import { prisma } from '../config/env.js';
import { serializableTransaction } from '../utils/transaction.js';
import { findManyPaginated } from '../utils/pagination.js';

export const processPayment = async (restaurantId, data) => {
  return await serializableTransaction(prisma, async (tx) => {
    const bill = await tx.bill.findFirst({
      where: { id: data.billId, restaurantId },
      include: {
        payments: true,
        order: true,
      },
    });

    if (!bill) {
      const error = new Error('Bill not found in this restaurant');
      error.statusCode = 404;
      throw error;
    }

    if (bill.status === 'PAID') {
      const error = new Error('Bill is already fully paid');
      error.statusCode = 400;
      throw error;
    }

    if (!['SERVED', 'COMPLETED', 'READY'].includes(bill.order.status)) {
      const error = new Error('Order must be prepared and served before payment');
      error.statusCode = 422;
      throw error;
    }

    if (data.transactionReference) {
      const duplicate = await tx.payment.findFirst({
        where: { billId: bill.id, transactionReference: data.transactionReference, status: 'COMPLETED' },
      });
      if (duplicate) {
        const error = new Error('This transaction reference has already been recorded for the bill');
        error.statusCode = 409;
        throw error;
      }
    }

    const paymentAmount = Number(data.amount !== undefined ? data.amount : data.amountPaid);
    const paymentMethod = data.method !== undefined ? data.method : (data.paymentMethod || 'CASH');
    const transactionReference = data.transactionReference || data.notes || null;

    const payment = await tx.payment.create({
      data: {
        billId: bill.id,
        amount: paymentAmount,
        method: paymentMethod,
        status: 'COMPLETED',
        transactionReference,
      },
    });

    const previousPayments = bill.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalPaid = previousPayments + paymentAmount;
    if (Math.round(totalPaid * 100) > Math.round(Number(bill.totalAmount) * 100)) {
      const error = new Error('Payment exceeds the bill balance');
      error.statusCode = 422;
      throw error;
    }
    const isFullyPaid = totalPaid >= Number(bill.totalAmount);

    let updatedBill;
    if (isFullyPaid) {
      updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: { status: 'PAID' },
      });

      // Mark order as COMPLETED
      await tx.order.update({
        where: { id: bill.orderId },
        data: { status: 'COMPLETED' },
      });

      // Release the table only when no other active order uses it.
      if (bill.order.tableId) {
        const otherActive = await tx.order.findFirst({
          where: {
            tableId: bill.order.tableId,
            id: { not: bill.orderId },
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
          select: { id: true },
        });
        if (!otherActive) {
          await tx.table.update({ where: { id: bill.order.tableId }, data: { status: 'AVAILABLE' } });
        }
      }
    } else {
      updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: { status: 'PARTIALLY_PAID' },
      });
    }

    return {
      payment,
      bill: updatedBill,
      totalPaid,
      remainingBalance: Math.max(0, Number(bill.totalAmount) - totalPaid),
      isFullyPaid,
    };
  });
};

export const createPayment = async (restaurantId, data) => {
  return await processPayment(restaurantId, data);
};

export const getPayments = async (restaurantId, filters = {}) => {
  const where = { bill: { restaurantId } };
  if (filters.method) where.method = filters.method;
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }
  return await findManyPaginated(prisma.payment, {
    where,
    include: {
      bill: {
        include: {
          order: { include: { table: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  }, filters);
};

export const getPaymentById = async (restaurantId, id) => {
  const payment = await prisma.payment.findFirst({
    where: { id, bill: { restaurantId } },
    include: {
      bill: {
        include: {
          order: { include: { table: true } },
        },
      },
    },
  });
  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }
  return payment;
};

export const getPaymentsByBill = async (restaurantId, billId) => {
  const bill = await prisma.bill.findFirst({
    where: { id: billId, restaurantId },
  });
  if (!bill) {
    const error = new Error('Bill not found in this restaurant');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.payment.findMany({
    where: { billId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getPaymentsByBillId = async (restaurantId, billId) => {
  return await getPaymentsByBill(restaurantId, billId);
};

export default {
  processPayment,
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentsByBill,
  getPaymentsByBillId,
};

import { prisma } from '../config/env.js';
import { serializableTransaction } from '../utils/transaction.js';
import { findManyPaginated } from '../utils/pagination.js';

export const createPurchase = async (restaurantId, data) => {
  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, restaurantId },
  });
  if (!supplier) {
    const error = new Error('Supplier not found in this restaurant');
    error.statusCode = 404;
    throw error;
  }

  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) {
    const error = new Error('Purchase must contain at least one item');
    error.statusCode = 400;
    throw error;
  }

  // Verify inventory items belong to restaurant
  const inventoryIds = items.map((i) => i.inventoryItemId);
  const existingItems = await prisma.inventoryItem.findMany({
    where: { id: { in: inventoryIds }, restaurantId },
  });
  if (existingItems.length !== inventoryIds.length) {
    const error = new Error('One or more inventory items are invalid for this restaurant');
    error.statusCode = 400;
    throw error;
  }

  let totalAmount = 0;
  const purchaseItemsData = items.map((i) => {
    const quantity = Number(i.quantity) || 0;
    const costPerUnit = Number(i.costPerUnit) || 0;
    const totalCost = quantity * costPerUnit;
    totalAmount += totalCost;
    return {
      inventoryItemId: i.inventoryItemId,
      quantity,
      costPerUnit,
      totalCost,
    };
  });

  return await prisma.purchase.create({
    data: {
      restaurantId,
      supplierId: data.supplierId,
      invoiceNumber: data.invoiceNumber || null,
      totalAmount,
      status: 'ORDERED',
      items: {
        create: purchaseItemsData,
      },
    },
    include: {
      supplier: true,
      items: { include: { inventoryItem: true } },
    },
  });
};

export const getPurchases = async (restaurantId, filters = {}) => {
  const where = { restaurantId };
  if (filters.supplierId) where.supplierId = filters.supplierId;
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.purchaseDate = {};
    if (filters.startDate) where.purchaseDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.purchaseDate.lte = new Date(filters.endDate);
  }
  return await findManyPaginated(prisma.purchase, {
    where,
    include: {
      supplier: true,
      items: { include: { inventoryItem: true } },
    },
    orderBy: { purchaseDate: 'desc' },
  }, filters);
};

export const getPurchaseById = async (restaurantId, id) => {
  const purchase = await prisma.purchase.findFirst({
    where: { id, restaurantId },
    include: {
      supplier: true,
      items: { include: { inventoryItem: true } },
    },
  });
  if (!purchase) {
    const error = new Error('Purchase record not found');
    error.statusCode = 404;
    throw error;
  }
  return purchase;
};

export const updatePurchase = async (restaurantId, id, data) => {
  const purchase = await getPurchaseById(restaurantId, id);
  if (purchase.status === 'RECEIVED' || purchase.status === 'CANCELLED') {
    const error = new Error(`Cannot update a purchase with status '${purchase.status}'`);
    error.statusCode = 409;
    throw error;
  }

  if (data.supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: data.supplierId, restaurantId }, select: { id: true } });
    if (!supplier) {
      const error = new Error('Supplier not found in this restaurant');
      error.statusCode = 404;
      throw error;
    }
  }

  if (data.items) {
    const inventoryIds = data.items.map((item) => item.inventoryItemId);
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { id: { in: inventoryIds }, restaurantId },
      select: { id: true },
    });
    if (inventoryItems.length !== inventoryIds.length) {
      const error = new Error('One or more inventory items are invalid for this restaurant');
      error.statusCode = 422;
      throw error;
    }
  }

  return await prisma.$transaction(async (tx) => {
    let totalAmount = Number(purchase.totalAmount);
    if (data.items) {
      totalAmount = data.items.reduce((total, item) => total + Number(item.quantity) * Number(item.costPerUnit), 0);
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      await tx.purchaseItem.createMany({
        data: data.items.map((item) => ({
          purchaseId: id,
          inventoryItemId: item.inventoryItemId,
          quantity: Number(item.quantity),
          costPerUnit: Number(item.costPerUnit),
          totalCost: Number((Number(item.quantity) * Number(item.costPerUnit)).toFixed(2)),
        })),
      });
    }
    return await tx.purchase.update({
      where: { id },
      data: {
        invoiceNumber: data.invoiceNumber !== undefined ? data.invoiceNumber : undefined,
        supplierId: data.supplierId || undefined,
        totalAmount,
      },
      include: { supplier: true, items: { include: { inventoryItem: true } } },
    });
  });
};

export const receivePurchase = async (restaurantId, id) => {
  return await serializableTransaction(prisma, async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: { id, restaurantId },
      include: { items: true },
    });

    if (!purchase) {
      const error = new Error('Purchase record not found');
      error.statusCode = 404;
      throw error;
    }

    if (purchase.status !== 'ORDERED' && purchase.status !== 'PENDING') {
      const error = new Error(`Cannot receive a purchase with status '${purchase.status}'`);
      error.statusCode = 409;
      throw error;
    }

    // Atomically increment inventory stock and update unit cost
    for (const item of purchase.items) {
      await tx.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          currentStock: { increment: Number(item.quantity) },
          costPerUnit: Number(item.costPerUnit),
        },
      });
    }

    return await tx.purchase.update({
      where: { id },
      data: { status: 'RECEIVED' },
      include: {
        supplier: true,
        items: { include: { inventoryItem: true } },
      },
    });
  });
};

export const cancelPurchase = async (restaurantId, id) => {
  const purchase = await getPurchaseById(restaurantId, id);
  if (purchase.status === 'RECEIVED') {
    const error = new Error('Cannot cancel a purchase that has already been RECEIVED');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.purchase.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { supplier: true, items: true },
  });
};

export default {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  receivePurchase,
  cancelPurchase,
};

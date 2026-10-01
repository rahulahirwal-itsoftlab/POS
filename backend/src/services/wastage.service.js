import { prisma } from '../config/env.js';
import { serializableTransaction } from '../utils/transaction.js';
import { findManyPaginated } from '../utils/pagination.js';

export const recordWastage = async (restaurantId, userId, data) => {
  return await serializableTransaction(prisma, async (tx) => {
    const item = await tx.inventoryItem.findFirst({
      where: { id: data.inventoryItemId, restaurantId },
    });

    if (!item) {
      const error = new Error('Inventory item not found');
      error.statusCode = 404;
      throw error;
    }

    const wasteQuantity = Number(data.quantity);
    if (data.unit && data.unit !== item.unit) {
      const error = new Error('Wastage unit must match its inventory item unit; unit conversion is not configured');
      error.statusCode = 422;
      throw error;
    }
    if (wasteQuantity <= 0) {
      const error = new Error('Wastage quantity must be greater than zero');
      error.statusCode = 400;
      throw error;
    }

    if (Number(item.currentStock) < wasteQuantity) {
      const error = new Error(
        `Cannot record wastage exceeding current stock. Available: ${item.currentStock} ${item.unit}, Requested: ${wasteQuantity} ${item.unit}`
      );
      error.statusCode = 400;
      throw error;
    }

    const cost = wasteQuantity * Number(item.costPerUnit || 0);

    // Atomically decrement inventory stock
    const stockUpdate = await tx.inventoryItem.updateMany({
      where: { id: item.id, restaurantId, currentStock: { gte: wasteQuantity } },
      data: { currentStock: { decrement: wasteQuantity } },
    });
    if (!stockUpdate.count) {
      const error = new Error('Wastage quantity exceeds current stock');
      error.statusCode = 422;
      throw error;
    }

    return await tx.wastage.create({
      data: {
        restaurantId,
        inventoryItemId: item.id,
        quantity: wasteQuantity,
        unit: data.unit || item.unit,
        reason: data.reason,
        cost,
        recordedById: userId,
      },
      include: {
        inventoryItem: true,
        recordedBy: { select: { id: true, name: true } },
      },
    });
  });
};

export const getWastageList = async (restaurantId, filters = {}) => {
  const where = { restaurantId };
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }
  return await findManyPaginated(prisma.wastage, {
    where,
    include: {
      inventoryItem: true,
      recordedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  }, filters);
};

export const getWastageById = async (restaurantId, id) => {
  const wastage = await prisma.wastage.findFirst({
    where: { id, restaurantId },
    include: {
      inventoryItem: true,
      recordedBy: { select: { id: true, name: true } },
    },
  });
  if (!wastage) {
    const error = new Error('Wastage record not found');
    error.statusCode = 404;
    throw error;
  }
  return wastage;
};

export const deleteWastage = async (restaurantId, id) => {
  return await serializableTransaction(prisma, async (tx) => {
    const wastage = await tx.wastage.findFirst({
      where: { id, restaurantId },
    });
    if (!wastage) {
      const error = new Error('Wastage record not found');
      error.statusCode = 404;
      throw error;
    }

    // Restore inventory stock
    await tx.inventoryItem.update({
      where: { id: wastage.inventoryItemId },
      data: {
        currentStock: { increment: Number(wastage.quantity) },
      },
    });

    return await tx.wastage.delete({
      where: { id },
    });
  });
};

export default {
  recordWastage,
  getWastageList,
  getWastageById,
  deleteWastage,
};

import { prisma } from '../config/env.js';
import { findManyPaginated } from '../utils/pagination.js';

export const createInventoryItem = async (restaurantId, data) => {
  const name = data.name.trim();
  const existing = await prisma.inventoryItem.findUnique({
    where: {
      restaurantId_name: {
        restaurantId,
        name,
      },
    },
  });
  if (existing) {
    const error = new Error(`Inventory item '${name}' already exists in this restaurant`);
    error.statusCode = 409;
    throw error;
  }

  return await prisma.inventoryItem.create({
    data: {
      restaurantId,
      name,
      sku: data.sku || null,
      currentStock: data.currentStock !== undefined ? Number(data.currentStock) : 0,
      minStockThreshold: data.minStockThreshold !== undefined ? Number(data.minStockThreshold) : 5,
      unit: data.unit,
      costPerUnit: data.costPerUnit !== undefined ? Number(data.costPerUnit) : 0,
    },
  });
};

export const getInventoryItems = async (restaurantId, filters = {}) => {
  const where = { restaurantId };
  if (filters.unit) where.unit = filters.unit;
  if (filters.search) where.name = { contains: String(filters.search), mode: 'insensitive' };
  return await findManyPaginated(prisma.inventoryItem, {
    where,
    orderBy: { name: 'asc' },
  }, filters);
};

export const getLowStockItems = async (restaurantId) => {
  const items = await prisma.inventoryItem.findMany({
    where: { restaurantId },
    orderBy: { currentStock: 'asc' },
  });
  return items.filter((i) => Number(i.currentStock) <= Number(i.minStockThreshold));
};

export const getInventoryItemById = async (restaurantId, id) => {
  const item = await prisma.inventoryItem.findFirst({
    where: { id, restaurantId },
    include: {
      recipeIngredients: { include: { recipe: { include: { menuItem: true } } } },
    },
  });
  if (!item) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }
  return item;
};

export const updateInventoryItem = async (restaurantId, id, data) => {
  await getInventoryItemById(restaurantId, id);

  return await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: data.name ? data.name.trim() : undefined,
      sku: data.sku !== undefined ? data.sku : undefined,
      currentStock: data.currentStock !== undefined ? Number(data.currentStock) : undefined,
      minStockThreshold: data.minStockThreshold !== undefined ? Number(data.minStockThreshold) : undefined,
      unit: data.unit || undefined,
      costPerUnit: data.costPerUnit !== undefined ? Number(data.costPerUnit) : undefined,
    },
  });
};

export const updateStock = async (restaurantId, id, data) => {
  const item = await getInventoryItemById(restaurantId, id);

  let newStock;
  if (data.currentStock !== undefined) {
    newStock = Number(data.currentStock);
  } else if (data.adjustment !== undefined) {
    newStock = Number(item.currentStock) + Number(data.adjustment);
  }

  if (newStock < 0) {
    const error = new Error(`Stock cannot be negative. Current stock is ${item.currentStock} ${item.unit}`);
    error.statusCode = 400;
    throw error;
  }

  if (data.adjustment !== undefined) {
    const result = await prisma.inventoryItem.updateMany({
      where: {
        id,
        restaurantId,
        ...(Number(data.adjustment) < 0 ? { currentStock: { gte: Math.abs(Number(data.adjustment)) } } : {}),
      },
      data: { currentStock: { increment: Number(data.adjustment) } },
    });
    if (!result.count) {
      const error = new Error('Stock adjustment would make inventory negative');
      error.statusCode = 422;
      throw error;
    }
    return await getInventoryItemById(restaurantId, id);
  }

  return await prisma.inventoryItem.updateMany({
    where: { id, restaurantId },
    data: { currentStock: newStock },
  }).then(() => getInventoryItemById(restaurantId, id));
};

export const deleteInventoryItem = async (restaurantId, id) => {
  const item = await prisma.inventoryItem.findFirst({
    where: { id, restaurantId },
    include: { _count: { select: { recipeIngredients: true, purchaseItems: true, wastages: true } } },
  });
  if (!item) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }
  if (item._count.recipeIngredients || item._count.purchaseItems || item._count.wastages) {
    const error = new Error('Inventory item has recipe, purchase, or wastage history and cannot be deleted');
    error.statusCode = 409;
    throw error;
  }
  return await prisma.inventoryItem.delete({
    where: { id },
  });
};

export default {
  createInventoryItem,
  getInventoryItems,
  getLowStockItems,
  getInventoryItemById,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem,
};

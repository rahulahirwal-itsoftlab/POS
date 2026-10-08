import { prisma } from '../config/env.js';
import { findManyPaginated } from '../utils/pagination.js';

// Categories
export const createCategory = async (restaurantId, data) => {
  const name = data.name.trim();
  const existing = await prisma.menuCategory.findUnique({
    where: {
      restaurantId_name: {
        restaurantId,
        name,
      },
    },
  });

  if (existing) {
    const error = new Error(`Menu category '${name}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  return await prisma.menuCategory.create({
    data: {
      restaurantId,
      name,
      description: data.description || null,
    },
  });
};

export const getCategories = async (restaurantId, filters = {}) => {
  return await findManyPaginated(prisma.menuCategory, {
    where: { restaurantId },
    include: {
      _count: { select: { menuItems: true } },
    },
    orderBy: { name: 'asc' },
  }, filters);
};

export const getCategoryById = async (restaurantId, id) => {
  const category = await prisma.menuCategory.findFirst({
    where: { id, restaurantId },
    include: {
      menuItems: true,
      _count: { select: { menuItems: true } },
    },
  });
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  return category;
};

export const updateCategory = async (restaurantId, id, data) => {
  await getCategoryById(restaurantId, id);

  return await prisma.menuCategory.update({
    where: { id },
    data: {
      name: data.name ? data.name.trim() : undefined,
      description: data.description !== undefined ? data.description : undefined,
    },
  });
};

export const deleteCategory = async (restaurantId, id) => {
  await getCategoryById(restaurantId, id);

  return await prisma.menuCategory.delete({
    where: { id },
  });
};

// Menu Items
export const createMenuItem = async (restaurantId, data) => {
  const name = data.name.trim();
  const existing = await prisma.menuItem.findUnique({
    where: {
      restaurantId_name: {
        restaurantId,
        name,
      },
    },
  });

  if (existing) {
    const error = new Error(`Menu item '${name}' already exists in this restaurant`);
    error.statusCode = 409;
    throw error;
  }

  if (data.categoryId) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: data.categoryId, restaurantId },
    });
    if (!category) {
      const error = new Error('Specified menu category not found in this restaurant');
      error.statusCode = 404;
      throw error;
    }
  }

  // Enforce Subscription Plan Menu Item Limits
  const subscription = await prisma.subscription.findUnique({
    where: { restaurantId },
    include: { plan: true },
  });
  if (subscription && subscription.status === 'ACTIVE' && subscription.plan) {
    const currentItemCount = await prisma.menuItem.count({ where: { restaurantId } });
    if (currentItemCount >= subscription.plan.maxMenuItems) {
      const error = new Error(`Menu item limit reached for your ${subscription.plan.name} (${subscription.plan.maxMenuItems} max). Please contact Super Admin to upgrade.`);
      error.statusCode = 422;
      throw error;
    }
  }

  return await prisma.menuItem.create({
    data: {
      restaurantId,
      categoryId: data.categoryId || null,
      name,
      description: data.description || null,
      price: Number(data.price),
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      dietary: data.dietary || null,
    },
    include: {
      category: true,
      recipe: {
        include: {
          ingredients: {
            include: { inventoryItem: true },
          },
        },
      },
    },
  });
};

export const getMenuItems = async (restaurantId, filters = {}) => {
  const where = { restaurantId };
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.dietary) where.dietary = filters.dietary;
  if (filters.isAvailable !== undefined) {
    where.isAvailable = filters.isAvailable === 'true' || filters.isAvailable === true;
  }
  if (filters.search) {
    where.name = { contains: String(filters.search), mode: 'insensitive' };
  }

  return await findManyPaginated(prisma.menuItem, {
      where,
      include: {
        category: true,
        recipe: { include: { ingredients: { include: { inventoryItem: true } } } },
      },
      orderBy: { name: 'asc' },
  }, filters);
};

export const getMenuItemById = async (restaurantId, id) => {
  const item = await prisma.menuItem.findFirst({
    where: { id, restaurantId },
    include: {
      category: true,
      recipe: {
        include: {
          ingredients: {
            include: { inventoryItem: true },
          },
        },
      },
    },
  });
  if (!item) {
    const error = new Error('Menu item not found');
    error.statusCode = 404;
    throw error;
  }
  return item;
};

export const updateMenuItem = async (restaurantId, id, data) => {
  await getMenuItemById(restaurantId, id);

  if (data.categoryId) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: data.categoryId, restaurantId },
      select: { id: true },
    });
    if (!category) {
      const error = new Error('Specified menu category not found in this restaurant');
      error.statusCode = 404;
      throw error;
    }
  }

  return await prisma.menuItem.update({
    where: { id },
    data: {
      name: data.name ? data.name.trim() : undefined,
      description: data.description !== undefined ? data.description : undefined,
      price: data.price !== undefined ? Number(data.price) : undefined,
      categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : undefined,
      dietary: data.dietary !== undefined ? (data.dietary || null) : undefined,
    },
    include: {
      category: true,
      recipe: true,
    },
  });
};

export const updateMenuItemAvailability = async (restaurantId, id, isAvailable) => {
  await getMenuItemById(restaurantId, id);

  return await prisma.menuItem.update({
    where: { id },
    data: { isAvailable },
    include: { category: true },
  });
};

export const deleteMenuItem = async (restaurantId, id) => {
  const item = await prisma.menuItem.findFirst({
    where: { id, restaurantId },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!item) {
    const error = new Error('Menu item not found');
    error.statusCode = 404;
    throw error;
  }
  if (item._count.orderItems) {
    const error = new Error('Menu item has order history and cannot be deleted');
    error.statusCode = 409;
    throw error;
  }
  return await prisma.menuItem.delete({
    where: { id },
  });
};

export default {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  updateMenuItemAvailability,
  deleteMenuItem,
};

import * as inventoryService from '../services/inventory.service.js';
import { sendSuccess } from '../utils/response.js';

export const createInventoryItem = async (req, res, next) => {
  try {
    const item = await inventoryService.createInventoryItem(req.user.restaurantId, req.body);
    return sendSuccess(res, 201, 'Inventory item created successfully', item);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItems = async (req, res, next) => {
  try {
    const items = await inventoryService.getInventoryItems(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Inventory items retrieved successfully', items);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItemById = async (req, res, next) => {
  try {
    const item = await inventoryService.getInventoryItemById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Inventory item retrieved successfully', item);
  } catch (error) {
    next(error);
  }
};

export const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await inventoryService.updateInventoryItem(req.user.restaurantId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Inventory item updated successfully', item);
  } catch (error) {
    next(error);
  }
};

export const deleteInventoryItem = async (req, res, next) => {
  try {
    await inventoryService.deleteInventoryItem(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Inventory item deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const item = await inventoryService.updateStock(req.user.restaurantId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Inventory stock updated successfully', item);
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const item = await inventoryService.adjustStock(
      req.user.restaurantId,
      req.params.id,
      req.body,
      req.user
    );
    return sendSuccess(res, 200, 'Inventory stock adjusted successfully', item);
  } catch (error) {
    next(error);
  }
};

export const getLowStockItems = async (req, res, next) => {
  try {
    const items = await inventoryService.getLowStockItems(req.user.restaurantId);
    return sendSuccess(res, 200, 'Low stock inventory items retrieved successfully', items);
  } catch (error) {
    next(error);
  }
};

export const getInventoryTransactions = async (req, res, next) => {
  try {
    const transactions = await inventoryService.getInventoryTransactions(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Inventory transactions retrieved successfully', transactions);
  } catch (error) {
    next(error);
  }
};

export default {
  createInventoryItem,
  getInventoryItems,
  getInventoryTransactions,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  updateStock,
  adjustStock,
  getLowStockItems,
};

import * as kitchenService from '../services/kitchen.service.js';
import { sendSuccess } from '../utils/response.js';

export const getKitchenDashboard = async (req, res, next) => {
  try {
    const dashboard = await kitchenService.getKitchenDashboard(req.user.restaurantId);
    return sendSuccess(res, 200, 'Kitchen dashboard retrieved successfully', dashboard);
  } catch (error) {
    next(error);
  }
};

export const getKitchenOrders = async (req, res, next) => {
  try {
    const queue = await kitchenService.getKitchenOrders(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Kitchen orders retrieved successfully', queue);
  } catch (error) {
    next(error);
  }
};

export const getKitchenOrderById = async (req, res, next) => {
  try {
    const order = await kitchenService.getKitchenOrderById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Kitchen order details retrieved successfully', order);
  } catch (error) {
    next(error);
  }
};

export const getPendingOrders = async (req, res, next) => {
  try {
    const pending = await kitchenService.getPendingOrders(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Pending kitchen orders retrieved successfully', pending);
  } catch (error) {
    next(error);
  }
};

export const acceptOrder = async (req, res, next) => {
  try {
    const order = await kitchenService.acceptOrder(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Order accepted into preparation', order);
  } catch (error) {
    next(error);
  }
};

export const startPreparation = async (req, res, next) => {
  try {
    const order = await kitchenService.startPreparation(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Order moved to IN_PREPARATION', order);
  } catch (error) {
    next(error);
  }
};

export const markOrderReady = async (req, res, next) => {
  try {
    const order = await kitchenService.markOrderReady(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Order marked as READY and recipe ingredients deducted from inventory', order);
  } catch (error) {
    next(error);
  }
};

export const markOrderServed = async (req, res, next) => {
  try {
    const order = await kitchenService.markOrderServed(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Order marked as SERVED to customer', order);
  } catch (error) {
    next(error);
  }
};

export const completeOrder = async (req, res, next) => {
  try {
    const order = await kitchenService.completeOrder(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Order marked as COMPLETED', order);
  } catch (error) {
    next(error);
  }
};

export const cancelKitchenOrder = async (req, res, next) => {
  try {
    const order = await kitchenService.cancelKitchenOrder(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Kitchen order cancelled successfully', order);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      const error = new Error('Status is required in request body');
      error.statusCode = 400;
      throw error;
    }
    const order = await kitchenService.updateOrderStatus(req.user.restaurantId, req.params.id, status);
    return sendSuccess(res, 200, `Order status updated to '${status}' successfully`, order);
  } catch (error) {
    next(error);
  }
};

export const updateItemStatus = async (req, res, next) => {
  try {
    const item = await kitchenService.updateItemStatus(req.user.restaurantId, req.params.itemId, req.body.status);
    return sendSuccess(res, 200, 'Order item status updated successfully', item);
  } catch (error) {
    next(error);
  }
};

export const getKitchenInventory = async (req, res, next) => {
  try {
    const items = await kitchenService.getKitchenInventory(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Kitchen inventory retrieved successfully', items);
  } catch (error) {
    next(error);
  }
};

export const getKitchenRecipes = async (req, res, next) => {
  try {
    const recipes = await kitchenService.getKitchenRecipes(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Kitchen recipes retrieved successfully', recipes);
  } catch (error) {
    next(error);
  }
};

export const prepareOrder = startPreparation;
export const markReady = markOrderReady;

export default {
  getKitchenDashboard,
  getKitchenOrders,
  getKitchenOrderById,
  getPendingOrders,
  acceptOrder,
  startPreparation,
  prepareOrder,
  markOrderReady,
  markReady,
  markOrderServed,
  completeOrder,
  cancelKitchenOrder,
  updateOrderStatus,
  updateItemStatus,
  getKitchenInventory,
  getKitchenRecipes,
};

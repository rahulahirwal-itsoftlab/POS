import * as purchaseService from '../services/purchase.service.js';
import { sendSuccess } from '../utils/response.js';

export const createPurchase = async (req, res, next) => {
  try {
    const purchase = await purchaseService.createPurchase(req.user.restaurantId, req.body);
    return sendSuccess(res, 201, 'Purchase created successfully', purchase);
  } catch (error) {
    next(error);
  }
};

export const getPurchases = async (req, res, next) => {
  try {
    const purchases = await purchaseService.getPurchases(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Purchases retrieved successfully', purchases);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await purchaseService.getPurchaseById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Purchase retrieved successfully', purchase);
  } catch (error) {
    next(error);
  }
};

export const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await purchaseService.updatePurchase(req.user.restaurantId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Purchase updated successfully', purchase);
  } catch (error) {
    next(error);
  }
};

export const receivePurchase = async (req, res, next) => {
  try {
    const result = await purchaseService.receivePurchase(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Purchase received and inventory restocked successfully', result);
  } catch (error) {
    next(error);
  }
};

export const cancelPurchase = async (req, res, next) => {
  try {
    const result = await purchaseService.cancelPurchase(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Purchase cancelled successfully', result);
  } catch (error) {
    next(error);
  }
};

export default {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  receivePurchase,
  cancelPurchase,
};

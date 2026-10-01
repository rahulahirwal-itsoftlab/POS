import * as billingService from '../services/billing.service.js';
import { sendSuccess } from '../utils/response.js';

export const createBill = async (req, res, next) => {
  try {
    const bill = await billingService.createBill(req.user.restaurantId, req.user.id, req.body);
    return sendSuccess(res, 201, 'Bill generated successfully with taxes and discounts', bill);
  } catch (error) {
    next(error);
  }
};

export const getBills = async (req, res, next) => {
  try {
    const bills = await billingService.getBills(req.user.restaurantId, req.query.status, req.query);
    return sendSuccess(res, 200, 'Bills retrieved successfully', bills);
  } catch (error) {
    next(error);
  }
};

export const getBillById = async (req, res, next) => {
  try {
    const bill = await billingService.getBillById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Bill retrieved successfully', bill);
  } catch (error) {
    next(error);
  }
};

export const getBillByOrderId = async (req, res, next) => {
  try {
    const bill = await billingService.getBillByOrderId(req.user.restaurantId, req.params.orderId);
    return sendSuccess(res, 200, 'Bill retrieved successfully', bill);
  } catch (error) {
    next(error);
  }
};

export const updateBill = async (req, res, next) => {
  try {
    const bill = await billingService.updateBill(req.user.restaurantId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Bill updated successfully', bill);
  } catch (error) {
    next(error);
  }
};

export const getPendingOrders = async (req, res, next) => {
  try {
    const orders = await billingService.getPendingBillingOrders(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Pending orders for billing retrieved successfully', orders);
  } catch (error) {
    next(error);
  }
};

export const deliverBill = async (req, res, next) => {
  try {
    const bill = await billingService.deliverBill(req.user.restaurantId, req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Bill marked as DELIVERED to table successfully', bill);
  } catch (error) {
    next(error);
  }
};

export const generateBill = createBill;
export const getAllBills = getBills;

export default {
  createBill,
  generateBill,
  getBills,
  getAllBills,
  getBillById,
  getBillByOrderId,
  updateBill,
  getPendingOrders,
  deliverBill,
};

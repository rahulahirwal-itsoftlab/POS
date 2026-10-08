import * as paymentService from '../services/payment.service.js';
import { sendSuccess } from '../utils/response.js';

export const createPayment = async (req, res, next) => {
  try {
    const result = await paymentService.createPayment(req.user.restaurantId, req.body);
    return sendSuccess(res, 201, 'Payment processed successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getPayments(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Payments retrieved successfully', payments);
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Payment retrieved successfully', payment);
  } catch (error) {
    next(error);
  }
};

export const getPaymentsByBill = async (req, res, next) => {
  try {
    const payments = await paymentService.getPaymentsByBill(req.user.restaurantId, req.params.billId);
    return sendSuccess(res, 200, 'Bill payments retrieved successfully', payments);
  } catch (error) {
    next(error);
  }
};

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const result = await paymentService.createRazorpayOrder(req.user.restaurantId, req.body.billId);
    return sendSuccess(res, 200, 'Razorpay order created successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createRazorpayQrCode = async (req, res, next) => {
  try {
    const result = await paymentService.createRazorpayQrCode(req.user.restaurantId, req.body.billId);
    return sendSuccess(res, 200, 'Razorpay QR code created successfully', result);
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const result = await paymentService.verifyRazorpayPayment(req.user.restaurantId, req.body);
    return sendSuccess(res, 200, 'Razorpay payment verified and processed successfully', result);
  } catch (error) {
    next(error);
  }
};

export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await paymentService.handleRazorpayWebhook(req.body, signature);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const processPayment = createPayment;
export const getPaymentsByBillId = getPaymentsByBill;

export default {
  createPayment,
  processPayment,
  createRazorpayOrder,
  createRazorpayQrCode,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  getPayments,
  getPaymentById,
  getPaymentsByBill,
  getPaymentsByBillId,
};

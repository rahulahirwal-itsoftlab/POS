import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import { validateUuidParams } from '../validations/resource.validation.js';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validatePayment, validateRazorpayOrder, validateRazorpayVerify } from '../validations/billing.validation.js';

const router = Router();
validateUuidParams(router);

// Public Webhook route for Razorpay payment events
router.post('/razorpay/webhook', paymentController.handleRazorpayWebhook);

// Protected routes (Receptionist and Restaurant Owner)
router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.RECEPTIONIST, ROLES.RESTAURANT_OWNER));

// Razorpay Payment Integration endpoints
router.post('/razorpay/order', validateRequest(validateRazorpayOrder), paymentController.createRazorpayOrder);
router.post('/razorpay/qr', validateRequest(validateRazorpayOrder), paymentController.createRazorpayQrCode);
router.post('/razorpay/verify', validateRequest(validateRazorpayVerify), paymentController.verifyRazorpayPayment);

// Existing Payment endpoints
router.get('/bill/:billId', paymentController.getPaymentsByBill);
router.get('/:id', paymentController.getPaymentById);
router.get('/', paymentController.getPayments);
router.post('/', validateRequest(validatePayment), paymentController.createPayment);

export default router;

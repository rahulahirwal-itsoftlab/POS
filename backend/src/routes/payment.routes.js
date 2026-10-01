import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import { validateUuidParams } from '../validations/resource.validation.js';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validatePayment } from '../validations/billing.validation.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.RECEPTIONIST, ROLES.RESTAURANT_OWNER));

router.get('/bill/:billId', paymentController.getPaymentsByBill);
router.get('/:id', paymentController.getPaymentById);
router.get('/', paymentController.getPayments);
router.post('/', validateRequest(validatePayment), paymentController.createPayment);

export default router;

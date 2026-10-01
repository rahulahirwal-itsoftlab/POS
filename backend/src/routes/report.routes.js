import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import { validateUuidParams } from '../validations/resource.validation.js';
import * as reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.RESTAURANT_OWNER));

router.get('/dashboard', reportController.getDashboardReport);
router.get('/sales', reportController.getSalesReport);
router.get('/orders', reportController.getOrdersReport);
router.get('/payments', reportController.getPaymentsReport);
router.get('/inventory', reportController.getInventoryReport);
router.get('/wastage', reportController.getWastageReport);
router.get('/purchases', reportController.getPurchaseReport);
router.get('/financials', reportController.getFinancialReport);

export default router;

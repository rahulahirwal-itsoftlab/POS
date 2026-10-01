import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import * as waiterController from '../controllers/waiter.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.WAITER, ROLES.RESTAURANT_OWNER));

// GET /api/waiter/dashboard
router.get('/dashboard', waiterController.getWaiterDashboard);

export default router;

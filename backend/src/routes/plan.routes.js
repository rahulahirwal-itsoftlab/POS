import { Router } from 'express';
import * as planController from '../controllers/plan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Allow authenticated users to view active plans
router.get('/', authenticate, planController.getPlans);
router.get('/:id', authenticate, planController.getPlanById);

export default router;

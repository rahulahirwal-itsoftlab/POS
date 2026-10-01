import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import { validateUuidParams } from '../validations/resource.validation.js';
import * as kitchenController from '../controllers/kitchen.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validateOrderItemStatus } from '../validations/resource.validation.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.KITCHEN_ADMIN, ROLES.RESTAURANT_OWNER));

// Dashboard
router.get('/dashboard', kitchenController.getKitchenDashboard);

// Inventory for kitchen
router.get('/inventory', kitchenController.getKitchenInventory);

// Recipes for kitchen
router.get('/recipes', kitchenController.getKitchenRecipes);

// Orders
router.get('/orders/pending', kitchenController.getPendingOrders);
router.get('/orders', kitchenController.getKitchenOrders);
router.get('/orders/:id', kitchenController.getKitchenOrderById);
router.patch('/orders/:id/status', kitchenController.updateOrderStatus);
router.patch('/orders/:id/accept', kitchenController.acceptOrder);
router.patch('/orders/:id/prepare', kitchenController.startPreparation);
router.patch('/orders/:id/ready', kitchenController.markOrderReady);
router.patch('/orders/:id/served', kitchenController.markOrderServed);
router.patch('/orders/:id/complete', kitchenController.completeOrder);
router.patch('/orders/:id/cancel', kitchenController.cancelKitchenOrder);
router.patch('/items/:itemId/status', validateRequest(validateOrderItemStatus), kitchenController.updateItemStatus);

export default router;

import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import { validateUuidParams } from '../validations/resource.validation.js';
import * as inventoryController from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validateCreateInventory, validateStockUpdate } from '../validations/inventory.validation.js';
import { validateInventoryUpdate } from '../validations/resource.validation.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.RESTAURANT_OWNER, ROLES.KITCHEN_ADMIN));

router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/', inventoryController.getInventoryItems);
router.get('/:id', inventoryController.getInventoryItemById);
router.post('/', authorizeRoles(ROLES.RESTAURANT_OWNER), validateRequest(validateCreateInventory), inventoryController.createInventoryItem);
router.patch('/:id/stock', authorizeRoles(ROLES.RESTAURANT_OWNER, ROLES.KITCHEN_ADMIN), validateRequest(validateStockUpdate), inventoryController.updateStock);
router.patch('/:id', authorizeRoles(ROLES.RESTAURANT_OWNER), validateRequest(validateInventoryUpdate), inventoryController.updateInventoryItem);
router.put('/:id', authorizeRoles(ROLES.RESTAURANT_OWNER), validateRequest(validateInventoryUpdate), inventoryController.updateInventoryItem);
router.delete('/:id', authorizeRoles(ROLES.RESTAURANT_OWNER), inventoryController.deleteInventoryItem);

export default router;

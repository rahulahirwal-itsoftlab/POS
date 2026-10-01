import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import * as purchaseController from '../controllers/purchase.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validatePurchase, validateUuidParams } from '../validations/resource.validation.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.RESTAURANT_OWNER));

router.get('/', purchaseController.getPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.post('/', validateRequest((data) => validatePurchase(data)), purchaseController.createPurchase);
router.patch('/:id/receive', purchaseController.receivePurchase);
router.patch('/:id/cancel', purchaseController.cancelPurchase);
router.patch('/:id', validateRequest((data) => validatePurchase(data, true)), purchaseController.updatePurchase);

export default router;

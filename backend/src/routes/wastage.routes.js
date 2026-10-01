import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import * as wastageController from '../controllers/wastage.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validateUuidParams, validateWastage } from '../validations/resource.validation.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);

router.get('/:id', wastageController.getWastageById);
router.get('/', wastageController.getWastages);
router.post('/', authorizeRoles(ROLES.KITCHEN_ADMIN, ROLES.RESTAURANT_OWNER), validateRequest(validateWastage), wastageController.createWastage);
router.delete('/:id', authorizeRoles(ROLES.RESTAURANT_OWNER), wastageController.deleteWastage);

export default router;

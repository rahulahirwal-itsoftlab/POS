import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import { validateUuidParams } from '../validations/resource.validation.js';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validateCreateStaff, validateUpdateStaff, validateStatusUpdate } from '../validations/user.validation.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.RESTAURANT_OWNER));

router.post('/', validateRequest(validateCreateStaff), userController.createUser);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/status', validateRequest(validateStatusUpdate), userController.updateUserStatus);
router.patch('/:id', validateRequest(validateUpdateStaff), userController.updateUser);
router.put('/:id', validateRequest(validateUpdateStaff), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;

import { Router } from 'express';
import { validateUuidParams } from '../validations/resource.validation.js';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validateRegisterOwner, validateLogin } from '../validations/auth.validation.js';

const router = Router();
validateUuidParams(router);

router.post('/register', validateRequest(validateRegisterOwner), authController.registerOwner);
router.post('/login', validateRequest(validateLogin), authController.login);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/password', authenticate, authController.changePassword);

export default router;

import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import { validateUuidParams } from '../validations/resource.validation.js';
import * as restaurantController from '../controllers/restaurant.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validateRestaurantProfile } from '../validations/resource.validation.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);

router.post('/', authorizeRoles(ROLES.RESTAURANT_OWNER), validateRequest((data) => validateRestaurantProfile(data)), restaurantController.createRestaurant);
router.get('/', restaurantController.getRestaurant);
router.get('/:id', restaurantController.getRestaurantById);
router.patch('/:id', authorizeRoles(ROLES.RESTAURANT_OWNER), validateRequest((data) => validateRestaurantProfile(data, true)), restaurantController.updateRestaurant);
router.put('/:id', authorizeRoles(ROLES.RESTAURANT_OWNER), validateRequest((data) => validateRestaurantProfile(data, true)), restaurantController.updateRestaurant);

export default router;

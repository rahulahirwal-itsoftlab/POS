import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import * as supplierController from '../controllers/supplier.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validateSupplier, validateUuidParams } from '../validations/resource.validation.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.RESTAURANT_OWNER));

router.get('/', supplierController.getSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', validateRequest((data) => validateSupplier(data)), supplierController.createSupplier);
router.patch('/:id', validateRequest((data) => validateSupplier(data, true)), supplierController.updateSupplier);
router.put('/:id', validateRequest((data) => validateSupplier(data, true)), supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

export default router;

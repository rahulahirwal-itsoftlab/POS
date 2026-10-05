import { Router } from 'express';
import * as settingController from '../controllers/setting.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// GET /api/settings - returns user personal settings, tenant settings, and platform settings per role
router.get('/', settingController.getSettings);

// PUT /api/settings/:scope/:key - updates a specific setting key in scope
router.put('/:scope/:key', settingController.updateSetting);
router.patch('/:scope/:key', settingController.updateSetting);

export default router;

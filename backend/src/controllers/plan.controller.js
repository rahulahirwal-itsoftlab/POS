import * as planService from '../services/plan.service.js';
import { sendSuccess } from '../utils/response.js';

export const getPlans = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user?.role === 'RESTAURANT_REGISTRATION_ADMIN';
    const plans = await planService.getPlans(!isSuperAdmin);
    return sendSuccess(res, 200, 'Plans retrieved successfully', plans);
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (req, res, next) => {
  try {
    const plan = await planService.getPlanById(req.params.id);
    return sendSuccess(res, 200, 'Plan retrieved successfully', plan);
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req, res, next) => {
  try {
    const plan = await planService.createPlan(req.body);
    return sendSuccess(res, 201, 'Plan created successfully', plan);
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const plan = await planService.updatePlan(req.params.id, req.body);
    return sendSuccess(res, 200, 'Plan updated successfully', plan);
  } catch (error) {
    next(error);
  }
};

export const updatePlanStatus = async (req, res, next) => {
  try {
    const plan = await planService.updatePlanStatus(req.params.id, req.body.isActive);
    return sendSuccess(res, 200, `Plan ${req.body.isActive ? 'activated' : 'deactivated'} successfully`, plan);
  } catch (error) {
    next(error);
  }
};

export default {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  updatePlanStatus,
};

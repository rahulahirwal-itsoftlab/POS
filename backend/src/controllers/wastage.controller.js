import * as wastageService from '../services/wastage.service.js';
import { sendSuccess } from '../utils/response.js';

export const createWastage = async (req, res, next) => {
  try {
    const wastage = await wastageService.recordWastage(req.user.restaurantId, req.user.id, req.body);
    return sendSuccess(res, 201, 'Wastage recorded and inventory stock decremented', wastage);
  } catch (error) {
    next(error);
  }
};

export const getWastages = async (req, res, next) => {
  try {
    const wastages = await wastageService.getWastageList(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Wastage records retrieved successfully', wastages);
  } catch (error) {
    next(error);
  }
};

export const getWastageById = async (req, res, next) => {
  try {
    const wastage = await wastageService.getWastageById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Wastage record retrieved successfully', wastage);
  } catch (error) {
    next(error);
  }
};

export const deleteWastage = async (req, res, next) => {
  try {
    await wastageService.deleteWastage(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Wastage record deleted and inventory restored');
  } catch (error) {
    next(error);
  }
};

export const recordWastage = createWastage;
export const getWastageList = getWastages;

export default {
  createWastage,
  recordWastage,
  getWastages,
  getWastageList,
  getWastageById,
  deleteWastage,
};

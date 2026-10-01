import * as supplierService from '../services/supplier.service.js';
import { sendSuccess } from '../utils/response.js';

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.user.restaurantId, req.body);
    return sendSuccess(res, 201, 'Supplier created successfully', supplier);
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await supplierService.getSuppliers(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Suppliers retrieved successfully', suppliers);
  } catch (error) {
    next(error);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await supplierService.getSupplierById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Supplier retrieved successfully', supplier);
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.updateSupplier(req.user.restaurantId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Supplier updated successfully', supplier);
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    await supplierService.deleteSupplier(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Supplier deleted successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};

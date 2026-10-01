import * as tableService from '../services/table.service.js';
import { sendSuccess } from '../utils/response.js';

export const createTable = async (req, res, next) => {
  try {
    const table = await tableService.createTable(req.user.restaurantId, req.body);
    return sendSuccess(res, 201, 'Table created successfully', table);
  } catch (error) {
    next(error);
  }
};

export const getTables = async (req, res, next) => {
  try {
    const tables = await tableService.getTables(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Tables retrieved successfully', tables);
  } catch (error) {
    next(error);
  }
};

export const getTableById = async (req, res, next) => {
  try {
    const table = await tableService.getTableById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Table retrieved successfully', table);
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (req, res, next) => {
  try {
    const table = await tableService.updateTable(req.user.restaurantId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Table updated successfully', table);
  } catch (error) {
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  try {
    const table = await tableService.updateTableStatus(req.user.restaurantId, req.params.id, req.body.status);
    return sendSuccess(res, 200, 'Table status updated successfully', table);
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    await tableService.deleteTable(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Table deleted successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  createTable,
  getTables,
  getTableById,
  updateTable,
  updateTableStatus,
  deleteTable,
};

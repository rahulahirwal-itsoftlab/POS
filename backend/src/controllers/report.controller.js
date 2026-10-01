import * as reportService from '../services/report.service.js';
import { sendSuccess } from '../utils/response.js';

export const getSalesReport = async (req, res, next) => {
  try {
    const report = await reportService.getSalesReport(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Sales report generated from database records', report);
  } catch (error) {
    next(error);
  }
};

export const getOrdersReport = async (req, res, next) => {
  try {
    const report = await reportService.getOrdersReport(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Orders report generated from database records', report);
  } catch (error) {
    next(error);
  }
};

export const getPaymentsReport = async (req, res, next) => {
  try {
    const report = await reportService.getPaymentsReport(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Payments report generated from database records', report);
  } catch (error) {
    next(error);
  }
};

export const getInventoryReport = async (req, res, next) => {
  try {
    const report = await reportService.getInventoryReport(req.user.restaurantId);
    return sendSuccess(res, 200, 'Inventory stock & valuation report generated', report);
  } catch (error) {
    next(error);
  }
};

export const getWastageReport = async (req, res, next) => {
  try {
    const report = await reportService.getWastageReport(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Wastage report generated from database records', report);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseReport = async (req, res, next) => {
  try {
    const report = await reportService.getPurchaseReport(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Purchase spending report generated from database records', report);
  } catch (error) {
    next(error);
  }
};

export const getPurchasesReport = getPurchaseReport;

export const getFinancialReport = async (req, res, next) => {
  try {
    const report = await reportService.getFinancialReport(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Financial income & expense report generated', report);
  } catch (error) {
    next(error);
  }
};

export const getDashboardReport = async (req, res, next) => {
  try {
    const report = await reportService.getAdminDashboardSummary(req.user.restaurantId);
    return sendSuccess(res, 200, 'Restaurant Admin analytical dashboard summary generated', report);
  } catch (error) {
    next(error);
  }
};

export default {
  getSalesReport,
  getOrdersReport,
  getPaymentsReport,
  getInventoryReport,
  getWastageReport,
  getPurchaseReport,
  getPurchasesReport,
  getFinancialReport,
  getDashboardReport,
};

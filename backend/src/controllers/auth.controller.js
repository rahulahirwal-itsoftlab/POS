import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

export const registerOwner = async (req, res, next) => {
  try {
    const result = await authService.registerOwner(req.body);
    return sendSuccess(res, 201, 'Restaurant and owner account registered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return sendSuccess(res, 200, 'Current authenticated user profile retrieved', user);
  } catch (error) {
    next(error);
  }
};

export const getMe = getCurrentUser;

export const updateProfile = async (req, res, next) => {
  try {
    const updated = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, 200, 'Profile details updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    return sendSuccess(res, 200, 'Password changed successfully', result);
  } catch (error) {
    next(error);
  }
};

export default {
  registerOwner,
  login,
  getCurrentUser,
  getMe,
  updateProfile,
  changePassword,
};

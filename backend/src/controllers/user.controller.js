import * as userService from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export const createUser = async (req, res, next) => {
  try {
    const staff = await userService.createStaff(req.user.restaurantId, req.body);
    return sendSuccess(res, 201, 'User account created successfully', staff);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getStaffList(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getStaffById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateStaff(req.user.restaurantId, req.params.id, req.body);
    return sendSuccess(res, 200, 'User updated successfully', user);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const user = await userService.updateStaffStatus(req.user.restaurantId, req.params.id, req.body.isActive);
    return sendSuccess(res, 200, 'User status updated successfully', user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteStaff(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const createStaff = createUser;
export const getStaffList = getUsers;
export const getStaffById = getUserById;
export const updateStaff = updateUser;
export const deleteStaff = deleteUser;

export default {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  createStaff,
  getStaffList,
  getStaffById,
  updateStaff,
  deleteStaff,
};

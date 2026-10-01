import * as restaurantService from '../services/restaurant.service.js';
import { sendSuccess } from '../utils/response.js';

export const createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.createRestaurant(req.user.id, req.body);
    return sendSuccess(res, 201, 'Restaurant created successfully', restaurant);
  } catch (error) {
    next(error);
  }
};

export const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.user.restaurantId);
    return sendSuccess(res, 200, 'Restaurant profile retrieved successfully', restaurant);
  } catch (error) {
    next(error);
  }
};

export const getRestaurantById = async (req, res, next) => {
  try {
    if (req.params.id !== req.user.restaurantId) {
      const error = new Error('Restaurant not found');
      error.statusCode = 404;
      throw error;
    }
    const restaurant = await restaurantService.getRestaurantById(req.user.restaurantId);
    return sendSuccess(res, 200, 'Restaurant retrieved successfully', restaurant);
  } catch (error) {
    next(error);
  }
};

export const updateRestaurant = async (req, res, next) => {
  try {
    if (req.params.id !== req.user.restaurantId) {
      const error = new Error('Restaurant not found');
      error.statusCode = 404;
      throw error;
    }
    const restaurant = await restaurantService.updateRestaurantProfile(req.user.restaurantId, req.body);
    return sendSuccess(res, 200, 'Restaurant profile updated successfully', restaurant);
  } catch (error) {
    next(error);
  }
};

export default {
  createRestaurant,
  getRestaurant,
  getRestaurantById,
  updateRestaurant,
};

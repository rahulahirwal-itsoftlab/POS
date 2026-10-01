import * as recipeService from '../services/recipe.service.js';
import { sendSuccess } from '../utils/response.js';

export const createRecipe = async (req, res, next) => {
  try {
    const recipe = await recipeService.createOrUpdateRecipe(req.user.restaurantId, req.body);
    return sendSuccess(res, 201, 'Recipe created successfully', recipe);
  } catch (error) {
    next(error);
  }
};

export const getRecipes = async (req, res, next) => {
  try {
    const recipes = await recipeService.getRecipes(req.user.restaurantId, req.query);
    return sendSuccess(res, 200, 'Recipes retrieved successfully', recipes);
  } catch (error) {
    next(error);
  }
};

export const getRecipeById = async (req, res, next) => {
  try {
    const recipe = await recipeService.getRecipeById(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Recipe retrieved successfully', recipe);
  } catch (error) {
    next(error);
  }
};

export const getRecipeByMenuItem = async (req, res, next) => {
  try {
    const recipe = await recipeService.getRecipeByMenuItem(req.user.restaurantId, req.params.menuItemId);
    return sendSuccess(res, 200, 'Recipe retrieved successfully', recipe);
  } catch (error) {
    next(error);
  }
};

export const updateRecipe = async (req, res, next) => {
  try {
    const recipe = await recipeService.updateRecipe(req.user.restaurantId, req.params.id, req.body);
    return sendSuccess(res, 200, 'Recipe updated successfully', recipe);
  } catch (error) {
    next(error);
  }
};

export const deleteRecipe = async (req, res, next) => {
  try {
    await recipeService.deleteRecipe(req.user.restaurantId, req.params.id);
    return sendSuccess(res, 200, 'Recipe deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const addRecipeIngredient = async (req, res, next) => {
  try {
    const ingredient = await recipeService.addRecipeIngredient(req.user.restaurantId, req.params.id || req.params.recipeId, req.body);
    return sendSuccess(res, 201, 'Recipe ingredient added successfully', ingredient);
  } catch (error) {
    next(error);
  }
};

export const updateRecipeIngredient = async (req, res, next) => {
  try {
    const ingredient = await recipeService.updateRecipeIngredient(req.user.restaurantId, req.params.ingredientId, req.body);
    return sendSuccess(res, 200, 'Recipe ingredient updated successfully', ingredient);
  } catch (error) {
    next(error);
  }
};

export const removeRecipeIngredient = async (req, res, next) => {
  try {
    await recipeService.removeRecipeIngredient(req.user.restaurantId, req.params.ingredientId);
    return sendSuccess(res, 200, 'Recipe ingredient removed successfully');
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateRecipe = createRecipe;
export const addIngredient = addRecipeIngredient;
export const updateIngredient = updateRecipeIngredient;
export const removeIngredient = removeRecipeIngredient;

export default {
  createRecipe,
  getRecipes,
  getRecipeById,
  getRecipeByMenuItem,
  updateRecipe,
  deleteRecipe,
  addRecipeIngredient,
  updateRecipeIngredient,
  removeRecipeIngredient,
  createOrUpdateRecipe,
  addIngredient,
  updateIngredient,
  removeIngredient,
};

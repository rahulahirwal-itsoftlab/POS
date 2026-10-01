import { Router } from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import { validateUuidParams } from '../validations/resource.validation.js';
import * as recipeController from '../controllers/recipe.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles, ROLES } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { validateRecipeSetup, validateAddIngredient } from '../validations/recipe.validation.js';
import { validateRecipeIngredientUpdate, validateRecipeUpdate } from '../validations/resource.validation.js';

const router = Router();
validateUuidParams(router);

router.use(authenticate);
router.use(validateQuery);
router.use(authorizeRoles(ROLES.RESTAURANT_OWNER, ROLES.KITCHEN_ADMIN));

router.get('/menu-item/:menuItemId', recipeController.getRecipeByMenuItem);
router.get('/:id', recipeController.getRecipeById);
router.get('/', recipeController.getRecipes);
router.post('/', validateRequest(validateRecipeSetup), recipeController.createRecipe);
router.patch('/:id', validateRequest(validateRecipeUpdate), recipeController.updateRecipe);
router.delete('/:id', recipeController.deleteRecipe);

// Ingredients sub-resource
router.post('/:recipeId/ingredients', validateRequest(validateAddIngredient), recipeController.addRecipeIngredient);
router.post('/:id/ingredients', validateRequest(validateAddIngredient), recipeController.addRecipeIngredient);
router.patch('/:recipeId/ingredients/:ingredientId', validateRequest(validateRecipeIngredientUpdate), recipeController.updateRecipeIngredient);
router.patch('/ingredients/:ingredientId', validateRequest(validateRecipeIngredientUpdate), recipeController.updateRecipeIngredient);
router.delete('/:recipeId/ingredients/:ingredientId', recipeController.removeRecipeIngredient);
router.delete('/ingredients/:ingredientId', recipeController.removeRecipeIngredient);

export default router;

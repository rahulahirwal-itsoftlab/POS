import { isUuid } from './resource.validation.js';

export const validateRecipeSetup = (data) => {
  const errors = [];
  const validUnits = ['KG', 'GRAM', 'LITER', 'MILLILITER', 'PIECE', 'PACKET', 'CAN', 'BOTTLE'];
  if (!isUuid(data?.menuItemId)) {
    errors.push('menuItemId must be a UUID');
  }
  if (!Array.isArray(data?.ingredients) || data.ingredients.length === 0) {
    errors.push('ingredients array with at least one ingredient is required');
  } else {
    data.ingredients.forEach((ing, i) => {
      if (!isUuid(ing.inventoryItemId)) errors.push(`Ingredient ${i}: inventoryItemId must be a UUID`);
      if (ing.quantityRequired === undefined || isNaN(Number(ing.quantityRequired)) || Number(ing.quantityRequired) <= 0) {
        errors.push(`Ingredient ${i}: quantityRequired must be greater than 0`);
      }
      if (!ing.unit || !validUnits.includes(ing.unit)) {
        errors.push(`Ingredient ${i}: unit must be one of: ${validUnits.join(', ')}`);
      }
    });
  }
  return { isValid: errors.length === 0, errors };
};

export const validateAddIngredient = (data) => {
  const errors = [];
  const validUnits = ['KG', 'GRAM', 'LITER', 'MILLILITER', 'PIECE', 'PACKET', 'CAN', 'BOTTLE'];
  if (!isUuid(data?.inventoryItemId)) errors.push('inventoryItemId must be a UUID');
  if (data?.quantityRequired === undefined || isNaN(Number(data.quantityRequired)) || Number(data.quantityRequired) <= 0) {
    errors.push('quantityRequired must be a positive number');
  }
  if (!data?.unit || !validUnits.includes(data.unit)) {
    errors.push(`unit must be one of: ${validUnits.join(', ')}`);
  }
  return { isValid: errors.length === 0, errors };
};

export default {
  validateRecipeSetup,
  validateAddIngredient,
};

import { isUuid } from './resource.validation.js';

export const validateCreateCategory = (data) => {
  const errors = [];
  if (!data?.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Category name is required');
  }
  if (data?.name?.length > 100) errors.push('Category name must be at most 100 characters');
  if (data?.description !== undefined && data.description !== null && (typeof data.description !== 'string' || data.description.length > 1000)) errors.push('description must be at most 1000 characters');
  return { isValid: errors.length === 0, errors };
};

export const validateUpdateCategory = (data) => {
  const errors = [];
  if (data?.name !== undefined && (typeof data.name !== 'string' || !data.name.trim())) {
    errors.push('Category name cannot be empty');
  }
  if (data?.name?.length > 100) errors.push('Category name must be at most 100 characters');
  if (data?.description !== undefined && data.description !== null && (typeof data.description !== 'string' || data.description.length > 1000)) errors.push('description must be at most 1000 characters');
  if (!Object.keys(data || {}).some((key) => ['name', 'description'].includes(key))) errors.push('At least one supported field is required');
  return { isValid: errors.length === 0, errors };
};

export const validateCreateMenuItem = (data) => {
  const errors = [];
  if (!data?.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Menu item name is required');
  }
  if (data?.price === undefined || isNaN(Number(data.price)) || Number(data.price) < 0) {
    errors.push('Price must be a valid non-negative number');
  }
  if (data?.categoryId !== undefined && data.categoryId !== null && !isUuid(data.categoryId)) errors.push('categoryId must be a UUID');
  if (data?.isAvailable !== undefined && typeof data.isAvailable !== 'boolean') errors.push('isAvailable must be a boolean');
  return { isValid: errors.length === 0, errors };
};

export const validateUpdateMenuItem = (data) => {
  const errors = [];
  if (data?.name !== undefined && (typeof data.name !== 'string' || !data.name.trim())) {
    errors.push('Menu item name cannot be empty');
  }
  if (data?.price !== undefined && (isNaN(Number(data.price)) || Number(data.price) < 0)) {
    errors.push('Price must be a valid non-negative number');
  }
  if (data?.categoryId !== undefined && data.categoryId !== null && !isUuid(data.categoryId)) errors.push('categoryId must be a UUID');
  if (data?.isAvailable !== undefined && typeof data.isAvailable !== 'boolean') errors.push('isAvailable must be a boolean');
  if (!Object.keys(data || {}).some((key) => ['name', 'description', 'price', 'categoryId', 'isAvailable'].includes(key))) errors.push('At least one supported field is required');
  return { isValid: errors.length === 0, errors };
};

export default {
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateMenuItem,
  validateUpdateMenuItem,
};

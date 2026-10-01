export const validateCreateInventory = (data) => {
  const errors = [];
  const validUnits = ['KG', 'GRAM', 'LITER', 'MILLILITER', 'PIECE', 'PACKET', 'CAN', 'BOTTLE'];
  if (!data?.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Item name is required');
  }
  if (!data?.unit || !validUnits.includes(data.unit)) {
    errors.push(`unit must be one of: ${validUnits.join(', ')}`);
  }
  if (data?.currentStock !== undefined && (isNaN(Number(data.currentStock)) || Number(data.currentStock) < 0)) {
    errors.push('currentStock cannot be negative');
  }
  if (data?.minStockThreshold !== undefined && (isNaN(Number(data.minStockThreshold)) || Number(data.minStockThreshold) < 0)) {
    errors.push('minStockThreshold cannot be negative');
  }
  if (data?.costPerUnit !== undefined && (isNaN(Number(data.costPerUnit)) || Number(data.costPerUnit) < 0)) {
    errors.push('costPerUnit cannot be negative');
  }
  return { isValid: errors.length === 0, errors };
};

export const validateStockUpdate = (data) => {
  const errors = [];
  if (data?.currentStock !== undefined && (isNaN(Number(data.currentStock)) || Number(data.currentStock) < 0)) {
    errors.push('currentStock cannot be negative');
  }
  if (data?.adjustment !== undefined && isNaN(Number(data.adjustment))) {
    errors.push('adjustment must be a number');
  }
  if (data?.currentStock === undefined && data?.adjustment === undefined) {
    errors.push('Provide either currentStock (set new value) or adjustment (increment/decrement)');
  }
  return { isValid: errors.length === 0, errors };
};

export default {
  validateCreateInventory,
  validateStockUpdate,
};

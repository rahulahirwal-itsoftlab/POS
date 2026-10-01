import { isUuid } from './resource.validation.js';

export const validateCreateOrder = (data) => {
  const errors = [];
  if (!data?.tableId && !data?.customerName) {
    errors.push('Either tableId or customerName (for takeaway/counter order) must be provided');
  }
  if (data?.tableId && !isUuid(data.tableId)) errors.push('tableId must be a UUID');
  if (!Array.isArray(data?.items) || data.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    data.items.forEach((item, i) => {
      if (!isUuid(item.menuItemId)) errors.push(`Item ${i}: menuItemId must be a UUID`);
      if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0 || !Number.isInteger(Number(item.quantity))) {
        errors.push(`Item ${i}: quantity must be a positive integer`);
      }
    });
  }
  return { isValid: errors.length === 0, errors };
};

export const validateUpdateOrderStatus = (data) => {
  const errors = [];
  const validStatuses = ['PENDING', 'ACCEPTED', 'IN_PREPARATION', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
  if (!data?.status || !validStatuses.includes(data.status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }
  return { isValid: errors.length === 0, errors };
};

export default {
  validateCreateOrder,
  validateUpdateOrderStatus,
};

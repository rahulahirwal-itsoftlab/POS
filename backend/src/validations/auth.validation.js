export const validateRegisterOwner = (data) => {
  const errors = [];
  const restaurantName = data?.restaurantName || data?.restaurant_name;
  if (!restaurantName || typeof restaurantName !== 'string' || !restaurantName.trim()) {
    errors.push('restaurantName (or restaurant_name) is required');
  }
  if (!data?.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('name is required');
  }
  if (!data?.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('A valid email address is required');
  }
  if (!data?.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (data?.name?.length > 120 || (restaurantName && restaurantName.length > 150)) {
    errors.push('Name fields exceed the allowed length');
  }
  if (data?.email?.length > 254) errors.push('email must be at most 254 characters');
  return { isValid: errors.length === 0, errors };
};

export const validateLogin = (data) => {
  const errors = [];
  if (!data?.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('A valid email address is required');
  }
  if (!data?.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  }
  if (typeof data?.password === 'string' && data.password.length > 200) errors.push('Password is too long');
  return { isValid: errors.length === 0, errors };
};

export default {
  validateRegisterOwner,
  validateLogin,
};

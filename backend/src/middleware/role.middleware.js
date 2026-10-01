import { sendError } from '../utils/response.js';

export const ROLES = {
  RESTAURANT_REGISTRATION_ADMIN: 'RESTAURANT_REGISTRATION_ADMIN',
  RESTAURANT_OWNER: 'RESTAURANT_OWNER',
  KITCHEN_ADMIN: 'KITCHEN_ADMIN',
  WAITER: 'WAITER',
  RECEPTIONIST: 'RECEPTIONIST',
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 401, 'User unauthenticated', { code: 'UNAUTHENTICATED' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`,
        {
          code: 'FORBIDDEN',
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        }
      );
    }

    next();
  };
};

export default authorizeRoles;

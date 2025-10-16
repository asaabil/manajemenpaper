
import { sendError } from '../utils/responses.js';

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, 'Forbidden: You do not have the required role');
    }
    next();
  };
};

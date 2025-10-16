
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import { sendError } from '../utils/responses.js';

export const authRequired = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return sendError(res, 401, 'No token, authorization denied');
  }

  try {
    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = await User.findById(decoded.sub).select('-passwordHash');
    if (!req.user) {
      return sendError(res, 401, 'User not found');
    }
    next();
  } catch (error) {
    sendError(res, 401, 'Token is not valid');
  }
};

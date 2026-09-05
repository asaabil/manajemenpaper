
import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/responses.js';
import { sendPasswordResetEmail } from '../services/mail.service.mock.js';

export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    const token = authService.generateToken(user);
    sendSuccess(res, 201, { user, token });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    const token = authService.generateToken(user);
    sendSuccess(res, 200, { user, token });
  } catch (error) {
    sendError(res, 401, error.message);
  }
};

export const logout = (req, res) => {
  sendSuccess(res, 200, { message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await sendPasswordResetEmail(email, 'mock-reset-token');
    sendSuccess(res, 200, { message: 'Password reset email sent' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    sendSuccess(res, 200, { message: 'Password reset successfully' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

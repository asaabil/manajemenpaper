
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/responses.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash');
    sendSuccess(res, 200, users);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    sendSuccess(res, 200, user);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    sendSuccess(res, 200, user);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    sendSuccess(res, 200, { message: 'User deleted' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};


import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const registerUser = async (userData) => {
  const { name, email, password, affiliation, role } = userData;
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password,
    affiliation,
    role
  });

  return user;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    throw new Error('Invalid email or password');
  }

  return user;
};

export const generateToken = (user) => {
  return jwt.sign(
    { sub: user._id, email: user.email, role: user.role },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
};

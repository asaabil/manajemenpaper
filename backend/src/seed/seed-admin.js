
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL,
      passwordHash: process.env.ADMIN_PASSWORD,
      role: 'admin',
    });

    console.log('Admin user created');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();

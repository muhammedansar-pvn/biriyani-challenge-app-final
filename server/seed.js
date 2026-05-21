const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
  try {
    await Admin.deleteMany();

    const adminUser = await Admin.create({
      email: 'admin@ssf.com',
      password: 'password123',
    });

    console.log('Data Imported - Admin created: admin@ssf.com / password123');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error}`);
    process.exit(1);
  }
};

importData();

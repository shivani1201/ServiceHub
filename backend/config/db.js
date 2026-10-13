const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error('Check MONGODB_URI in backend/.env and make sure your IP is allowed in Atlas (Network Access).');
    process.exit(1);
  }
};

module.exports = connectDB;

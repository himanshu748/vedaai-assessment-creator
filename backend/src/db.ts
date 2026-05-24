import mongoose from 'mongoose';

export async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vedaai';
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully to:', mongoURI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

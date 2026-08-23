import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ganeshotsava';
    await mongoose.connect(connStr);
    console.log(`MongoDB Connected successfully to ${mongoose.connection.db?.databaseName}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

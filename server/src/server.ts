import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before importing app
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app';
import { connectDB } from './config/db';
import { Setting } from './models/Setting';
import { runSeed } from './seed/seed';

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Auto-seed if database settings are empty
  try {
    const settingsCount = await Setting.countDocuments();
    if (settingsCount === 0) {
      console.log('Database collections are empty. Auto-seeding production dataset...');
      await runSeed(false);
      console.log('Auto-seed completed successfully!');
    }
  } catch (err) {
    console.error('Error during auto-seed check:', err);
  }

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! Shutting down...', err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...', err.name, err.message);
    process.exit(1);
  });
};

startServer();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/api';
import { errorHandler } from './middleware/errorHandler';

import path from 'path';

const app = express();

// Serve uploads folder as static static resources
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allows client to render images hosted on server
}));

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Limit requests from same IP (security headers & rate limit)
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests from this IP, please try again in a minute.'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body (increased limit for base64 images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount all REST routes
app.use('/api', apiRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// Root fallback
app.use('/', (req, res) => {
  res.status(200).send('<h1>Ganeshotsava Community API Service is Online.</h1>');
});

// Centralized error handler middleware
app.use(errorHandler);

export default app;

import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this.target, this.constructor);
  }
  
  // Getter placeholder for captureStackTrace target
  private get target() {
    return this;
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production: don't leak internals
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : 'Something went wrong!',
    });
  }
};

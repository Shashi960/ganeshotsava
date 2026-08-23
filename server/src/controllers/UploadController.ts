import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const uploadBase64 = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      return next(new AppError('No image content provided', 400));
    }

    // Expecting base64 data format: data:image/png;base64,iVBORw0KGgo...
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return next(new AppError('Invalid image format. Must be base64 data URI', 400));
    }

    const type = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine extension
    let extension = 'png';
    if (type.includes('jpeg') || type.includes('jpg')) extension = 'jpg';
    else if (type.includes('gif')) extension = 'gif';
    else if (type.includes('webp')) extension = 'webp';

    const filename = `upload_${Date.now()}_${Math.round(Math.random() * 1000)}.${extension}`;
    
    // Target directory: c:\Chouti\server\uploads
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    // Return relative URL path
    res.status(200).json({
      status: 'success',
      url: `/uploads/${filename}`
    });
  } catch (error) {
    next(error);
  }
};

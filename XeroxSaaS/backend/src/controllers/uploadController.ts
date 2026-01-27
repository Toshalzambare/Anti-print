import { Request, Response } from 'express';
import s3, { BUCKET_NAME } from '../config/s3';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Type definition for Multer file (Standard Express type)
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// @desc    Upload file to MinIO and get Hash
// @route   POST /api/upload
// @access  Private (Student)
export const uploadFile = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // 1. Generate SHA-256 Hash (The "Fingerprint")
    const fileBuffer = req.file.buffer;
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const fileHash = hashSum.digest('hex');

    // 2. Generate a unique filename for storage (keep original extension)
    const fileExt = req.file.originalname.split('.').pop();
    const storageKey = `${uuidv4()}.${fileExt}`;

    // 3. Upload to MinIO (S3)
    const params = {
      Bucket: BUCKET_NAME,
      Key: storageKey,
      Body: fileBuffer,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();

    // 4. Return the Keys to Frontend
    // We do NOT save to DB yet. We only return the ID. 
    // The Frontend will send this ID back when the user clicks "Pay".
    res.status(201).json({
      message: 'File uploaded successfully',
      originalName: req.file.originalname,
      storageKey: uploadResult.Key, // The hidden ID
      fileHash: fileHash,           // The grouping key
      location: uploadResult.Location
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
};

// ... existing imports
// Add this import if missing:
// import s3, { BUCKET_NAME } from '../config/s3';

// @desc    Get Presigned URL for viewing/printing
// @route   POST /api/upload/presigned
// @access  Private (Owner only)
export const getFileUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storageKey } = req.body;

    if (!storageKey) {
      res.status(400).json({ message: 'Storage Key is required' });
      return;
    }

    // Generate a link that expires in 5 minutes (300 seconds)
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: BUCKET_NAME,
      Key: storageKey,
      Expires: 300, 
    });

    res.json({ url });
  } catch (error) {
    console.error('Presign Error:', error);
    res.status(500).json({ message: 'Could not generate link' });
  }
};
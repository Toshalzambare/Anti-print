import express from 'express';
import multer from 'multer';
import { uploadFile, getFileUrl } from '../controllers/uploadController'; // <--- Import getFileUrl
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/', protect, upload.single('file'), uploadFile);

// NEW ROUTE: Only Shop Owners can get download links
router.post('/presigned', protect, authorize('OWNER', 'EMPLOYEE'), getFileUrl); 

export default router;
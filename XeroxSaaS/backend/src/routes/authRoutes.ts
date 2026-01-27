import express from 'express';
import { registerShopOwner, loginUser, registerStudent, googleLogin } from '../controllers/authController';

const router = express.Router();

router.post('/register-shop', registerShopOwner);
router.post('/register-student', registerStudent);
router.post('/login', loginUser);
router.post('/google', googleLogin);

export default router;
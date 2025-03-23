import express from 'express';
import { userController } from '../controllers/index.js';

const router = express.Router();

router.get('/signup', userController.signup);
router.post('/verify-otp', userController.verifyOTP);
router.post('/login', userController.login);
router.post('/delete-account', userController.deleteAccount);

export default router; 
import express from 'express';
import { webhookController } from '../controllers/index.js';

const router = express.Router();

router.post('/image-processing', webhookController.handleImageProcessing);

export default router; 
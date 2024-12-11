import express from 'express';
import { mediaController } from '../controllers/index.js';
import upload from '../middleware/upload.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.post(
    '/edit',
    authenticateUser,
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'maskImage', maxCount: 1 }
    ]),
    mediaController.uploadAndEditImage
);

router.post(
    '/uploadAndInpaintImage',
    authenticateUser,
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'maskImage', maxCount: 1 }
    ]),
    mediaController.uploadAndInpaintImage
);

router.get(
    '/status/:id',
    authenticateUser,
    mediaController.checkStatus
);

export default router; 
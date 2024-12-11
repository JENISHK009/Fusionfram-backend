import { Media } from '../models/index.js';
import { cloudinary } from '../config/index.js';
import { imageEditingService } from '../utils/index.js';
import crypto from 'crypto';

const mediaController = {
    uploadAndEditImage: async (req, res) => {
        try {
            if (!req.files || !req.files.image || !req.files.maskImage) {
                return res.status(400).json({
                    success: false,
                    message: 'Both image and mask image are required'
                });
            }

            // Generate track ID
            const trackId = crypto.randomUUID();

            // Upload original image to Cloudinary
            const imageStr = req.files.image[0].buffer.toString('base64');
            const imageType = req.files.image[0].mimetype;

            const maskStr = req.files.maskImage[0].buffer.toString('base64');
            const maskType = req.files.maskImage[0].mimetype;

            // Upload both images to Cloudinary
            const [imageUpload, maskUpload] = await Promise.all([
                cloudinary.uploader.upload(
                    `data:${imageType};base64,${imageStr}`,
                    { folder: 'user_uploads/originals' }
                ),
                cloudinary.uploader.upload(
                    `data:${maskType};base64,${maskStr}`,
                    { folder: 'user_uploads/masks' }
                )
            ]);

            // Create media record first
            const media = new Media({
                url: imageUpload.secure_url,
                publicId: imageUpload.public_id,
                maskUrl: maskUpload.secure_url,
                maskPublicId: maskUpload.public_id,
                userId: req.currentUser._id,
                trackId,
                status: 'pending'
            });

            await media.save();

            // Generate webhook URL
            const webhookUrl = `${process.env.API_BASE_URL}/webhooks/image-processing`;

            console.log("imageUpload.secure_url", imageUpload.secure_url)
            console.log("maskUpload.secure_ur", maskUpload.secure_ur)


            // Call image editing API with webhook
            let data = await imageEditingService.removeObject(
                'https://i.ibb.co/kMRK2mg/image2.jpg',
                'https://i.ibb.co/tH0Z8HY/mask2.jpg',
                trackId,
                webhookUrl
            );
            console.log("data", data)

            res.status(200).json({
                success: true,
                message: 'Image upload initiated. You will be notified when processing is complete.',
                data: {
                    id: media._id,
                    trackId,
                    originalUrl: media.url,
                    maskUrl: media.maskUrl,
                    status: media.status
                }
            });

        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error processing image'
            });
        }
    },

    uploadAndInpaintImage: async (req, res) => {
        try {
            if (!req.files || !req.files.image || !req.files.maskImage) {
                return res.status(400).json({
                    success: false,
                    message: 'Both image and mask image are required'
                });
            }

            const trackId = crypto.randomUUID();

            const imageStr = req.files.image[0].buffer.toString('base64');
            const imageType = req.files.image[0].mimetype;
            const maskStr = req.files.maskImage[0].buffer.toString('base64');
            const maskType = req.files.maskImage[0].mimetype;

            const [imageUpload, maskUpload] = await Promise.all([
                cloudinary.uploader.upload(
                    `data:${imageType};base64,${imageStr}`,
                    { folder: 'user_uploads/originals' }
                ),
                cloudinary.uploader.upload(
                    `data:${maskType};base64,${maskStr}`,
                    { folder: 'user_uploads/masks' }
                )
            ]);

            // Save media record
            const media = new Media({
                url: imageUpload.secure_url,
                publicId: imageUpload.public_id,
                maskUrl: maskUpload.secure_url,
                maskPublicId: maskUpload.public_id,
                userId: req.currentUser._id,
                trackId,
                status: 'pending'
            });

            await media.save();

            // Generate webhook URL
            const webhookUrl = `${process.env.API_BASE_URL}/webhooks/image-processing`;

            // Call inpaintImage API
            const params = {
                modelId: "portrait-realisticman-v1",
                prompt: "sexy naked blonde girl showing her pussy, nude, nsfw, perfect boobs, naked boobs, naked pussy, no underwear, no clothes, no panties",
                negativePrompt: "Elements to exclude",
                width: 1024,
                height: 1024,
                samples: 1,
                steps: 20,
                safetyChecker: "no",
                safetyCheckerType: "blur",
                enhancePrompt: "yes",
                enhanceStyle: "nude",
                guidanceScale: 7,
                tomesd: "yes",
                useKarrasSigmas: "yes",
                algorithmType: "PNDMScheduler",
                strength: 0.8,
                seed: null,
                clipSkip: 1,
                temp: "no",
                loraModel: "Photorealistic-NSFW-flux",
                initImage: imageUpload.secure_url,
                maskImage: maskUpload.secure_url,
                scheduler: "PNDMScheduler",
                trackId,
                webhook: webhookUrl
            };

            const inpaintResponse = await imageEditingService.inpaintImage(params);

            if (!inpaintResponse.success) {
                throw new Error(inpaintResponse.error);
            }

            res.status(200).json({
                success: true,
                message: 'Image upload and inpainting initiated successfully.',
                data: {
                    id: media._id,
                    trackId,
                    originalUrl: media.url,
                    maskUrl: media.maskUrl,
                    status: media.status,
                    inpaintApiResponse: inpaintResponse.data
                }
            });

        } catch (error) {
            console.error('Inpaint upload error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error processing image'
            });
        }
    },

    // Add method to check processing status
    checkStatus: async (req, res) => {
        try {
            const { id } = req.params;

            const media = await Media.findOne({
                _id: id,
                userId: req.currentUser._id
            });

            if (!media) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found'
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    id: media._id,
                    status: media.status,
                    originalUrl: media.url,
                    editedUrl: media.editedUrl,
                    error: media.processingError
                }
            });

        } catch (error) {
            console.error('Status check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking status'
            });
        }
    }
};

export default mediaController; 
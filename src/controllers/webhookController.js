import { Media } from '../models/index.js';

const webhookController = {
    handleImageProcessing: async (req, res) => {
        try {
            console.log(req.body)
            const { track_id, output_url, error } = req.body;

            if (!track_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Track ID is required'
                });
            }

            const media = await Media.findOne({ trackId: track_id });

            if (!media) {
                return res.status(404).json({
                    success: false,
                    message: 'Media record not found'
                });
            }

            if (error) {
                media.status = 'failed';
                media.processingError = error;
            } else {
                media.status = 'completed';
                media.editedUrl = output_url;
            }

            await media.save();

            // You might want to emit a socket event here to notify the client
            // or trigger any other necessary actions

            res.status(200).json({
                success: true,
                message: 'Webhook processed successfully'
            });

        } catch (error) {
            console.error('Webhook processing error:', error);
            res.status(500).json({
                success: false,
                message: 'Error processing webhook'
            });
        }
    }
};

export default webhookController; 
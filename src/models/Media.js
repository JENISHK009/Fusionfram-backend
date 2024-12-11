import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    maskUrl: {
        type: String
    },
    maskPublicId: {
        type: String
    },
    editedUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    trackId: {
        type: String,
        required: true
    },
    processingError: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model('Media', mediaSchema); 
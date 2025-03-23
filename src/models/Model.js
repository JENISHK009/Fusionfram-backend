import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
    modelId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true, // Title is required
        trim: true
    },
    description: {
        type: String,
        required: true, // Description is required
        trim: true
    },
    thumbnail: {
        type: String,
        required: true,
    },
    prompt: {
        type: String,
        required: true
    },
    negativePrompt: {
        type: String,
        default: "Elements to exclude"
    },
    width: {
        type: Number,
        default: 1024
    },
    height: {
        type: Number,
        default: 1024
    },
    samples: {
        type: Number,
        default: 1
    },
    steps: {
        type: Number,
        default: 20
    },
    safetyChecker: {
        type: String,
        default: "no"
    },
    safetyCheckerType: {
        type: String,
        default: "blur"
    },
    enhancePrompt: {
        type: String,
        default: "yes"
    },
    enhanceStyle: {
        type: String,
        default: "nude"
    },
    guidanceScale: {
        type: Number,
        default: 7
    },
    tomesd: {
        type: String,
        default: "yes"
    },
    useKarrasSigmas: {
        type: String,
        default: "yes"
    },
    algorithmType: {
        type: String,
        default: "PNDMScheduler"
    },
    strength: {
        type: Number,
        default: 0.8
    },
    seed: {
        type: Number,
        default: null
    },
    clipSkip: {
        type: Number,
        default: 1
    },
    temp: {
        type: String,
        default: "no"
    },
    loraModel: {
        type: String,
        default: "Photorealistic-NSFW-flux"
    },
    scheduler: {
        type: String,
        default: "PNDMScheduler"
    },
    isActive: {
        type: Boolean,
        default: true // Default value is true
    }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model('Model', modelSchema);
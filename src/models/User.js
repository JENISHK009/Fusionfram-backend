import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the Role model
        ref: 'Role',
        required: true,
        default: null // Default role will be set programmatically
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    otp: {
        code: String,
        expiry: Date
    }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model('User', userSchema);
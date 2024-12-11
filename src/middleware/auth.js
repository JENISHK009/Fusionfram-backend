import { verifyToken } from '../utils/index.js';
import { User } from '../models/index.js';

export const authenticateUser = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyToken(token);

        // Get user from database
        const currentUser = await User.findOne({ 
            _id: decoded.userId,
            isDeleted: false 
        }).select('-password -otp');

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'User not found or unauthorized'
            });
        }

        if (!currentUser.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email first'
            });
        }

        // Add user to request object
        req.currentUser = currentUser;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token or expired'
        });
    }
}; 
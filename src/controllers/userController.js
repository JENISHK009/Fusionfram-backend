import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import { 
    sendOTPEmail, 
    generateOTP, 
    getOTPExpiry,
    generateToken 
} from '../utils/index.js';

export async function signup(req, res) {
    try {
        const { email } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Check for deleted user
        const deletedUser = await User.findOne({ email, isDeleted: true });
        if (deletedUser) {
            return res.status(403).json({ 
                success: false, 
                message: 'This account has been deleted. Please contact support for assistance.' 
            });
        }

        // Check for existing user
        const existingUser = await User.findOne({ email, isDeleted: false });

        // Generate OTP and set expiry
        const otp = generateOTP();
        const otpExpiry = getOTPExpiry();

        if (existingUser) {
            // Update existing inactive user
            if (!existingUser.isActive) {
                existingUser.otp = { code: otp, expiry: otpExpiry };
                await existingUser.save();

                await sendOTPEmail(email, otp);

                return res.status(200).json({
                    success: true,
                    message: 'Account details updated. Please verify your email with the new OTP.',
                    data: { email: existingUser.email }
                });
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: 'An active account with this email already exists' 
                });
            }
        }

        // Create new user
        const newUser = new User({
            email,
            isActive: false,
            isDeleted: false,
            otp: { code: otp, expiry: otpExpiry }
        });

        await newUser.save();
        await sendOTPEmail(email, otp);

        res.status(201).json({
            success: true,
            message: 'User created successfully. Please check your email for OTP verification.',
            data: { email: newUser.email }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}

export async function deleteAccount(req, res) {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email, isDeleted: false });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isDeleted = true;
        user.deletedAt = new Date();
        user.isActive = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

const SALT_ROUNDS = 10; // Salt rounds for password hashing

export async function verifyOTP(req, res) {
    try {
        const { email, otp, password } = req.body;

        // Validate input
        if (!email || !otp || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, and password are required'
            });
        }

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate OTP
        if (user.otp.code !== otp || user.otp.expiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Activate user, update password, and clear OTP
        user.isActive = true;
        user.password = hashedPassword;
        user.otp = undefined; // Clear OTP after verification
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Email verified and password set successfully',
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    isActive: user.isActive
                }
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email first'
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    isActive: user.isActive
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}
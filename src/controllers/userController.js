import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import { 
    sendOTPEmail, 
    generateOTP, 
    getOTPExpiry,
    generateToken 
} from '../utils/index.js';

const SALT_ROUNDS = 10;

const userController = {
    signup: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Basic validation
            if (!email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email and password are required' 
                });
            }

            // Check if user exists and is deleted
            const deletedUser = await User.findOne({ 
                email, 
                isDeleted: true 
            });

            if (deletedUser) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'This account has been deleted. Please contact support for assistance.' 
                });
            }

            // Check for existing user
            const existingUser = await User.findOne({ 
                email, 
                isDeleted: false 
            });

            // Generate OTP and hash password
            const otp = generateOTP();
            const otpExpiry = getOTPExpiry();
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            if (existingUser) {
                // If user exists but not active, update their details
                if (!existingUser.isActive) {
                    existingUser.password = hashedPassword;
                    existingUser.otp = {
                        code: otp,
                        expiry: otpExpiry
                    };
                    await existingUser.save();

                    // Send new OTP
                    await sendOTPEmail(email, otp);

                    return res.status(200).json({
                        success: true,
                        message: 'Account details updated. Please verify your email with the new OTP.',
                        data: { email: existingUser.email }
                    });
                } else {
                    // If user exists and is active
                    return res.status(400).json({ 
                        success: false, 
                        message: 'An active account with this email already exists' 
                    });
                }
            }

            // Create new user if doesn't exist
            const newUser = new User({
                email,
                password: hashedPassword,
                isActive: false,
                isDeleted: false,
                otp: {
                    code: otp,
                    expiry: otpExpiry
                }
            });

            await newUser.save();

            // Send OTP email
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
    },

    // Add a new method for soft delete
    deleteAccount: async (req, res) => {
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
            user.isActive = false; // Deactivate the account as well
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
    },

    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if OTP is valid and not expired
            if (user.otp.code !== otp || user.otp.expiry < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired OTP'
                });
            }

            // Activate user and clear OTP
            user.isActive = true;
            user.otp = undefined;
            await user.save();

            // Generate token after verification
            const token = generateToken(user._id);

            res.status(200).json({
                success: true,
                message: 'Email verified successfully',
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
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Basic validation
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
};

export default userController; 
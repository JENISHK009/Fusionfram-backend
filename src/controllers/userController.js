import { User, Roles } from "../models/index.js";
import bcrypt from "bcrypt";
import {
  sendOTPEmail,
  generateOTP,
  getOTPExpiry,
  generateToken,
} from "../utils/index.js";
import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const SALT_ROUNDS = 10;

export async function signup(req, res) {
  try {
    const { email } = req.query;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check for deleted user
    const deletedUser = await User.findOne({ email, isDeleted: true });
    if (deletedUser) {
      return res.status(403).json({
        success: false,
        message:
          "This account has been deleted. Please contact support for assistance.",
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email, isDeleted: false });

    // Generate OTP and set expiry
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Find the default role (user)
    const defaultRole = await Roles.findOne({ name: "user" });
    if (!defaultRole) {
      return res.status(500).json({
        success: false,
        message: "Default role not found",
      });
    }

    if (existingUser) {
      // Update existing inactive user
      if (!existingUser.isActive) {
        existingUser.otp = { code: otp, expiry: otpExpiry };
        await existingUser.save();

        await sendOTPEmail(email, otp);

        return res.status(200).json({
          success: true,
          message:
            "Account details updated. Please verify your email with the new OTP.",
          data: { email: existingUser.email },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "An active account with this email already exists",
        });
      }
    }

    // Create new user with the default role
    const newUser = new User({
      email,
      roleId: defaultRole._id, // Assign the default role
      isActive: false,
      isDeleted: false,
      otp: { code: otp, expiry: otpExpiry },
    });

    await newUser.save();
    await sendOTPEmail(email, otp);

    res.status(201).json({
      success: true,
      message:
        "User created successfully. Please check your email for OTP verification.",
      data: { email: newUser.email },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function googleLogin(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if the user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        email,
        name,
        profilePicture: picture,
        isActive: true,
        isGoogleAuth: true, // Mark the user as authenticated via Google
      });

      await user.save();
    } else if (!user.isGoogleAuth) {
      // If the user exists but didn't sign up via Google, update their details
      user.name = name;
      user.profilePicture = picture;
      user.isGoogleAuth = true;
      await user.save();
    }

    // Generate a token for the user
    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          isGoogleAuth: user.isGoogleAuth,
        },
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
        message: "User not found",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function verifyOTP(req, res) {
  try {
    const { email, code, password } = req.body;

    // Validate input
    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and password are required",
      });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate OTP
    if (user.otp.code !== code || user.otp.expiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Activate user, update password, and clear OTP
    user.isActive = true;
    user.password = hashedPassword;
    user.otp = undefined; // Clear OTP after verification
    await user.save();

    // Fetch the user's role
    const role = await Roles.findById(user.roleId);

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Email verified and password set successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
        role: role ? role.name : null, // Return the user's role
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Fetch the user's role
    const role = await Roles.findById(user.roleId);

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
        role: role ? role.name : null, // Include the role name in the response
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

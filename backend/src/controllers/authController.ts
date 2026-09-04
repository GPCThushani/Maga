import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { User } from '../models/User';

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ message: 'Email already registered.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        targetRole: user.targetRole,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        targetRole: user.targetRole,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// POST /api/v1/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({ message: 'No registered user found with this email address.' });
      return;
    }

    // Generate 6-digit OTP valid for 10 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = expires;
    await user.save();

    // 1. Prominent terminal output for verification and debugging
    console.log('\n==================================================');
    console.log(`PASSWORD RESET OTP FOR: ${user.email}`);
    console.log(`VERIFICATION CODE: ${otp}`);
    console.log(`VALID UNTIL: ${expires.toLocaleTimeString()}`);
    console.log('==================================================\n');

    // 2. Dispatch email if SMTP credentials exist, catching failure gracefully
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: `"Maga Careers" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'Your Password Reset OTP - Maga',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
              <h2 style="color: #111827; margin-bottom: 8px;">Reset Your Password</h2>
              <p style="color: #4b5563; font-size: 14px;">Use the verification code below to reset your Maga account password. This code is valid for 10 minutes.</p>
              <div style="margin: 24px 0; text-align: center;">
                <span style="display: inline-block; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f172a; background: #f1f5f9; padding: 12px 24px; border-radius: 6px;">${otp}</span>
              </div>
              <p style="color: #9ca3af; font-size: 12px;">If you did not request this, please disregard this email.</p>
            </div>
          `,
        });
        console.log(`Reset email successfully dispatched to ${user.email}`);
      } catch (mailError: any) {
        console.warn('SMTP dispatch skipped/failed. Check .env EMAIL credentials:', mailError.message);
      }
    } else {
      console.log('EMAIL_USER / EMAIL_PASS not defined. The generated OTP above can be entered directly in the UI.');
    }

    res.status(200).json({
      message: 'Verification code generated! Please check your terminal or email inbox.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset.', error: error.message });
  }
};

// POST /api/v1/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP code are required.' });
      return;
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordOtp: otp.trim(),
      resetPasswordOtpExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired OTP code.' });
      return;
    }

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Error verifying OTP.', error: error.message });
  }
};

// POST /api/v1/auth/reset-password
export const resetPasswordWithOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ message: 'Email, OTP, and new password are required.' });
      return;
    }

    // Backend validation matching frontend criteria (min 8 chars, uppercase, lowercase, number)
    const hasMinLen = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNum = /[0-9]/.test(newPassword);

    if (!hasMinLen || !hasUpper || !hasLower || !hasNum) {
      res.status(400).json({
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.',
      });
      return;
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordOtp: otp.trim(),
      resetPasswordOtpExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired OTP code.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    console.log(`Password successfully updated for ${user.email}`);

    res.status(200).json({ message: 'Password has been successfully updated.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password.', error: error.message });
  }
};
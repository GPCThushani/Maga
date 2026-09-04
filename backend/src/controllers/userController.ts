import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';

// GET /api/v1/users/profile
export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving profile.', error });
  }
};

// PUT /api/v1/users/profile
export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, university, degree, gradYear, targetRole, skills } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Apply updates if provided
    if (name) user.name = name;
    if (university !== undefined) user.university = university;
    if (degree !== undefined) user.degree = degree;
    if (gradYear !== undefined) user.gradYear = Number(gradYear);
    if (targetRole !== undefined) user.targetRole = targetRole;
    if (skills !== undefined && Array.isArray(skills)) user.skills = skills;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        degree: user.degree,
        gradYear: user.gradYear,
        targetRole: user.targetRole,
        skills: user.skills,
        cvUrl: user.cvUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile.', error });
  }
};

// PUT /api/v1/users/change-password
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Both current and new passwords are required.' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Validate old password against passwordHash
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing password.', error });
  }
};
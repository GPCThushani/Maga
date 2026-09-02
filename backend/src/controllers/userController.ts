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
import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Endpoints protected by JWT guard
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

export default router;
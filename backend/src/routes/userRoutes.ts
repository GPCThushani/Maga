import { Router } from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Both endpoints are protected by the JWT guard
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

export default router;
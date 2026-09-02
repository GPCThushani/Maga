import { Router } from 'express';
import { uploadAndParseCV } from '../controllers/cvController';
import { protect } from '../middleware/authMiddleware';
import { uploadCV } from '../middleware/uploadMiddleware';

const router = Router();

router.use(protect);
router.post('/upload', uploadCV.single('cv'), uploadAndParseCV);

export default router;
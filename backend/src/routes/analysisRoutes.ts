import { Router } from 'express';
import { analyzeJobFit } from '../controllers/analysisController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);
router.post('/match', analyzeJobFit);

export default router;
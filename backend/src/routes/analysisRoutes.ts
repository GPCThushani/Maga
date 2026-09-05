import { Router } from 'express';
import { analyzeJobFit } from '../controllers/analysisController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Protect all analysis endpoints with JWT verification
router.use(protect);

// POST /api/v1/analysis/match -> Computes fit score, matched/missing skills, dynamic advice, and syncs to Application
router.post('/match', analyzeJobFit);

export default router;
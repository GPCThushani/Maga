import { Router } from 'express';
import { getDashboardOverview } from '../controllers/analyticsController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);
router.get('/overview', getDashboardOverview);

export default router;
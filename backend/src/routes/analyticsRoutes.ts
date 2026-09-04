//analyticsRoutes.ts
import { Router } from 'express';
import {
  getDashboardOverview,
  getLiveMarketJobs,
} from '../controllers/analyticsController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/overview', getDashboardOverview);
router.get('/live-jobs', getLiveMarketJobs);

export default router;
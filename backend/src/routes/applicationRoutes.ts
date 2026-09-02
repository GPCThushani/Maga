import { Router } from 'express';
import {
  getApplications,
  createApplication,
  getApplicationById,
  updateApplicationStage,
  deleteApplication,
} from '../controllers/applicationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Require valid JWT authentication across all application tracking routes
router.use(protect);

router.get('/', getApplications);
router.post('/', createApplication);
router.get('/:id', getApplicationById);
router.patch('/:id/stage', updateApplicationStage);
router.delete('/:id', deleteApplication);

export default router;
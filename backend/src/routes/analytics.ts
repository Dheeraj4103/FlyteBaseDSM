import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getMissionAnalytics,
  getFleetAnalytics,
  getSiteAnalytics,
  getOperationalEfficiency,
  getMaintenanceSchedule
} from '../controllers/analyticsController';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Analytics endpoints
router.get('/missions', getMissionAnalytics);
router.get('/fleet', getFleetAnalytics);
router.get('/sites', getSiteAnalytics);
router.get('/efficiency', getOperationalEfficiency);
router.get('/maintenance', getMaintenanceSchedule);

export default router; 
import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { 
  getAllMissions, 
  getMissionById, 
  createMission, 
  updateMission, 
  deleteMission,
  startMission,
  pauseMission,
  resumeMission,
  abortMission,
  getMissionFlightLogs
} from '../controllers/missionController';
import { validateMission } from '../middleware/validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all missions (with filtering and pagination)
router.get('/', getAllMissions);

// Get mission by ID
router.get('/:id', getMissionById);

// Get flight logs for a mission
router.get('/:id/flight-logs', getMissionFlightLogs);

// Create new mission (requires OPERATOR or ADMIN role)
router.post('/', authorize('OPERATOR', 'ADMIN'), validateMission, createMission);

// Update mission (requires OPERATOR or ADMIN role)
router.put('/:id', authorize('OPERATOR', 'ADMIN'), validateMission, updateMission);

// Delete mission (requires ADMIN role)
router.delete('/:id', authorize('ADMIN'), deleteMission);

// Mission control actions (requires OPERATOR or ADMIN role)
router.post('/:id/start', authorize('OPERATOR', 'ADMIN'), startMission);
router.post('/:id/pause', authorize('OPERATOR', 'ADMIN'), pauseMission);
router.post('/:id/resume', authorize('OPERATOR', 'ADMIN'), resumeMission);
router.post('/:id/abort', authorize('OPERATOR', 'ADMIN'), abortMission);

export default router; 
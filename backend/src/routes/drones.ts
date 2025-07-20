import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { 
  getAllDrones, 
  getDroneById, 
  createDrone, 
  updateDrone, 
  deleteDrone,
  getDroneMissions
} from '../controllers/droneController';
import { validateDrone } from '../middleware/validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all drones (with filtering and pagination)
router.get('/', getAllDrones);

// Get drone by ID
router.get('/:id', getDroneById);

// Get missions for a specific drone
router.get('/:id/missions', getDroneMissions);

// Create new drone (requires OPERATOR or ADMIN role)
router.post('/', authorize('OPERATOR', 'ADMIN'), validateDrone, createDrone);

// Update drone (requires OPERATOR or ADMIN role)
router.put('/:id', authorize('OPERATOR', 'ADMIN'), validateDrone, updateDrone);

// Delete drone (requires ADMIN role)
router.delete('/:id', authorize('ADMIN'), deleteDrone);

export default router; 
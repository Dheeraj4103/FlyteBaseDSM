import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { 
  getAllSites, 
  getSiteById, 
  createSite, 
  updateSite, 
  deleteSite,
  getSiteMissions,
  getSiteDrones
} from '../controllers/siteController';
import { validateSite } from '../middleware/validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all sites (with filtering and pagination)
router.get('/', getAllSites);

// Get site by ID
router.get('/:id', getSiteById);

// Get missions for a specific site
router.get('/:id/missions', getSiteMissions);

// Get drones for a specific site
router.get('/:id/drones', getSiteDrones);

// Create new site (requires OPERATOR or ADMIN role)
router.post('/', authorize('OPERATOR', 'ADMIN'), validateSite, createSite);

// Update site (requires OPERATOR or ADMIN role)
router.put('/:id', authorize('OPERATOR', 'ADMIN'), validateSite, updateSite);

// Delete site (requires ADMIN role)
router.delete('/:id', authorize('ADMIN'), deleteSite);

export default router; 
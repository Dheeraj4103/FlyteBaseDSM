import { Router } from 'express';
import { register, login, refreshToken, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRegistration, validateLogin } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router; 
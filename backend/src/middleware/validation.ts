import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const missionSchema = z.object({
  name: z.string().min(1, 'Mission name is required'),
  description: z.string().optional(),
  type: z.enum(['INSPECTION', 'SECURITY_PATROL', 'SITE_MAPPING', 'SURVEY', 'CUSTOM']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  altitude: z.number().min(10).max(400), // meters
  speed: z.number().min(1).max(50), // m/s
  overlap: z.number().min(0).max(100), // percentage
  pattern: z.enum(['GRID', 'CROSSHATCH', 'PERIMETER', 'SPIRAL', 'CUSTOM']),
  waypoints: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    altitude: z.number().optional()
  })),
  surveyArea: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number())))
  }),
  estimatedDuration: z.number().min(1), // minutes
  scheduledAt: z.string().datetime().optional(),
  siteId: z.string().optional(),
  droneId: z.string().cuid('Invalid drone ID').optional()
});

const droneSchema = z.object({
  name: z.string().min(1, 'Drone name is required'),
  model: z.string().min(1, 'Drone model is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  maxFlightTime: z.number().min(1, 'Max flight time must be positive'),
  maxPayload: z.number().min(0, 'Max payload must be non-negative'),
  maxAltitude: z.number().min(10, 'Max altitude must be at least 10m'),
  maxSpeed: z.number().min(1, 'Max speed must be positive'),
  siteId: z.string().optional()
});

const siteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  area: z.number().min(0, 'Area must be non-negative')
});

// Validation middleware functions
export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateMission = (req: Request, res: Response, next: NextFunction) => {
  try {
    missionSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateDrone = (req: Request, res: Response, next: NextFunction) => {
  try {
    droneSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateSite = (req: Request, res: Response, next: NextFunction) => {
  try {
    siteSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
}; 
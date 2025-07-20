"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSite = exports.validateDrone = exports.validateMission = exports.validateLogin = exports.validateRegistration = void 0;
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    role: zod_1.z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional()
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required')
});
const missionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Mission name is required'),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['INSPECTION', 'SECURITY_PATROL', 'SITE_MAPPING', 'SURVEY', 'CUSTOM']),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    altitude: zod_1.z.number().min(10).max(400),
    speed: zod_1.z.number().min(1).max(50),
    overlap: zod_1.z.number().min(0).max(100),
    pattern: zod_1.z.enum(['GRID', 'CROSSHATCH', 'PERIMETER', 'SPIRAL', 'CUSTOM']),
    waypoints: zod_1.z.array(zod_1.z.object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        altitude: zod_1.z.number().optional()
    })),
    surveyArea: zod_1.z.object({
        type: zod_1.z.literal('Polygon'),
        coordinates: zod_1.z.array(zod_1.z.array(zod_1.z.array(zod_1.z.number())))
    }),
    estimatedDuration: zod_1.z.number().min(1),
    scheduledAt: zod_1.z.string().datetime().optional(),
    siteId: zod_1.z.string().cuid('Invalid site ID'),
    droneId: zod_1.z.string().cuid('Invalid drone ID').optional()
});
const droneSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Drone name is required'),
    model: zod_1.z.string().min(1, 'Drone model is required'),
    serialNumber: zod_1.z.string().min(1, 'Serial number is required'),
    maxFlightTime: zod_1.z.number().min(1, 'Max flight time must be positive'),
    maxPayload: zod_1.z.number().min(0, 'Max payload must be non-negative'),
    maxAltitude: zod_1.z.number().min(10, 'Max altitude must be at least 10m'),
    maxSpeed: zod_1.z.number().min(1, 'Max speed must be positive'),
    siteId: zod_1.z.string().cuid('Invalid site ID').optional()
});
const siteSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Site name is required'),
    description: zod_1.z.string().optional(),
    address: zod_1.z.string().min(1, 'Address is required'),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    area: zod_1.z.number().min(0, 'Area must be non-negative')
});
const validateRegistration = (req, res, next) => {
    try {
        registerSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.validateRegistration = validateRegistration;
const validateLogin = (req, res, next) => {
    try {
        loginSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.validateLogin = validateLogin;
const validateMission = (req, res, next) => {
    try {
        missionSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.validateMission = validateMission;
const validateDrone = (req, res, next) => {
    try {
        droneSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.validateDrone = validateDrone;
const validateSite = (req, res, next) => {
    try {
        siteSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.validateSite = validateSite;
//# sourceMappingURL=validation.js.map
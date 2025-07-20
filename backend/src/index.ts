import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Routes
import authRoutes from './routes/auth';
import missionRoutes from './routes/missions';
import droneRoutes from './routes/drones';
import siteRoutes from './routes/sites';
import analyticsRoutes from './routes/analytics';

// WebSocket handlers
import { setupWebSocket } from './websocket/setup';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/analytics', analyticsRoutes);

// API Documentation
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'FlyteBase DSM API',
    version: '1.0.0',
    description: 'Drone Survey Management System API',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/refresh': 'Refresh JWT token'
      },
      missions: {
        'GET /api/missions': 'Get all missions',
        'POST /api/missions': 'Create new mission',
        'GET /api/missions/:id': 'Get mission by ID',
        'PUT /api/missions/:id': 'Update mission',
        'DELETE /api/missions/:id': 'Delete mission',
        'POST /api/missions/:id/start': 'Start mission',
        'POST /api/missions/:id/pause': 'Pause mission',
        'POST /api/missions/:id/resume': 'Resume mission',
        'POST /api/missions/:id/abort': 'Abort mission'
      },
      drones: {
        'GET /api/drones': 'Get all drones',
        'POST /api/drones': 'Add new drone',
        'GET /api/drones/:id': 'Get drone by ID',
        'PUT /api/drones/:id': 'Update drone',
        'DELETE /api/drones/:id': 'Delete drone'
      },
      sites: {
        'GET /api/sites': 'Get all sites',
        'POST /api/sites': 'Add new site',
        'GET /api/sites/:id': 'Get site by ID',
        'PUT /api/sites/:id': 'Update site',
        'DELETE /api/sites/:id': 'Delete site'
      },
      analytics: {
        'GET /api/analytics/missions': 'Get mission analytics',
        'GET /api/analytics/fleet': 'Get fleet performance',
        'GET /api/analytics/sites': 'Get site coverage analytics'
      }
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Setup WebSocket
setupWebSocket(io);

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 FlyteBase DSM Server running on port ${PORT}`);
  logger.info(`📊 API Documentation available at http://localhost:${PORT}/api/docs`);
  logger.info(`🔌 WebSocket server ready for real-time updates`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app; 
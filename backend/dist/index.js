"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const auth_1 = __importDefault(require("./routes/auth"));
const missions_1 = __importDefault(require("./routes/missions"));
const drones_1 = __importDefault(require("./routes/drones"));
const sites_1 = __importDefault(require("./routes/sites"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const setup_1 = require("./websocket/setup");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3001;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.'
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.logger.info(message.trim()) } }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(limiter);
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/missions', missions_1.default);
app.use('/api/drones', drones_1.default);
app.use('/api/sites', sites_1.default);
app.use('/api/analytics', analytics_1.default);
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
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
(0, setup_1.setupWebSocket)(io);
server.listen(PORT, () => {
    logger_1.logger.info(`🚀 FlyteBase DSM Server running on port ${PORT}`);
    logger_1.logger.info(`📊 API Documentation available at http://localhost:${PORT}/api/docs`);
    logger_1.logger.info(`🔌 WebSocket server ready for real-time updates`);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('Process terminated');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = exports.io = void 0;
const logger_1 = require("../utils/logger");
const database_1 = __importDefault(require("../utils/database"));
const setupWebSocket = (socketIO) => {
    exports.io = socketIO;
    exports.io.on('connection', (socket) => {
        logger_1.logger.info(`Client connected: ${socket.id}`);
        socket.on('join:mission', (missionId) => {
            socket.join(`mission:${missionId}`);
            logger_1.logger.info(`Client ${socket.id} joined mission room: ${missionId}`);
        });
        socket.on('leave:mission', (missionId) => {
            socket.leave(`mission:${missionId}`);
            logger_1.logger.info(`Client ${socket.id} left mission room: ${missionId}`);
        });
        socket.on('join:fleet', () => {
            socket.join('fleet');
            logger_1.logger.info(`Client ${socket.id} joined fleet room`);
        });
        socket.on('leave:fleet', () => {
            socket.leave('fleet');
            logger_1.logger.info(`Client ${socket.id} left fleet room`);
        });
        socket.on('flight:log', async (data) => {
            try {
                const flightLog = await database_1.default.flightLog.create({
                    data: {
                        missionId: data.missionId,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        altitude: data.altitude,
                        speed: data.speed,
                        batteryLevel: data.batteryLevel,
                        status: data.status
                    }
                });
                exports.io.to(`mission:${data.missionId}`).emit('flight:log:update', flightLog);
                const mission = await database_1.default.mission.findUnique({
                    where: { id: data.missionId },
                    select: { droneId: true }
                });
                if (mission?.droneId) {
                    await database_1.default.drone.update({
                        where: { id: mission.droneId },
                        data: { batteryLevel: data.batteryLevel }
                    });
                    exports.io.to('fleet').emit('drone:battery_update', {
                        droneId: mission.droneId,
                        batteryLevel: data.batteryLevel
                    });
                }
                logger_1.logger.debug(`Flight log saved for mission ${data.missionId}`);
            }
            catch (error) {
                logger_1.logger.error('Error saving flight log:', error);
            }
        });
        socket.on('mission:complete', async (data) => {
            try {
                const [updatedMission, updatedDrone] = await Promise.all([
                    database_1.default.mission.update({
                        where: { id: data.missionId },
                        data: {
                            status: 'COMPLETED',
                            completedAt: new Date(),
                            actualDuration: data.actualDuration,
                            actualDistance: data.actualDistance,
                            coverageArea: data.coverageArea
                        },
                        include: {
                            site: { select: { id: true, name: true, latitude: true, longitude: true } },
                            drone: { select: { id: true, name: true, model: true, status: true } },
                            createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
                        }
                    }),
                    database_1.default.mission.findUnique({
                        where: { id: data.missionId },
                        select: { droneId: true }
                    }).then(mission => mission?.droneId ? database_1.default.drone.update({
                        where: { id: mission.droneId },
                        data: { status: 'AVAILABLE' }
                    }) : null)
                ]);
                exports.io.emit('mission:completed', updatedMission);
                if (updatedDrone) {
                    exports.io.to('fleet').emit('drone:status_updated', updatedDrone);
                }
                logger_1.logger.info(`Mission completed: ${data.missionId}`);
            }
            catch (error) {
                logger_1.logger.error('Error completing mission:', error);
            }
        });
        socket.on('mission:failed', async (data) => {
            try {
                const [updatedMission, updatedDrone] = await Promise.all([
                    database_1.default.mission.update({
                        where: { id: data.missionId },
                        data: {
                            status: 'FAILED',
                            completedAt: new Date()
                        },
                        include: {
                            site: { select: { id: true, name: true, latitude: true, longitude: true } },
                            drone: { select: { id: true, name: true, model: true, status: true } },
                            createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
                        }
                    }),
                    database_1.default.mission.findUnique({
                        where: { id: data.missionId },
                        select: { droneId: true }
                    }).then(mission => mission?.droneId ? database_1.default.drone.update({
                        where: { id: mission.droneId },
                        data: { status: 'ERROR' }
                    }) : null)
                ]);
                exports.io.emit('mission:failed', { ...updatedMission, reason: data.reason });
                if (updatedDrone) {
                    exports.io.to('fleet').emit('drone:status_updated', updatedDrone);
                }
                logger_1.logger.error(`Mission failed: ${data.missionId} - ${data.reason}`);
            }
            catch (error) {
                logger_1.logger.error('Error handling mission failure:', error);
            }
        });
        socket.on('drone:status_update', async (data) => {
            try {
                const updatedDrone = await database_1.default.drone.update({
                    where: { id: data.droneId },
                    data: {
                        status: data.status,
                        ...(data.batteryLevel !== undefined && { batteryLevel: data.batteryLevel })
                    }
                });
                exports.io.to('fleet').emit('drone:status_updated', updatedDrone);
                logger_1.logger.info(`Drone status updated: ${data.droneId} - ${data.status}`);
            }
            catch (error) {
                logger_1.logger.error('Error updating drone status:', error);
            }
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`Client disconnected: ${socket.id}`);
        });
    });
    logger_1.logger.info('WebSocket server setup complete');
};
exports.setupWebSocket = setupWebSocket;
//# sourceMappingURL=setup.js.map
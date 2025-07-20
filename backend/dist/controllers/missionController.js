"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMissionFlightLogs = exports.abortMission = exports.resumeMission = exports.pauseMission = exports.startMission = exports.deleteMission = exports.updateMission = exports.createMission = exports.getMissionById = exports.getAllMissions = void 0;
const database_1 = __importDefault(require("../utils/database"));
const logger_1 = require("../utils/logger");
const setup_1 = require("../websocket/setup");
const getAllMissions = async (req, res) => {
    try {
        const { page = '1', limit = '10', status, type, siteId, droneId, priority, startDate, endDate } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        if (siteId)
            where.siteId = siteId;
        if (droneId)
            where.droneId = droneId;
        if (priority)
            where.priority = priority;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [missions, total] = await Promise.all([
            database_1.default.mission.findMany({
                where,
                include: {
                    site: {
                        select: { id: true, name: true, latitude: true, longitude: true }
                    },
                    drone: {
                        select: { id: true, name: true, model: true, status: true }
                    },
                    createdByUser: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            database_1.default.mission.count({ where })
        ]);
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            success: true,
            data: missions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching missions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch missions'
        });
    }
};
exports.getAllMissions = getAllMissions;
const getMissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const mission = await database_1.default.mission.findUnique({
            where: { id },
            include: {
                site: {
                    select: { id: true, name: true, address: true, latitude: true, longitude: true, area: true }
                },
                drone: {
                    select: {
                        id: true,
                        name: true,
                        model: true,
                        status: true,
                        batteryLevel: true,
                        maxFlightTime: true,
                        maxAltitude: true,
                        maxSpeed: true
                    }
                },
                createdByUser: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                flightLogs: {
                    orderBy: { timestamp: 'desc' },
                    take: 100
                }
            }
        });
        if (!mission) {
            return res.status(404).json({
                success: false,
                error: 'Mission not found'
            });
        }
        res.json({
            success: true,
            data: mission
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching mission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mission'
        });
    }
};
exports.getMissionById = getMissionById;
const createMission = async (req, res) => {
    try {
        const { name, description, type, priority, altitude, speed, overlap, pattern, waypoints, surveyArea, estimatedDuration, scheduledAt, siteId, droneId } = req.body;
        const site = await database_1.default.site.findUnique({
            where: { id: siteId }
        });
        if (!site) {
            return res.status(400).json({
                success: false,
                error: 'Site not found'
            });
        }
        if (droneId) {
            const drone = await database_1.default.drone.findUnique({
                where: { id: droneId }
            });
            if (!drone) {
                return res.status(400).json({
                    success: false,
                    error: 'Drone not found'
                });
            }
            if (drone.status !== 'AVAILABLE') {
                return res.status(400).json({
                    success: false,
                    error: 'Drone is not available'
                });
            }
        }
        const mission = await database_1.default.mission.create({
            data: {
                name,
                description,
                type,
                priority,
                altitude,
                speed,
                overlap,
                pattern,
                waypoints,
                surveyArea,
                estimatedDuration,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                siteId,
                droneId,
                createdBy: req.user.id
            },
            include: {
                site: {
                    select: { id: true, name: true, latitude: true, longitude: true }
                },
                drone: {
                    select: { id: true, name: true, model: true, status: true }
                },
                createdByUser: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });
        setup_1.io.emit('mission:created', mission);
        logger_1.logger.info(`Mission created: ${mission.id} by user ${req.user.id}`);
        res.status(201).json({
            success: true,
            data: mission
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating mission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create mission'
        });
    }
};
exports.createMission = createMission;
const updateMission = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const existingMission = await database_1.default.mission.findUnique({
            where: { id }
        });
        if (!existingMission) {
            return res.status(404).json({
                success: false,
                error: 'Mission not found'
            });
        }
        if (['IN_PROGRESS', 'COMPLETED', 'ABORTED', 'FAILED'].includes(existingMission.status)) {
            return res.status(400).json({
                success: false,
                error: 'Cannot update mission that is in progress or completed'
            });
        }
        const mission = await database_1.default.mission.update({
            where: { id },
            data: updateData,
            include: {
                site: {
                    select: { id: true, name: true, latitude: true, longitude: true }
                },
                drone: {
                    select: { id: true, name: true, model: true, status: true }
                },
                createdByUser: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });
        setup_1.io.emit('mission:updated', mission);
        logger_1.logger.info(`Mission updated: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            data: mission
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating mission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update mission'
        });
    }
};
exports.updateMission = updateMission;
const deleteMission = async (req, res) => {
    try {
        const { id } = req.params;
        const existingMission = await database_1.default.mission.findUnique({
            where: { id }
        });
        if (!existingMission) {
            return res.status(404).json({
                success: false,
                error: 'Mission not found'
            });
        }
        if (existingMission.status === 'IN_PROGRESS') {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete mission that is in progress'
            });
        }
        await database_1.default.mission.delete({
            where: { id }
        });
        setup_1.io.emit('mission:deleted', { id });
        logger_1.logger.info(`Mission deleted: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            message: 'Mission deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting mission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete mission'
        });
    }
};
exports.deleteMission = deleteMission;
const startMission = async (req, res) => {
    try {
        const { id } = req.params;
        const mission = await database_1.default.mission.findUnique({
            where: { id },
            include: { drone: true }
        });
        if (!mission) {
            return res.status(404).json({
                success: false,
                error: 'Mission not found'
            });
        }
        if (mission.status !== 'PLANNED' && mission.status !== 'SCHEDULED') {
            return res.status(400).json({
                success: false,
                error: 'Mission can only be started if it is planned or scheduled'
            });
        }
        if (!mission.droneId) {
            return res.status(400).json({
                success: false,
                error: 'Mission must have an assigned drone to start'
            });
        }
        if (mission.drone?.status !== 'AVAILABLE') {
            return res.status(400).json({
                success: false,
                error: 'Assigned drone is not available'
            });
        }
        const [updatedMission, updatedDrone] = await Promise.all([
            database_1.default.mission.update({
                where: { id },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date()
                },
                include: {
                    site: { select: { id: true, name: true, latitude: true, longitude: true } },
                    drone: { select: { id: true, name: true, model: true, status: true } },
                    createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
                }
            }),
            database_1.default.drone.update({
                where: { id: mission.droneId },
                data: { status: 'IN_MISSION' }
            })
        ]);
        setup_1.io.emit('mission:started', updatedMission);
        setup_1.io.emit('drone:status_updated', updatedDrone);
        logger_1.logger.info(`Mission started: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            data: updatedMission
        });
    }
    catch (error) {
        logger_1.logger.error('Error starting mission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start mission'
        });
    }
};
exports.startMission = startMission;
const pauseMission = async (req, res) => {
    try {
        const { id } = req.params;
        const mission = await database_1.default.mission.findUnique({
            where: { id }
        });
        if (!mission) {
            return res.status(404).json({
                success: false,
                error: 'Mission not found'
            });
        }
        if (mission.status !== 'IN_PROGRESS') {
            return res.status(400).json({
                success: false,
                error: 'Mission can only be paused if it is in progress'
            });
        }
        const updatedMission = await database_1.default.mission.update({
            where: { id },
            data: { status: 'PAUSED' },
            include: {
                site: { select: { id: true, name: true, latitude: true, longitude: true } },
                drone: { select: { id: true, name: true, model: true, status: true } },
                createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
            }
        });
        setup_1.io.emit('mission:paused', updatedMission);
        logger_1.logger.info(`Mission paused: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            data: updatedMission
        });
    }
    catch (error) {
        logger_1.logger.error('Error pausing mission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to pause mission'
        });
    }
};
exports.pauseMission = pauseMission;
const resumeMission = async (req, res) => {
    try {
        const { id } = req.params;
        const mission = await database_1.default.mission.findUnique({
            where: { id }
        });
        if (!mission) {
            return res.status(404).json({
                success: false,
                error: 'Mission not found'
            });
        }
        if (mission.status !== 'PAUSED') {
            return res.status(400).json({
                success: false,
                error: 'Mission can only be resumed if it is paused'
            });
        }
        const updatedMission = await database_1.default.mission.update({
            where: { id },
            data: { status: 'IN_PROGRESS' },
            include: {
                site: { select: { id: true, name: true, latitude: true, longitude: true } },
                drone: { select: { id: true, name: true, model: true, status: true } },
                createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
            }
        });
        setup_1.io.emit('mission:resumed', updatedMission);
        logger_1.logger.info(`Mission resumed: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            data: updatedMission
        });
    }
    catch (error) {
        logger_1.logger.error('Error resuming mission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resume mission'
        });
    }
};
exports.resumeMission = resumeMission;
const abortMission = async (req, res) => {
    try {
        const { id } = req.params;
        const mission = await database_1.default.mission.findUnique({
            where: { id },
            include: { drone: true }
        });
        if (!mission) {
            return res.status(404).json({
                success: false,
                error: 'Mission not found'
            });
        }
        if (!['IN_PROGRESS', 'PAUSED'].includes(mission.status)) {
            return res.status(400).json({
                success: false,
                error: 'Mission can only be aborted if it is in progress or paused'
            });
        }
        const [updatedMission, updatedDrone] = await Promise.all([
            database_1.default.mission.update({
                where: { id },
                data: {
                    status: 'ABORTED',
                    completedAt: new Date()
                },
                include: {
                    site: { select: { id: true, name: true, latitude: true, longitude: true } },
                    drone: { select: { id: true, name: true, model: true, status: true } },
                    createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
                }
            }),
            mission.droneId ? database_1.default.drone.update({
                where: { id: mission.droneId },
                data: { status: 'AVAILABLE' }
            }) : null
        ]);
        setup_1.io.emit('mission:aborted', updatedMission);
        if (updatedDrone) {
            setup_1.io.emit('drone:status_updated', updatedDrone);
        }
        logger_1.logger.info(`Mission aborted: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            data: updatedMission
        });
    }
    catch (error) {
        logger_1.logger.error('Error aborting mission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to abort mission'
        });
    }
};
exports.abortMission = abortMission;
const getMissionFlightLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const mission = await database_1.default.mission.findUnique({
            where: { id }
        });
        if (!mission) {
            return res.status(404).json({
                success: false,
                error: 'Mission not found'
            });
        }
        const [flightLogs, total] = await Promise.all([
            database_1.default.flightLog.findMany({
                where: { missionId: id },
                orderBy: { timestamp: 'desc' },
                skip,
                take: limitNum
            }),
            database_1.default.flightLog.count({
                where: { missionId: id }
            })
        ]);
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            success: true,
            data: flightLogs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching flight logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch flight logs'
        });
    }
};
exports.getMissionFlightLogs = getMissionFlightLogs;
//# sourceMappingURL=missionController.js.map
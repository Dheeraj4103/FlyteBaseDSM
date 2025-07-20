"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDroneMissions = exports.deleteDrone = exports.updateDrone = exports.createDrone = exports.getDroneById = exports.getAllDrones = void 0;
const database_1 = __importDefault(require("../utils/database"));
const logger_1 = require("../utils/logger");
const getAllDrones = async (req, res) => {
    try {
        const { page = '1', limit = '10', status, siteId, model } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status)
            where.status = status;
        if (siteId)
            where.siteId = siteId;
        if (model)
            where.model = { contains: model, mode: 'insensitive' };
        const [drones, total] = await Promise.all([
            database_1.default.drone.findMany({
                where,
                include: {
                    site: {
                        select: { id: true, name: true, latitude: true, longitude: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            database_1.default.drone.count({ where })
        ]);
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            success: true,
            data: drones,
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
        logger_1.logger.error('Error fetching drones:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch drones'
        });
    }
};
exports.getAllDrones = getAllDrones;
const getDroneById = async (req, res) => {
    try {
        const { id } = req.params;
        const drone = await database_1.default.drone.findUnique({
            where: { id },
            include: {
                site: {
                    select: { id: true, name: true, address: true, latitude: true, longitude: true }
                },
                missions: {
                    where: { status: { in: ['IN_PROGRESS', 'PAUSED'] } },
                    select: { id: true, name: true, status: true, startedAt: true }
                }
            }
        });
        if (!drone) {
            return res.status(404).json({
                success: false,
                error: 'Drone not found'
            });
        }
        res.json({
            success: true,
            data: drone
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching drone:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch drone'
        });
    }
};
exports.getDroneById = getDroneById;
const createDrone = async (req, res) => {
    try {
        const { name, model, serialNumber, maxFlightTime, maxPayload, maxAltitude, maxSpeed, siteId } = req.body;
        const existingDrone = await database_1.default.drone.findUnique({
            where: { serialNumber }
        });
        if (existingDrone) {
            return res.status(400).json({
                success: false,
                error: 'Drone with this serial number already exists'
            });
        }
        if (siteId) {
            const site = await database_1.default.site.findUnique({
                where: { id: siteId }
            });
            if (!site) {
                return res.status(400).json({
                    success: false,
                    error: 'Site not found'
                });
            }
        }
        const drone = await database_1.default.drone.create({
            data: {
                name,
                model,
                serialNumber,
                maxFlightTime,
                maxPayload,
                maxAltitude,
                maxSpeed,
                siteId
            },
            include: {
                site: {
                    select: { id: true, name: true, latitude: true, longitude: true }
                }
            }
        });
        logger_1.logger.info(`Drone created: ${drone.id} by user ${req.user.id}`);
        res.status(201).json({
            success: true,
            data: drone
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating drone:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create drone'
        });
    }
};
exports.createDrone = createDrone;
const updateDrone = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const existingDrone = await database_1.default.drone.findUnique({
            where: { id }
        });
        if (!existingDrone) {
            return res.status(404).json({
                success: false,
                error: 'Drone not found'
            });
        }
        if (updateData.serialNumber && updateData.serialNumber !== existingDrone.serialNumber) {
            const duplicateDrone = await database_1.default.drone.findUnique({
                where: { serialNumber: updateData.serialNumber }
            });
            if (duplicateDrone) {
                return res.status(400).json({
                    success: false,
                    error: 'Drone with this serial number already exists'
                });
            }
        }
        if (updateData.siteId) {
            const site = await database_1.default.site.findUnique({
                where: { id: updateData.siteId }
            });
            if (!site) {
                return res.status(400).json({
                    success: false,
                    error: 'Site not found'
                });
            }
        }
        const drone = await database_1.default.drone.update({
            where: { id },
            data: updateData,
            include: {
                site: {
                    select: { id: true, name: true, latitude: true, longitude: true }
                }
            }
        });
        logger_1.logger.info(`Drone updated: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            data: drone
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating drone:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update drone'
        });
    }
};
exports.updateDrone = updateDrone;
const deleteDrone = async (req, res) => {
    try {
        const { id } = req.params;
        const existingDrone = await database_1.default.drone.findUnique({
            where: { id },
            include: {
                missions: {
                    where: { status: { in: ['IN_PROGRESS', 'PAUSED'] } }
                }
            }
        });
        if (!existingDrone) {
            return res.status(404).json({
                success: false,
                error: 'Drone not found'
            });
        }
        if (existingDrone.missions.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete drone that is currently in a mission'
            });
        }
        await database_1.default.drone.delete({
            where: { id }
        });
        logger_1.logger.info(`Drone deleted: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            message: 'Drone deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting drone:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete drone'
        });
    }
};
exports.deleteDrone = deleteDrone;
const getDroneMissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '10', status } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const drone = await database_1.default.drone.findUnique({
            where: { id }
        });
        if (!drone) {
            return res.status(404).json({
                success: false,
                error: 'Drone not found'
            });
        }
        const where = { droneId: id };
        if (status)
            where.status = status;
        const [missions, total] = await Promise.all([
            database_1.default.mission.findMany({
                where,
                include: {
                    site: {
                        select: { id: true, name: true, latitude: true, longitude: true }
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
        logger_1.logger.error('Error fetching drone missions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch drone missions'
        });
    }
};
exports.getDroneMissions = getDroneMissions;
//# sourceMappingURL=droneController.js.map
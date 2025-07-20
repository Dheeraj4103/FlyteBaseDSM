"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteDrones = exports.getSiteMissions = exports.deleteSite = exports.updateSite = exports.createSite = exports.getSiteById = exports.getAllSites = void 0;
const database_1 = __importDefault(require("../utils/database"));
const logger_1 = require("../utils/logger");
const getAllSites = async (req, res) => {
    try {
        const { page = '1', limit = '10', search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [sites, total] = await Promise.all([
            database_1.default.site.findMany({
                where,
                include: {
                    createdByUser: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    },
                    _count: {
                        select: { missions: true, drones: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            database_1.default.site.count({ where })
        ]);
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            success: true,
            data: sites,
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
        logger_1.logger.error('Error fetching sites:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sites'
        });
    }
};
exports.getAllSites = getAllSites;
const getSiteById = async (req, res) => {
    try {
        const { id } = req.params;
        const site = await database_1.default.site.findUnique({
            where: { id },
            include: {
                createdByUser: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                missions: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, name: true, status: true, type: true, createdAt: true }
                },
                drones: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, name: true, model: true, status: true, batteryLevel: true }
                }
            }
        });
        if (!site) {
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }
        res.json({
            success: true,
            data: site
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching site:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch site'
        });
    }
};
exports.getSiteById = getSiteById;
const createSite = async (req, res) => {
    try {
        const { name, description, address, latitude, longitude, area } = req.body;
        const site = await database_1.default.site.create({
            data: {
                name,
                description,
                address,
                latitude,
                longitude,
                area,
                createdBy: req.user.id
            },
            include: {
                createdByUser: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });
        logger_1.logger.info(`Site created: ${site.id} by user ${req.user.id}`);
        res.status(201).json({
            success: true,
            data: site
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating site:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create site'
        });
    }
};
exports.createSite = createSite;
const updateSite = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const existingSite = await database_1.default.site.findUnique({
            where: { id }
        });
        if (!existingSite) {
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }
        const site = await database_1.default.site.update({
            where: { id },
            data: updateData,
            include: {
                createdByUser: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });
        logger_1.logger.info(`Site updated: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            data: site
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating site:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update site'
        });
    }
};
exports.updateSite = updateSite;
const deleteSite = async (req, res) => {
    try {
        const { id } = req.params;
        const existingSite = await database_1.default.site.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { missions: true, drones: true }
                }
            }
        });
        if (!existingSite) {
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }
        if (existingSite._count.missions > 0 || existingSite._count.drones > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete site that has missions or drones assigned'
            });
        }
        await database_1.default.site.delete({
            where: { id }
        });
        logger_1.logger.info(`Site deleted: ${id} by user ${req.user.id}`);
        res.json({
            success: true,
            message: 'Site deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting site:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete site'
        });
    }
};
exports.deleteSite = deleteSite;
const getSiteMissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '10', status } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const site = await database_1.default.site.findUnique({
            where: { id }
        });
        if (!site) {
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }
        const where = { siteId: id };
        if (status)
            where.status = status;
        const [missions, total] = await Promise.all([
            database_1.default.mission.findMany({
                where,
                include: {
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
        logger_1.logger.error('Error fetching site missions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch site missions'
        });
    }
};
exports.getSiteMissions = getSiteMissions;
const getSiteDrones = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '10', status } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const site = await database_1.default.site.findUnique({
            where: { id }
        });
        if (!site) {
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }
        const where = { siteId: id };
        if (status)
            where.status = status;
        const [drones, total] = await Promise.all([
            database_1.default.drone.findMany({
                where,
                include: {
                    missions: {
                        where: { status: { in: ['IN_PROGRESS', 'PAUSED'] } },
                        select: { id: true, name: true, status: true }
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
        logger_1.logger.error('Error fetching site drones:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch site drones'
        });
    }
};
exports.getSiteDrones = getSiteDrones;
//# sourceMappingURL=siteController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaintenanceSchedule = exports.getOperationalEfficiency = exports.getSiteAnalytics = exports.getFleetAnalytics = exports.getMissionAnalytics = void 0;
const database_1 = __importDefault(require("../utils/database"));
const logger_1 = require("../utils/logger");
const getMissionAnalytics = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const [totalMissions, completedMissions, failedMissions, inProgressMissions, missionTypes, missionStatuses, averageDuration, totalDistance, totalCoverage] = await Promise.all([
            database_1.default.mission.count({
                where: { createdAt: { gte: startDate } }
            }),
            database_1.default.mission.count({
                where: {
                    createdAt: { gte: startDate },
                    status: 'COMPLETED'
                }
            }),
            database_1.default.mission.count({
                where: {
                    createdAt: { gte: startDate },
                    status: { in: ['FAILED', 'ABORTED'] }
                }
            }),
            database_1.default.mission.count({
                where: {
                    createdAt: { gte: startDate },
                    status: { in: ['IN_PROGRESS', 'PAUSED'] }
                }
            }),
            database_1.default.mission.groupBy({
                by: ['type'],
                where: { createdAt: { gte: startDate } },
                _count: { type: true }
            }),
            database_1.default.mission.groupBy({
                by: ['status'],
                where: { createdAt: { gte: startDate } },
                _count: { status: true }
            }),
            database_1.default.mission.aggregate({
                where: {
                    createdAt: { gte: startDate },
                    actualDuration: { not: null }
                },
                _avg: { actualDuration: true }
            }),
            database_1.default.mission.aggregate({
                where: {
                    createdAt: { gte: startDate },
                    actualDistance: { not: null }
                },
                _sum: { actualDistance: true }
            }),
            database_1.default.mission.aggregate({
                where: {
                    createdAt: { gte: startDate },
                    coverageArea: { not: null }
                },
                _sum: { coverageArea: true }
            })
        ]);
        const successRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
        res.json({
            success: true,
            data: {
                period,
                summary: {
                    totalMissions,
                    completedMissions,
                    failedMissions,
                    inProgressMissions,
                    successRate: Math.round(successRate * 100) / 100
                },
                metrics: {
                    averageDuration: averageDuration._avg.actualDuration || 0,
                    totalDistance: totalDistance._sum.actualDistance || 0,
                    totalCoverage: totalCoverage._sum.coverageArea || 0
                },
                distributions: {
                    types: missionTypes.map(item => ({
                        type: item.type,
                        count: item._count.type
                    })),
                    statuses: missionStatuses.map(item => ({
                        status: item.status,
                        count: item._count.status
                    }))
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching mission analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mission analytics'
        });
    }
};
exports.getMissionAnalytics = getMissionAnalytics;
const getFleetAnalytics = async (req, res) => {
    try {
        const [totalDrones, availableDrones, inMissionDrones, maintenanceDrones, offlineDrones, errorDrones, averageBattery, droneModels, siteDistribution] = await Promise.all([
            database_1.default.drone.count(),
            database_1.default.drone.count({
                where: { status: 'AVAILABLE' }
            }),
            database_1.default.drone.count({
                where: { status: 'IN_MISSION' }
            }),
            database_1.default.drone.count({
                where: { status: 'MAINTENANCE' }
            }),
            database_1.default.drone.count({
                where: { status: 'OFFLINE' }
            }),
            database_1.default.drone.count({
                where: { status: 'ERROR' }
            }),
            database_1.default.drone.aggregate({
                _avg: { batteryLevel: true }
            }),
            database_1.default.drone.groupBy({
                by: ['model'],
                _count: { model: true }
            }),
            database_1.default.drone.groupBy({
                by: ['siteId'],
                _count: { siteId: true }
            })
        ]);
        const utilizationRate = totalDrones > 0 ? (inMissionDrones / totalDrones) * 100 : 0;
        res.json({
            success: true,
            data: {
                summary: {
                    totalDrones,
                    availableDrones,
                    inMissionDrones,
                    maintenanceDrones,
                    offlineDrones,
                    errorDrones,
                    utilizationRate: Math.round(utilizationRate * 100) / 100
                },
                metrics: {
                    averageBattery: Math.round((averageBattery._avg.batteryLevel || 0) * 100) / 100
                },
                distributions: {
                    models: droneModels.map(item => ({
                        model: item.model,
                        count: item._count.model
                    })),
                    sites: siteDistribution.map(item => ({
                        siteId: item.siteId,
                        count: item._count.siteId
                    }))
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching fleet analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch fleet analytics'
        });
    }
};
exports.getFleetAnalytics = getFleetAnalytics;
const getSiteAnalytics = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const [totalSites, activeSites, siteMissions, siteDrones, siteCoverage] = await Promise.all([
            database_1.default.site.count(),
            database_1.default.site.count({
                where: {
                    missions: {
                        some: {
                            createdAt: { gte: startDate }
                        }
                    }
                }
            }),
            database_1.default.mission.groupBy({
                by: ['siteId'],
                where: { createdAt: { gte: startDate } },
                _count: { siteId: true },
                _sum: {
                    actualDistance: true,
                    coverageArea: true
                }
            }),
            database_1.default.drone.groupBy({
                by: ['siteId'],
                _count: { siteId: true }
            }),
            database_1.default.site.findMany({
                select: {
                    id: true,
                    name: true,
                    area: true,
                    missions: {
                        where: { createdAt: { gte: startDate } },
                        select: { coverageArea: true }
                    }
                }
            })
        ]);
        res.json({
            success: true,
            data: {
                period,
                summary: {
                    totalSites,
                    activeSites,
                    activeRate: totalSites > 0 ? (activeSites / totalSites) * 100 : 0
                },
                siteMissions: siteMissions.map(item => ({
                    siteId: item.siteId,
                    missionCount: item._count.siteId,
                    totalDistance: item._sum.actualDistance || 0,
                    totalCoverage: item._sum.coverageArea || 0
                })),
                siteDrones: siteDrones.map(item => ({
                    siteId: item.siteId,
                    droneCount: item._count.siteId
                })),
                coverage: siteCoverage.map(site => {
                    const totalCoverage = site.missions.reduce((sum, mission) => sum + (mission.coverageArea || 0), 0);
                    const coveragePercentage = site.area > 0 ? (totalCoverage / site.area) * 100 : 0;
                    return {
                        siteId: site.id,
                        siteName: site.name,
                        totalArea: site.area,
                        coveredArea: totalCoverage,
                        coveragePercentage: Math.round(coveragePercentage * 100) / 100
                    };
                })
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching site analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch site analytics'
        });
    }
};
exports.getSiteAnalytics = getSiteAnalytics;
const getOperationalEfficiency = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const [totalMissions, completedMissions, totalDuration, totalDistance, averageSpeed, efficiencyMetrics] = await Promise.all([
            database_1.default.mission.count({
                where: { createdAt: { gte: startDate } }
            }),
            database_1.default.mission.count({
                where: {
                    createdAt: { gte: startDate },
                    status: 'COMPLETED'
                }
            }),
            database_1.default.mission.aggregate({
                where: {
                    createdAt: { gte: startDate },
                    actualDuration: { not: null }
                },
                _sum: { actualDuration: true }
            }),
            database_1.default.mission.aggregate({
                where: {
                    createdAt: { gte: startDate },
                    actualDistance: { not: null }
                },
                _sum: { actualDistance: true }
            }),
            database_1.default.mission.aggregate({
                where: {
                    createdAt: { gte: startDate },
                    actualDistance: { not: null },
                    actualDuration: { not: null }
                },
                _avg: { speed: true }
            }),
            database_1.default.mission.groupBy({
                by: ['createdAt'],
                where: {
                    createdAt: { gte: startDate },
                    status: 'COMPLETED'
                },
                _count: { id: true },
                _sum: {
                    actualDuration: true,
                    actualDistance: true
                }
            })
        ]);
        const successRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
        const averageMissionDuration = completedMissions > 0 ?
            (totalDuration._sum.actualDuration || 0) / completedMissions : 0;
        const averageMissionDistance = completedMissions > 0 ?
            (totalDistance._sum.actualDistance || 0) / completedMissions : 0;
        res.json({
            success: true,
            data: {
                period,
                summary: {
                    totalMissions,
                    completedMissions,
                    successRate: Math.round(successRate * 100) / 100,
                    averageMissionDuration: Math.round(averageMissionDuration * 100) / 100,
                    averageMissionDistance: Math.round(averageMissionDistance * 100) / 100,
                    averageSpeed: Math.round((averageSpeed._avg.speed || 0) * 100) / 100
                },
                dailyMetrics: efficiencyMetrics.map(item => ({
                    date: item.createdAt,
                    missionCount: item._count.id,
                    totalDuration: item._sum.actualDuration || 0,
                    totalDistance: item._sum.actualDistance || 0
                }))
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching operational efficiency:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch operational efficiency'
        });
    }
};
exports.getOperationalEfficiency = getOperationalEfficiency;
const getMaintenanceSchedule = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const [overdueMaintenance, upcomingMaintenance, maintenanceHistory] = await Promise.all([
            database_1.default.drone.findMany({
                where: {
                    nextMaintenance: { lt: now }
                },
                include: {
                    site: {
                        select: { id: true, name: true }
                    }
                }
            }),
            database_1.default.drone.findMany({
                where: {
                    nextMaintenance: {
                        gte: now,
                        lte: thirtyDaysFromNow
                    }
                },
                include: {
                    site: {
                        select: { id: true, name: true }
                    }
                }
            }),
            database_1.default.drone.findMany({
                where: {
                    lastMaintenance: { not: null }
                },
                select: {
                    id: true,
                    name: true,
                    model: true,
                    lastMaintenance: true,
                    nextMaintenance: true,
                    site: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { lastMaintenance: 'desc' },
                take: 20
            })
        ]);
        res.json({
            success: true,
            data: {
                overdue: overdueMaintenance.map(drone => ({
                    id: drone.id,
                    name: drone.name,
                    model: drone.model,
                    nextMaintenance: drone.nextMaintenance,
                    daysOverdue: Math.floor((now.getTime() - drone.nextMaintenance.getTime()) / (1000 * 60 * 60 * 24)),
                    site: drone.site
                })),
                upcoming: upcomingMaintenance.map(drone => ({
                    id: drone.id,
                    name: drone.name,
                    model: drone.model,
                    nextMaintenance: drone.nextMaintenance,
                    daysUntil: Math.floor((drone.nextMaintenance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                    site: drone.site
                })),
                history: maintenanceHistory
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching maintenance schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch maintenance schedule'
        });
    }
};
exports.getMaintenanceSchedule = getMaintenanceSchedule;
//# sourceMappingURL=analyticsController.js.map
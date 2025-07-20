import { Request, Response } from 'express';
import prisma from '../utils/database';
import { logger } from '../utils/logger';
import { MissionStatus, DroneStatus } from '@prisma/client';

// Get mission analytics
export const getMissionAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
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

    const [
      totalMissions,
      completedMissions,
      failedMissions,
      inProgressMissions,
      missionTypes,
      missionStatuses,
      averageDuration,
      totalDistance,
      totalCoverage
    ] = await Promise.all([
      // Total missions
      prisma.mission.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Completed missions
      prisma.mission.count({
        where: { 
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        }
      }),
      
      // Failed missions
      prisma.mission.count({
        where: { 
          createdAt: { gte: startDate },
          status: { in: ['FAILED', 'ABORTED'] }
        }
      }),
      
      // In progress missions
      prisma.mission.count({
        where: { 
          createdAt: { gte: startDate },
          status: { in: ['IN_PROGRESS', 'PAUSED'] }
        }
      }),
      
      // Mission types distribution
      prisma.mission.groupBy({
        by: ['type'],
        where: { createdAt: { gte: startDate } },
        _count: { type: true }
      }),
      
      // Mission statuses distribution
      prisma.mission.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: { status: true }
      }),
      
      // Average duration
      prisma.mission.aggregate({
        where: { 
          createdAt: { gte: startDate },
          actualDuration: { not: null }
        },
        _avg: { actualDuration: true }
      }),
      
      // Total distance
      prisma.mission.aggregate({
        where: { 
          createdAt: { gte: startDate },
          actualDistance: { not: null }
        },
        _sum: { actualDistance: true }
      }),
      
      // Total coverage area
      prisma.mission.aggregate({
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
  } catch (error) {
    logger.error('Error fetching mission analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mission analytics'
    });
  }
};

// Get fleet analytics
export const getFleetAnalytics = async (req: Request, res: Response) => {
  try {
    const [
      totalDrones,
      availableDrones,
      inMissionDrones,
      maintenanceDrones,
      offlineDrones,
      errorDrones,
      averageBattery,
      droneModels,
      siteDistribution
    ] = await Promise.all([
      // Total drones
      prisma.drone.count(),
      
      // Available drones
      prisma.drone.count({
        where: { status: 'AVAILABLE' }
      }),
      
      // In mission drones
      prisma.drone.count({
        where: { status: 'IN_MISSION' }
      }),
      
      // Maintenance drones
      prisma.drone.count({
        where: { status: 'MAINTENANCE' }
      }),
      
      // Offline drones
      prisma.drone.count({
        where: { status: 'OFFLINE' }
      }),
      
      // Error drones
      prisma.drone.count({
        where: { status: 'ERROR' }
      }),
      
      // Average battery level
      prisma.drone.aggregate({
        _avg: { batteryLevel: true }
      }),
      
      // Drone models distribution
      prisma.drone.groupBy({
        by: ['model'],
        _count: { model: true }
      }),
      
      // Site distribution
      prisma.drone.groupBy({
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
  } catch (error) {
    logger.error('Error fetching fleet analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fleet analytics'
    });
  }
};

// Get site analytics
export const getSiteAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
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

    const [
      totalSites,
      activeSites,
      siteMissions,
      siteDrones,
      siteCoverage
    ] = await Promise.all([
      // Total sites
      prisma.site.count(),
      
      // Active sites (with missions in the period)
      prisma.site.count({
        where: {
          missions: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        }
      }),
      
      // Missions per site
      prisma.mission.groupBy({
        by: ['siteId'],
        where: { createdAt: { gte: startDate } },
        _count: { siteId: true },
        _sum: { 
          actualDistance: true,
          coverageArea: true
        }
      }),
      
      // Drones per site
      prisma.drone.groupBy({
        by: ['siteId'],
        _count: { siteId: true }
      }),
      
      // Site coverage data
      prisma.site.findMany({
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
          const totalCoverage = site.missions.reduce((sum, mission) => 
            sum + (mission.coverageArea || 0), 0
          );
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
  } catch (error) {
    logger.error('Error fetching site analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site analytics'
    });
  }
};

// Get operational efficiency
export const getOperationalEfficiency = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
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

    const [
      totalMissions,
      completedMissions,
      totalDuration,
      totalDistance,
      averageSpeed,
      efficiencyMetrics
    ] = await Promise.all([
      // Total missions
      prisma.mission.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Completed missions
      prisma.mission.count({
        where: { 
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        }
      }),
      
      // Total duration
      prisma.mission.aggregate({
        where: { 
          createdAt: { gte: startDate },
          actualDuration: { not: null }
        },
        _sum: { actualDuration: true }
      }),
      
      // Total distance
      prisma.mission.aggregate({
        where: { 
          createdAt: { gte: startDate },
          actualDistance: { not: null }
        },
        _sum: { actualDistance: true }
      }),
      
      // Average speed
      prisma.mission.aggregate({
        where: { 
          createdAt: { gte: startDate },
          actualDistance: { not: null },
          actualDuration: { not: null }
        },
        _avg: { speed: true }
      }),
      
      // Efficiency metrics by day
      prisma.mission.groupBy({
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
  } catch (error) {
    logger.error('Error fetching operational efficiency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operational efficiency'
    });
  }
};

// Get maintenance schedule
export const getMaintenanceSchedule = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      overdueMaintenance,
      upcomingMaintenance,
      maintenanceHistory
    ] = await Promise.all([
      // Drones overdue for maintenance
      prisma.drone.findMany({
        where: {
          nextMaintenance: { lt: now }
        },
        include: {
          site: {
            select: { id: true, name: true }
          }
        }
      }),
      
      // Drones with upcoming maintenance
      prisma.drone.findMany({
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
      
      // Maintenance history
      prisma.drone.findMany({
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
          daysOverdue: Math.floor((now.getTime() - drone.nextMaintenance!.getTime()) / (1000 * 60 * 60 * 24)),
          site: drone.site
        })),
        upcoming: upcomingMaintenance.map(drone => ({
          id: drone.id,
          name: drone.name,
          model: drone.model,
          nextMaintenance: drone.nextMaintenance,
          daysUntil: Math.floor((drone.nextMaintenance!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          site: drone.site
        })),
        history: maintenanceHistory
      }
    });
  } catch (error) {
    logger.error('Error fetching maintenance schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance schedule'
    });
  }
}; 
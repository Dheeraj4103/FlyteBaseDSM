import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/database';
import { logger } from '../utils/logger';
import { MissionStatus, MissionType, Priority, FlightPattern } from '@prisma/client';
import { io } from '../websocket/setup';

// Get all missions with filtering and pagination
export const getAllMissions = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      type,
      siteId,
      droneId,
      priority,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {};
    
    if (status) where.status = status as MissionStatus;
    if (type) where.type = type as MissionType;
    if (siteId) where.siteId = siteId as string;
    if (droneId) where.droneId = droneId as string;
    if (priority) where.priority = priority as Priority;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
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
      prisma.mission.count({ where })
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
  } catch (error) {
    logger.error('Error fetching missions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch missions'
    });
  }
};

// Get mission by ID
export const getMissionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mission = await prisma.mission.findUnique({
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
          take: 100 // Limit to last 100 logs
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
  } catch (error) {
    logger.error('Error fetching mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mission'
    });
  }
};

// Create new mission
export const createMission = async (req: AuthRequest, res: Response) => {
  try {
    const {
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
      scheduledAt,
      siteId,
      droneId
    } = req.body;

    // Validate site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return res.status(400).json({
        success: false,
        error: 'Site not found'
      });
    }

    // Validate drone exists and is available (if provided)
    if (droneId) {
      const drone = await prisma.drone.findUnique({
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

    const mission = await prisma.mission.create({
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
        createdBy: req.user!.id
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

    // Emit WebSocket event for real-time updates
    io.emit('mission:created', mission);

    logger.info(`Mission created: ${mission.id} by user ${req.user!.id}`);

    res.status(201).json({
      success: true,
      data: mission
    });
  } catch (error) {
    logger.error('Error creating mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create mission'
    });
  }
};

// Update mission
export const updateMission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if mission exists
    const existingMission = await prisma.mission.findUnique({
      where: { id }
    });

    if (!existingMission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    // Prevent updates to missions that are in progress or completed
    if (['IN_PROGRESS', 'COMPLETED', 'ABORTED', 'FAILED'].includes(existingMission.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update mission that is in progress or completed'
      });
    }

    const mission = await prisma.mission.update({
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

    // Emit WebSocket event for real-time updates
    io.emit('mission:updated', mission);

    logger.info(`Mission updated: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      data: mission
    });
  } catch (error) {
    logger.error('Error updating mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update mission'
    });
  }
};

// Delete mission
export const deleteMission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if mission exists
    const existingMission = await prisma.mission.findUnique({
      where: { id }
    });

    if (!existingMission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    // Prevent deletion of missions that are in progress
    if (existingMission.status === 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete mission that is in progress'
      });
    }

    await prisma.mission.delete({
      where: { id }
    });

    // Emit WebSocket event for real-time updates
    io.emit('mission:deleted', { id });

    logger.info(`Mission deleted: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Mission deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete mission'
    });
  }
};

// Start mission
export const startMission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const mission = await prisma.mission.findUnique({
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

    // Update mission and drone status
    const [updatedMission, updatedDrone] = await Promise.all([
      prisma.mission.update({
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
      prisma.drone.update({
        where: { id: mission.droneId },
        data: { status: 'IN_MISSION' }
      })
    ]);

    // Emit WebSocket events
    io.emit('mission:started', updatedMission);
    io.emit('drone:status_updated', updatedDrone);

    logger.info(`Mission started: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      data: updatedMission
    });
  } catch (error) {
    logger.error('Error starting mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start mission'
    });
  }
};

// Pause mission
export const pauseMission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const mission = await prisma.mission.findUnique({
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

    const updatedMission = await prisma.mission.update({
      where: { id },
      data: { status: 'PAUSED' },
      include: {
        site: { select: { id: true, name: true, latitude: true, longitude: true } },
        drone: { select: { id: true, name: true, model: true, status: true } },
        createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    // Emit WebSocket event
    io.emit('mission:paused', updatedMission);

    logger.info(`Mission paused: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      data: updatedMission
    });
  } catch (error) {
    logger.error('Error pausing mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause mission'
    });
  }
};

// Resume mission
export const resumeMission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const mission = await prisma.mission.findUnique({
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

    const updatedMission = await prisma.mission.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: {
        site: { select: { id: true, name: true, latitude: true, longitude: true } },
        drone: { select: { id: true, name: true, model: true, status: true } },
        createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    // Emit WebSocket event
    io.emit('mission:resumed', updatedMission);

    logger.info(`Mission resumed: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      data: updatedMission
    });
  } catch (error) {
    logger.error('Error resuming mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume mission'
    });
  }
};

// Abort mission
export const abortMission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const mission = await prisma.mission.findUnique({
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

    // Update mission and drone status
    const [updatedMission, updatedDrone] = await Promise.all([
      prisma.mission.update({
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
      mission.droneId ? prisma.drone.update({
        where: { id: mission.droneId },
        data: { status: 'AVAILABLE' }
      }) : null
    ]);

    // Emit WebSocket events
    io.emit('mission:aborted', updatedMission);
    if (updatedDrone) {
      io.emit('drone:status_updated', updatedDrone);
    }

    logger.info(`Mission aborted: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      data: updatedMission
    });
  } catch (error) {
    logger.error('Error aborting mission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to abort mission'
    });
  }
};

// Get flight logs for a mission
export const getMissionFlightLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Check if mission exists
    const mission = await prisma.mission.findUnique({
      where: { id }
    });

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    const [flightLogs, total] = await Promise.all([
      prisma.flightLog.findMany({
        where: { missionId: id },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.flightLog.count({
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
  } catch (error) {
    logger.error('Error fetching flight logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flight logs'
    });
  }
}; 
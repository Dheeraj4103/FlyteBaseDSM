import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/database';
import { logger } from '../utils/logger';
import { DroneStatus } from '@prisma/client';

// Get all drones with filtering and pagination
export const getAllDrones = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      siteId,
      model
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {};
    
    if (status) where.status = status as DroneStatus;
    if (siteId) where.siteId = siteId as string;
    if (model) where.model = { contains: model as string, mode: 'insensitive' };

    const [drones, total] = await Promise.all([
      prisma.drone.findMany({
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
      prisma.drone.count({ where })
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
  } catch (error) {
    logger.error('Error fetching drones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drones'
    });
  }
};

// Get drone by ID
export const getDroneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const drone = await prisma.drone.findUnique({
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
  } catch (error) {
    logger.error('Error fetching drone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drone'
    });
  }
};

// Create new drone
export const createDrone = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      model,
      serialNumber,
      maxFlightTime,
      maxPayload,
      maxAltitude,
      maxSpeed,
      siteId
    } = req.body;

    // Check if serial number already exists
    const existingDrone = await prisma.drone.findUnique({
      where: { serialNumber }
    });

    if (existingDrone) {
      return res.status(400).json({
        success: false,
        error: 'Drone with this serial number already exists'
      });
    }

    // Validate site exists (if provided)
    if (siteId) {
      const site = await prisma.site.findUnique({
        where: { id: siteId }
      });

      if (!site) {
        return res.status(400).json({
          success: false,
          error: 'Site not found'
        });
      }
    }

    const drone = await prisma.drone.create({
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

    logger.info(`Drone created: ${drone.id} by user ${req.user!.id}`);

    res.status(201).json({
      success: true,
      data: drone
    });
  } catch (error) {
    logger.error('Error creating drone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create drone'
    });
  }
};

// Update drone
export const updateDrone = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if drone exists
    const existingDrone = await prisma.drone.findUnique({
      where: { id }
    });

    if (!existingDrone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    // Check if serial number is being updated and if it already exists
    if (updateData.serialNumber && updateData.serialNumber !== existingDrone.serialNumber) {
      const duplicateDrone = await prisma.drone.findUnique({
        where: { serialNumber: updateData.serialNumber }
      });

      if (duplicateDrone) {
        return res.status(400).json({
          success: false,
          error: 'Drone with this serial number already exists'
        });
      }
    }

    // Validate site exists (if being updated)
    if (updateData.siteId) {
      const site = await prisma.site.findUnique({
        where: { id: updateData.siteId }
      });

      if (!site) {
        return res.status(400).json({
          success: false,
          error: 'Site not found'
        });
      }
    }

    const drone = await prisma.drone.update({
      where: { id },
      data: updateData,
      include: {
        site: {
          select: { id: true, name: true, latitude: true, longitude: true }
        }
      }
    });

    logger.info(`Drone updated: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      data: drone
    });
  } catch (error) {
    logger.error('Error updating drone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update drone'
    });
  }
};

// Delete drone
export const deleteDrone = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if drone exists
    const existingDrone = await prisma.drone.findUnique({
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

    // Prevent deletion if drone is currently in a mission
    if (existingDrone.missions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete drone that is currently in a mission'
      });
    }

    await prisma.drone.delete({
      where: { id }
    });

    logger.info(`Drone deleted: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Drone deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting drone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete drone'
    });
  }
};

// Get missions for a specific drone
export const getDroneMissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Check if drone exists
    const drone = await prisma.drone.findUnique({
      where: { id }
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    // Build filter conditions
    const where: any = { droneId: id };
    if (status) where.status = status;

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
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
    logger.error('Error fetching drone missions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drone missions'
    });
  }
}; 
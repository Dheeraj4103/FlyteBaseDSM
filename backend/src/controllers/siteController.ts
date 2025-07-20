import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/database';
import { logger } from '../utils/logger';

// Get all sites with filtering and pagination
export const getAllSites = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
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
      prisma.site.count({ where })
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
  } catch (error) {
    logger.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sites'
    });
  }
};

// Get site by ID
export const getSiteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const site = await prisma.site.findUnique({
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
  } catch (error) {
    logger.error('Error fetching site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site'
    });
  }
};

// Create new site
export const createSite = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      address,
      latitude,
      longitude,
      area,
      waypoints,
      surveyArea
    } = req.body;

    const site = await prisma.site.create({
      data: {
        name,
        description,
        address,
        latitude,
        longitude,
        area,
        waypoints,
        surveyArea,
        createdBy: req.user!.id
      },
      include: {
        createdByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    logger.info(`Site created: ${site.id} by user ${req.user!.id}`);

    res.status(201).json({
      success: true,
      data: site
    });
  } catch (error) {
    logger.error('Error creating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create site'
    });
  }
};

// Update site
export const updateSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if site exists
    const existingSite = await prisma.site.findUnique({
      where: { id }
    });

    if (!existingSite) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }

    const site = await prisma.site.update({
      where: { id },
      data: updateData,
      include: {
        createdByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    logger.info(`Site updated: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      data: site
    });
  } catch (error) {
    logger.error('Error updating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update site'
    });
  }
};

// Delete site
export const deleteSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if site exists and has dependencies
    const existingSite = await prisma.site.findUnique({
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

    // Prevent deletion if site has missions or drones
    if (existingSite._count.missions > 0 || existingSite._count.drones > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete site that has missions or drones assigned'
      });
    }

    await prisma.site.delete({
      where: { id }
    });

    logger.info(`Site deleted: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete site'
    });
  }
};

// Get missions for a specific site
export const getSiteMissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id }
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }

    // Build filter conditions
    const where: any = { siteId: id };
    if (status) where.status = status;

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
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
    logger.error('Error fetching site missions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site missions'
    });
  }
};

// Get drones for a specific site
export const getSiteDrones = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id }
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }

    // Build filter conditions
    const where: any = { siteId: id };
    if (status) where.status = status;

    const [drones, total] = await Promise.all([
      prisma.drone.findMany({
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
    logger.error('Error fetching site drones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site drones'
    });
  }
}; 
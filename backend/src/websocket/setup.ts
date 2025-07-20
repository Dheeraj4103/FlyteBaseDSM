import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
import prisma from '../utils/database';

export let io: SocketIOServer;

export const setupWebSocket = (socketIO: SocketIOServer) => {
  io = socketIO;

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join room for specific mission updates
    socket.on('join:mission', (missionId: string) => {
      socket.join(`mission:${missionId}`);
      logger.info(`Client ${socket.id} joined mission room: ${missionId}`);
    });

    // Leave mission room
    socket.on('leave:mission', (missionId: string) => {
      socket.leave(`mission:${missionId}`);
      logger.info(`Client ${socket.id} left mission room: ${missionId}`);
    });

    // Join room for fleet updates
    socket.on('join:fleet', () => {
      socket.join('fleet');
      logger.info(`Client ${socket.id} joined fleet room`);
    });

    // Leave fleet room
    socket.on('leave:fleet', () => {
      socket.leave('fleet');
      logger.info(`Client ${socket.id} left fleet room`);
    });

    // Handle flight log updates (simulated for demo)
    socket.on('flight:log', async (data: {
      missionId: string;
      latitude: number;
      longitude: number;
      altitude: number;
      speed: number;
      batteryLevel: number;
      status: string;
    }) => {
      try {
        // Save flight log to database
        const flightLog = await prisma.flightLog.create({
          data: {
            missionId: data.missionId,
            latitude: data.latitude,
            longitude: data.longitude,
            altitude: data.altitude,
            speed: data.speed,
            batteryLevel: data.batteryLevel,
            status: data.status as any
          }
        });

        // Emit to mission room
        io.to(`mission:${data.missionId}`).emit('flight:log:update', flightLog);

        // Update drone battery level
        const mission = await prisma.mission.findUnique({
          where: { id: data.missionId },
          select: { droneId: true }
        });

        if (mission?.droneId) {
          await prisma.drone.update({
            where: { id: mission.droneId },
            data: { batteryLevel: data.batteryLevel }
          });

          // Emit drone status update
          io.to('fleet').emit('drone:battery_update', {
            droneId: mission.droneId,
            batteryLevel: data.batteryLevel
          });
        }

        logger.debug(`Flight log saved for mission ${data.missionId}`);
      } catch (error) {
        logger.error('Error saving flight log:', error);
      }
    });

    // Handle mission completion
    socket.on('mission:complete', async (data: {
      missionId: string;
      actualDuration: number;
      actualDistance: number;
      coverageArea: number;
    }) => {
      try {
        const [updatedMission, updatedDrone] = await Promise.all([
          prisma.mission.update({
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
          prisma.mission.findUnique({
            where: { id: data.missionId },
            select: { droneId: true }
          }).then(mission => 
            mission?.droneId ? prisma.drone.update({
              where: { id: mission.droneId },
              data: { status: 'AVAILABLE' }
            }) : null
          )
        ]);

        // Emit events
        io.emit('mission:completed', updatedMission);
        if (updatedDrone) {
          io.to('fleet').emit('drone:status_updated', updatedDrone);
        }

        logger.info(`Mission completed: ${data.missionId}`);
      } catch (error) {
        logger.error('Error completing mission:', error);
      }
    });

    // Handle mission failure
    socket.on('mission:failed', async (data: {
      missionId: string;
      reason: string;
    }) => {
      try {
        const [updatedMission, updatedDrone] = await Promise.all([
          prisma.mission.update({
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
          prisma.mission.findUnique({
            where: { id: data.missionId },
            select: { droneId: true }
          }).then(mission => 
            mission?.droneId ? prisma.drone.update({
              where: { id: mission.droneId },
              data: { status: 'ERROR' }
            }) : null
          )
        ]);

        // Emit events
        io.emit('mission:failed', { ...updatedMission, reason: data.reason });
        if (updatedDrone) {
          io.to('fleet').emit('drone:status_updated', updatedDrone);
        }

        logger.error(`Mission failed: ${data.missionId} - ${data.reason}`);
      } catch (error) {
        logger.error('Error handling mission failure:', error);
      }
    });

    // Handle drone status updates
    socket.on('drone:status_update', async (data: {
      droneId: string;
      status: string;
      batteryLevel?: number;
    }) => {
      try {
        const updatedDrone = await prisma.drone.update({
          where: { id: data.droneId },
          data: {
            status: data.status as any,
            ...(data.batteryLevel !== undefined && { batteryLevel: data.batteryLevel })
          }
        });

        io.to('fleet').emit('drone:status_updated', updatedDrone);
        logger.info(`Drone status updated: ${data.droneId} - ${data.status}`);
      } catch (error) {
        logger.error('Error updating drone status:', error);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  logger.info('WebSocket server setup complete');
}; 
import { PrismaClient, UserRole, MissionType, MissionStatus, Priority, FlightPattern, DroneStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@flytebase.com' },
    update: {},
    create: {
      email: 'admin@flytebase.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@flytebase.com' },
    update: {},
    create: {
      email: 'operator@flytebase.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Operator',
      role: UserRole.OPERATOR,
    },
  });

  console.log('✅ Users created');

  // Create sites
  const sites = await Promise.all([
    prisma.site.upsert({
      where: { id: 'site-1' },
      update: {},
      create: {
        id: 'site-1',
        name: 'Site A - Industrial Complex',
        description: 'Large industrial complex with multiple buildings',
        address: '123 Industrial Blvd, Tech City, TC 12345',
        latitude: 37.7749,
        longitude: -122.4194,
        area: 50000, // 50,000 sq meters
        createdBy: adminUser.id,
        waypoints: [
          { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
          { latitude: 37.7759, longitude: -122.4194, altitude: 100 },
          { latitude: 37.7759, longitude: -122.4184, altitude: 100 },
          { latitude: 37.7749, longitude: -122.4184, altitude: 100 },
        ],
        surveyArea: {
          type: 'Polygon',
          coordinates: [[
            [-122.4194, 37.7749],
            [-122.4194, 37.7759],
            [-122.4184, 37.7759],
            [-122.4184, 37.7749],
            [-122.4194, 37.7749],
          ]],
        },
      },
    }),
    prisma.site.upsert({
      where: { id: 'site-2' },
      update: {},
      create: {
        id: 'site-2',
        name: 'Site B - Construction Zone',
        description: 'Active construction site with heavy machinery',
        address: '456 Construction Ave, Build Town, BT 67890',
        latitude: 37.7849,
        longitude: -122.4094,
        area: 30000, // 30,000 sq meters
        createdBy: adminUser.id,
        waypoints: [
          { latitude: 37.7849, longitude: -122.4094, altitude: 80 },
          { latitude: 37.7859, longitude: -122.4094, altitude: 80 },
          { latitude: 37.7859, longitude: -122.4084, altitude: 80 },
          { latitude: 37.7849, longitude: -122.4084, altitude: 80 },
        ],
        surveyArea: {
          type: 'Polygon',
          coordinates: [[
            [-122.4094, 37.7849],
            [-122.4094, 37.7859],
            [-122.4084, 37.7859],
            [-122.4084, 37.7849],
            [-122.4094, 37.7849],
          ]],
        },
      },
    }),
    prisma.site.upsert({
      where: { id: 'site-3' },
      update: {},
      create: {
        id: 'site-3',
        name: 'Site C - Agricultural Field',
        description: 'Large agricultural field for crop monitoring',
        address: '789 Farm Road, Agri Valley, AV 11111',
        latitude: 37.7649,
        longitude: -122.4294,
        area: 100000, // 100,000 sq meters
        createdBy: adminUser.id,
        waypoints: [
          { latitude: 37.7649, longitude: -122.4294, altitude: 60 },
          { latitude: 37.7659, longitude: -122.4294, altitude: 60 },
          { latitude: 37.7659, longitude: -122.4284, altitude: 60 },
          { latitude: 37.7649, longitude: -122.4284, altitude: 60 },
        ],
        surveyArea: {
          type: 'Polygon',
          coordinates: [[
            [-122.4294, 37.7649],
            [-122.4294, 37.7659],
            [-122.4284, 37.7659],
            [-122.4284, 37.7649],
            [-122.4294, 37.7649],
          ]],
        },
      },
    }),
  ]);

  console.log('✅ Sites created');

  // Create drones
  const drones = await Promise.all([
    prisma.drone.upsert({
      where: { id: 'drone-1' },
      update: {},
      create: {
        id: 'drone-1',
        name: 'DJI Mavic 3 Pro',
        model: 'DJI Mavic 3 Pro',
        serialNumber: 'DJI-M3P-001',
        status: DroneStatus.AVAILABLE,
        batteryLevel: 85.0,
        maxFlightTime: 46,
        maxPayload: 0.9,
        maxAltitude: 500,
        maxSpeed: 21,
        siteId: sites[0].id,
      },
    }),
    prisma.drone.upsert({
      where: { id: 'drone-2' },
      update: {},
      create: {
        id: 'drone-2',
        name: 'DJI Phantom 4 RTK',
        model: 'DJI Phantom 4 RTK',
        serialNumber: 'DJI-P4RTK-002',
        status: DroneStatus.AVAILABLE,
        batteryLevel: 92.0,
        maxFlightTime: 30,
        maxPayload: 1.4,
        maxAltitude: 600,
        maxSpeed: 20,
        siteId: sites[1].id,
      },
    }),
    prisma.drone.upsert({
      where: { id: 'drone-3' },
      update: {},
      create: {
        id: 'drone-3',
        name: 'Autel EVO II',
        model: 'Autel EVO II',
        serialNumber: 'AUTEL-EVO2-003',
        status: DroneStatus.IN_MISSION,
        batteryLevel: 45.0,
        maxFlightTime: 40,
        maxPayload: 0.8,
        maxAltitude: 450,
        maxSpeed: 19,
        siteId: sites[2].id,
      },
    }),
  ]);

  console.log('✅ Drones created');

  // Create missions
  const missions = await Promise.all([
    prisma.mission.upsert({
      where: { id: 'mission-1' },
      update: {},
      create: {
        id: 'mission-1',
        name: 'Site A Security Patrol',
        description: 'Regular security patrol around the industrial complex',
        type: MissionType.SECURITY_PATROL,
        status: MissionStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        altitude: 100,
        speed: 8.0,
        overlap: 70.0,
        pattern: FlightPattern.PERIMETER,
        waypoints: [
          { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
          { latitude: 37.7759, longitude: -122.4194, altitude: 100 },
          { latitude: 37.7759, longitude: -122.4184, altitude: 100 },
          { latitude: 37.7749, longitude: -122.4184, altitude: 100 },
        ],
        surveyArea: {
          type: 'Polygon',
          coordinates: [[
            [-122.4194, 37.7749],
            [-122.4194, 37.7759],
            [-122.4184, 37.7759],
            [-122.4184, 37.7749],
            [-122.4194, 37.7749],
          ]],
        },
        estimatedDuration: 45,
        startedAt: new Date(),
        siteId: sites[0].id,
        droneId: drones[0].id,
        createdBy: operatorUser.id,
      },
    }),
    prisma.mission.upsert({
      where: { id: 'mission-2' },
      update: {},
      create: {
        id: 'mission-2',
        name: 'Site B Progress Inspection',
        description: 'Weekly construction progress inspection',
        type: MissionType.INSPECTION,
        status: MissionStatus.COMPLETED,
        priority: Priority.MEDIUM,
        altitude: 80,
        speed: 6.0,
        overlap: 80.0,
        pattern: FlightPattern.GRID,
        waypoints: [
          { latitude: 37.7849, longitude: -122.4094, altitude: 80 },
          { latitude: 37.7859, longitude: -122.4094, altitude: 80 },
          { latitude: 37.7859, longitude: -122.4084, altitude: 80 },
          { latitude: 37.7849, longitude: -122.4084, altitude: 80 },
        ],
        surveyArea: {
          type: 'Polygon',
          coordinates: [[
            [-122.4094, 37.7849],
            [-122.4094, 37.7859],
            [-122.4084, 37.7859],
            [-122.4084, 37.7849],
            [-122.4094, 37.7849],
          ]],
        },
        estimatedDuration: 30,
        actualDuration: 28,
        actualDistance: 1200.0,
        coverageArea: 25000.0,
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        siteId: sites[1].id,
        droneId: drones[1].id,
        createdBy: operatorUser.id,
      },
    }),
    prisma.mission.upsert({
      where: { id: 'mission-3' },
      update: {},
      create: {
        id: 'mission-3',
        name: 'Site C Crop Monitoring',
        description: 'Agricultural field monitoring and crop health assessment',
        type: MissionType.SURVEY,
        status: MissionStatus.PLANNED,
        priority: Priority.LOW,
        altitude: 120,
        speed: 5.0,
        overlap: 85.0,
        pattern: FlightPattern.CROSSHATCH,
        waypoints: [
          { latitude: 37.7649, longitude: -122.4294, altitude: 120 },
          { latitude: 37.7669, longitude: -122.4294, altitude: 120 },
          { latitude: 37.7669, longitude: -122.4274, altitude: 120 },
          { latitude: 37.7649, longitude: -122.4274, altitude: 120 },
        ],
        surveyArea: {
          type: 'Polygon',
          coordinates: [[
            [-122.4294, 37.7649],
            [-122.4294, 37.7669],
            [-122.4274, 37.7669],
            [-122.4274, 37.7649],
            [-122.4294, 37.7649],
          ]],
        },
        estimatedDuration: 90,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        siteId: sites[2].id,
        droneId: drones[2].id,
        createdBy: adminUser.id,
      },
    }),
  ]);

  console.log('✅ Missions created');

  // Create flight logs for completed mission
  const flightLogs = await Promise.all([
    prisma.flightLog.create({
      data: {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 minutes after start
        latitude: 37.7849,
        longitude: -122.4094,
        altitude: 80,
        speed: 6.0,
        batteryLevel: 95.0,
        status: 'TAKEOFF',
        missionId: missions[1].id,
      },
    }),
    prisma.flightLog.create({
      data: {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000), // 10 minutes after start
        latitude: 37.7854,
        longitude: -122.4089,
        altitude: 80,
        speed: 6.0,
        batteryLevel: 92.0,
        status: 'SURVEYING',
        missionId: missions[1].id,
      },
    }),
    prisma.flightLog.create({
      data: {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 25 * 60 * 1000), // 25 minutes after start
        latitude: 37.7849,
        longitude: -122.4094,
        altitude: 80,
        speed: 6.0,
        batteryLevel: 88.0,
        status: 'LANDING',
        missionId: missions[1].id,
      },
    }),
  ]);

  console.log('✅ Flight logs created');

  // Create analytics data
  const analytics = await Promise.all([
    prisma.analytics.create({
      data: {
        type: 'MISSION_SUMMARY',
        data: {
          totalMissions: 3,
          completedMissions: 1,
          failedMissions: 0,
          inProgressMissions: 1,
          successRate: 100,
          averageDuration: 28,
          totalDistance: 1200,
          totalCoverage: 25000,
        },
        period: 'daily',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
        createdBy: adminUser.id,
      },
    }),
    prisma.analytics.create({
      data: {
        type: 'FLEET_PERFORMANCE',
        data: {
          totalDrones: 3,
          availableDrones: 2,
          inMissionDrones: 1,
          maintenanceDrones: 0,
          offlineDrones: 0,
          errorDrones: 0,
          utilizationRate: 33.33,
          averageBattery: 74.0,
        },
        period: 'daily',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
        createdBy: adminUser.id,
      },
    }),
  ]);

  console.log('✅ Analytics data created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Sites: ${await prisma.site.count()}`);
  console.log(`- Drones: ${await prisma.drone.count()}`);
  console.log(`- Missions: ${await prisma.mission.count()}`);
  console.log(`- Flight Logs: ${await prisma.flightLog.count()}`);
  console.log(`- Analytics: ${await prisma.analytics.count()}`);
  
  console.log('\n🔑 Default Login Credentials:');
  console.log('Admin: admin@flytebase.com / password123');
  console.log('Operator: operator@flytebase.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
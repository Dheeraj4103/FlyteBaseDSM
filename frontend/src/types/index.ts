// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

// Mission types
export interface Mission {
  id: string;
  name: string;
  description?: string;
  type: MissionType;
  status: MissionStatus;
  priority: Priority;
  altitude: number;
  speed: number;
  overlap: number;
  pattern: FlightPattern;
  waypoints: Waypoint[];
  surveyArea: GeoJSON.Polygon;
  estimatedDuration: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  actualDistance?: number;
  coverageArea?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  siteId: string;
  droneId?: string;
  site: Site;
  drone?: Drone;
  createdByUser: User;
  flightLogs?: FlightLog[];
}

export type MissionType = 'INSPECTION' | 'SECURITY_PATROL' | 'SITE_MAPPING' | 'SURVEY' | 'CUSTOM';
export type MissionStatus = 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ABORTED' | 'FAILED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FlightPattern = 'GRID' | 'CROSSHATCH' | 'PERIMETER' | 'SPIRAL' | 'CUSTOM';

export interface Waypoint {
  latitude: number;
  longitude: number;
  altitude?: number;
}

// Drone types
export interface Drone {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  status: DroneStatus;
  batteryLevel: number;
  maxFlightTime: number;
  maxPayload: number;
  maxAltitude: number;
  maxSpeed: number;
  isActive: boolean;
  lastMaintenance?: string;
  nextMaintenance?: string;
  createdAt: string;
  updatedAt: string;
  siteId?: string;
  site?: Site;
  missions?: Mission[];
}

export type DroneStatus = 'AVAILABLE' | 'IN_MISSION' | 'MAINTENANCE' | 'OFFLINE' | 'ERROR';

// Site types
export interface Site {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  area: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByUser: User;
  missions?: Mission[];
  drones?: Drone[];
}

// Flight log types
export interface FlightLog {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  batteryLevel: number;
  status: FlightStatus;
  missionId: string;
}

export type FlightStatus = 'TAKEOFF' | 'CRUISE' | 'SURVEYING' | 'LANDING' | 'HOVERING' | 'ERROR';

// Analytics types
export interface MissionAnalytics {
  period: string;
  summary: {
    totalMissions: number;
    completedMissions: number;
    failedMissions: number;
    inProgressMissions: number;
    successRate: number;
  };
  metrics: {
    averageDuration: number;
    totalDistance: number;
    totalCoverage: number;
  };
  distributions: {
    types: Array<{ type: MissionType; count: number }>;
    statuses: Array<{ status: MissionStatus; count: number }>;
  };
}

export interface FleetAnalytics {
  summary: {
    totalDrones: number;
    availableDrones: number;
    inMissionDrones: number;
    maintenanceDrones: number;
    offlineDrones: number;
    errorDrones: number;
    utilizationRate: number;
  };
  metrics: {
    averageBattery: number;
  };
  distributions: {
    models: Array<{ model: string; count: number }>;
    sites: Array<{ siteId: string; count: number }>;
  };
}

export interface SiteAnalytics {
  period: string;
  summary: {
    totalSites: number;
    activeSites: number;
    activeRate: number;
  };
  siteMissions: Array<{
    siteId: string;
    missionCount: number;
    totalDistance: number;
    totalCoverage: number;
  }>;
  siteDrones: Array<{
    siteId: string;
    droneCount: number;
  }>;
  coverage: Array<{
    siteId: string;
    siteName: string;
    totalArea: number;
    coveredArea: number;
    coveragePercentage: number;
  }>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface MissionForm {
  name: string;
  description?: string;
  type: MissionType;
  priority: Priority;
  altitude: number;
  speed: number;
  overlap: number;
  pattern: FlightPattern;
  waypoints: Waypoint[];
  surveyArea: GeoJSON.Polygon;
  estimatedDuration: number;
  scheduledAt?: string;
  siteId: string;
  droneId?: string;
}

export interface DroneForm {
  name: string;
  model: string;
  serialNumber: string;
  maxFlightTime: number;
  maxPayload: number;
  maxAltitude: number;
  maxSpeed: number;
  siteId?: string;
}

export interface SiteForm {
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  area: number;
}

// Filter types
export interface MissionFilters {
  status?: MissionStatus;
  type?: MissionType;
  siteId?: string;
  droneId?: string;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DroneFilters {
  status?: DroneStatus;
  siteId?: string;
  model?: string;
  page?: number;
  limit?: number;
}

export interface SiteFilters {
  search?: string;
  page?: number;
  limit?: number;
}

// WebSocket event types
export interface WebSocketEvents {
  'mission:created': Mission;
  'mission:updated': Mission;
  'mission:deleted': { id: string };
  'mission:started': Mission;
  'mission:paused': Mission;
  'mission:resumed': Mission;
  'mission:aborted': Mission;
  'mission:completed': Mission;
  'mission:failed': Mission & { reason: string };
  'drone:status_updated': Drone;
  'drone:battery_update': { droneId: string; batteryLevel: number };
  'flight:log:update': FlightLog;
} 
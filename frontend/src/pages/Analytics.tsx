import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  ClockIcon,
  MapIcon,
  CpuChipIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Types
interface Mission {
  id: string;
  name: string;
  status: string;
  type: string;
  estimatedDuration: number;
  actualDuration?: number;
  startedAt?: string;
  completedAt?: string;
  site: {
    id: string;
    name: string;
  };
  drone?: {
    id: string;
    name: string;
  };
}

interface Drone {
  id: string;
  name: string;
  model: string;
  status: string;
  batteryLevel: number;
  maxFlightTime: number;
}

interface Site {
  id: string;
  name: string;
  area: number;
  isActive: boolean;
}

interface AnalyticsData {
  missions: Mission[];
  drones: Drone[];
  sites: Site[];
}

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Queries
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => apiService.get<AnalyticsData>(`/analytics?timeRange=${timeRange}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const missions = analyticsData?.data?.missions || [];
  const drones = analyticsData?.data?.drones || [];
  const sites = analyticsData?.data?.sites || [];

  // Calculate analytics
  const totalMissions = missions.length;
  const completedMissions = missions.filter(m => m.status === 'COMPLETED').length;
  const failedMissions = missions.filter(m => m.status === 'FAILED').length;
  const successRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  const totalFlightTime = missions
    .filter(m => m.actualDuration)
    .reduce((sum, m) => sum + (m.actualDuration || 0), 0);

  const avgMissionDuration = completedMissions > 0 
    ? totalFlightTime / completedMissions 
    : 0;

  const totalDrones = drones.length;
  const availableDrones = drones.filter(d => d.status === 'AVAILABLE').length;
  const inMissionDrones = drones.filter(d => d.status === 'IN_MISSION').length;

  const totalSites = sites.length;
  const activeSites = sites.filter(s => s.isActive).length;
  const totalArea = sites.reduce((sum, s) => sum + s.area, 0);

  // Mission type distribution
  const missionTypes = missions.reduce((acc, mission) => {
    acc[mission.type] = (acc[mission.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Status distribution
  const statusDistribution = missions.reduce((acc, mission) => {
    acc[mission.status] = (acc[mission.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Monthly mission trend (mock data for now)
  const monthlyTrend = [
    { month: 'Jan', missions: 12, completed: 10 },
    { month: 'Feb', missions: 15, completed: 13 },
    { month: 'Mar', missions: 18, completed: 16 },
    { month: 'Apr', missions: 22, completed: 19 },
    { month: 'May', missions: 25, completed: 22 },
    { month: 'Jun', missions: 28, completed: 25 },
  ];

  // Drone utilization
  const droneUtilization = drones.map(drone => ({
    name: drone.name,
    utilization: drone.status === 'IN_MISSION' ? 100 : 
                 drone.status === 'MAINTENANCE' ? 0 : 
                 Math.random() * 30 + 10, // Mock utilization for available drones
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Performance metrics and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="form-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Missions</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalMissions}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">{successRate.toFixed(1)}% Success Rate</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Flight Hours</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(totalFlightTime / 60).toFixed(1)}h
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-500">
                Avg: {avgMissionDuration.toFixed(1)} min/mission
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CpuChipIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Fleet Utilization</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalDrones > 0 ? Math.round((inMissionDrones / totalDrones) * 100) : 0}%
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-500">
                {inMissionDrones}/{totalDrones} drones active
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Coverage Area</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(totalArea / 1000000).toFixed(1)} km²
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-500">
                {activeSites}/{totalSites} sites active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mission Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Mission Status Distribution</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {Object.entries(statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      status === 'COMPLETED' ? 'bg-green-500' :
                      status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      status === 'FAILED' ? 'bg-red-500' :
                      status === 'PLANNED' ? 'bg-gray-500' :
                      'bg-yellow-500'
                    }`} />
                    <span className="text-sm text-gray-700">
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({((count / totalMissions) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Type Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Mission Type Distribution</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {Object.entries(missionTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3 bg-primary-500" />
                    <span className="text-sm text-gray-700">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({((count / totalMissions) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Mission Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Monthly Mission Trend</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {monthlyTrend.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Total:</span>
                      <span className="text-sm font-medium text-gray-900">{month.missions}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Completed:</span>
                      <span className="text-sm font-medium text-green-600">{month.completed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drone Utilization */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Drone Utilization</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {droneUtilization.slice(0, 5).map((drone) => (
                <div key={drone.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate">{drone.name}</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${drone.utilization}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {drone.utilization.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Performing Sites */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Top Performing Sites</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {sites.slice(0, 5).map((site, index) => (
                <div key={site.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{site.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">
                      {(site.area / 1000000).toFixed(1)} km²
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      site.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {site.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Missions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Missions</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {missions.slice(0, 5).map((mission) => (
                <div key={mission.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {mission.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {mission.site.name}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      mission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      mission.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      mission.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {mission.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fleet Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Fleet Status</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {drones.slice(0, 5).map((drone) => (
                <div key={drone.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {drone.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {drone.model}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        drone.batteryLevel > 50 ? 'bg-green-500' :
                        drone.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs text-gray-500">{drone.batteryLevel}%</span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      drone.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                      drone.status === 'IN_MISSION' ? 'bg-blue-100 text-blue-800' :
                      drone.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {drone.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">System Alerts</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {failedMissions > 0 && (
              <div className="flex items-center p-4 bg-red-50 rounded-md">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {failedMissions} mission(s) failed in the last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
                  </p>
                  <p className="text-sm text-red-700">
                    Review failed missions and check drone status
                  </p>
                </div>
              </div>
            )}
            
            {availableDrones === 0 && (
              <div className="flex items-center p-4 bg-yellow-50 rounded-md">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    No drones available
                  </p>
                  <p className="text-sm text-yellow-700">
                    All drones are currently in use or under maintenance
                  </p>
                </div>
              </div>
            )}

            {successRate < 80 && (
              <div className="flex items-center p-4 bg-orange-50 rounded-md">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Low success rate detected
                  </p>
                  <p className="text-sm text-orange-700">
                    Current success rate is {successRate.toFixed(1)}%. Consider reviewing mission parameters.
                  </p>
                </div>
              </div>
            )}

            {totalMissions === 0 && (
              <div className="flex items-center p-4 bg-blue-50 rounded-md">
                <ChartBarIcon className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    No missions in selected time range
                  </p>
                  <p className="text-sm text-blue-700">
                    Create new missions to start collecting analytics data
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 
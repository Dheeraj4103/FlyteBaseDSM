import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapIcon,
  CpuChipIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  // Mock data for demonstration
  const stats = {
    totalMissions: 24,
    activeMissions: 3,
    completedMissions: 18,
    failedMissions: 3,
    totalDrones: 8,
    availableDrones: 5,
    totalSites: 6,
    activeSites: 4,
  };

  const recentMissions = [
    {
      id: '1',
      name: 'Site A Security Patrol',
      status: 'IN_PROGRESS' as const,
      site: 'Site A',
      drone: 'DJI Mavic 3',
      startedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: 'Site B Inspection',
      status: 'COMPLETED' as const,
      site: 'Site B',
      drone: 'DJI Phantom 4',
      startedAt: '2024-01-15T09:00:00Z',
    },
    {
      id: '3',
      name: 'Site C Mapping',
      status: 'PLANNED' as const,
      site: 'Site C',
      drone: 'DJI Mavic 3',
      scheduledAt: '2024-01-16T14:00:00Z',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'PAUSED':
        return <PauseIcon className="h-5 w-5 text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'FAILED':
      case 'ABORTED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <MapIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'badge-info';
      case 'PAUSED':
        return 'badge-warning';
      case 'COMPLETED':
        return 'badge-success';
      case 'FAILED':
      case 'ABORTED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your drone survey operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Missions Card */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Missions</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalMissions}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex space-x-2 text-sm">
                <span className="text-green-600">{stats.activeMissions} Active</span>
                <span className="text-gray-500">•</span>
                <span className="text-blue-600">{stats.completedMissions} Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drones Card */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CpuChipIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Fleet Size</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalDrones}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex space-x-2 text-sm">
                <span className="text-green-600">{stats.availableDrones} Available</span>
                <span className="text-gray-500">•</span>
                <span className="text-blue-600">{stats.totalDrones - stats.availableDrones} In Use</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sites Card */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sites</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalSites}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex space-x-2 text-sm">
                <span className="text-green-600">{stats.activeSites} Active</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{stats.totalSites - stats.activeSites} Inactive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round((stats.completedMissions / stats.totalMissions) * 100)}%
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex space-x-2 text-sm">
                <span className="text-green-600">{stats.completedMissions} Success</span>
                <span className="text-gray-500">•</span>
                <span className="text-red-600">{stats.failedMissions} Failed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Missions */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Missions</h3>
            <Link
              to="/missions"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="card-body">
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {recentMissions.map((mission) => (
                <li key={mission.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(mission.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {mission.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mission.site} • {mission.drone}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`badge ${getStatusBadge(mission.status)}`}>
                        {mission.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/missions"
          className="card hover:shadow-lg transition-shadow duration-200"
        >
          <div className="card-body text-center">
            <MapIcon className="mx-auto h-12 w-12 text-primary-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Create Mission</h3>
            <p className="mt-2 text-sm text-gray-500">
              Plan and configure new drone survey missions
            </p>
          </div>
        </Link>

        <Link
          to="/fleet"
          className="card hover:shadow-lg transition-shadow duration-200"
        >
          <div className="card-body text-center">
            <CpuChipIcon className="mx-auto h-12 w-12 text-primary-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Manage Fleet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Monitor and manage your drone fleet
            </p>
          </div>
        </Link>

        <Link
          to="/analytics"
          className="card hover:shadow-lg transition-shadow duration-200"
        >
          <div className="card-body text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-primary-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">View Analytics</h3>
            <p className="mt-2 text-sm text-gray-500">
              Analyze mission performance and fleet statistics
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard; 
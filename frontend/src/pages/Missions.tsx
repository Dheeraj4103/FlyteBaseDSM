import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  MapIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  Battery100Icon,
  Battery50Icon,
  Battery0Icon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Types
interface Mission {
  id: string;
  name: string;
  description?: string;
  type: 'INSPECTION' | 'SECURITY_PATROL' | 'SITE_MAPPING' | 'SURVEY' | 'CUSTOM';
  status: 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ABORTED' | 'FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  altitude: number;
  speed: number;
  overlap: number;
  pattern: 'GRID' | 'CROSSHATCH' | 'PERIMETER' | 'SPIRAL' | 'CUSTOM';
  waypoints: any[];
  surveyArea: any;
  estimatedDuration: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  actualDistance?: number;
  coverageArea?: number;
  site: {
    id: string;
    name: string;
  };
  drone?: {
    id: string;
    name: string;
    model: string;
  };
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Site {
  id: string;
  name: string;
  address: string;
  waypoints?: any[];
  surveyArea?: any;
}

interface Drone {
  id: string;
  name: string;
  model: string;
  status: string;
  batteryLevel: number;
}

// Form schemas
const missionSchema = z.object({
  name: z.string().min(1, 'Mission name is required'),
  description: z.string().optional(),
  type: z.enum(['INSPECTION', 'SECURITY_PATROL', 'SITE_MAPPING', 'SURVEY', 'CUSTOM']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  siteId: z.string().min(1, 'Site is required'),
  droneId: z.string().optional(),
  altitude: z.number().min(10).max(400),
  speed: z.number().min(1).max(20),
  overlap: z.number().min(0).max(100),
  pattern: z.enum(['GRID', 'CROSSHATCH', 'PERIMETER', 'SPIRAL', 'CUSTOM']),
  estimatedDuration: z.number().min(1),
  scheduledAt: z.string().optional(),
});

type MissionFormData = z.infer<typeof missionSchema>;

const Missions: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const queryClient = useQueryClient();

  // Queries
  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: () => apiService.get<Mission[]>('/missions'),
  });

  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => apiService.get<Site[]>('/sites'),
  });

  const { data: drones } = useQuery({
    queryKey: ['drones'],
    queryFn: () => apiService.get<Drone[]>('/drones'),
  });

  // Mutations
  const createMissionMutation = useMutation({
    mutationFn: (data: MissionFormData) => apiService.post<Mission>('/missions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success('Mission created successfully!');
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create mission');
    },
  });

  const updateMissionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MissionFormData> }) =>
      apiService.put<Mission>(`/missions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success('Mission updated successfully!');
      setIsEditModalOpen(false);
      setSelectedMission(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update mission');
    },
  });

  const deleteMissionMutation = useMutation({
    mutationFn: (id: string) => apiService.delete(`/missions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success('Mission deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete mission');
    },
  });

  const startMissionMutation = useMutation({
    mutationFn: (id: string) => apiService.post(`/missions/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success('Mission started successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to start mission');
    },
  });

  const pauseMissionMutation = useMutation({
    mutationFn: (id: string) => apiService.post(`/missions/${id}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success('Mission paused successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to pause mission');
    },
  });

  const abortMissionMutation = useMutation({
    mutationFn: (id: string) => apiService.post(`/missions/${id}/abort`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success('Mission aborted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to abort mission');
    },
  });

  // Form setup
  const createForm = useForm<MissionFormData>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      type: 'INSPECTION',
      priority: 'MEDIUM',
      altitude: 100,
      speed: 5,
      overlap: 70,
      pattern: 'GRID',
      estimatedDuration: 30,
    },
  });

  const editForm = useForm<MissionFormData>({
    resolver: zodResolver(missionSchema),
  });

  // Handlers
  const handleCreateMission = (data: MissionFormData) => {
    createMissionMutation.mutate(data);
  };

  const handleEditMission = (data: MissionFormData) => {
    if (selectedMission) {
      updateMissionMutation.mutate({ id: selectedMission.id, data });
    }
  };

  const handleDeleteMission = (mission: Mission) => {
    if (window.confirm(`Are you sure you want to delete mission "${mission.name}"?`)) {
      deleteMissionMutation.mutate(mission.id);
    }
  };

  const handleStartMission = (mission: Mission) => {
    startMissionMutation.mutate(mission.id);
  };

  const handlePauseMission = (mission: Mission) => {
    pauseMissionMutation.mutate(mission.id);
  };

  const handleAbortMission = (mission: Mission) => {
    if (window.confirm(`Are you sure you want to abort mission "${mission.name}"?`)) {
      abortMissionMutation.mutate(mission.id);
    }
  };

  const openEditModal = (mission: Mission) => {
    setSelectedMission(mission);
    editForm.reset({
      name: mission.name,
      description: mission.description || '',
      type: mission.type,
      priority: mission.priority,
      siteId: mission.site.id,
      droneId: mission.drone?.id || '',
      altitude: mission.altitude,
      speed: mission.speed,
      overlap: mission.overlap,
      pattern: mission.pattern,
      estimatedDuration: mission.estimatedDuration,
      scheduledAt: mission.scheduledAt || '',
    });
    setIsEditModalOpen(true);
  };

  // Filter missions
  const filteredMissions = missions?.data?.filter((mission) => {
    if (statusFilter === 'ALL') return true;
    return mission.status === statusFilter;
  }) || [];

  // Status helpers
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
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <MapIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
      case 'ABORTED':
        return 'bg-red-100 text-red-800';
      case 'PLANNED':
        return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (missionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Missions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor drone survey missions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Mission
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="ABORTED">Aborted</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Missions List */}
      <div className="card">
        <div className="card-body">
          {filteredMissions.length === 0 ? (
            <div className="text-center py-12">
              <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No missions</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new mission.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMissions.map((mission) => (
                    <tr key={mission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {getStatusIcon(mission.status)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {mission.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {mission.type.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{mission.site.name}</div>
                        <div className="text-sm text-gray-500">
                          {mission.drone?.name || 'No drone assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(mission.status)}`}>
                          {mission.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(mission.priority)}`}>
                          {mission.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {mission.actualDuration || mission.estimatedDuration} min
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {mission.status === 'PLANNED' && (
                            <button
                              onClick={() => handleStartMission(mission)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Start Mission"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          )}
                          {mission.status === 'IN_PROGRESS' && (
                            <>
                              <button
                                onClick={() => handlePauseMission(mission)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Pause Mission"
                              >
                                <PauseIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleAbortMission(mission)}
                                className="text-red-600 hover:text-red-900"
                                title="Abort Mission"
                              >
                                <StopIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEditModal(mission)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Mission"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMission(mission)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Mission"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Mission Modal */}
      {isCreateModalOpen && (
        <MissionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateMission}
          form={createForm}
          sites={sites?.data || []}
          drones={drones?.data || []}
          isLoading={createMissionMutation.isPending}
        />
      )}

      {/* Edit Mission Modal */}
      {isEditModalOpen && selectedMission && (
        <MissionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMission(null);
          }}
          onSubmit={handleEditMission}
          form={editForm}
          sites={sites?.data || []}
          drones={drones?.data || []}
          isLoading={updateMissionMutation.isPending}
          mission={selectedMission}
        />
      )}
    </div>
  );
};

// Mission Modal Component
interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MissionFormData) => void;
  form: any;
  sites: Site[];
  drones: Drone[];
  isLoading: boolean;
  mission?: Mission;
}

const MissionModal: React.FC<MissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  sites,
  drones,
  isLoading,
  mission,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = form;

  const [selectedSiteWaypoints, setSelectedSiteWaypoints] = React.useState<any[]>([]);
  const [selectedSiteSurveyArea, setSelectedSiteSurveyArea] = React.useState<any>(null);

  React.useEffect(() => {
    const subscription = watch((value: any) => {
      const selectedSite = sites.find(site => site.id === value.siteId);
      setSelectedSiteWaypoints(selectedSite?.waypoints || []);
      setSelectedSiteSurveyArea(selectedSite?.surveyArea || null);
    });
    return () => subscription.unsubscribe();
  }, [watch, sites]);

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      waypoints: selectedSiteWaypoints,
      surveyArea: selectedSiteSurveyArea,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {mission ? 'Edit Mission' : 'Create Mission'}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        {...register('name')}
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          {...register('type')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="INSPECTION">Inspection</option>
                          <option value="SECURITY_PATROL">Security Patrol</option>
                          <option value="SITE_MAPPING">Site Mapping</option>
                          <option value="SURVEY">Survey</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                        <select
                          {...register('priority')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site</label>
                      <select
                        {...register('siteId')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select a site</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                      {errors.siteId && (
                        <p className="mt-1 text-sm text-red-600">{errors.siteId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Drone (Optional)</label>
                      <select
                        {...register('droneId')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">No drone assigned</option>
                        {drones
                          .filter((drone) => drone.status === 'AVAILABLE')
                          .map((drone) => (
                            <option key={drone.id} value={drone.id}>
                              {drone.name} ({drone.model})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Altitude (m)</label>
                        <input
                          {...register('altitude', { valueAsNumber: true })}
                          type="number"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Speed (m/s)</label>
                        <input
                          {...register('speed', { valueAsNumber: true })}
                          type="number"
                          step="0.1"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Overlap (%)</label>
                        <input
                          {...register('overlap', { valueAsNumber: true })}
                          type="number"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pattern</label>
                        <select
                          {...register('pattern')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="GRID">Grid</option>
                          <option value="CROSSHATCH">Crosshatch</option>
                          <option value="PERIMETER">Perimeter</option>
                          <option value="SPIRAL">Spiral</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                        <input
                          {...register('estimatedDuration', { valueAsNumber: true })}
                          type="number"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  mission ? 'Update Mission' : 'Create Mission'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Missions; 
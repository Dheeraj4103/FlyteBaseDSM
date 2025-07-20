import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
  Battery100Icon,
  Battery50Icon,
  Battery0Icon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Types
interface Drone {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  status: 'AVAILABLE' | 'IN_MISSION' | 'MAINTENANCE' | 'OFFLINE' | 'ERROR';
  batteryLevel: number;
  maxFlightTime: number;
  maxPayload: number;
  maxAltitude: number;
  maxSpeed: number;
  isActive: boolean;
  lastMaintenance?: string;
  nextMaintenance?: string;
  site?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Site {
  id: string;
  name: string;
  address: string;
}

// Form schemas
const droneSchema = z.object({
  name: z.string().min(1, 'Drone name is required'),
  model: z.string().min(1, 'Model is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  maxFlightTime: z.number().min(1, 'Max flight time must be at least 1 minute'),
  maxPayload: z.number().min(0.1, 'Max payload must be at least 0.1 kg'),
  maxAltitude: z.number().min(10, 'Max altitude must be at least 10 meters'),
  maxSpeed: z.number().min(1, 'Max speed must be at least 1 m/s'),
  siteId: z.string().optional(),
});

type DroneFormData = z.infer<typeof droneSchema>;

const Fleet: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const queryClient = useQueryClient();

  // Queries
  const { data: drones, isLoading: dronesLoading } = useQuery({
    queryKey: ['drones'],
    queryFn: () => apiService.get<Drone[]>('/drones'),
  });

  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => apiService.get<Site[]>('/sites'),
  });

  // Mutations
  const createDroneMutation = useMutation({
    mutationFn: (data: DroneFormData) => apiService.post<Drone>('/drones', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drones'] });
      toast.success('Drone added successfully!');
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add drone');
    },
  });

  const updateDroneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DroneFormData> }) =>
      apiService.put<Drone>(`/drones/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drones'] });
      toast.success('Drone updated successfully!');
      setIsEditModalOpen(false);
      setSelectedDrone(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update drone');
    },
  });

  const deleteDroneMutation = useMutation({
    mutationFn: (id: string) => apiService.delete(`/drones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drones'] });
      toast.success('Drone deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete drone');
    },
  });

  // Form setup
  const createForm = useForm<DroneFormData>({
    resolver: zodResolver(droneSchema),
    defaultValues: {
      maxFlightTime: 30,
      maxPayload: 2.5,
      maxAltitude: 120,
      maxSpeed: 15,
    },
  });

  const editForm = useForm<DroneFormData>({
    resolver: zodResolver(droneSchema),
  });

  // Handlers
  const handleCreateDrone = (data: DroneFormData) => {
    createDroneMutation.mutate(data);
  };

  const handleEditDrone = (data: DroneFormData) => {
    if (selectedDrone) {
      updateDroneMutation.mutate({ id: selectedDrone.id, data });
    }
  };

  const handleDeleteDrone = (drone: Drone) => {
    if (window.confirm(`Are you sure you want to delete drone "${drone.name}"?`)) {
      deleteDroneMutation.mutate(drone.id);
    }
  };

  const openEditModal = (drone: Drone) => {
    setSelectedDrone(drone);
    editForm.reset({
      name: drone.name,
      model: drone.model,
      serialNumber: drone.serialNumber,
      maxFlightTime: drone.maxFlightTime,
      maxPayload: drone.maxPayload,
      maxAltitude: drone.maxAltitude,
      maxSpeed: drone.maxSpeed,
      siteId: drone.site?.id || '',
    });
    setIsEditModalOpen(true);
  };

  // Filter drones
  const filteredDrones = drones?.data?.filter((drone) => {
    if (statusFilter === 'ALL') return true;
    return drone.status === statusFilter;
  }) || [];

  // Status helpers
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'IN_MISSION':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'MAINTENANCE':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-yellow-500" />;
      case 'OFFLINE':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      case 'ERROR':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'IN_MISSION':
        return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level >= 75) return <Battery100Icon className="h-5 w-5 text-green-500" />;
    if (level >= 50) return <Battery50Icon className="h-5 w-5 text-yellow-500" />;
    if (level >= 25) return <Battery50Icon className="h-5 w-5 text-orange-500" />;
    return <Battery0Icon className="h-5 w-5 text-red-500" />;
  };

  // Calculate fleet statistics
  const fleetStats = {
    total: drones?.data?.length || 0,
    available: drones?.data?.filter(d => d.status === 'AVAILABLE').length || 0,
    inMission: drones?.data?.filter(d => d.status === 'IN_MISSION').length || 0,
    maintenance: drones?.data?.filter(d => d.status === 'MAINTENANCE').length || 0,
    offline: drones?.data?.filter(d => d.status === 'OFFLINE').length || 0,
    error: drones?.data?.filter(d => d.status === 'ERROR').length || 0,
  };

  if (dronesLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage your drone fleet
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Drone
        </button>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-gray-900">{fleetStats.total}</div>
            <div className="text-sm text-gray-500">Total Drones</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">{fleetStats.available}</div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">{fleetStats.inMission}</div>
            <div className="text-sm text-gray-500">In Mission</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-yellow-600">{fleetStats.maintenance}</div>
            <div className="text-sm text-gray-500">Maintenance</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-gray-600">{fleetStats.offline}</div>
            <div className="text-sm text-gray-500">Offline</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-red-600">{fleetStats.error}</div>
            <div className="text-sm text-gray-500">Error</div>
          </div>
        </div>
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
              <option value="AVAILABLE">Available</option>
              <option value="IN_MISSION">In Mission</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OFFLINE">Offline</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drones Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDrones.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No drones</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new drone to your fleet.
            </p>
          </div>
        ) : (
          filteredDrones.map((drone) => (
            <div key={drone.id} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {getStatusIcon(drone.status)}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{drone.name}</h3>
                      <p className="text-sm text-gray-500">{drone.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(drone)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit Drone"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDrone(drone)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Drone"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(drone.status)}`}>
                      {drone.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Battery</span>
                    <div className="flex items-center">
                      {getBatteryIcon(drone.batteryLevel)}
                      <span className="ml-1 text-sm text-gray-900">{drone.batteryLevel}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Location</span>
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {drone.site?.name || 'Unassigned'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Flight Time</span>
                      <p className="font-medium">{drone.maxFlightTime} min</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Max Payload</span>
                      <p className="font-medium">{drone.maxPayload} kg</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Max Altitude</span>
                      <p className="font-medium">{drone.maxAltitude} m</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Max Speed</span>
                      <p className="font-medium">{drone.maxSpeed} m/s</p>
                    </div>
                  </div>

                  {drone.nextMaintenance && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                      <div className="flex items-center">
                        <WrenchScrewdriverIcon className="h-4 w-4 text-yellow-500 mr-2" />
                        <div className="text-sm">
                          <p className="text-yellow-800 font-medium">Maintenance Due</p>
                          <p className="text-yellow-700">
                            {new Date(drone.nextMaintenance).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Drone Modal */}
      {isCreateModalOpen && (
        <DroneModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateDrone}
          form={createForm}
          sites={sites?.data || []}
          isLoading={createDroneMutation.isPending}
        />
      )}

      {/* Edit Drone Modal */}
      {isEditModalOpen && selectedDrone && (
        <DroneModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDrone(null);
          }}
          onSubmit={handleEditDrone}
          form={editForm}
          sites={sites?.data || []}
          isLoading={updateDroneMutation.isPending}
          drone={selectedDrone}
        />
      )}
    </div>
  );
};

// Drone Modal Component
interface DroneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DroneFormData) => void;
  form: any;
  sites: Site[];
  isLoading: boolean;
  drone?: Drone;
}

const DroneModal: React.FC<DroneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  sites,
  isLoading,
  drone,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {drone ? 'Edit Drone' : 'Add Drone'}
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
                      <label className="block text-sm font-medium text-gray-700">Model</label>
                      <input
                        {...register('model')}
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.model && (
                        <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                      <input
                        {...register('serialNumber')}
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.serialNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.serialNumber.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site (Optional)</label>
                      <select
                        {...register('siteId')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">No site assigned</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Flight Time (min)</label>
                        <input
                          {...register('maxFlightTime', { valueAsNumber: true })}
                          type="number"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                        {errors.maxFlightTime && (
                          <p className="mt-1 text-sm text-red-600">{errors.maxFlightTime.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Payload (kg)</label>
                        <input
                          {...register('maxPayload', { valueAsNumber: true })}
                          type="number"
                          step="0.1"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                        {errors.maxPayload && (
                          <p className="mt-1 text-sm text-red-600">{errors.maxPayload.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Altitude (m)</label>
                        <input
                          {...register('maxAltitude', { valueAsNumber: true })}
                          type="number"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                        {errors.maxAltitude && (
                          <p className="mt-1 text-sm text-red-600">{errors.maxAltitude.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Speed (m/s)</label>
                        <input
                          {...register('maxSpeed', { valueAsNumber: true })}
                          type="number"
                          step="0.1"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                        {errors.maxSpeed && (
                          <p className="mt-1 text-sm text-red-600">{errors.maxSpeed.message}</p>
                        )}
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
                  drone ? 'Update Drone' : 'Add Drone'
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

export default Fleet; 
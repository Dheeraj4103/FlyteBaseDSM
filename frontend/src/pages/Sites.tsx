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
  MapPinIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  MapIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Types
interface Site {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  area: number;
  isActive: boolean;
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Drone {
  id: string;
  name: string;
  model: string;
  status: string;
}

interface Mission {
  id: string;
  name: string;
  status: string;
  type: string;
}

// Form schemas
const siteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  area: z.number().min(0.1, 'Area must be at least 0.1 square meters'),
});

type SiteFormData = z.infer<typeof siteSchema>;

const Sites: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailSite, setDetailSite] = useState<Site | null>(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: sites, isLoading: sitesLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => apiService.get<Site[]>('/sites'),
  });

  const { data: siteDrones } = useQuery({
    queryKey: ['site-drones', detailSite?.id],
    queryFn: () => apiService.get<Drone[]>(`/sites/${detailSite?.id}/drones`),
    enabled: !!detailSite?.id,
  });

  const { data: siteMissions } = useQuery({
    queryKey: ['site-missions', detailSite?.id],
    queryFn: () => apiService.get<Mission[]>(`/sites/${detailSite?.id}/missions`),
    enabled: !!detailSite?.id,
  });

  // Mutations
  const createSiteMutation = useMutation({
    mutationFn: (data: SiteFormData) => apiService.post<Site>('/sites', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site created successfully!');
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create site');
    },
  });

  const updateSiteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SiteFormData> }) =>
      apiService.put<Site>(`/sites/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site updated successfully!');
      setIsEditModalOpen(false);
      setSelectedSite(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update site');
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: (id: string) => apiService.delete(`/sites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete site');
    },
  });

  // Form setup
  const createForm = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      area: 1000,
    },
  });

  const editForm = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
  });

  // Handlers
  const handleCreateSite = (data: SiteFormData) => {
    createSiteMutation.mutate(data);
  };

  const handleEditSite = (data: SiteFormData) => {
    if (selectedSite) {
      updateSiteMutation.mutate({ id: selectedSite.id, data });
    }
  };

  const handleDeleteSite = (site: Site) => {
    if (window.confirm(`Are you sure you want to delete site "${site.name}"?`)) {
      deleteSiteMutation.mutate(site.id);
    }
  };

  const openEditModal = (site: Site) => {
    setSelectedSite(site);
    editForm.reset({
      name: site.name,
      description: site.description || '',
      address: site.address,
      latitude: site.latitude,
      longitude: site.longitude,
      area: site.area,
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = (site: Site) => {
    setDetailSite(site);
    setIsDetailModalOpen(true);
  };

  // Calculate site statistics
  const siteStats = {
    total: sites?.data?.length || 0,
    active: sites?.data?.filter(s => s.isActive).length || 0,
    inactive: sites?.data?.filter(s => !s.isActive).length || 0,
  };

  if (sitesLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage survey sites and locations
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Site
        </button>
      </div>

      {/* Site Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-gray-900">{siteStats.total}</div>
            <div className="text-sm text-gray-500">Total Sites</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">{siteStats.active}</div>
            <div className="text-sm text-gray-500">Active Sites</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-gray-600">{siteStats.inactive}</div>
            <div className="text-sm text-gray-500">Inactive Sites</div>
          </div>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sites?.data?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sites</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new survey site.
            </p>
          </div>
        ) : (
          sites?.data?.map((site) => (
            <div key={site.id} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <BuildingOfficeIcon className="h-10 w-10 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{site.name}</h3>
                      <p className="text-sm text-gray-500">{site.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openDetailModal(site)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(site)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit Site"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSite(site)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Site"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {site.description && (
                    <p className="text-sm text-gray-600">{site.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      site.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {site.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Area</span>
                    <span className="text-sm font-medium text-gray-900">
                      {site.area.toLocaleString()} m²
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Coordinates</span>
                    <div className="text-sm text-gray-900">
                      <div>{site.latitude.toFixed(6)}°N</div>
                      <div>{site.longitude.toFixed(6)}°E</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">
                      {new Date(site.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Site Modal */}
      {isCreateModalOpen && (
        <SiteModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSite}
          form={createForm}
          isLoading={createSiteMutation.isPending}
        />
      )}

      {/* Edit Site Modal */}
      {isEditModalOpen && selectedSite && (
        <SiteModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSite(null);
          }}
          onSubmit={handleEditSite}
          form={editForm}
          isLoading={updateSiteMutation.isPending}
          site={selectedSite}
        />
      )}

      {/* Site Detail Modal */}
      {isDetailModalOpen && detailSite && (
        <SiteDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailSite(null);
          }}
          site={detailSite}
          drones={siteDrones?.data || []}
          missions={siteMissions?.data || []}
        />
      )}
    </div>
  );
};

// Site Modal Component
interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SiteFormData) => void;
  form: any;
  isLoading: boolean;
  site?: Site;
}

const SiteModal: React.FC<SiteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  isLoading,
  site,
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
                    {site ? 'Edit Site' : 'Add Site'}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <input
                        {...register('address')}
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Latitude</label>
                        <input
                          {...register('latitude', { valueAsNumber: true })}
                          type="number"
                          step="0.000001"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                        {errors.latitude && (
                          <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Longitude</label>
                        <input
                          {...register('longitude', { valueAsNumber: true })}
                          type="number"
                          step="0.000001"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                        {errors.longitude && (
                          <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Area (m²)</label>
                      <input
                        {...register('area', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.area && (
                        <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
                      )}
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
                  site ? 'Update Site' : 'Add Site'
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

// Site Detail Modal Component
interface SiteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site;
  drones: Drone[];
  missions: Mission[];
}

const SiteDetailModal: React.FC<SiteDetailModalProps> = ({
  isOpen,
  onClose,
  site,
  drones,
  missions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Site Details: {site.name}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Site Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Site Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Address:</span>
                        <p className="text-sm font-medium text-gray-900">{site.address}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Coordinates:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {site.latitude.toFixed(6)}°N, {site.longitude.toFixed(6)}°E
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Area:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {site.area.toLocaleString()} m²
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                          site.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {site.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {site.description && (
                        <div>
                          <span className="text-sm text-gray-500">Description:</span>
                          <p className="text-sm text-gray-900">{site.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Site Statistics */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Drones:</span>
                        <span className="text-sm font-medium text-gray-900">{drones.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Missions:</span>
                        <span className="text-sm font-medium text-gray-900">{missions.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Created:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(site.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Last Updated:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(site.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drones at this site */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Drones at this Site</h4>
                  {drones.length === 0 ? (
                    <p className="text-sm text-gray-500">No drones assigned to this site.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {drones.map((drone) => (
                        <div key={drone.id} className="flex items-center p-3 bg-gray-50 rounded-md">
                          <CpuChipIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{drone.name}</p>
                            <p className="text-xs text-gray-500">{drone.model}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Missions */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Recent Missions</h4>
                  {missions.length === 0 ? (
                    <p className="text-sm text-gray-500">No missions at this site.</p>
                  ) : (
                    <div className="space-y-2">
                      {missions.slice(0, 5).map((mission) => (
                        <div key={mission.id} className="flex items-center p-3 bg-gray-50 rounded-md">
                          <MapIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{mission.name}</p>
                            <p className="text-xs text-gray-500">{mission.type.replace('_', ' ')}</p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            mission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            mission.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {mission.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sites; 
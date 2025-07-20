import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MapIcon,
  CpuChipIcon,
  BuildingOfficeIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Types
interface Drone {
  id: string;
  name: string;
  model: string;
  status: string;
  batteryLevel: number;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  site?: {
    id: string;
    name: string;
  };
}

interface Mission {
  id: string;
  name: string;
  status: string;
  type: string;
  waypoints: Array<{
    latitude: number;
    longitude: number;
    altitude: number;
  }>;
  surveyArea: {
    coordinates: Array<Array<[number, number]>>;
  };
  site: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  drone?: {
    id: string;
    name: string;
  };
}

interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  area: number;
  isActive: boolean;
}

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showDrones, setShowDrones] = useState(true);
  const [showMissions, setShowMissions] = useState(true);
  const [showSites, setShowSites] = useState(true);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  // Queries
  const { data: drones, isLoading: dronesLoading } = useQuery({
    queryKey: ['map-drones'],
    queryFn: () => apiService.get<Drone[]>('/drones'),
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ['map-missions'],
    queryFn: () => apiService.get<Mission[]>('/missions'),
  });

  const { data: sites, isLoading: sitesLoading } = useQuery({
    queryKey: ['map-sites'],
    queryFn: () => apiService.get<Site[]>('/sites'),
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-74.006, 40.7128], // Default to NYC
      zoom: 10,
      pitch: 45,
      bearing: 0,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add drone markers
  useEffect(() => {
    if (!mapLoaded || !map.current || !drones?.data || !showDrones) return;

    // Remove existing drone markers
    const existingMarkers = document.querySelectorAll('.drone-marker');
    existingMarkers.forEach(marker => marker.remove());

    drones.data.forEach((drone) => {
      if (drone.latitude && drone.longitude) {
        // Create marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'drone-marker';
        markerEl.innerHTML = `
          <div class="relative">
            <div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0z"/>
              </svg>
            </div>
            <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs shadow-md whitespace-nowrap">
              ${drone.name}
            </div>
          </div>
        `;

        // Add click handler
        markerEl.addEventListener('click', () => {
          setSelectedDrone(drone);
        });

        // Create and add marker
        new mapboxgl.Marker(markerEl)
          .setLngLat([drone.longitude, drone.latitude])
          .setRotation(drone.heading)
          .addTo(map.current!);
      }
    });
  }, [mapLoaded, drones?.data, showDrones]);

  // Add mission paths and areas
  useEffect(() => {
    if (!mapLoaded || !map.current || !missions?.data || !showMissions) return;

    // Remove existing mission layers
    const existingSources = ['missions', 'mission-areas'];
    existingSources.forEach(source => {
      if (map.current!.getSource(source)) {
        map.current!.removeLayer(`${source}-layer`);
        map.current!.removeSource(source);
      }
    });

    missions.data.forEach((mission, index) => {
      if (mission.waypoints && mission.waypoints.length > 0) {
        // Add mission path
        const pathCoordinates = mission.waypoints.map(wp => [wp.longitude, wp.latitude]);
        
        map.current!.addSource(`mission-${mission.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: pathCoordinates,
            },
          },
        });

        map.current!.addLayer({
          id: `mission-${mission.id}-path`,
          type: 'line',
          source: `mission-${mission.id}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': mission.status === 'COMPLETED' ? '#10B981' :
                         mission.status === 'IN_PROGRESS' ? '#3B82F6' :
                         mission.status === 'FAILED' ? '#EF4444' : '#6B7280',
            'line-width': 3,
            'line-dasharray': mission.status === 'PLANNED' ? [2, 2] : [1],
          },
        });

        // Add mission area if available
        if (mission.surveyArea && mission.surveyArea.coordinates.length > 0) {
          map.current!.addSource(`mission-area-${mission.id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: mission.surveyArea.coordinates,
              },
            },
          });

          map.current!.addLayer({
            id: `mission-area-${mission.id}`,
            type: 'fill',
            source: `mission-area-${mission.id}`,
            paint: {
              'fill-color': mission.status === 'COMPLETED' ? '#10B981' :
                           mission.status === 'IN_PROGRESS' ? '#3B82F6' :
                           mission.status === 'FAILED' ? '#EF4444' : '#6B7280',
              'fill-opacity': 0.2,
            },
          });
        }
      }
    });
  }, [mapLoaded, missions?.data, showMissions]);

  // Add site markers
  useEffect(() => {
    if (!mapLoaded || !map.current || !sites?.data || !showSites) return;

    // Remove existing site markers
    const existingMarkers = document.querySelectorAll('.site-marker');
    existingMarkers.forEach(marker => marker.remove());

    sites.data.forEach((site) => {
      if (site.latitude && site.longitude) {
        // Create marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'site-marker';
        markerEl.innerHTML = `
          <div class="relative">
            <div class="w-6 h-6 bg-purple-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </div>
            <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs shadow-md whitespace-nowrap">
              ${site.name}
            </div>
          </div>
        `;

        // Add click handler
        markerEl.addEventListener('click', () => {
          // Fly to site
          map.current!.flyTo({
            center: [site.longitude, site.latitude],
            zoom: 14,
            duration: 2000,
          });
        });

        // Create and add marker
        new mapboxgl.Marker(markerEl)
          .setLngLat([site.longitude, site.latitude])
          .addTo(map.current!);
      }
    });
  }, [mapLoaded, sites?.data, showSites]);

  // Auto-center map to first drone or site
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (drones?.data && drones.data.length > 0) {
      const firstDrone = drones.data[0];
      if (firstDrone.latitude && firstDrone.longitude) {
        map.current.flyTo({
          center: [firstDrone.longitude, firstDrone.latitude],
          zoom: 12,
          duration: 2000,
        });
      }
    } else if (sites?.data && sites.data.length > 0) {
      const firstSite = sites.data[0];
      if (firstSite.latitude && firstSite.longitude) {
        map.current.flyTo({
          center: [firstSite.longitude, firstSite.latitude],
          zoom: 10,
          duration: 2000,
        });
      }
    }
  }, [mapLoaded, drones?.data, sites?.data]);

  if (dronesLoading || missionsLoading || sitesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Map</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time drone tracking and mission visualization
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Layer Controls */}
          <div className="flex items-center space-x-2 bg-white rounded-lg shadow-md p-2">
            <button
              onClick={() => setShowDrones(!showDrones)}
              className={`flex items-center px-3 py-1 rounded text-sm font-medium ${
                showDrones ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CpuChipIcon className="h-4 w-4 mr-1" />
              Drones
            </button>
            <button
              onClick={() => setShowMissions(!showMissions)}
              className={`flex items-center px-3 py-1 rounded text-sm font-medium ${
                showMissions ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapIcon className="h-4 w-4 mr-1" />
              Missions
            </button>
            <button
              onClick={() => setShowSites(!showSites)}
              className={`flex items-center px-3 py-1 rounded text-sm font-medium ${
                showSites ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
              Sites
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div ref={mapContainer} className="w-full h-96 rounded-lg shadow-lg" />
        
        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2">
          <div className="space-y-2">
            <button
              onClick={() => map.current?.flyTo({ zoom: (map.current.getZoom() || 10) + 1 })}
              className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
            >
              +
            </button>
            <button
              onClick={() => map.current?.flyTo({ zoom: (map.current.getZoom() || 10) - 1 })}
              className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
            >
              −
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Drones</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span>Sites</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span>Completed Missions</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span>Active Missions</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span>Failed Missions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Data Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Drones */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Active Drones</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {drones?.data?.filter(d => d.status === 'IN_MISSION').length === 0 ? (
                <p className="text-sm text-gray-500">No drones currently in mission</p>
              ) : (
                drones?.data?.filter(d => d.status === 'IN_MISSION').map((drone) => (
                  <div key={drone.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center">
                      <CpuChipIcon className="h-5 w-5 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{drone.name}</p>
                        <p className="text-xs text-gray-500">{drone.model}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{drone.altitude}m</p>
                      <p className="text-xs text-gray-500">{drone.batteryLevel}% battery</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Active Missions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Active Missions</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {missions?.data?.filter(m => m.status === 'IN_PROGRESS').length === 0 ? (
                <p className="text-sm text-gray-500">No missions currently in progress</p>
              ) : (
                missions?.data?.filter(m => m.status === 'IN_PROGRESS').map((mission) => (
                  <div key={mission.id} className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                    <div className="flex items-center">
                      <MapIcon className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{mission.name}</p>
                        <p className="text-xs text-gray-500">{mission.site.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{mission.type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{mission.drone?.name || 'No drone'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Site Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Site Overview</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {sites?.data?.length === 0 ? (
                <p className="text-sm text-gray-500">No sites available</p>
              ) : (
                sites?.data?.slice(0, 3).map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-md">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-purple-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{site.name}</p>
                        <p className="text-xs text-gray-500">{(site.area / 1000000).toFixed(1)} km²</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        site.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {site.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Drone/Mission Details */}
      {(selectedDrone || selectedMission) && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {selectedDrone ? 'Drone Details' : 'Mission Details'}
            </h3>
            <button
              onClick={() => {
                setSelectedDrone(null);
                setSelectedMission(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="card-body">
            {selectedDrone && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDrone.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDrone.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDrone.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Battery</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDrone.batteryLevel}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Altitude</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDrone.altitude}m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Speed</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDrone.speed} m/s</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedDrone.latitude.toFixed(6)}, {selectedDrone.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Heading</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDrone.heading}°</p>
                </div>
              </div>
            )}
            {selectedMission && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{selectedMission.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-sm font-medium text-gray-900">{selectedMission.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900">{selectedMission.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Site</p>
                  <p className="text-sm font-medium text-gray-900">{selectedMission.site.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Drone</p>
                  <p className="text-sm font-medium text-gray-900">{selectedMission.drone?.name || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Waypoints</p>
                  <p className="text-sm font-medium text-gray-900">{selectedMission.waypoints.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Map; 
import React from 'react';
import { useParams } from 'react-router-dom';

const MissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mission Details</h1>
        <p className="mt-1 text-sm text-gray-500">
          Mission ID: {id}
        </p>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Mission Details</h3>
            <p className="text-gray-500">
              This page will show detailed mission information, real-time monitoring, and control options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionDetail; 
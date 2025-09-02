import React from 'react';
import { Clock, Trophy, Edit, Plus, Eye, EyeOff } from 'lucide-react';

interface RecentActivityProps {
  recentEvents: any[];
}

export function RecentActivity({ recentEvents }: RecentActivityProps) {
  const getActivityIcon = (isActive: boolean) => {
    if (isActive) {
        return <Plus className="w-4 h-4 text-green-600" />;
    } else {
        return <Edit className="w-4 h-4 text-orange-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      
      <div className="space-y-4">
        {recentEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          recentEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                {getActivityIcon(event.is_active)}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{event.event_type}</h3>
                <p className="text-sm text-gray-600">
                  {event.is_active ? 'Event activated' : 'Event deactivated'}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  event.is_active ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event.is_active ? 'Active' : 'Inactive'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(event.updated_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
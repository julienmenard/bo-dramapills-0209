import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Activity } from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { RecentActivity } from './RecentActivity';
import { supabase } from '../../lib/supabase';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    inactiveEvents: 0,
    totalRewards: 0,
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load gamification events stats
      const { data: events, error: eventsError } = await supabase
        .from('gamification_events')
        .select('id, event_type, is_active, coins_reward, updated_at')
        .order('updated_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Calculate stats
      const totalEvents = events?.length || 0;
      const activeEvents = events?.filter(e => e.is_active).length || 0;
      const inactiveEvents = events?.filter(e => !e.is_active).length || 0;
      const totalRewards = events?.reduce((sum, e) => sum + e.coins_reward, 0) || 0;

      setStats({
        totalEvents,
        activeEvents,
        inactiveEvents,
        totalRewards,
      });

      // Set recent events (last 5)
      setRecentEvents(events?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your product management system</p>
      </div>

      <DashboardStats
        totalEvents={stats.totalEvents}
        activeEvents={stats.activeEvents}
        inactiveEvents={stats.inactiveEvents}
        totalRewards={stats.totalRewards}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity recentEvents={recentEvents} />
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Trophy className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add New Event</p>
                <p className="text-sm text-gray-600">Create a new gamification event</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all text-left">
              <div className="bg-green-100 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-600">Monitor user engagement and rewards</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
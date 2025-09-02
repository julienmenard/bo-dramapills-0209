import React from 'react';
import { Trophy, TrendingUp, Eye, EyeOff } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

function StatsCard({ title, value, change, changeType, icon, color }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  totalEvents: number;
  activeEvents: number;
  inactiveEvents: number;
  totalRewards: number;
}

export function DashboardStats({ 
  totalEvents, 
  activeEvents, 
  inactiveEvents, 
  totalRewards 
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Events"
        value={totalEvents}
        change="+12% from last month"
        changeType="positive"
        icon={<Trophy className="w-6 h-6 text-blue-600" />}
        color="bg-blue-50"
      />
      <StatsCard
        title="Active Events"
        value={activeEvents}
        change="+5% from last month"
        changeType="positive"
        icon={<Eye className="w-6 h-6 text-green-600" />}
        color="bg-green-50"
      />
      <StatsCard
        title="Inactive Events"
        value={inactiveEvents}
        change="Disabled events"
        changeType="neutral"
        icon={<EyeOff className="w-6 h-6 text-orange-600" />}
        color="bg-orange-50"
      />
      <StatsCard
        title="Total Coin Rewards"
        value={totalRewards}
        change="+8% from last month"
        changeType="positive"
        icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
        color="bg-purple-50"
      />
    </div>
  );
}
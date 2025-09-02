import React from 'react';
import { 
  Home, 
  Trophy, 
  Languages,
  Settings, 
  LogOut, 
  BarChart3,
  Users,
  Globe,
  BookOpen,
  Video,
  Play,
  Gift,
  Tags,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { signOut, user } = useAuth();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'gamification', name: 'Gamification Events', icon: Trophy },
    { id: 'translations', name: 'Event Translations', icon: Languages },
    { id: 'event-categories', name: 'Event Categories', icon: Tags },
    { id: 'trouple', name: 'Trouple Management', icon: Globe },
    { id: 'rubrics', name: 'Content Rubrics', icon: Tags },
    { id: 'series', name: 'Content Series', icon: Video },
    { id: 'episodes', name: 'Series Episodes', icon: Play },
    { id: 'free-episodes', name: 'Free Episodes', icon: Gift },
    { id: 'series-rubrics', name: 'Series Rubrics', icon: BookOpen },
    { id: 'sync-galaxy', name: 'Sync Galaxy', icon: RefreshCw },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="bg-white w-64 min-h-screen border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">DramaPills Admin</h1>
            <p className="text-sm text-gray-600">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        {user && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">
              {user.user_name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-600">{user.user_email}</p>
            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {user.user_role}
            </span>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
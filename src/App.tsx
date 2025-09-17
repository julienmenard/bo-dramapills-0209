import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { GamificationEventsManager } from './components/gamification/GamificationEventsManager';
import { EventTranslationsManager } from './components/gamification/EventTranslationsManager';
import { EventCategoriesManager } from './components/gamification/EventCategoriesManager';
import { TroupleManager } from './components/trouple/TroupleManager';
import { ContentRubricsManager } from './components/content/ContentRubricsManager';
import { ContentSeriesManager } from './components/content/ContentSeriesManager';
import { SeriesEpisodesManager } from './components/content/SeriesEpisodesManager';
import { FreeEpisodesManager } from './components/content/FreeEpisodesManager';
import { SeriesRubricsManager } from './components/content/SeriesRubricsManager';
import { AdminUserManager } from './components/settings/AdminUserManager';
import { SyncGalaxy } from './components/sync/SyncGalaxy';

function AuthCallback() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Handle OAuth callback route
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'gamification':
        return <GamificationEventsManager />;
      case 'translations':
        return <EventTranslationsManager />;
      case 'event-categories':
        return <EventCategoriesManager />;
      case 'trouple':
        return <TroupleManager />;
      case 'rubrics':
        return <ContentRubricsManager />;
      case 'series':
        return <ContentSeriesManager />;
      case 'episodes':
        return <SeriesEpisodesManager />;
      case 'free-episodes':
        return <FreeEpisodesManager />;
      case 'series-rubrics':
        return <SeriesRubricsManager />;
      case 'sync-galaxy':
        return <SyncGalaxy />;
      case 'analytics':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h2>
            <p className="text-gray-600">Advanced analytics features coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage application settings and user accounts</p>
            </div>
            <AdminUserManager />
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
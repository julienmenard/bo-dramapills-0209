import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function SyncGalaxy() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🔄 Starting Galaxy import...');
      
      const { data, error } = await supabase.functions.invoke('galaxy-import-3', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (error) {
        console.error('❌ Galaxy import error:', error);
        setResult({
          success: false,
          message: error.message || 'Failed to execute Galaxy import'
        });
        return;
      }

      console.log('✅ Galaxy import completed:', data);
      setResult({
        success: true,
        message: data?.message || 'Galaxy import completed successfully'
      });
    } catch (error) {
      console.error('❌ Unexpected error during Galaxy import:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <RefreshCw className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sync Galaxy</h1>
            <p className="text-gray-600">Import and synchronize data from Galaxy API</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Galaxy Data Import</h3>
              <p className="text-sm text-blue-800">
                This will execute the galaxy-import edge function to synchronize content data from the Galaxy API. 
                This process may take several minutes to complete.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={handleSync}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-lg font-medium flex items-center gap-3 transition-colors text-lg"
          >
            {loading ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                Syncing Galaxy Data...
              </>
            ) : (
              <>
                <RefreshCw className="w-6 h-6" />
                Start Galaxy Sync
              </>
            )}
          </button>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <h3 className={`font-medium mb-1 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Sync Completed' : 'Sync Failed'}
                </h3>
                <p className={`text-sm ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What does Galaxy Sync do?</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p>Imports content series data from the Galaxy API</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p>Synchronizes episode information and metadata</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p>Updates content rubrics and categorization</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p>Maintains data consistency across the platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
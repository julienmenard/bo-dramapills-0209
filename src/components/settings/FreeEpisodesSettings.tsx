import React, { useState, useEffect } from 'react';
import { Save, Settings, Gift, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FreeEpisodesSettingValue {
  count: number;
}

export function FreeEpisodesSettings() {
  const [freeEpisodesCount, setFreeEpisodesCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'free_episodes_count')
        .single();

      if (error) {
        console.error('Error loading free episodes setting:', error);
        return;
      }

      const value = data?.setting_value as FreeEpisodesSettingValue;
      if (value?.count) {
        setFreeEpisodesCount(value.count);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: { count: freeEpisodesCount },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'free_episodes_count');

      if (error) throw error;

      setMessage({ type: 'success', text: 'Free episodes setting updated successfully!' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving setting:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save setting' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Gift className="w-6 h-6 text-orange-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Free Episodes Configuration</h2>
          <p className="text-gray-600">Manage how many episodes are available for free viewing</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">How Free Episodes Work</h3>
              <p className="text-sm text-blue-800">
                Episodes with position numbers from 1 to the configured count will be marked as free. 
                For example, if set to 3, episodes at positions 1, 2, and 3 will be available for free viewing.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="free_episodes_count" className="block text-sm font-medium text-gray-700 mb-3">
            Number of Free Episodes per Series
          </label>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <input
                type="number"
                id="free_episodes_count"
                value={freeEpisodesCount}
                onChange={(e) => setFreeEpisodesCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Gift className="w-5 h-5 text-orange-500" />
              <span className="text-sm">
                Episodes 1-{freeEpisodesCount} will be free
              </span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            This setting affects which episodes are marked as free during Galaxy import
          </p>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Setting'}
          </button>
        </div>
      </div>
    </div>
  );
}
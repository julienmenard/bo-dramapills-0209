import React, { useState, useEffect } from 'react';
import { Play, Search, Clock, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SeriesEpisode {
  series_id: number;
  episode_id: number;
  season_id: number;
  episode_position: number;
  season_position: number | null;
  campaign_countries_languages_id: string;
  url_streaming_no_drm: string | null;
  description: string | null;
  title: string | null;
  duration: number | null;
  product_year: number | null;
  created_at: string;
  updated_at: string;
}

export function SeriesEpisodesManager() {
  const [episodes, setEpisodes] = useState<SeriesEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');

  useEffect(() => {
    loadEpisodes();
  }, []);

  const loadEpisodes = async () => {
    console.log('🔄 Loading series episodes...');
    try {
      const { data, error } = await supabase
        .from('contents_series_episodes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📊 Series episodes loaded:', data?.length || 0);
      setEpisodes(data || []);
    } catch (error) {
      console.error('❌ Error loading series episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEpisodes = episodes.filter((episode) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (episode.title || '').toLowerCase().includes(searchLower) ||
      (episode.description || '').toLowerCase().includes(searchLower) ||
      episode.series_id.toString().includes(searchLower) ||
      episode.episode_id.toString().includes(searchLower) ||
      episode.season_id.toString().includes(searchLower) ||
      episode.campaign_countries_languages_id.toLowerCase().includes(searchLower)
    );
    const matchesCampaign = campaignFilter === 'all' || 
      episode.campaign_countries_languages_id === campaignFilter;
    
    return matchesSearch && matchesCampaign;
  });

  const uniqueCampaigns = [...new Set(episodes.map(e => e.campaign_countries_languages_id))];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Play className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Series Episodes</h1>
              <p className="text-gray-600">View series episodes information (Read Only)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search episodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Campaigns</option>
              {uniqueCampaigns.map((campaign) => (
                <option key={campaign} value={campaign}>
                  {campaign.substring(0, 8)}...
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">Episode ID</th>
                <th className="text-left p-4 font-medium text-gray-900">Title</th>
                <th className="text-left p-4 font-medium text-gray-900">Series</th>
                <th className="text-left p-4 font-medium text-gray-900">Season</th>
                <th className="text-left p-4 font-medium text-gray-900">Position</th>
                <th className="text-left p-4 font-medium text-gray-900">Duration</th>
                <th className="text-left p-4 font-medium text-gray-900">Year</th>
                <th className="text-left p-4 font-medium text-gray-900 min-w-[120px]">Campaign</th>
                <th className="text-left p-4 font-medium text-gray-900">Streaming</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEpisodes.map((episode) => (
                <tr key={`${episode.series_id}-${episode.episode_id}-${episode.season_id}-${episode.campaign_countries_languages_id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                      {episode.episode_id}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {episode.title || `Episode ${episode.episode_position}`}
                      </p>
                      {episode.description && (
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {episode.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {episode.series_id}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                        S{episode.season_id}
                      </span>
                      {episode.season_position && (
                        <span className="text-xs text-gray-500">
                          (Pos: {episode.season_position})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                      {episode.episode_position}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDuration(episode.duration)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-600">
                      {episode.product_year || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono break-all max-w-[100px] block">
                      {episode.campaign_countries_languages_id}
                    </code>
                  </td>
                  <td className="p-4">
                    {episode.url_streaming_no_drm ? (
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600">Available</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No stream</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredEpisodes.length === 0 && (
            <div className="text-center py-12">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No series episodes found</p>
              <p className="text-sm text-gray-500 mt-1">
                {episodes.length === 0 ? 'No episodes available' : 'Try adjusting your search'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
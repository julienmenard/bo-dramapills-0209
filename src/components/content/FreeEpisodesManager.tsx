import React, { useState, useEffect } from 'react';
import { Gift, Search, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FreeEpisode {
  episode_id: number;
  campaign_countries_languages_id: string;
  created_at: string;
  updated_at: string;
}

export function FreeEpisodesManager() {
  const [freeEpisodes, setFreeEpisodes] = useState<FreeEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');

  useEffect(() => {
    loadFreeEpisodes();
  }, []);

  const loadFreeEpisodes = async () => {
    console.log('🔄 Loading free episodes...');
    try {
      const { data, error } = await supabase
        .from('contents_series_episodes_free')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📊 Free episodes loaded:', data?.length || 0);
      setFreeEpisodes(data || []);
    } catch (error) {
      console.error('❌ Error loading free episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFreeEpisodes = freeEpisodes.filter((episode) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      episode.episode_id.toString().includes(searchLower) ||
      episode.campaign_countries_languages_id.toLowerCase().includes(searchLower)
    );
    const matchesCampaign = campaignFilter === 'all' || 
      episode.campaign_countries_languages_id === campaignFilter;
    
    return matchesSearch && matchesCampaign;
  });

  const uniqueCampaigns = [...new Set(freeEpisodes.map(e => e.campaign_countries_languages_id))];

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
            <Gift className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Free Episodes</h1>
              <p className="text-gray-600">View episodes available for free viewing (Read Only)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search free episodes..."
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
                <th className="text-left p-4 font-medium text-gray-900 min-w-[120px]">Campaign</th>
                <th className="text-left p-4 font-medium text-gray-900">Created</th>
                <th className="text-left p-4 font-medium text-gray-900">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFreeEpisodes.map((episode) => (
                <tr key={`${episode.episode_id}-${episode.campaign_countries_languages_id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-orange-500" />
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">
                        {episode.episode_id}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono break-all max-w-[100px] block">
                      {episode.campaign_countries_languages_id}
                    </code>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(episode.created_at)}
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(episode.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredFreeEpisodes.length === 0 && (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No free episodes found</p>
              <p className="text-sm text-gray-500 mt-1">
                {freeEpisodes.length === 0 ? 'No free episodes available' : 'Try adjusting your search'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
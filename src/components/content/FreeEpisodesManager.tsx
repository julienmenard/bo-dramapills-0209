import React, { useState, useEffect } from 'react';
import { Gift, Search, Play, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FreeEpisode {
  episode_id: number;
  campaign_countries_languages_id: string;
  created_at: string;
  updated_at: string;
  series_id?: number;
  episode_position?: number;
  title?: string;
  country_code?: string;
  language_code?: string;
}

interface CampaignInfo {
  id: string;
  campaign_id: number;
  country_code: string | null;
}

export function FreeEpisodesManager() {
  const [freeEpisodes, setFreeEpisodes] = useState<FreeEpisode[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadFreeEpisodes();
    loadCampaigns();
  }, []);

  const loadFreeEpisodes = async () => {
    console.log('🔄 Loading free episodes...');
    try {
      const { data, error } = await supabase
        .from('contents_series_episodes_free')
        .select(`
          *,
          contents_series_episodes!inner(series_id, episode_position, title),
          campaign_countries_languages!inner(country_code, language_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Flatten the joined data
      const flattenedData = data?.map(item => ({
        ...item,
        series_id: item.contents_series_episodes?.series_id,
        episode_position: item.contents_series_episodes?.episode_position,
        title: item.contents_series_episodes?.title,
        country_code: item.campaign_countries_languages?.country_code,
        language_code: item.campaign_countries_languages?.language_code
      })) || [];
      
      console.log('📊 Free episodes loaded:', flattenedData.length);
      setFreeEpisodes(flattenedData);
    } catch (error) {
      console.error('❌ Error loading free episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_countries_languages')
        .select('id, campaign_id, country_code')
        .order('campaign_id', { ascending: true });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('❌ Error loading campaigns:', error);
    }
  };

  const getCampaignDisplay = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      return `${campaign.campaign_id}${campaign.country_code ? ` - ${campaign.country_code.toUpperCase()}` : ''}`;
    }
    return campaignId.substring(0, 8) + '...';
  };
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortData = (data: FreeEpisode[]) => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'episode_id':
          aValue = a.episode_id;
          bValue = b.episode_id;
          break;
        case 'series_id':
          aValue = a.series_id || 0;
          bValue = b.series_id || 0;
          break;
        case 'episode_position':
          aValue = a.episode_position || 0;
          bValue = b.episode_position || 0;
          break;
        case 'title':
          aValue = (a.title || `Episode ${a.episode_position || a.episode_id}`).toLowerCase();
          bValue = (b.title || `Episode ${b.episode_position || b.episode_id}`).toLowerCase();
          break;
        case 'country_language':
          aValue = `${a.country_code || ''} ${a.language_code || ''}`.toLowerCase();
          bValue = `${b.country_code || ''} ${b.language_code || ''}`.toLowerCase();
          break;
        case 'campaign_id':
          aValue = a.campaign_countries_languages_id.toLowerCase();
          bValue = b.campaign_countries_languages_id.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };
  const filteredFreeEpisodes = freeEpisodes.filter((episode) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      episode.episode_id.toString().includes(searchLower) ||
      episode.campaign_countries_languages_id.toLowerCase().includes(searchLower) ||
      (episode.series_id && episode.series_id.toString().includes(searchLower)) ||
      (episode.episode_position && episode.episode_position.toString().includes(searchLower)) ||
      (episode.title && episode.title.toLowerCase().includes(searchLower)) ||
      (episode.country_code && episode.country_code.toLowerCase().includes(searchLower)) ||
      (episode.language_code && episode.language_code.toLowerCase().includes(searchLower))
    );
    const matchesCampaign = campaignFilter === 'all' || 
      episode.campaign_countries_languages_id === campaignFilter;
    
    return matchesSearch && matchesCampaign;
  });

  const sortedAndFilteredFreeEpisodes = sortData(filteredFreeEpisodes);


  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <th 
      className="text-left p-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors select-none"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col">
          <ChevronUp 
            className={`w-3 h-3 ${
              sortColumn === column && sortDirection === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-300'
            }`} 
          />
          <ChevronDown 
            className={`w-3 h-3 -mt-1 ${
              sortColumn === column && sortDirection === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-300'
            }`} 
          />
        </div>
      </div>
    </th>
  );

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
              {campaigns.filter(campaign => 
                freeEpisodes.some(e => e.campaign_countries_languages_id === campaign.id)
              ).map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {getCampaignDisplay(campaign.id)}
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
                <SortableHeader column="episode_id">Episode ID</SortableHeader>
                <SortableHeader column="series_id">Serie ID</SortableHeader>
                <SortableHeader column="episode_position">Episode Position</SortableHeader>
                <SortableHeader column="title">Title</SortableHeader>
                <SortableHeader column="country_language">Country Language</SortableHeader>
                <th className="text-left p-4 font-medium text-gray-900 min-w-[120px] cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('campaign_id')}>
                  <div className="flex items-center gap-2">
                    ID trouple campaign
                    <div className="flex flex-col">
                      <ChevronUp 
                        className={`w-3 h-3 ${
                          sortColumn === 'campaign_id' && sortDirection === 'asc' 
                            ? 'text-blue-600' 
                            : 'text-gray-300'
                        }`} 
                      />
                      <ChevronDown 
                        className={`w-3 h-3 -mt-1 ${
                          sortColumn === 'campaign_id' && sortDirection === 'desc' 
                            ? 'text-blue-600' 
                            : 'text-gray-300'
                        }`} 
                      />
                    </div>
                  </div>
                </th>
                <SortableHeader column="created_at">Created</SortableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedAndFilteredFreeEpisodes.map((episode) => (
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
                    {episode.series_id ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {episode.series_id}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    {episode.episode_position ? (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                        {episode.episode_position}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-gray-900">
                      {episode.title || `Episode ${episode.episode_position || episode.episode_id}`}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {episode.country_code && episode.language_code ? (
                        <>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                            {episode.country_code.toUpperCase()}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                            {episode.language_code.toUpperCase()}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedAndFilteredFreeEpisodes.length === 0 && (
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
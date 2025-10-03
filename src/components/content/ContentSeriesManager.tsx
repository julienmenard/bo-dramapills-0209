import React, { useState, useEffect } from 'react';
import { Video, Search, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContentSeries {
  serie_id: number;
  title: string;
  description: string | null;
  campaign_countries_languages_id: string;
  url_covers: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignInfo {
  id: string;
  campaign_id: number;
  country_code: string | null;
}

export function ContentSeriesManager() {
  const [series, setSeries] = useState<ContentSeries[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');

  useEffect(() => {
    loadSeries();
    loadCampaigns();
  }, []);

  const loadSeries = async () => {
    console.log('🔄 Loading content series...');
    try {
      const { data, error } = await supabase
        .from('contents_series')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📊 Content series loaded:', data?.length || 0);
      setSeries(data || []);
    } catch (error) {
      console.error('❌ Error loading content series:', error);
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
  const filteredSeries = series.filter((serie) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      serie.title.toLowerCase().includes(searchLower) ||
      (serie.description || '').toLowerCase().includes(searchLower) ||
      serie.serie_id.toString().includes(searchLower) ||
      serie.campaign_countries_languages_id.toLowerCase().includes(searchLower)
    );
    const matchesCampaign = campaignFilter === 'all' || 
      serie.campaign_countries_languages_id === campaignFilter;
    
    return matchesSearch && matchesCampaign;
  });


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
            <Video className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Series</h1>
              <p className="text-gray-600">View content series information (Read Only)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search series..."
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
                series.some(s => s.campaign_countries_languages_id === campaign.id)
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
                <th className="text-left p-4 font-medium text-gray-900">Series ID</th>
                <th className="text-left p-4 font-medium text-gray-900">Title</th>
                <th className="text-left p-4 font-medium text-gray-900">Description</th>
                <th className="text-left p-4 font-medium text-gray-900">Cover</th>
                <th className="text-left p-4 font-medium text-gray-900">Campaign ID</th>
                <th className="text-left p-4 font-medium text-gray-900">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSeries.map((serie) => (
                <tr key={`${serie.serie_id}-${serie.campaign_countries_languages_id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {serie.serie_id}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-gray-900">
                      {serie.title}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-600 truncate max-w-xs">
                      {serie.description || '-'}
                    </p>
                  </td>
                  <td className="p-4">
                    {serie.url_covers ? (
                      <div className="flex items-center gap-2">
                        <img 
                          src={serie.url_covers} 
                          alt="Cover" 
                          className="w-12 h-8 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No cover</span>
                    )}
                  </td>
                  <td className="p-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      {serie.campaign_countries_languages_id}
                    </code>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(serie.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSeries.length === 0 && (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No content series found</p>
              <p className="text-sm text-gray-500 mt-1">
                {series.length === 0 ? 'No series available' : 'Try adjusting your search'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
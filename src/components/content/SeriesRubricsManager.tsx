import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Tags, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SeriesRubric {
  serie_id: number;
  id_rubric: number;
  campaign_countries_languages_id: string;
  created_at: string;
  updated_at: string;
}

interface CampaignInfo {
  id: string;
  campaign_id: number;
  country_code: string | null;
}

export function SeriesRubricsManager() {
  const [seriesRubrics, setSeriesRubrics] = useState<SeriesRubric[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');

  useEffect(() => {
    loadSeriesRubrics();
    loadCampaigns();
  }, []);

  const loadSeriesRubrics = async () => {
    console.log('🔄 Loading series rubrics...');
    try {
      const { data, error } = await supabase
        .from('contents_series_rubrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📊 Series rubrics loaded:', data?.length || 0);
      setSeriesRubrics(data || []);
    } catch (error) {
      console.error('❌ Error loading series rubrics:', error);
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
  const filteredSeriesRubrics = seriesRubrics.filter((seriesRubric) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      seriesRubric.serie_id.toString().includes(searchLower) ||
      seriesRubric.id_rubric.toString().includes(searchLower) ||
      seriesRubric.campaign_countries_languages_id.toLowerCase().includes(searchLower)
    );
    const matchesCampaign = campaignFilter === 'all' || 
      seriesRubric.campaign_countries_languages_id === campaignFilter;
    
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
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Series Rubrics</h1>
              <p className="text-gray-600">View series-rubric associations (Read Only)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search series rubrics..."
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
                seriesRubrics.some(sr => sr.campaign_countries_languages_id === campaign.id)
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
                <th className="text-left p-4 font-medium text-gray-900">Rubric ID</th>
                <th className="text-left p-4 font-medium text-gray-900">Campaign ID</th>
                <th className="text-left p-4 font-medium text-gray-900">Created</th>
                <th className="text-left p-4 font-medium text-gray-900">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSeriesRubrics.map((seriesRubric) => (
                <tr key={`${seriesRubric.serie_id}-${seriesRubric.id_rubric}-${seriesRubric.campaign_countries_languages_id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-500" />
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {seriesRubric.serie_id}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Tags className="w-4 h-4 text-purple-500" />
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                        {seriesRubric.id_rubric}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      {seriesRubric.campaign_countries_languages_id}
                    </code>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(seriesRubric.created_at)}
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(seriesRubric.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSeriesRubrics.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No series rubrics found</p>
              <p className="text-sm text-gray-500 mt-1">
                {seriesRubrics.length === 0 ? 'No series rubrics available' : 'Try adjusting your search'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
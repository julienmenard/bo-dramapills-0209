import React, { useState, useEffect } from 'react';
import { Tags, Search, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContentRubric {
  id_rubric: number;
  rubric_name: string;
  campaign_countries_languages_id: string;
  created_at: string;
  updated_at: string;
}

export function ContentRubricsManager() {
  const [rubrics, setRubrics] = useState<ContentRubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');

  useEffect(() => {
    loadRubrics();
  }, []);

  const loadRubrics = async () => {
    console.log('🔄 Loading content rubrics...');
    try {
      const { data, error } = await supabase
        .from('contents_rubrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📊 Content rubrics loaded:', data?.length || 0);
      setRubrics(data || []);
    } catch (error) {
      console.error('❌ Error loading content rubrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRubrics = rubrics.filter((rubric) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      rubric.rubric_name.toLowerCase().includes(searchLower) ||
      rubric.id_rubric.toString().includes(searchLower) ||
      rubric.campaign_countries_languages_id.toLowerCase().includes(searchLower)
    );
    const matchesCampaign = campaignFilter === 'all' || 
      rubric.campaign_countries_languages_id === campaignFilter;
    
    return matchesSearch && matchesCampaign;
  });

  const uniqueCampaigns = [...new Set(rubrics.map(r => r.campaign_countries_languages_id))];

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
            <Tags className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Rubrics</h1>
              <p className="text-gray-600">View content rubrics and categories (Read Only)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search rubrics..."
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
                <th className="text-left p-4 font-medium text-gray-900">Rubric ID</th>
                <th className="text-left p-4 font-medium text-gray-900">Name</th>
                <th className="text-left p-4 font-medium text-gray-900">Campaign ID</th>
                <th className="text-left p-4 font-medium text-gray-900">Created</th>
                <th className="text-left p-4 font-medium text-gray-900">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRubrics.map((rubric) => (
                <tr key={`${rubric.id_rubric}-${rubric.campaign_countries_languages_id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                      {rubric.id_rubric}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-gray-900">
                      {rubric.rubric_name}
                    </span>
                  </td>
                  <td className="p-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      {rubric.campaign_countries_languages_id}
                    </code>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(rubric.created_at)}
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(rubric.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRubrics.length === 0 && (
            <div className="text-center py-12">
              <Tags className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No content rubrics found</p>
              <p className="text-sm text-gray-500 mt-1">
                {rubrics.length === 0 ? 'No rubrics available' : 'Try adjusting your search'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Globe, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CampaignCountryLanguage {
  id: string;
  campaign_id: number;
  country_code: string | null;
  language_code: string | null;
  created_at: string;
}

interface TroupleFormData {
  campaign_id: number;
  country_code: string;
  language_code: string;
}

export function TroupleManager() {
  const [trouples, setTrouples] = useState<CampaignCountryLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrouple, setEditingTrouple] = useState<CampaignCountryLanguage | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<TroupleFormData>({
    campaign_id: 0,
    country_code: '',
    language_code: '',
  });

  const commonCountries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'IN', name: 'India' },
  ];

  const commonLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
  ];

  useEffect(() => {
    loadTrouples();
  }, []);

  const loadTrouples = async () => {
    console.log('🔄 Loading trouples...');
    try {
      const { data, error } = await supabase
        .from('campaign_countries_languages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📊 Trouples loaded:', data?.length || 0);
      setTrouples(data || []);
    } catch (error) {
      console.error('❌ Error loading trouples:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 Saving trouple:', formData);
    setSaving(true);

    try {
      if (editingTrouple) {
        console.log('✏️ Updating existing trouple:', editingTrouple.id);
        const { error } = await supabase
          .from('campaign_countries_languages')
          .update(formData)
          .eq('id', editingTrouple.id);

        if (error) throw error;
        console.log('✅ Trouple updated successfully');
      } else {
        console.log('➕ Creating new trouple');
        const { error } = await supabase
          .from('campaign_countries_languages')
          .insert(formData);

        if (error) throw error;
        console.log('✅ Trouple created successfully');
      }

      console.log('🔄 Reloading data after save...');
      await loadTrouples();
      console.log('✅ Data reloaded successfully');
      resetForm();
    } catch (error) {
      console.error('❌ Error saving trouple:', error);
      alert('Error saving trouple. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trouple?')) {
      return;
    }

    console.log('🗑️ Deleting trouple:', id);
    try {
      const { error } = await supabase
        .from('campaign_countries_languages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('✅ Trouple deleted successfully');
      console.log('🔄 Reloading data after delete...');
      await loadTrouples();
      console.log('✅ Data reloaded successfully');
    } catch (error) {
      console.error('❌ Error deleting trouple:', error);
      alert('Error deleting trouple. Please try again.');
    }
  };

  const handleEdit = (trouple: CampaignCountryLanguage) => {
    setFormData({
      campaign_id: trouple.campaign_id,
      country_code: trouple.country_code || '',
      language_code: trouple.language_code || '',
    });
    setEditingTrouple(trouple);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      campaign_id: 0,
      country_code: '',
      language_code: '',
    });
    setEditingTrouple(null);
    setShowForm(false);
  };

  const getCountryName = (code: string | null) => {
    if (!code) return '-';
    const country = commonCountries.find(c => c.code === code);
    return country ? country.name : code.toUpperCase();
  };

  const getLanguageName = (code: string | null) => {
    if (!code) return '-';
    const language = commonLanguages.find(l => l.code === code);
    return language ? language.name : code.toUpperCase();
  };

  const filteredTrouples = trouples.filter((trouple) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      trouple.campaign_id.toString().includes(searchLower) ||
      (trouple.country_code || '').toLowerCase().includes(searchLower) ||
      (trouple.language_code || '').toLowerCase().includes(searchLower) ||
      getCountryName(trouple.country_code).toLowerCase().includes(searchLower) ||
      getLanguageName(trouple.language_code).toLowerCase().includes(searchLower)
    );
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
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trouple Management</h1>
              <p className="text-gray-600">Manage campaign countries and languages combinations</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Trouple
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trouples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">Campaign ID</th>
                <th className="text-left p-4 font-medium text-gray-900">Country</th>
                <th className="text-left p-4 font-medium text-gray-900">Language</th>
                <th className="text-left p-4 font-medium text-gray-900">Created</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTrouples.map((trouple) => (
                <tr key={trouple.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {trouple.campaign_id}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {getCountryName(trouple.country_code)}
                      </span>
                      {trouple.country_code && (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {trouple.country_code}
                        </code>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {getLanguageName(trouple.language_code)}
                      </span>
                      {trouple.language_code && (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {trouple.language_code}
                        </code>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(trouple.created_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(trouple)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit trouple"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(trouple.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete trouple"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTrouples.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No trouples found</p>
              <p className="text-sm text-gray-500 mt-1">
                {trouples.length === 0 ? 'Create your first trouple' : 'Try adjusting your search'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTrouple ? 'Edit Trouple' : 'Add New Trouple'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label htmlFor="campaign_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign ID *
                  </label>
                  <input
                    type="number"
                    id="campaign_id"
                    value={formData.campaign_id}
                    onChange={(e) => setFormData({ ...formData, campaign_id: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter campaign ID"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="country_code" className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      id="country_code"
                      value={formData.country_code}
                      onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select country...</option>
                      {commonCountries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="language_code" className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      id="language_code"
                      value={formData.language_code}
                      onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select language...</option>
                      {commonLanguages.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.name} ({language.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingTrouple ? 'Update Trouple' : 'Create Trouple'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
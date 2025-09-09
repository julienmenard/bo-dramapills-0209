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

  const allCountries = [
    { code: 'ad', name: 'Andorra' },
    { code: 'ae', name: 'United Arab Emirates' },
    { code: 'af', name: 'Afghanistan' },
    { code: 'ag', name: 'Antigua and Barbuda' },
    { code: 'ai', name: 'Anguilla' },
    { code: 'al', name: 'Albania' },
    { code: 'am', name: 'Armenia' },
    { code: 'ao', name: 'Angola' },
    { code: 'aq', name: 'Antarctica' },
    { code: 'ar', name: 'Argentina' },
    { code: 'as', name: 'American Samoa' },
    { code: 'at', name: 'Austria' },
    { code: 'au', name: 'Australia' },
    { code: 'aw', name: 'Aruba' },
    { code: 'ax', name: 'Åland Islands' },
    { code: 'az', name: 'Azerbaijan' },
    { code: 'ba', name: 'Bosnia and Herzegovina' },
    { code: 'bb', name: 'Barbados' },
    { code: 'bd', name: 'Bangladesh' },
    { code: 'be', name: 'Belgium' },
    { code: 'bf', name: 'Burkina Faso' },
    { code: 'bg', name: 'Bulgaria' },
    { code: 'bh', name: 'Bahrain' },
    { code: 'bi', name: 'Burundi' },
    { code: 'bj', name: 'Benin' },
    { code: 'bl', name: 'Saint Barthélemy' },
    { code: 'bm', name: 'Bermuda' },
    { code: 'bn', name: 'Brunei' },
    { code: 'bo', name: 'Bolivia' },
    { code: 'bq', name: 'Caribbean Netherlands' },
    { code: 'br', name: 'Brazil' },
    { code: 'bs', name: 'Bahamas' },
    { code: 'bt', name: 'Bhutan' },
    { code: 'bv', name: 'Bouvet Island' },
    { code: 'bw', name: 'Botswana' },
    { code: 'by', name: 'Belarus' },
    { code: 'bz', name: 'Belize' },
    { code: 'ca', name: 'Canada' },
    { code: 'cc', name: 'Cocos Islands' },
    { code: 'cd', name: 'Democratic Republic of the Congo' },
    { code: 'cf', name: 'Central African Republic' },
    { code: 'cg', name: 'Republic of the Congo' },
    { code: 'ch', name: 'Switzerland' },
    { code: 'ci', name: 'Côte d\'Ivoire' },
    { code: 'ck', name: 'Cook Islands' },
    { code: 'cl', name: 'Chile' },
    { code: 'cm', name: 'Cameroon' },
    { code: 'cn', name: 'China' },
    { code: 'co', name: 'Colombia' },
    { code: 'cr', name: 'Costa Rica' },
    { code: 'cu', name: 'Cuba' },
    { code: 'cv', name: 'Cape Verde' },
    { code: 'cw', name: 'Curaçao' },
    { code: 'cx', name: 'Christmas Island' },
    { code: 'cy', name: 'Cyprus' },
    { code: 'cz', name: 'Czech Republic' },
    { code: 'de', name: 'Germany' },
    { code: 'dj', name: 'Djibouti' },
    { code: 'dk', name: 'Denmark' },
    { code: 'dm', name: 'Dominica' },
    { code: 'do', name: 'Dominican Republic' },
    { code: 'dz', name: 'Algeria' },
    { code: 'ec', name: 'Ecuador' },
    { code: 'ee', name: 'Estonia' },
    { code: 'eg', name: 'Egypt' },
    { code: 'eh', name: 'Western Sahara' },
    { code: 'er', name: 'Eritrea' },
    { code: 'es', name: 'Spain' },
    { code: 'et', name: 'Ethiopia' },
    { code: 'fi', name: 'Finland' },
    { code: 'fj', name: 'Fiji' },
    { code: 'fk', name: 'Falkland Islands' },
    { code: 'fm', name: 'Micronesia' },
    { code: 'fo', name: 'Faroe Islands' },
    { code: 'fr', name: 'France' },
    { code: 'ga', name: 'Gabon' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'gd', name: 'Grenada' },
    { code: 'ge', name: 'Georgia' },
    { code: 'gf', name: 'French Guiana' },
    { code: 'gg', name: 'Guernsey' },
    { code: 'gh', name: 'Ghana' },
    { code: 'gi', name: 'Gibraltar' },
    { code: 'gl', name: 'Greenland' },
    { code: 'gm', name: 'Gambia' },
    { code: 'gn', name: 'Guinea' },
    { code: 'gp', name: 'Guadeloupe' },
    { code: 'gq', name: 'Equatorial Guinea' },
    { code: 'gr', name: 'Greece' },
    { code: 'gs', name: 'South Georgia' },
    { code: 'gt', name: 'Guatemala' },
    { code: 'gu', name: 'Guam' },
    { code: 'gw', name: 'Guinea-Bissau' },
    { code: 'gy', name: 'Guyana' },
    { code: 'hk', name: 'Hong Kong' },
    { code: 'hm', name: 'Heard Island' },
    { code: 'hn', name: 'Honduras' },
    { code: 'hr', name: 'Croatia' },
    { code: 'ht', name: 'Haiti' },
    { code: 'hu', name: 'Hungary' },
    { code: 'id', name: 'Indonesia' },
    { code: 'ie', name: 'Ireland' },
    { code: 'il', name: 'Israel' },
    { code: 'im', name: 'Isle of Man' },
    { code: 'in', name: 'India' },
    { code: 'io', name: 'British Indian Ocean Territory' },
    { code: 'iq', name: 'Iraq' },
    { code: 'ir', name: 'Iran' },
    { code: 'is', name: 'Iceland' },
    { code: 'it', name: 'Italy' },
    { code: 'je', name: 'Jersey' },
    { code: 'jm', name: 'Jamaica' },
    { code: 'jo', name: 'Jordan' },
    { code: 'jp', name: 'Japan' },
    { code: 'ke', name: 'Kenya' },
    { code: 'kg', name: 'Kyrgyzstan' },
    { code: 'kh', name: 'Cambodia' },
    { code: 'ki', name: 'Kiribati' },
    { code: 'km', name: 'Comoros' },
    { code: 'kn', name: 'Saint Kitts and Nevis' },
    { code: 'kp', name: 'North Korea' },
    { code: 'kr', name: 'South Korea' },
    { code: 'kw', name: 'Kuwait' },
    { code: 'ky', name: 'Cayman Islands' },
    { code: 'kz', name: 'Kazakhstan' },
    { code: 'la', name: 'Laos' },
    { code: 'lb', name: 'Lebanon' },
    { code: 'lc', name: 'Saint Lucia' },
    { code: 'li', name: 'Liechtenstein' },
    { code: 'lk', name: 'Sri Lanka' },
    { code: 'lr', name: 'Liberia' },
    { code: 'ls', name: 'Lesotho' },
    { code: 'lt', name: 'Lithuania' },
    { code: 'lu', name: 'Luxembourg' },
    { code: 'lv', name: 'Latvia' },
    { code: 'ly', name: 'Libya' },
    { code: 'ma', name: 'Morocco' },
    { code: 'mc', name: 'Monaco' },
    { code: 'md', name: 'Moldova' },
    { code: 'me', name: 'Montenegro' },
    { code: 'mf', name: 'Saint Martin' },
    { code: 'mg', name: 'Madagascar' },
    { code: 'mh', name: 'Marshall Islands' },
    { code: 'mk', name: 'North Macedonia' },
    { code: 'ml', name: 'Mali' },
    { code: 'mm', name: 'Myanmar' },
    { code: 'mn', name: 'Mongolia' },
    { code: 'mo', name: 'Macao' },
    { code: 'mp', name: 'Northern Mariana Islands' },
    { code: 'mq', name: 'Martinique' },
    { code: 'mr', name: 'Mauritania' },
    { code: 'ms', name: 'Montserrat' },
    { code: 'mt', name: 'Malta' },
    { code: 'mu', name: 'Mauritius' },
    { code: 'mv', name: 'Maldives' },
    { code: 'mw', name: 'Malawi' },
    { code: 'mx', name: 'Mexico' },
    { code: 'my', name: 'Malaysia' },
    { code: 'mz', name: 'Mozambique' },
    { code: 'na', name: 'Namibia' },
    { code: 'nc', name: 'New Caledonia' },
    { code: 'ne', name: 'Niger' },
    { code: 'nf', name: 'Norfolk Island' },
    { code: 'ng', name: 'Nigeria' },
    { code: 'ni', name: 'Nicaragua' },
    { code: 'nl', name: 'Netherlands' },
    { code: 'no', name: 'Norway' },
    { code: 'np', name: 'Nepal' },
    { code: 'nr', name: 'Nauru' },
    { code: 'nu', name: 'Niue' },
    { code: 'nz', name: 'New Zealand' },
    { code: 'om', name: 'Oman' },
    { code: 'pa', name: 'Panama' },
    { code: 'pe', name: 'Peru' },
    { code: 'pf', name: 'French Polynesia' },
    { code: 'pg', name: 'Papua New Guinea' },
    { code: 'ph', name: 'Philippines' },
    { code: 'pk', name: 'Pakistan' },
    { code: 'pl', name: 'Poland' },
    { code: 'pm', name: 'Saint Pierre and Miquelon' },
    { code: 'pn', name: 'Pitcairn Islands' },
    { code: 'pr', name: 'Puerto Rico' },
    { code: 'ps', name: 'Palestine' },
    { code: 'pt', name: 'Portugal' },
    { code: 'pw', name: 'Palau' },
    { code: 'py', name: 'Paraguay' },
    { code: 'qa', name: 'Qatar' },
    { code: 're', name: 'Réunion' },
    { code: 'ro', name: 'Romania' },
    { code: 'rs', name: 'Serbia' },
    { code: 'ru', name: 'Russia' },
    { code: 'rw', name: 'Rwanda' },
    { code: 'sa', name: 'Saudi Arabia' },
    { code: 'sb', name: 'Solomon Islands' },
    { code: 'sc', name: 'Seychelles' },
    { code: 'sd', name: 'Sudan' },
    { code: 'se', name: 'Sweden' },
    { code: 'sg', name: 'Singapore' },
    { code: 'sh', name: 'Saint Helena' },
    { code: 'si', name: 'Slovenia' },
    { code: 'sj', name: 'Svalbard and Jan Mayen' },
    { code: 'sk', name: 'Slovakia' },
    { code: 'sl', name: 'Sierra Leone' },
    { code: 'sm', name: 'San Marino' },
    { code: 'sn', name: 'Senegal' },
    { code: 'so', name: 'Somalia' },
    { code: 'sr', name: 'Suriname' },
    { code: 'ss', name: 'South Sudan' },
    { code: 'st', name: 'São Tomé and Príncipe' },
    { code: 'sv', name: 'El Salvador' },
    { code: 'sx', name: 'Sint Maarten' },
    { code: 'sy', name: 'Syria' },
    { code: 'sz', name: 'Eswatini' },
    { code: 'tc', name: 'Turks and Caicos Islands' },
    { code: 'td', name: 'Chad' },
    { code: 'tf', name: 'French Southern Territories' },
    { code: 'tg', name: 'Togo' },
    { code: 'th', name: 'Thailand' },
    { code: 'tj', name: 'Tajikistan' },
    { code: 'tk', name: 'Tokelau' },
    { code: 'tl', name: 'Timor-Leste' },
    { code: 'tm', name: 'Turkmenistan' },
    { code: 'tn', name: 'Tunisia' },
    { code: 'to', name: 'Tonga' },
    { code: 'tr', name: 'Turkey' },
    { code: 'tt', name: 'Trinidad and Tobago' },
    { code: 'tv', name: 'Tuvalu' },
    { code: 'tw', name: 'Taiwan' },
    { code: 'tz', name: 'Tanzania' },
    { code: 'ua', name: 'Ukraine' },
    { code: 'ug', name: 'Uganda' },
    { code: 'um', name: 'U.S. Minor Outlying Islands' },
    { code: 'us', name: 'United States' },
    { code: 'uy', name: 'Uruguay' },
    { code: 'uz', name: 'Uzbekistan' },
    { code: 'va', name: 'Vatican City' },
    { code: 'vc', name: 'Saint Vincent and the Grenadines' },
    { code: 've', name: 'Venezuela' },
    { code: 'vg', name: 'British Virgin Islands' },
    { code: 'vi', name: 'U.S. Virgin Islands' },
    { code: 'vn', name: 'Vietnam' },
    { code: 'vu', name: 'Vanuatu' },
    { code: 'wf', name: 'Wallis and Futuna' },
    { code: 'ws', name: 'Samoa' },
    { code: 'ye', name: 'Yemen' },
    { code: 'yt', name: 'Mayotte' },
    { code: 'za', name: 'South Africa' },
    { code: 'zm', name: 'Zambia' },
    { code: 'zw', name: 'Zimbabwe' },
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
        // Convert codes to lowercase before saving
        const updateData = {
          ...formData,
          country_code: formData.country_code.toLowerCase(),
          language_code: formData.language_code.toLowerCase(),
        };
        const { error } = await supabase
          .from('campaign_countries_languages')
          .update(updateData)
          .eq('id', editingTrouple.id);

        if (error) throw error;
        console.log('✅ Trouple updated successfully');
      } else {
        console.log('➕ Creating new trouple');
        // Convert codes to lowercase before saving
        const insertData = {
          ...formData,
          country_code: formData.country_code.toLowerCase(),
          language_code: formData.language_code.toLowerCase(),
        };
        const { error } = await supabase
          .from('campaign_countries_languages')
          .insert(insertData);

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
    if (!confirm('Are you sure you want to delete this trouple? This will also delete ALL related content (series, episodes, rubrics, etc.) for this campaign. This action cannot be undone.')) {
      return;
    }

    console.log('🗑️ Deleting trouple:', id);
    try {
      // First, delete all related content based on campaign_countries_languages_id
      console.log('🗑️ Deleting related content for trouple:', id);
      
      // Delete from contents_series_rubrics
      const { error: seriesRubricsError } = await supabase
        .from('contents_series_rubrics')
        .delete()
        .eq('campaign_countries_languages_id', id);
      
      if (seriesRubricsError) {
        console.error('Error deleting series rubrics:', seriesRubricsError);
        throw seriesRubricsError;
      }
      console.log('✅ Deleted related series rubrics');

      // Delete from contents_rubrics
      const { error: rubricsError } = await supabase
        .from('contents_rubrics')
        .delete()
        .eq('campaign_countries_languages_id', id);
      
      if (rubricsError) {
        console.error('Error deleting rubrics:', rubricsError);
        throw rubricsError;
      }
      console.log('✅ Deleted related rubrics');

      // Delete from contents_series_episodes_free
      const { error: freeEpisodesError } = await supabase
        .from('contents_series_episodes_free')
        .delete()
        .eq('campaign_countries_languages_id', id);
      
      if (freeEpisodesError) {
        console.error('Error deleting free episodes:', freeEpisodesError);
        throw freeEpisodesError;
      }
      console.log('✅ Deleted related free episodes');

      // Delete from contents_series_episodes
      const { error: episodesError } = await supabase
        .from('contents_series_episodes')
        .delete()
        .eq('campaign_countries_languages_id', id);
      
      if (episodesError) {
        console.error('Error deleting series episodes:', episodesError);
        throw episodesError;
      }
      console.log('✅ Deleted related series episodes');

      // Delete from contents_series
      const { error: seriesError } = await supabase
        .from('contents_series')
        .delete()
        .eq('campaign_countries_languages_id', id);
      
      if (seriesError) {
        console.error('Error deleting series:', seriesError);
        throw seriesError;
      }
      console.log('✅ Deleted related series');

      // Finally, delete the trouple itself
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
      alert('Error deleting trouple and related content. Please try again.');
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
    const country = allCountries.find(c => c.code === code.toLowerCase());
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
                      {allCountries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.code.toUpperCase()})
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
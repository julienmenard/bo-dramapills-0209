import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Languages, Search, Filter, Globe, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GamificationEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  is_active: boolean;
}

interface EventTranslation {
  id: string;
  event_id: string;
  language_code: string;
  title: string;
  description: string;
  message: string;
  created_at: string;
  updated_at: string;
}

interface TranslationFormData {
  event_id: string;
  language_code: string;
  title: string;
  description: string;
  message: string;
}

interface BulkTranslationData {
  [eventId: string]: {
    es?: { title: string; description: string; message: string };
    'pt-BR'?: { title: string; description: string; message: string };
    de?: { title: string; description: string; message: string };
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export function EventTranslationsManager() {
  const [events, setEvents] = useState<GamificationEvent[]>([]);
  const [translations, setTranslations] = useState<EventTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<EventTranslation | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [bulkTranslations, setBulkTranslations] = useState<BulkTranslationData>({});

  const [formData, setFormData] = useState<TranslationFormData>({
    event_id: '',
    language_code: '',
    title: '',
    description: '',
    message: '',
  });

  const commonLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pt-BR', name: 'Brazilian Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
  ];

  const bulkLanguages = [
    { code: 'es', name: 'Spanish' },
    { code: 'pt-BR', name: 'Brazilian Portuguese' },
    { code: 'de', name: 'German' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const loadData = async () => {
    console.log('🔄 Loading translations data...');
    setLoading(true);
    try {
      // Load events
      const { data: eventsData, error: eventsError } = await supabase
        .from('gamification_events')
        .select('id, event_type, is_active')
        .order('event_position', { ascending: true });

      console.log('📊 Events loaded:', eventsData?.length || 0);
      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Load translations
      const { data: translationsData, error: translationsError } = await supabase
        .from('gamification_event_translations')
        .select('*')
        .order('updated_at', { ascending: false });

      console.log('🌐 Translations loaded:', translationsData?.length || 0);
      if (translationsError) throw translationsError;
      setTranslations(translationsData || []);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      console.error('Error loading data:', error);
      addNotification('error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 Saving translation:', formData);
    setSaving(true);

    try {
      if (editingTranslation) {
        console.log('✏️ Updating existing translation:', editingTranslation.id);
        const { error } = await supabase
          .from('gamification_event_translations')
          .update(formData)
          .eq('id', editingTranslation.id);

        if (error) throw error;
        console.log('✅ Translation updated successfully');
        addNotification('success', 'Translation updated successfully');
      } else {
        console.log('➕ Creating new translation');
        const { error } = await supabase
          .from('gamification_event_translations')
          .insert(formData);

        if (error) throw error;
        console.log('✅ Translation created successfully');
        addNotification('success', 'Translation created successfully');
      }

      console.log('🔄 Reloading data after save...');
      await loadData();
      console.log('✅ Data reloaded successfully');
      resetForm();
    } catch (error) {
      console.error('❌ Error saving translation:', error);
      console.error('Error saving translation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification('error', `Failed to save translation: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this translation?')) {
      return;
    }

    console.log('🗑️ Deleting translation:', id);
    try {
      const { error } = await supabase
        .from('gamification_event_translations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('✅ Translation deleted successfully');
      addNotification('success', 'Translation deleted successfully');
      console.log('🔄 Reloading data after delete...');
      await loadData();
      console.log('✅ Data reloaded successfully');
    } catch (error) {
      console.error('❌ Error deleting translation:', error);
      console.error('Error deleting translation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification('error', `Failed to delete translation: ${errorMessage}`);
    }
  };

  const handleBulkSave = async () => {
    console.log('💾 Bulk saving translations...');
    setBulkSaving(true);

    try {
      const translationsToInsert = [];

      // Prepare all translations for bulk insert
      for (const [eventId, eventTranslations] of Object.entries(bulkTranslations)) {
        for (const [languageCode, translation] of Object.entries(eventTranslations)) {
          if (translation && translation.title && translation.description && translation.message) {
            // Check if translation already exists
            const existingTranslation = translations.find(
              t => t.event_id === eventId && t.language_code === languageCode
            );

            if (!existingTranslation) {
              translationsToInsert.push({
                event_id: eventId,
                language_code: languageCode,
                title: translation.title,
                description: translation.description,
                message: translation.message,
              });
            }
          }
        }
      }

      if (translationsToInsert.length === 0) {
        addNotification('error', 'No new translations to save. Please fill in at least one complete translation.');
        setBulkSaving(false);
        return;
      }

      console.log(`➕ Inserting ${translationsToInsert.length} translations...`);
      const { error } = await supabase
        .from('gamification_event_translations')
        .insert(translationsToInsert);

      if (error) throw error;

      console.log('✅ Bulk translations saved successfully');
      addNotification('success', `Successfully added ${translationsToInsert.length} translations`);
      
      // Reload data and reset form
      await loadData();
      setBulkTranslations({});
      setShowBulkForm(false);
    } catch (error) {
      console.error('❌ Error bulk saving translations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification('error', `Failed to save translations: ${errorMessage}`);
    } finally {
      setBulkSaving(false);
    }
  };

  const updateBulkTranslation = (eventId: string, languageCode: string, field: string, value: string) => {
    setBulkTranslations(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [languageCode]: {
          ...prev[eventId]?.[languageCode],
          [field]: value,
        },
      },
    }));
  };

  const getEventsWithoutTranslations = () => {
    return events.filter(event => {
      const existingLanguages = translations
        .filter(t => t.event_id === event.id)
        .map(t => t.language_code);
      
      // Return events that don't have all 3 target languages
      return bulkLanguages.some(lang => !existingLanguages.includes(lang.code));
    });
  };

  const handleEdit = (translation: EventTranslation) => {
    setFormData({
      event_id: translation.event_id,
      language_code: translation.language_code,
      title: translation.title,
      description: translation.description,
      message: translation.message,
    });
    setEditingTranslation(translation);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      event_id: '',
      language_code: '',
      title: '',
      description: '',
      message: '',
    });
    setEditingTranslation(null);
    setShowForm(false);
  };

  const getEventTitle = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.event_type : 'Unknown Event';
  };

  const getLanguageName = (code: string) => {
    const language = commonLanguages.find(l => l.code === code);
    return language ? language.name : code.toUpperCase();
  };

  const filteredTranslations = translations.filter((translation) => {
    const event = events.find(e => e.id === translation.event_id);
    const eventTitle = event ? event.title : '';
    
    const matchesSearch = 
      translation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.language_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEvent = eventFilter === 'all' || translation.event_id === eventFilter;
    const matchesLanguage = languageFilter === 'all' || translation.language_code === languageFilter;
    
    return matchesSearch && matchesEvent && matchesLanguage;
  });

  const usedLanguages = [...new Set(translations.map(t => t.language_code))];

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
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Languages className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Translations</h1>
              <p className="text-gray-600">Manage multilingual content for gamification events</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Translation
            </button>
            <button
              onClick={() => setShowBulkForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Bulk Add Translations
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search translations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Languages</option>
              {usedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {getLanguageName(lang)}
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
                <th className="text-left p-4 font-medium text-gray-900">Event</th>
                <th className="text-left p-4 font-medium text-gray-900">Language</th>
                <th className="text-left p-4 font-medium text-gray-900">Title</th>
                <th className="text-left p-4 font-medium text-gray-900">Description</th>
                <th className="text-left p-4 font-medium text-gray-900">Message</th>
                <th className="text-left p-4 font-medium text-gray-900">Updated</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTranslations.map((translation) => (
                <tr key={translation.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">
                      {getEventTitle(translation.event_id)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {getLanguageName(translation.language_code)}
                      </span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {translation.language_code}
                      </code>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900 truncate max-w-xs">
                      {translation.title}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-600 truncate max-w-xs">
                      {translation.description}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-600 truncate max-w-xs">
                      {translation.message}
                    </p>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(translation.updated_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(translation)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit translation"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(translation.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete translation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTranslations.length === 0 && (
            <div className="text-center py-12">
              <Languages className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No translations found</p>
              <p className="text-sm text-gray-500 mt-1">
                {translations.length === 0 ? 'Create your first translation' : 'Try adjusting your filters'}
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
                {editingTranslation ? 'Edit Translation' : 'Add New Translation'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event_id" className="block text-sm font-medium text-gray-700 mb-2">
                      Event *
                    </label>
                    <select
                      id="event_id"
                      value={formData.event_id}
                      onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                      required
                      disabled={!!editingTranslation}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select an event...</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.event_type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="language_code" className="block text-sm font-medium text-gray-700 mb-2">
                      Language *
                    </label>
                    <select
                      id="language_code"
                      value={formData.language_code}
                      onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                      required
                      disabled={!!editingTranslation}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select language...</option>
                      {commonLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name} ({lang.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter translated title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter translated description"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter translated message shown to users"
                  />
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
                  {editingTranslation ? 'Update Translation' : 'Create Translation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Bulk Add Translations</h2>
                <p className="text-sm text-gray-600 mt-1">Add Spanish, Brazilian Portuguese, and German translations for existing events</p>
              </div>
              <button
                onClick={() => {
                  setShowBulkForm(false);
                  setBulkTranslations({});
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-8">
                {getEventsWithoutTranslations().length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">All events already have translations for the target languages</p>
                    <p className="text-sm text-gray-500 mt-1">Spanish, Brazilian Portuguese, and German translations are complete</p>
                  </div>
                ) : (
                  getEventsWithoutTranslations().map((event) => {
                    const existingLanguages = translations
                      .filter(t => t.event_id === event.id)
                      .map(t => t.language_code);
                    
                    const missingLanguages = bulkLanguages.filter(lang => !existingLanguages.includes(lang.code));

                    return (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{event.event_type}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {existingLanguages.map(lang => (
                              <span key={lang} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                {getLanguageName(lang)} ✓
                              </span>
                            ))}
                            {missingLanguages.map(lang => (
                              <span key={lang.code} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                {lang.name} (missing)
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {missingLanguages.map((language) => (
                            <div key={language.code} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4 text-blue-600" />
                                <h4 className="font-medium text-gray-900">{language.name}</h4>
                                <code className="bg-gray-200 px-2 py-1 rounded text-xs">{language.code}</code>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={bulkTranslations[event.id]?.[language.code]?.title || ''}
                                    onChange={(e) => updateBulkTranslation(event.id, language.code, 'title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter title"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                  <textarea
                                    value={bulkTranslations[event.id]?.[language.code]?.description || ''}
                                    onChange={(e) => updateBulkTranslation(event.id, language.code, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    placeholder="Enter description"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                                  <textarea
                                    value={bulkTranslations[event.id]?.[language.code]?.message || ''}
                                    onChange={(e) => updateBulkTranslation(event.id, language.code, 'message', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    placeholder="Enter user message"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {getEventsWithoutTranslations().length > 0 && (
                  <>Fill in the translations above and click "Save All Translations" to add them.</>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkForm(false);
                    setBulkTranslations({});
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Cancel
                </button>
                {getEventsWithoutTranslations().length > 0 && (
                  <button
                    onClick={handleBulkSave}
                    disabled={bulkSaving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    {bulkSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save All Translations
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
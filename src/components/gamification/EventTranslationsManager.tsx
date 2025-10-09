import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, Languages, Search, Filter, Globe, CheckCircle, AlertCircle, ChevronUp, ChevronDown, Wand2, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TranslationService, SUPPORTED_LANGUAGES } from '../../lib/translationService';

interface GamificationEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  is_active: boolean;
  event_type_category: string | null;
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
  translation_status: 'auto' | 'manual' | 'pending';
  batch_id: string | null;
}

interface EventCategory {
  id: string;
  name: string;
  category_position: number;
}

interface TranslationFormData {
  event_id: string;
  language_code: string;
  title: string;
  description: string;
  message: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export function EventTranslationsManager() {
  const [events, setEvents] = useState<GamificationEvent[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [translations, setTranslations] = useState<EventTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<EventTranslation | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [autoTranslating, setAutoTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });

  const [sortColumn, setSortColumn] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [formData, setFormData] = useState<TranslationFormData>({
    event_id: '',
    language_code: '',
    title: '',
    description: '',
    message: '',
  });

  const translationService = TranslationService.getInstance();

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

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortData = (data: EventTranslation[]) => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'event':
          aValue = getEventTitle(a.event_id).toLowerCase();
          bValue = getEventTitle(b.event_id).toLowerCase();
          break;
        case 'language':
          aValue = getLanguageName(a.language_code).toLowerCase();
          bValue = getLanguageName(b.language_code).toLowerCase();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'message':
          aValue = a.message.toLowerCase();
          bValue = b.message.toLowerCase();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
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

  const loadData = async () => {
    console.log('🔄 Loading translations data...');
    setLoading(true);
    try {
      // Load events
      const { data: eventsData, error: eventsError } = await supabase
        .from('gamification_events')
        .select('id, event_type, is_active, event_type_category')
        .order('event_position', { ascending: true });

      console.log('📊 Events loaded:', eventsData?.length || 0);
      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Load event categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('event_categories')
        .select('id, name, category_position')
        .order('category_position', { ascending: true });

      console.log('📋 Event categories loaded:', categoriesData?.length || 0);
      if (categoriesError) throw categoriesError;
      setEventCategories(categoriesData || []);

      // Load translations
      const { data: translationsData, error: translationsError } = await supabase
        .from('gamification_event_translations')
        .select('*, translation_status, batch_id')
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
        
        // Update status to manual when user edits
        if (editingTranslation) {
          await supabase
            .from('gamification_event_translations')
            .update({ translation_status: 'manual' })
            .eq('id', editingTranslation.id);
        }
      } else {
        console.log('➕ Creating new translation');
        const { error } = await supabase 
          .from('gamification_event_translations')
          .insert({
            ...formData,
            translation_status: 'manual'
          });

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

  const handleBulkDeleteEnglish = async () => {
    const englishTranslations = translations.filter(t => t.language_code === 'en');
    
    if (englishTranslations.length === 0) {
      addNotification('error', 'No English translations found to delete.');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${englishTranslations.length} English translations? This action cannot be undone.`)) {
      return;
    }

    console.log('🗑️ Bulk deleting English translations:', englishTranslations.length);
    setBulkDeleting(true);

    try {
      const { error } = await supabase
        .from('gamification_event_translations')
        .delete()
        .eq('language_code', 'en');

      if (error) throw error;
      
      console.log('✅ English translations deleted successfully');
      addNotification('success', `Successfully deleted ${englishTranslations.length} English translations`);
      console.log('🔄 Reloading data after bulk delete...');
      await loadData();
      console.log('✅ Data reloaded successfully');
    } catch (error) {
      console.error('❌ Error bulk deleting English translations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification('error', `Failed to delete English translations: ${errorMessage}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleAutoTranslateAll = async () => {
    if (!confirm('This will automatically translate all existing events into 30 languages. This may take several minutes. Continue?')) {
      return;
    }

    console.log('🎯 Starting automatic translation for all events...');
    setAutoTranslating(true);
    setTranslationProgress({ current: 0, total: 0 });

    try {
      const batchId = crypto.randomUUID();
      const translationsToCreate = [];
      
      // Calculate total translations needed
      const totalNeeded = events.length * SUPPORTED_LANGUAGES.length;
      setTranslationProgress({ current: 0, total: totalNeeded });

      for (const event of events) {
        for (const language of SUPPORTED_LANGUAGES) {
          // Skip if translation already exists
          const existingTranslation = translations.find(
            t => t.event_id === event.id && t.language_code === language.code
          );
          
          if (existingTranslation) {
            setTranslationProgress(prev => ({ ...prev, current: prev.current + 1 }));
            continue;
          }

          try {
            console.log(`🔄 Translating ${event.event_type} to ${language.name}...`);
            
            // Create mock translations for demonstration
            // In production, you would call the real translation service
            const titleTranslation = await translationService.translateText({
              text: event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              targetLanguage: language.code,
              sourceLanguage: 'en'
            });

            const descriptionTranslation = await translationService.translateText({
              text: `Complete the ${event.event_type.replace(/_/g, ' ')} action to earn rewards`,
              targetLanguage: language.code,
              sourceLanguage: 'en'
            });

            const messageTranslation = await translationService.translateText({
              text: `Congratulations! You've completed ${event.event_type.replace(/_/g, ' ')}`,
              targetLanguage: language.code,
              sourceLanguage: 'en'
            });

            translationsToCreate.push({
              event_id: event.id,
              language_code: language.code,
              title: titleTranslation.translatedText,
              description: descriptionTranslation.translatedText,
              message: messageTranslation.translatedText,
              translation_status: 'auto',
              batch_id: batchId
            });

            setTranslationProgress(prev => ({ ...prev, current: prev.current + 1 }));
            
            // Small delay to prevent overwhelming the UI
            await new Promise(resolve => setTimeout(resolve, 10));

          } catch (error) {
            console.error(`❌ Error translating ${event.event_type} to ${language.name}:`, error);
            setTranslationProgress(prev => ({ ...prev, current: prev.current + 1 }));
          }
        }
      }

      if (translationsToCreate.length > 0) {
        console.log(`💾 Saving ${translationsToCreate.length} automatic translations...`);
        
        // Insert translations in batches to avoid overwhelming the database
        const batchSize = 50;
        for (let i = 0; i < translationsToCreate.length; i += batchSize) {
          const batch = translationsToCreate.slice(i, i + batchSize);
          const { error } = await supabase
            .from('gamification_event_translations')
            .insert(batch);

          if (error) {
            console.error('❌ Error saving translation batch:', error);
            throw error;
          }
        }

        console.log('✅ All translations saved successfully');
        addNotification('success', `Successfully created ${translationsToCreate.length} automatic translations`);
        await loadData();
      } else {
        addNotification('success', 'All events are already translated in all languages');
      }

    } catch (error) {
      console.error('❌ Error during automatic translation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification('error', `Failed to auto-translate events: ${errorMessage}`);
    } finally {
      setAutoTranslating(false);
      setTranslationProgress({ current: 0, total: 0 });
    }
  };

  const handleAutoTranslateEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (!confirm(`Automatically translate "${event.event_type}" into all 30 languages?`)) {
      return;
    }

    console.log(`🎯 Auto-translating event: ${event.event_type}`);
    const batchId = crypto.randomUUID();
    const translationsToCreate = [];

    try {
      for (const language of SUPPORTED_LANGUAGES) {
        // Skip if translation already exists
        const existingTranslation = translations.find(
          t => t.event_id === event.id && t.language_code === language.code
        );
        
        if (existingTranslation) continue;

        // Create translations (mock implementation)
        const titleTranslation = await translationService.translateText({
          text: event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          targetLanguage: language.code,
          sourceLanguage: 'en'
        });

        const descriptionTranslation = await translationService.translateText({
          text: `Complete the ${event.event_type.replace(/_/g, ' ')} action to earn rewards`,
          targetLanguage: language.code,
          sourceLanguage: 'en'
        });

        const messageTranslation = await translationService.translateText({
          text: `Congratulations! You've completed ${event.event_type.replace(/_/g, ' ')}`,
          targetLanguage: language.code,
          sourceLanguage: 'en'
        });

        translationsToCreate.push({
          event_id: event.id,
          language_code: language.code,
          title: titleTranslation.translatedText,
          description: descriptionTranslation.translatedText,
          message: messageTranslation.translatedText,
          translation_status: 'auto',
          batch_id: batchId
        });
      }

      if (translationsToCreate.length > 0) {
        const { error } = await supabase
          .from('gamification_event_translations')
          .insert(translationsToCreate);

        if (error) throw error;

        addNotification('success', `Auto-translated "${event.event_type}" into ${translationsToCreate.length} languages`);
        await loadData();
      } else {
        addNotification('success', `"${event.event_type}" is already translated in all languages`);
      }

    } catch (error) {
      console.error('❌ Error auto-translating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification('error', `Failed to auto-translate event: ${errorMessage}`);
    }
  };

  const handleEdit = (translation: EventTranslation) => {
    // Mark as manual edit when user modifies
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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = eventCategories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const getLanguageName = (code: string) => {
    const language = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return language ? language.name : code.toUpperCase();
  };

  // Group events by category
  const groupEventsByCategory = () => {
    const grouped: Record<string, GamificationEvent[]> = {};
    
    events.forEach(event => {
      const categoryName = getCategoryName(event.event_type_category);
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(event);
    });
    
    return grouped;
  };

  // Get translations for events grouped by category
  const getTranslationsByCategory = () => {
    const groupedEvents = groupEventsByCategory();
    const result: Record<string, EventTranslation[]> = {};
    
    Object.entries(groupedEvents).forEach(([categoryName, categoryEvents]) => {
      const eventIds = categoryEvents.map(e => e.id);
      result[categoryName] = translations.filter(t => eventIds.includes(t.event_id));
    });
    
    return result;
  };

  const filteredTranslations = translations.filter((translation) => {
    const event = events.find(e => e.id === translation.event_id);
    const eventTitle = event ? event.event_type : '';
    
    const matchesSearch = 
      translation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.language_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEvent = eventFilter === 'all' || translation.event_id === eventFilter;
    const matchesLanguage = languageFilter === 'all' || translation.language_code === languageFilter;
    const matchesCategory = categoryFilter === 'all' || 
      (event && event.event_type_category === categoryFilter);
    
    return matchesSearch && matchesEvent && matchesLanguage && matchesCategory;
  });

  const usedLanguages = [...new Set(translations.map(t => t.language_code))];
  const translationsByCategory = getTranslationsByCategory();
  const categoryNames = Object.keys(translationsByCategory).sort();
  const englishTranslationsCount = translations.filter(t => t.language_code === 'en').length;
  const autoTranslationsCount = translations.filter(t => t.translation_status === 'auto').length;
  const manualTranslationsCount = translations.filter(t => t.translation_status === 'manual').length;
  const missingTranslationsCount = events.length * SUPPORTED_LANGUAGES.length - translations.length;

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
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-green-600">✅ {autoTranslationsCount} auto-translated</span>
                <span className="text-blue-600">✏️ {manualTranslationsCount} manual</span>
                {missingTranslationsCount > 0 && (
                  <span className="text-orange-600">⚠️ {missingTranslationsCount} missing</span>
                )}
                {englishTranslationsCount > 0 && (
                  <span className="text-red-600">🗑️ {englishTranslationsCount} English</span>
                )}
              </div>
            </div>
          </div>
          <>
          <div className="flex items-center gap-3">
            {!autoTranslating && (
              <button
                onClick={handleAutoTranslateAll}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Auto-Translate All Events
              </button>
            )}
            
            {autoTranslating && (
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Translating... {translationProgress.current}/{translationProgress.total}
              </div>
            )}

            {englishTranslationsCount > 0 && (
              <button
                onClick={handleBulkDeleteEnglish}
                disable
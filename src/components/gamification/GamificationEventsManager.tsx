import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Trophy, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GamificationEvent {
  id: string;
  event_type: string;
  coins_reward: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  event_type_category: string | null;
  event_position: number;
}

interface EventCategory {
  id: string;
  name: string;
}

interface EventFormData {
  event_type: string;
  coins_reward: number;
  event_type_category: string;
  is_active: boolean;
  metadata: Record<string, any>;
  event_position: number;
}

export function GamificationEventsManager() {
  const [events, setEvents] = useState<GamificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GamificationEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [metadataText, setMetadataText] = useState('{}');
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);

  const [formData, setFormData] = useState<EventFormData>({
    event_type: '',
    coins_reward: 1,
    event_type_category: '',
    is_active: true,
    metadata: {},
    event_position: 0,
  });

  useEffect(() => {
    loadEvents();
    loadEventCategories();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('gamification_events')
        .select('*')
        .order('event_position', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('event_categories')
        .select('id, name')
        .order('category_position', { ascending: true });

      if (error) throw error;
      setEventCategories(data || []);
    } catch (error) {
      console.error('Error loading event categories:', error);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const category = eventCategories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Parse metadata JSON
      let parsedMetadata = {};
      try {
        parsedMetadata = JSON.parse(metadataText);
      } catch (error) {
        alert('Invalid JSON format in metadata field');
        setSaving(false);
        return;
      }

      const eventData = {
        ...formData,
        metadata: parsedMetadata,
        // Ensure event_type_category is null if empty string
        event_type_category: formData.event_type_category || null,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('gamification_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gamification_events')
          .insert(eventData);

        if (error) throw error;
      }

      await loadEvents();
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gamification event?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('gamification_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    }
  };

  const handleEdit = (event: GamificationEvent) => {
    setFormData({
      event_type: event.event_type,
      coins_reward: event.coins_reward,
      event_type_category: event.event_type_category || '',
      is_active: event.is_active,
      metadata: event.metadata || {},
      event_position: event.event_position,
    });
    setMetadataText(JSON.stringify(event.metadata || {}, null, 2));
    setEditingEvent(event);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      event_type: '',
      coins_reward: 1,
      event_type_category: '',
      is_active: true,
      metadata: {},
      event_position: 0,
    });
    setMetadataText('{}');
    setEditingEvent(null);
    setShowForm(false);
  };

  const toggleEventStatus = async (event: GamificationEvent) => {
    try {
      const { error } = await supabase
        .from('gamification_events')
        .update({ is_active: !event.is_active })
        .eq('id', event.id);

      if (error) throw error;
      await loadEvents();
    } catch (error) {
      console.error('Error toggling event status:', error);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      (event.event_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.event_type_category || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && event.is_active) ||
      (statusFilter === 'inactive' && !event.is_active);
    
    const matchesCategory = categoryFilter === 'all' || 
      event.event_type_category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(events.map(e => e.event_type_category).filter(Boolean))];

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
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gamification Events</h1>
              <p className="text-gray-600">Manage rewards and achievements for user engagement</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
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
                <th className="text-left p-4 font-medium text-gray-900">Type</th>
                <th className="text-left p-4 font-medium text-gray-900">Category</th>
                <th className="text-left p-4 font-medium text-gray-900">Position</th>
                <th className="text-left p-4 font-medium text-gray-900">Coins</th>
                <th className="text-left p-4 font-medium text-gray-900">Metadata</th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Updated</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {event.event_type}
                    </code>
                  </td>
                  <td className="p-4">
                    {event.event_type_category ? (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                        {getCategoryName(event.event_type_category)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                      {event.event_position}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-gray-900">{event.coins_reward}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="max-w-xs">
                      {Object.keys(event.metadata || {}).length > 0 ? (
                        <code className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs font-mono block truncate">
                          {JSON.stringify(event.metadata)}
                        </code>
                      ) : (
                        <span className="text-gray-400 text-sm">Empty</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleEventStatus(event)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        event.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {event.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {event.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {formatDate(event.updated_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No gamification events found</p>
              <p className="text-sm text-gray-500 mt-1">
                {events.length === 0 ? 'Create your first event' : 'Try adjusting your filters'}
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
                {editingEvent ? 'Edit Gamification Event' : 'Add New Gamification Event'}
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
                  <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <input
                    type="text"
                    id="event_type"
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., daily_login, video_watch"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="coins_reward" className="block text-sm font-medium text-gray-700 mb-2">
                      Coins Reward *
                    </label>
                    <input
                      type="number"
                      id="coins_reward"
                      value={formData.coins_reward}
                      onChange={(e) => setFormData({ ...formData, coins_reward: parseInt(e.target.value) || 1 })}
                      required
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="event_position" className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <input
                      type="number"
                      id="event_position"
                      value={formData.event_position}
                      onChange={(e) => setFormData({ ...formData, event_position: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="metadata" className="block text-sm font-medium text-gray-700 mb-2">
                    Metadata (JSON)
                  </label>
                  <textarea
                    id="metadata"
                    value={metadataText}
                    onChange={(e) => setMetadataText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                    placeholder='{"key": "value"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter valid JSON format. Example: {"{"}"key": "value", "number": 123{"}"}
                  </p>
                </div>

                <div>
                  <label htmlFor="event_type_category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="event_type_category"
                    value={formData.event_type_category}
                    onChange={(e) => setFormData({ ...formData, event_type_category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a category...</option>
                    {eventCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Event is active and available to users
                  </label>
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
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
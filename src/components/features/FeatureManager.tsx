import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Package, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product, ProductFeature } from '../../types/database';

interface FeatureFormData {
  feature_name: string;
  feature_value: string;
  feature_type: 'text' | 'number' | 'boolean' | 'date';
  is_required: boolean;
  display_order: number;
}

export function FeatureManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [features, setFeatures] = useState<ProductFeature[]>([]);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FeatureFormData>({
    feature_name: '',
    feature_value: '',
    feature_type: 'text',
    is_required: false,
    display_order: 0,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadFeatures(selectedProduct.id);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_features')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const featureData = {
        ...formData,
        product_id: selectedProduct.id,
        display_order: formData.display_order || features.length,
      };

      if (editingFeature) {
        const { error } = await supabase
          .from('product_features')
          .update(featureData)
          .eq('id', editingFeature.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_features')
          .insert(featureData);

        if (error) throw error;
      }

      await loadFeatures(selectedProduct.id);
      resetForm();
    } catch (error) {
      console.error('Error saving feature:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
      const { error } = await supabase
        .from('product_features')
        .delete()
        .eq('id', featureId);

      if (error) throw error;
      
      if (selectedProduct) {
        await loadFeatures(selectedProduct.id);
      }
    } catch (error) {
      console.error('Error deleting feature:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      feature_name: '',
      feature_value: '',
      feature_type: 'text',
      is_required: false,
      display_order: 0,
    });
    setEditingFeature(null);
    setShowFeatureForm(false);
  };

  const startEditFeature = (feature: ProductFeature) => {
    setFormData({
      feature_name: feature.feature_name,
      feature_value: feature.feature_value,
      feature_type: feature.feature_type,
      is_required: feature.is_required,
      display_order: feature.display_order,
    });
    setEditingFeature(feature);
    setShowFeatureForm(true);
  };

  const renderFeatureValue = (feature: ProductFeature) => {
    switch (feature.feature_type) {
      case 'boolean':
        return (
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            feature.feature_value === 'true' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {feature.feature_value === 'true' ? 'Yes' : 'No'}
          </span>
        );
      case 'date':
        return new Date(feature.feature_value).toLocaleDateString();
      case 'number':
        return parseFloat(feature.feature_value).toLocaleString();
      default:
        return feature.feature_value;
    }
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feature Management</h1>
              <p className="text-gray-600">Manage product features and properties</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Product
          </label>
          <select
            id="product-select"
            value={selectedProduct?.id || ''}
            onChange={(e) => {
              const product = products.find(p => p.id === e.target.value);
              setSelectedProduct(product || null);
            }}
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a product...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Features for "{selectedProduct.name}"
                </h2>
                <p className="text-gray-600 mt-1">
                  {features.length} feature{features.length !== 1 ? 's' : ''} configured
                </p>
              </div>
              <button
                onClick={() => setShowFeatureForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Feature
              </button>
            </div>
          </div>

          <div className="p-6">
            {features.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No features configured</p>
                <p className="text-sm text-gray-500 mt-1">Add your first feature to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {features.map((feature) => (
                  <div key={feature.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{feature.feature_name}</h3>
                          {feature.is_required && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                              Required
                            </span>
                          )}
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                            {feature.feature_type}
                          </span>
                        </div>
                        <div className="text-lg font-medium text-gray-800 mb-1">
                          {renderFeatureValue(feature)}
                        </div>
                        <p className="text-sm text-gray-600">Display order: {feature.display_order}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditFeature(feature)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFeature(feature.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showFeatureForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingFeature ? 'Edit Feature' : 'Add New Feature'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeature} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="feature_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Feature Name *
                  </label>
                  <input
                    type="text"
                    id="feature_name"
                    value={formData.feature_name}
                    onChange={(e) => setFormData({ ...formData, feature_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Weight, Color, Dimensions"
                  />
                </div>

                <div>
                  <label htmlFor="feature_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Feature Type
                  </label>
                  <select
                    id="feature_type"
                    value={formData.feature_type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      feature_type: e.target.value as FeatureFormData['feature_type'],
                      feature_value: '' // Reset value when type changes
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean (Yes/No)</option>
                    <option value="date">Date</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="feature_value" className="block text-sm font-medium text-gray-700 mb-2">
                    Feature Value *
                  </label>
                  {formData.feature_type === 'boolean' ? (
                    <select
                      id="feature_value"
                      value={formData.feature_value}
                      onChange={(e) => setFormData({ ...formData, feature_value: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      type={formData.feature_type === 'date' ? 'date' : formData.feature_type === 'number' ? 'number' : 'text'}
                      id="feature_value"
                      value={formData.feature_value}
                      onChange={(e) => setFormData({ ...formData, feature_value: e.target.value })}
                      required
                      step={formData.feature_type === 'number' ? '0.01' : undefined}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={
                        formData.feature_type === 'text' ? 'Enter text value' :
                        formData.feature_type === 'number' ? 'Enter number' :
                        'Select date'
                      }
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      id="display_order"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_required}
                        onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Required field</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
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
                  {editingFeature ? 'Update Feature' : 'Add Feature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
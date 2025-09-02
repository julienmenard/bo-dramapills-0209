import React, { useState, useEffect } from 'react';
import { Product, ProductFeature } from '../../types/database';
import { ProductTable } from './ProductTable';
import { ProductForm } from './ProductForm';
import { supabase } from '../../lib/supabase';

export function ProductView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productFeatures, setProductFeatures] = useState<ProductFeature[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductFeatures = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_features')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      setProductFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const handleSave = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
      }

      await loadProducts();
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This will also delete all its features.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleView = async (product: Product) => {
    setSelectedProduct(product);
    await loadProductFeatures(product.id);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedProduct) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h1>
              <p className="text-gray-600">{selectedProduct.description}</p>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Back to Products
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-medium text-gray-900 capitalize">{selectedProduct.category}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                selectedProduct.status === 'active' ? 'bg-green-100 text-green-800' :
                selectedProduct.status === 'draft' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedProduct.status}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Price</p>
              <p className="font-medium text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(selectedProduct.price)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Features</h2>
          {productFeatures.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No features configured for this product</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productFeatures.map((feature) => (
                <div key={feature.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{feature.feature_name}</h3>
                    {feature.is_required && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-medium text-blue-600">
                    {feature.feature_type === 'boolean' 
                      ? (feature.feature_value === 'true' ? 'Yes' : 'No')
                      : feature.feature_type === 'date'
                      ? new Date(feature.feature_value).toLocaleDateString()
                      : feature.feature_value
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {feature.feature_type} • Order: {feature.display_order}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductTable
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onAdd={handleAdd}
      />

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          loading={false}
        />
      )}
    </div>
  );
}
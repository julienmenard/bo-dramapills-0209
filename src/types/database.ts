export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'draft';
  price: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ProductFeature {
  id: string;
  product_id: string;
  feature_name: string;
  feature_value: string;
  feature_type: 'text' | 'number' | 'boolean' | 'date';
  is_required: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminLoginResponse {
  user_id: string;
  user_email: string;
  user_name: string | null;
  user_role: string;
}

export interface EventCategory {
  id: string;
  name: string;
  description: string | null;
  category_position: number;
  created_at: string;
  updated_at: string;
}
export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
  avatar_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Motorcycle {
  id: number;
  brand: string;
  model: string;
  year: number;
  description?: string;
  daily_rate: number;
  capacity: number;
  engine_cc?: number;
  fuel_type: 'petrol' | 'electric' | 'hybrid';
  image_url?: string;
  status: 'available' | 'rented' | 'maintenance';
  created_at?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  motorcycle_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  admin_notes?: string;
  brand?: string;
  model?: string;
  image_url?: string;
  daily_rate?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface DashboardStats {
  motorcycles: { total: number; available: number; rented: number };
  bookings: { total: number; pending: number; approved: number };
  customers: { total: number };
  revenue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'pt'
  first_name?: string
  last_name?: string
  phone_number?: string
  created_at: string
  updated_at: string
}

export interface Trainer {
  id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  pin_code?: string
  city?: string
  state?: string
  country?: string
  address?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  client_count?: number
  payments_collected?: number
  payments_pending?: number
}

export interface Client {
  id: string
  client_id: string
  full_name: string
  email: string
  phone_number?: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  trainer_id?: string
  first_payment?: number
  payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'
  balance?: number
  session_type?: '1 month' | '3 months' | '6 months' | '12 months'
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  trainer?: Trainer
}

export interface Payment {
  id: string
  client_id: string
  amount_paid: number
  amount_pending: number
  payment_date: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  client?: Client
}

export interface Session {
  id: string
  client_id: string
  trainer_id?: string
  session_date: string
  session_type: string
  total_duration?: number
  remaining_days?: number
  status: 'pending' | 'confirmed' | 'booked' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  client?: Client
  trainer?: Trainer
}

export interface PTSale {
  id: string
  order_id: string
  trainer_id: string
  client_id: string
  session_type: string
  total_days?: number
  status: 'pending' | 'in_progress' | 'complete' | 'approved' | 'rejected'
  payment_status: 'pending' | 'paid'
  sale_date: string
  created_at: string
  updated_at: string
  trainer?: Trainer
  client?: Client
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'dummy'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Bill = {
  id: number
  bill_number: number
  bill_type: 'kacchi' | 'pakki'
  party_name: string
  bill_date: string
  total_amount: number
  total_amount_words: string | null
  gst_number: string | null
  vehicle_number: string | null
  balance: number | null
  bank_name: string | null
  bank_ifsc: string | null
  bank_account: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type BillItem = {
  id: number
  bill_id: number
  particular: string
  qty_bags: number | null
  weight_kg: number | null
  rate: number | null
  amount: number | null
  created_at: string
}

export const FIXED_PRODUCTS = [
  'Adsigiri (Bhadang Murmura)',
  'Kolhapuri',
  'MP'
]

export type SavedBankDetail = {
  id: number
  bank_name: string
  bank_ifsc: string
  bank_account: string
  created_at: string
}

export const COMPANY_INFO = {
  name: 'M S TRADING COMPANY',
  address: 'KUPWAD MIDC NEAR NAV KRISHNA VALLEY SCHOOL PLOT NO L-52',
  gst: '27CQIPS6685K1ZU',
  jurisdiction: 'Subject to Sangli Jurisdiction'
}

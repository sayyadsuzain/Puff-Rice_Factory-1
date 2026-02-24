-- DROP EXISTING TABLE IF WRONG STRUCTURE
DROP TABLE IF EXISTS bills CASCADE;

-- Create bills table with CORRECT GST fields
CREATE TABLE bills (
  id SERIAL PRIMARY KEY,
  bill_number VARCHAR(10) NOT NULL UNIQUE, -- P001, K001 format
  bill_type VARCHAR(20) NOT NULL CHECK (bill_type IN ('kacchi', 'pakki')), -- kacchi (cash) or pakki (credit/gst)
  party_id INTEGER NOT NULL REFERENCES parties(id),
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount DECIMAL(12, 2) NOT NULL,
  total_amount_words TEXT,
  vehicle_number VARCHAR(50),
  balance DECIMAL(12, 2) DEFAULT 0,
  -- GST fields for Pakki bills
  is_gst_enabled BOOLEAN DEFAULT false,
  company_gst_number VARCHAR(15), -- Fixed company GST
  party_gst_number VARCHAR(15), -- Party GST when GST enabled
  cgst_percent DECIMAL(5, 2) DEFAULT 0,
  igst_percent DECIMAL(5, 2) DEFAULT 0,
  sgst_percent DECIMAL(5, 2) DEFAULT 0,
  cgst_amount DECIMAL(12, 2) DEFAULT 0,
  igst_amount DECIMAL(12, 2) DEFAULT 0,
  sgst_amount DECIMAL(12, 2) DEFAULT 0,
  gst_total DECIMAL(12, 2) DEFAULT 0,
  -- Bank details
  bank_name VARCHAR(100),
  bank_ifsc VARCHAR(20),
  bank_account VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate bill_items table if needed
DROP TABLE IF EXISTS bill_items CASCADE;
CREATE TABLE bill_items (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  particular VARCHAR(255) NOT NULL,
  qty_bags INTEGER,
  weight_kg DECIMAL(10, 2),
  rate DECIMAL(10, 2),
  amount DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_bills_party_id ON bills(party_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_type ON bills(bill_type);
CREATE INDEX IF NOT EXISTS idx_bills_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

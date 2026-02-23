-- Create saved_bank_details table
CREATE TABLE IF NOT EXISTS saved_bank_details (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  bank_ifsc VARCHAR(20) NOT NULL,
  bank_account VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bank_name, bank_ifsc, bank_account)
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  bill_number INTEGER NOT NULL,
  bill_type VARCHAR(20) NOT NULL CHECK (bill_type IN ('kacchi', 'pakki')), -- kacchi (cash) or pakki (credit/gst)
  party_name VARCHAR(255) NOT NULL,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount DECIMAL(12, 2) NOT NULL,
  total_amount_words TEXT,
  gst_number VARCHAR(50),
  vehicle_number VARCHAR(50),
  balance DECIMAL(12, 2),
  bank_name VARCHAR(100),
  bank_ifsc VARCHAR(20),
  bank_account VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  particular VARCHAR(255) NOT NULL,
  qty_bags INTEGER,
  weight_kg DECIMAL(10, 2),
  rate DECIMAL(10, 2),
  amount DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sequence for bill numbers (starting from 1)
CREATE SEQUENCE IF NOT EXISTS bills_bill_number_seq START 1 INCREMENT 1;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_type ON bills(bill_type);
CREATE INDEX IF NOT EXISTS idx_bills_party ON bills(party_name);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

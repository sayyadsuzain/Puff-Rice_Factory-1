-- Create parties table
CREATE TABLE IF NOT EXISTS parties (
  id SERIAL PRIMARY KEY,
  party_id VARCHAR(10) NOT NULL UNIQUE, -- PYT01, PYT02 format
  name VARCHAR(255) NOT NULL UNIQUE,
  gst_number VARCHAR(15), -- 15-digit GST format
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create saved_bank_details table
CREATE TABLE IF NOT EXISTS saved_bank_details (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  bank_ifsc VARCHAR(20) NOT NULL,
  bank_account VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bank_name, bank_ifsc, bank_account)
);

-- Create bills table with GST fields
CREATE TABLE IF NOT EXISTS bills (
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);
CREATE INDEX IF NOT EXISTS idx_parties_gst ON parties(gst_number);
CREATE INDEX IF NOT EXISTS idx_bills_party_id ON bills(party_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_type ON bills(bill_type);
CREATE INDEX IF NOT EXISTS idx_bills_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

-- Create function to generate next party ID
CREATE OR REPLACE FUNCTION generate_party_id()
RETURNS TEXT AS $$
DECLARE
  next_id INTEGER;
  party_id TEXT;
BEGIN
  -- Get the next ID from sequence
  SELECT COALESCE(MAX(CAST(SUBSTRING(party_id FROM 4) AS INTEGER)), 0) + 1
  INTO next_id
  FROM parties;

  -- Format as PYT01, PYT02, etc.
  party_id := 'PYT' || LPAD(next_id::TEXT, 2, '0');

  RETURN party_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate next bill number
CREATE OR REPLACE FUNCTION generate_bill_number(bill_type_param VARCHAR)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  next_num INTEGER;
  bill_num TEXT;
BEGIN
  -- Set prefix based on bill type
  IF bill_type_param = 'pakki' THEN
    prefix := 'P';
  ELSE
    prefix := 'K';
  END IF;

  -- Get next number for this type
  SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM 2) AS INTEGER)), 0) + 1
  INTO next_num
  FROM bills
  WHERE bill_number LIKE prefix || '%';

  -- Format as P001, K001, etc.
  bill_num := prefix || LPAD(next_num::TEXT, 3, '0');

  RETURN bill_num;
END;
$$ LANGUAGE plpgsql;

-- Drop all existing create_party_with_id functions (to handle signature changes)
DROP FUNCTION IF EXISTS create_party_with_id(VARCHAR, VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS create_party_with_id(VARCHAR, VARCHAR);

-- Create RPC function for creating party with auto ID
CREATE OR REPLACE FUNCTION create_party_with_id(
  party_name VARCHAR,
  gst_number_param VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_party_id TEXT;
  new_party_record parties;
BEGIN
  -- Generate party ID
  new_party_id := generate_party_id();

  -- Insert new party
  INSERT INTO parties (party_id, name, gst_number)
  VALUES (new_party_id, party_name, gst_number_param)
  RETURNING * INTO new_party_record;

  -- Return the created party
  RETURN json_build_object(
    'id', new_party_record.id,
    'party_id', new_party_record.party_id,
    'name', new_party_record.name,
    'gst_number', new_party_record.gst_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

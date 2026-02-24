import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wvhswztjjahhbdtxnhxb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aHN3enRqamFoaGJkdHguaHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MzA5NDMsImV4cCI6MjA4NzQwNjk0M30.Cw4V-eU2jcOmH8CRrk9HvPHdgAF3IfOtMtGoW6To0JI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTables() {
  try {
    console.log('Checking if bills table exists...')

    // Try to select from bills table
    const { data, error } = await supabase
      .from('bills')
      .select('id')
      .limit(1)

    if (error) {
      console.log('Bills table does not exist or error:', error.message)
      return false
    }

    console.log('Bills table exists!')
    return true
  } catch (error) {
    console.error('Error checking tables:', error)
    return false
  }
}

async function createTables() {
  try {
    console.log('Creating database tables...')

    // Create parties table
    const { error: partiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS parties (
          id SERIAL PRIMARY KEY,
          party_id VARCHAR(10) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL UNIQUE,
          gst_number VARCHAR(15),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    })

    if (partiesError) {
      console.error('Error creating parties table:', partiesError)
    } else {
      console.log('Parties table created successfully')
    }

    // Create bills table
    const { error: billsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bills (
          id SERIAL PRIMARY KEY,
          bill_number VARCHAR(10) NOT NULL UNIQUE,
          bill_type VARCHAR(20) NOT NULL CHECK (bill_type IN ('kacchi', 'pakki')),
          party_id INTEGER NOT NULL,
          bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
          total_amount DECIMAL(12, 2) NOT NULL,
          total_amount_words TEXT,
          vehicle_number VARCHAR(50),
          balance DECIMAL(12, 2) DEFAULT 0,
          is_gst_enabled BOOLEAN DEFAULT false,
          company_gst_number VARCHAR(15),
          party_gst_number VARCHAR(15),
          cgst_percent DECIMAL(5, 2) DEFAULT 0,
          igst_percent DECIMAL(5, 2) DEFAULT 0,
          sgst_percent DECIMAL(5, 2) DEFAULT 0,
          cgst_amount DECIMAL(12, 2) DEFAULT 0,
          igst_amount DECIMAL(12, 2) DEFAULT 0,
          sgst_amount DECIMAL(12, 2) DEFAULT 0,
          gst_total DECIMAL(12, 2) DEFAULT 0,
          bank_name VARCHAR(100),
          bank_ifsc VARCHAR(20),
          bank_account VARCHAR(50),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    })

    if (billsError) {
      console.error('Error creating bills table:', billsError)
    } else {
      console.log('Bills table created successfully')
    }

    // Create bill_items table
    const { error: itemsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bill_items (
          id SERIAL PRIMARY KEY,
          bill_id INTEGER NOT NULL,
          particular VARCHAR(255) NOT NULL,
          qty_bags INTEGER,
          weight_kg DECIMAL(10, 2),
          rate DECIMAL(10, 2),
          amount DECIMAL(12, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    })

    if (itemsError) {
      console.error('Error creating bill_items table:', itemsError)
    } else {
      console.log('Bill_items table created successfully')
    }

    console.log('Database setup completed!')
  } catch (error) {
    console.error('Error creating tables:', error)
  }
}

async function main() {
  const tablesExist = await checkTables()

  if (!tablesExist) {
    await createTables()
  } else {
    console.log('Tables already exist!')
  }
}

main()

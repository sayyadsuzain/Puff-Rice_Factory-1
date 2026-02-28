import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')

    // Get bills with party info
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id, bill_number, party_id, bill_type')
      .limit(5)

    if (billsError) {
      console.error('Bills query error:', billsError)
      return NextResponse.json({ error: billsError.message }, { status: 500 })
    }

    // Get parties
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name, gst_number')
      .limit(10)

    if (partiesError) {
      console.error('Parties query error:', partiesError)
      return NextResponse.json({ error: partiesError.message }, { status: 500 })
    }

    console.log('Bills:', bills)
    console.log('Parties:', parties)

    return NextResponse.json({
      success: true,
      billsCount: bills?.length || 0,
      bills: bills,
      partiesCount: parties?.length || 0,
      parties: parties
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

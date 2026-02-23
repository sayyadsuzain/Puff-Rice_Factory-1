import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase
      .from('bills')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Supabase connection successful, bills count:', data)
    return NextResponse.json({ success: true, billsCount: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

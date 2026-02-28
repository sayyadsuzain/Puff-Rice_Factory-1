import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check all bills with party information using JOIN
    const { data: billsWithParties, error: billsPartiesError } = await supabase
      .from('bills')
      .select(`
        id, bill_number, party_id, bill_date, financial_year, month_number, bill_type,
        total_amount, taxable_amount, gst_total, net_total,
        parties:party_id (
          id,
          name,
          gst_number
        )
      `)
      .order('bill_date', { ascending: false })

    if (billsPartiesError) {
      return NextResponse.json({ error: billsPartiesError.message }, { status: 500 })
    }

    // Check all bills with CA reporting fields (no join)
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id, bill_number, party_id, bill_date, financial_year, month_number, bill_type, total_amount, taxable_amount, gst_total, net_total')
      .order('bill_date', { ascending: false })

    if (billsError) {
      return NextResponse.json({ error: billsError.message }, { status: 500 })
    }

    // Group bills by financial year and month
    const billsByFY: Record<string, Record<number, any[]>> = {}
    bills?.forEach(bill => {
      const fy = bill.financial_year || 'unknown'
      const month = bill.month_number || 0

      if (!billsByFY[fy]) billsByFY[fy] = {}
      if (!billsByFY[fy][month]) billsByFY[fy][month] = []

      billsByFY[fy][month].push(bill)
    })

    // Check parties table
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name, gst_number')

    if (partiesError) {
      return NextResponse.json({ error: partiesError.message }, { status: 500 })
    }

    // Check bills for February 2026 specifically
    const feb2026Bills = bills?.filter(bill =>
      bill.financial_year === '2025-26' && bill.month_number === 2
    ) || []

    return NextResponse.json({
      totalBills: bills?.length || 0,
      feb2026BillsCount: feb2026Bills.length,
      feb2026Bills: feb2026Bills.slice(0, 10), // Show first 10
      billsByFY,
      billsWithParties: billsWithParties?.slice(0, 5), // Show first 5 with party data
      partiesCount: parties?.length || 0,
      sampleParties: parties?.slice(0, 5),
      billsWithoutFY: bills?.filter(b => !b.financial_year).length || 0,
      billsWithoutMonth: bills?.filter(b => !b.month_number).length || 0,
      billsWithoutPartyData: billsWithParties?.filter((b: any) => !b.parties || !b.parties.name).length || 0
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('=== CHECKING EXISTING PARTIES ===')

    // First, test basic connection
    const { data: testData, error: testError } = await supabase
      .from('parties')
      .select('count')
      .limit(1)

    console.log('Basic parties count test:', { data: testData, error: testError })

    // Check existing parties
    const { data: existingParties, error: partiesError } = await supabase
      .from('parties')
      .select('*')
      .order('id')

    console.log('Full parties query:', { data: existingParties, error: partiesError })

    // Group by name to find duplicates
    const partiesByName: Record<string, any[]> = {}
    existingParties?.forEach(party => {
      if (!partiesByName[party.name]) partiesByName[party.name] = []
      partiesByName[party.name].push(party)
    })

    console.log('Parties grouped by name:', partiesByName)

    // Find duplicates
    const duplicates = Object.entries(partiesByName)
      .filter(([name, parties]) => parties.length > 1)
      .map(([name, parties]) => ({ name, count: parties.length, parties }))

    console.log('Duplicate parties:', duplicates)

    // Check which parties are referenced by bills
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('party_id')
      .not('party_id', 'is', null)

    const referencedPartyIds = [...new Set(bills?.map(b => b.party_id) || [])]
    console.log('Party IDs referenced by bills:', referencedPartyIds)

    return NextResponse.json({
      existingParties,
      partiesByName,
      duplicates,
      referencedPartyIds,
      partiesReferenced: existingParties?.filter(p => referencedPartyIds.includes(p.id)),
      partiesNotReferenced: existingParties?.filter(p => !referencedPartyIds.includes(p.id))
    })

  } catch (error) {
    console.error('Check parties error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

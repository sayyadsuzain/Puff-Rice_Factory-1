'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Bill, BillItem } from '@/lib/supabase'
import BillDisplay from '@/components/bill-display'

export default function BillPrintPage() {
  const params = useParams()
  const billId = parseInt(params.id as string)

  const [bill, setBill] = useState<Bill | null>(null)
  const [items, setItems] = useState<BillItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBillDetails()
  }, [billId])

  const fetchBillDetails = async () => {
    try {
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single()

      if (billError) throw billError

      setBill(billData)

      const { data: itemsData, error: itemsError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)
        .order('id', { ascending: true })

      if (itemsError) throw itemsError

      setItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching bill details:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && bill && items) {
      // Auto-print when page loads
      window.print()
    }
  }, [loading, bill, items])

  if (loading) {
    return <div className="p-8">Loading bill...</div>
  }

  if (!bill) {
    return <div className="p-8">Bill not found</div>
  }

  return (
    <div className="p-8">
      <BillDisplay bill={bill} items={items} />
    </div>
  )
}

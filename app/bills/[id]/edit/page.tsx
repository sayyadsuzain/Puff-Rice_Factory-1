'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, Bill, BillItem, FIXED_PRODUCTS, COMPANY_INFO } from '@/lib/supabase'
import BillPreview from '@/components/bill-preview'
import BillItemForm from '@/components/bill-item-form'
import { ProtectedRoute } from '@/components/protected-route'

export const dynamic = 'force-dynamic'

export default function EditBillPage() {
  const params = useParams()
  const billId = parseInt(params.id as string)

  const [billType, setBillType] = useState<'kacchi' | 'pakki'>('kacchi')
  const [partyName, setPartyName] = useState('')
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<Partial<BillItem>[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalAmountWords, setTotalAmountWords] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [balance, setBalance] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankIFSC, setBankIFSC] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [showBankDetails, setShowBankDetails] = useState(true)
  const [notes, setNotes] = useState('')
  const [billNumber, setBillNumber] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Auto-format vehicle number to uppercase
  useEffect(() => {
    if (vehicleNumber) {
      setVehicleNumber(vehicleNumber.toUpperCase())
    }
  }, [vehicleNumber])

  // Auto-format party name to title case
  useEffect(() => {
    if (partyName) {
      const titleCase = partyName
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      if (titleCase !== partyName) {
        setPartyName(titleCase)
      }
    }
  }, [partyName])

  // Fetch bill data on component mount
  useEffect(() => {
    if (billId) {
      fetchBillData()
    }
  }, [billId])

  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero'

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const teens = ['', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const thousands = ['', 'Thousand', 'Lakh', 'Crore']

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return ''
      if (n < 10) return ones[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) {
        const ten = Math.floor(n / 10)
        const one = n % 10
        return tens[ten] + (one > 0 ? ' ' + ones[one] : '')
      }
      const hundred = Math.floor(n / 100)
      const remainder = n % 100
      return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '')
    }

    const rupees = Math.floor(num)
    const paise = Math.round((num - rupees) * 100)

    let result = ''

    // Handle rupees
    if (rupees > 0) {
      let temp = rupees
      let thousandIndex = 0

      while (temp > 0 && thousandIndex < thousands.length) {
        const chunk = temp % 1000
        if (chunk > 0) {
          const chunkWords = convertLessThanThousand(chunk)
          result = chunkWords + (thousands[thousandIndex] ? ' ' + thousands[thousandIndex] : '') + (result ? ' ' + result : '')
        }
        temp = Math.floor(temp / 1000)
        thousandIndex++
      }

      result += ' Rupees'
    }

    // Handle paise
    if (paise > 0) {
      if (rupees > 0) result += ' and '
      result += convertLessThanThousand(paise) + ' Paise'
    }

    if (result) result += ' Only'

    return result.trim()
  }

  const fetchBillData = async () => {
    try {
      console.log('Fetching bill data for ID:', billId)

      setFetchLoading(true)
      setFetchError(null)

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - please check your internet connection')), 15000)
      )

      const fetchPromise = async () => {
        console.log('Connecting to Supabase...')

        // Fetch bill data
        const { data: billData, error: billError } = await supabase
          .from('bills')
          .select('*')
          .eq('id', billId)
          .single()

        if (billError) {
          console.error('Bill fetch error:', billError)
          throw new Error(`Failed to fetch bill: ${billError.message}`)
        }

        if (!billData) {
          throw new Error('Bill not found')
        }

        console.log('Bill data fetched successfully:', billData)

        // Populate form with existing data
        setBillType(billData.bill_type)
        setPartyName(billData.party_name)
        setBillDate(billData.bill_date)
        setVehicleNumber(billData.vehicle_number || '')
        setBalance(billData.balance ? billData.balance.toString() : '')
        setBankName(billData.bank_name || '')
        setBankIFSC(billData.bank_ifsc || '')
        setBankAccount(billData.bank_account || '')
        setNotes(billData.notes || '')
        setBillNumber(billData.bill_number)
        // Don't set totalAmount from database - calculate from items instead
        // setTotalAmount(billData.total_amount)
        setTotalAmountWords(billData.total_amount_words || '')

        console.log('Form populated with bill data')

        // Fetch bill items
        const { data: itemsData, error: itemsError } = await supabase
          .from('bill_items')
          .select('*')
          .eq('bill_id', billId)
          .order('id', { ascending: true })

        if (itemsError) {
          console.error('Items fetch error:', itemsError)
        }

        console.log('Items data fetched successfully:', itemsData?.length || 0, 'items')
        setItems(itemsData || [])

        // Recalculate total after loading items (don't use database total)
        const calculatedTotal = (itemsData || []).reduce((sum, item) => sum + (item.amount || 0), 0)
        setTotalAmount(calculatedTotal)

        // Recalculate amount in words
        const finalTotal = calculatedTotal + (billData.balance || 0)
        if (finalTotal > 0) {
          setTotalAmountWords(numberToWords(finalTotal))
        }
      }

      await Promise.race([fetchPromise(), timeoutPromise])
      console.log('Bill data loading completed successfully')
    } catch (error) {
      console.error('Error fetching bill data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setFetchError(errorMessage)
      toast.error(`Failed to load bill: ${errorMessage}`)
    } finally {
      setFetchLoading(false)
    }
  }

  // Auto-calculate total amount when items or balance change
  useEffect(() => {
    const calculatedTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
    console.log('Recalculating total from items:', items.length, 'items, total:', calculatedTotal)
    setTotalAmount(calculatedTotal)

    // Auto-generate amount in words based on total including balance
    const finalTotal = calculatedTotal + (balance ? parseFloat(balance) : 0)
    if (finalTotal > 0) {
      const words = numberToWords(finalTotal)
      console.log('Generated amount in words:', words)
      setTotalAmountWords(words)
    } else {
      setTotalAmountWords('')
    }
  }, [items, balance])

  const handleAddItem = () => {
    setItems([...items, {}])
  }

  const handleUpdateItem = (index: number, updatedItem: Partial<BillItem>) => {
    const newItems = [...items]
    newItems[index] = updatedItem
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const handleSaveBill = async () => {
    if (!partyName.trim()) {
      toast.error('Please enter party name')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    setLoading(true)
    console.log('Starting bill update process...')

    try {
      console.log('Updating bill record...')
      // Update bill
      const billUpdateData = {
        bill_type: billType,
        party_name: partyName,
        bill_date: billDate,
        total_amount: totalAmount,
        total_amount_words: totalAmountWords,
        gst_number: billType === 'pakki' ? COMPANY_INFO.gst : null,
        vehicle_number: vehicleNumber || null,
        balance: balance ? parseFloat(balance) : null,
        bank_name: billType === 'pakki' ? bankName : null,
        bank_ifsc: billType === 'pakki' ? bankIFSC : null,
        bank_account: billType === 'pakki' ? bankAccount : null,
        notes: notes || null
      }

      console.log('Bill update data:', billUpdateData)

      const { data: billUpdateResult, error: billError } = await supabase
        .from('bills')
        .update(billUpdateData)
        .eq('id', billId)
        .select()

      if (billError) {
        console.error('Bill update error:', billError)
        throw new Error(`Failed to update bill: ${billError.message}`)
      }

      console.log('Bill updated successfully:', billUpdateResult)

      // Delete existing bill items with proper error handling
      console.log('Deleting existing bill items...')
      const { error: deleteError } = await supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', billId)

      if (deleteError) {
        console.error('Bill items delete error:', deleteError)
        throw new Error(`Failed to delete existing items: ${deleteError.message}`)
      }

      console.log('Existing items deleted successfully')

      // Insert updated bill items
      if (items.length > 0) {
        console.log('Inserting updated bill items...')
        const itemsToInsert = items.map(item => ({
          bill_id: billId,
          particular: item.particular || '',
          qty_bags: item.qty_bags || null,
          weight_kg: item.weight_kg || null,
          rate: item.rate || null,
          amount: item.amount || null
        }))

        console.log('Items to insert:', itemsToInsert)

        const { data: itemsInsertResult, error: itemsError } = await supabase
          .from('bill_items')
          .insert(itemsToInsert)
          .select()

        if (itemsError) {
          console.error('Bill items insert error:', itemsError)
          throw new Error(`Failed to insert bill items: ${itemsError.message}`)
        }

        console.log('Bill items inserted successfully:', itemsInsertResult)
      }

      console.log('Bill update process completed successfully!')
      toast.success('Bill updated successfully! Redirecting to view...')

      console.log('🚀 REDIRECTING BACK TO VIEW PAGE...')
      const viewUrl = `/bills/${billId}`
      console.log('Redirecting to view:', viewUrl)

      // Redirect immediately back to bill detail to see the updated bill
      window.location.href = viewUrl

    } catch (error) {
      console.error('Error updating bill:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to update bill: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground">Loading bill data...</p>
            <p className="text-sm text-gray-500">Bill ID: {billId}</p>
            <p className="text-xs text-gray-400">This may take a few seconds</p>
            <Link href={`/bills/${billId}`}>
              <Button variant="outline" size="sm">
                Back to Bill View
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-6xl">⚠️</div>
            <h2 className="text-xl font-semibold text-red-600">Failed to Load Bill</h2>
            <p className="text-muted-foreground max-w-md">{fetchError}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
              <Link href="/bills">
                <Button>Back to Bills</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Responsive Back Button */}
        <div className="mb-4 md:mb-6">
          <Link href={`/bills/${billId}`}>
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Back to Bill View
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          {/* Form Section */}
          <div className="space-y-4 md:space-y-6">
            <Card className="bg-white shadow-md rounded-lg">
              <CardHeader className="pb-4 md:pb-6">
                <CardTitle className="text-lg md:text-xl">Edit Bill</CardTitle>
                <CardDescription className="text-sm md:text-base">Update bill details below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                {/* Bill Type */}
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Bill Type</Label>
                  <Select value={billType} onValueChange={(value) => setBillType(value as 'kacchi' | 'pakki')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kacchi">Kacchi (Cash)</SelectItem>
                      <SelectItem value="pakki">Pakki (Credit/GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bill Number & Date - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm md:text-base">Bill No.</Label>
                    <Input value={`${billType === 'kacchi' ? 'K' : 'P'}${String(billNumber || 0).padStart(3, '0')}`} disabled className="bg-muted text-sm md:text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm md:text-base">Date</Label>
                    <Input
                      type="date"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>

                {/* Party Name */}
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Party Name (M/s.)</Label>
                  <Input
                    placeholder="Enter customer/party name"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>

                {/* Vehicle Number */}
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Vehicle Number</Label>
                  <Input
                    placeholder="e.g., MH-12-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>

                {/* Bank Details (Only for Pakki bills) */}
                {billType === 'pakki' && (
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <Label className="text-sm md:text-base font-semibold">Bank Details</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBankDetails(!showBankDetails)}
                        className="text-xs md:text-sm"
                      >
                        {showBankDetails ? 'Hide' : 'Show'} Bank Details
                      </Button>
                    </div>

                    {showBankDetails && (
                      <div className="space-y-3 md:space-y-4 p-3 md:p-4 border rounded-lg bg-gray-50">
                        {/* Bank Name */}
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">Bank Name</Label>
                          <Input
                            placeholder="e.g., KARNATAKA BANK LTD."
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>

                        {/* Bank IFSC */}
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">IFSC Code</Label>
                          <Input
                            placeholder="e.g., KARB0000729"
                            value={bankIFSC}
                            onChange={(e) => setBankIFSC(e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>

                        {/* Bank Account */}
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">Account Number</Label>
                          <Input
                            placeholder="e.g., 7292000100047001"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Items Section */}
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm md:text-base font-semibold">Items</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      className="text-xs md:text-sm"
                    >
                      + Add Item
                    </Button>
                  </div>

                  <div className="space-y-3 md:space-y-4 max-h-64 md:max-h-96 overflow-y-auto border rounded-md p-2 md:p-4">
                    {items.length === 0 ? (
                      <p className="text-xs md:text-sm text-muted-foreground text-center py-4 md:py-8">No items added yet</p>
                    ) : (
                      items.map((item, index) => (
                        <BillItemForm
                          key={index}
                          index={index}
                          item={item}
                          onUpdate={(updatedItem) => handleUpdateItem(index, updatedItem)}
                          onRemove={() => handleRemoveItem(index)}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Total Amount - Read Only */}
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Total Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={totalAmount.toFixed(2)}
                    readOnly
                    className="bg-muted text-sm md:text-base"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground">Total is auto-calculated from items</p>
                </div>

                {/* Total Amount in Words */}
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Amount in Words</Label>
                  <Input
                    placeholder="e.g., Sixty-Five Thousand Only"
                    value={totalAmountWords}
                    onChange={(e) => setTotalAmountWords(e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Notes</Label>
                  <Input
                    placeholder="Add any additional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveBill}
                  disabled={loading}
                  className="w-full text-sm md:text-base"
                  size="lg"
                >
                  {loading ? 'Updating Bill...' : 'Update Bill'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="mt-6 md:mt-0">
            <BillPreview
              billType={billType}
              billNumber={`${billType === 'kacchi' ? 'K' : 'P'}${String(billNumber || 0).padStart(3, '0')}`}
              billDate={billDate}
              partyName={partyName}
              vehicleNumber={vehicleNumber}
              balance={balance ? parseFloat(balance) : undefined}
              bankName={billType === 'pakki' ? bankName : undefined}
              bankIFSC={billType === 'pakki' ? bankIFSC : undefined}
              bankAccount={billType === 'pakki' ? bankAccount : undefined}
              showBankDetails={showBankDetails}
              items={items}
              totalAmount={totalAmount}
              totalAmountWords={totalAmountWords}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

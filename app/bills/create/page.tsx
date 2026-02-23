'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, Bill, BillItem, FIXED_PRODUCTS, COMPANY_INFO, SavedBankDetail } from '@/lib/supabase'
import BillPreview from '@/components/bill-preview'
import BillItemForm from '@/components/bill-item-form'

export const dynamic = 'force-dynamic'

export default function CreateBillPage() {
  const [billType, setBillType] = useState<'kacchi' | 'pakki'>('kacchi')
  const [partyName, setPartyName] = useState('')
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<Partial<BillItem>[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalAmountWords, setTotalAmountWords] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [balance, setBalance] = useState('')
  const [bankName, setBankName] = useState('KARNATAKA BANK LTD.')
  const [bankIFSC, setBankIFSC] = useState('KARB0000729')
  const [bankAccount, setBankAccount] = useState('7292000100047001')
  const [showBankDetails, setShowBankDetails] = useState(true)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [nextBillNumber, setNextBillNumber] = useState<number | null>(null)
  const [savedBankDetails, setSavedBankDetails] = useState<SavedBankDetail[]>([])

  // Fetch next bill number on component mount
  useEffect(() => {
    fetchNextBillNumber()
    fetchSavedBankDetails()
  }, [])

  const fetchSavedBankDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_bank_details')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedBankDetails(data || [])
    } catch (error) {
      console.error('Error fetching saved bank details:', error)
    }
  }

  const handleBillTypeChange = (value: 'kacchi' | 'pakki') => {
    setBillType(value)
    // Reset bank details to default when switching to Pakki
    if (value === 'pakki') {
      setBankName('KARNATAKA BANK LTD.')
      setBankIFSC('KARB0000729')
      setBankAccount('7292000100047001')
    }
  }

  const loadBankDetails = (bank: SavedBankDetail) => {
    setBankName(bank.bank_name)
    setBankIFSC(bank.bank_ifsc)
    setBankAccount(bank.bank_account)
  }

  const handleSaveBankDetails = async () => {
    if (!bankName.trim() || !bankIFSC.trim() || !bankAccount.trim()) {
      toast.error('Please fill all bank details before saving')
      return
    }

    try {
      // Check if this bank combination already exists
      const { data: existingBanks } = await supabase
        .from('saved_bank_details')
        .select('id')
        .eq('bank_name', bankName.trim())
        .eq('bank_ifsc', bankIFSC.trim())
        .eq('bank_account', bankAccount.trim())

      if (existingBanks && existingBanks.length > 0) {
        toast.error('This bank details already exists in saved banks')
        return
      }

      // Save bank details to dedicated table
      const { error: saveError } = await supabase
        .from('saved_bank_details')
        .insert([
          {
            bank_name: bankName.trim(),
            bank_ifsc: bankIFSC.trim(),
            bank_account: bankAccount.trim()
          }
        ])

      if (saveError) {
        console.error('Save error:', saveError)
        throw saveError
      }

      // Refresh saved bank details
      await fetchSavedBankDetails()
      toast.success('Bank details saved successfully!')
    } catch (error) {
      console.error('Error saving bank details:', error)
      toast.error('Failed to save bank details')
    }
  }

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

  // Auto-calculate total amount when items change
  useEffect(() => {
    const calculatedTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
    setTotalAmount(calculatedTotal)

    // Auto-generate amount in words based on total including balance
    const finalTotal = calculatedTotal + (balance ? parseFloat(balance) : 0)
    if (finalTotal > 0) {
      setTotalAmountWords(numberToWords(finalTotal))
    } else {
      setTotalAmountWords('')
    }
  }, [items, balance])

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

  const fetchNextBillNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('bill_number')
        .order('bill_number', { ascending: false })
        .limit(1)

      if (error) throw error

      const nextNum = data && data.length > 0 ? data[0].bill_number + 1 : 1
      setNextBillNumber(nextNum)
    } catch (error) {
      console.error('Error fetching bill number:', error)
      setNextBillNumber(1)
    }
  }

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
    let billId: number | null = null

    try {
      console.log('Creating bill with data:', {
        billNumber: nextBillNumber,
        billType,
        partyName,
        billDate,
        totalAmount,
        itemsCount: items.length
      })

      // Get the latest bill number globally (not per type) to avoid duplicates
      const { data: latestBill, error: latestError } = await supabase
        .from('bills')
        .select('bill_number')
        .order('bill_number', { ascending: false })
        .limit(1)

      if (latestError) {
        console.error('Error fetching latest bill number:', latestError)
        throw latestError
      }

      const actualBillNumber = latestBill && latestBill.length > 0 ? latestBill[0].bill_number + 1 : 1
      console.log('Using global bill number:', actualBillNumber, '(was:', nextBillNumber, 'for type:', billType, ')')

      const billData = {
        bill_number: actualBillNumber,
        bill_type: billType,
        party_name: partyName,
        bill_date: billDate,
        total_amount: totalAmount,
        total_amount_words: totalAmountWords,
        bank_name: billType === 'pakki' ? bankName : null,
        bank_ifsc: billType === 'pakki' ? bankIFSC : null,
        bank_account: billType === 'pakki' ? bankAccount : null,
        vehicle_number: vehicleNumber || null,
        balance: balance ? parseFloat(balance) : null,
        notes: notes || null
      }

      console.log('Bill data to insert:', billData)

      const { data: billResult, error: billError } = await supabase
        .from('bills')
        .insert([billData])
        .select()

      console.log('Bill insert result:', billResult)
      if (billError) {
        console.error('Bill insert error details:', billError)
        throw billError
      }

      billId = billResult[0].id
      console.log('Created bill with ID:', billId)

      // Create bill items
      const itemsToInsert = items.map(item => ({
        bill_id: billId,
        particular: item.particular || '',
        qty_bags: item.qty_bags || null,
        weight_kg: item.weight_kg || null,
        rate: item.rate || null,
        amount: item.amount || null
      }))

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Items insert error:', itemsError)
        throw itemsError
      }

      toast.success(`Bill created successfully! (${billType})`)

      console.log(`Redirecting to bill view: /bills/${billId} for ${billType} bill`)

      // Redirect to bill view for both kacchi and pakki bills
      window.location.href = `/bills/${billId}`
    } catch (error) {
      console.error('Error creating bill:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Error message:', error.message)
        toast.error(`Failed to create bill: ${error.message}`)
      } else {
        toast.error('Failed to create bill - check console for details')
      }

      // If bill was created but items failed, clean up
      if (billId && error) {
        try {
          await supabase.from('bills').delete().eq('id', billId)
          console.log('Cleaned up failed bill creation')
        } catch (cleanupError) {
          console.error('Failed to cleanup:', cleanupError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Responsive Back Button */}
      <div className="mb-4 md:mb-6">
        <Link href="/bills">
          <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Back to Bills
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {/* Form Section */}
        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Create New Bill</CardTitle>
              <CardDescription className="text-sm md:text-base">Fill in the bill details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Bill Type */}
              <div className="space-y-2">
                <Label className="text-sm md:text-base">Bill Type</Label>
                <Select value={billType} onValueChange={handleBillTypeChange}>
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
                  <Input value={`${billType === 'kacchi' ? 'K' : 'P'}${String(nextBillNumber || 0).padStart(3, '0')}`} disabled className="bg-muted text-sm md:text-base" />
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

              {/* Balance */}
              <div className="space-y-2">
                <Label className="text-sm md:text-base">Balance (₹)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  step="0.01"
                  className="text-sm md:text-base"
                />
              </div>

              {/* Bank Details (Only for Pakki bills) */}
              {billType === 'pakki' && (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Label className="text-sm md:text-base font-semibold">Bank Details</Label>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBankDetails(!showBankDetails)}
                        className="text-xs md:text-sm"
                      >
                        {showBankDetails ? 'Hide' : 'Show'} Bank Details
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleSaveBankDetails}
                        className="text-xs md:text-sm"
                      >
                        + Save Bank
                      </Button>
                    </div>
                  </div>

                  {showBankDetails && (
                    <div className="space-y-3 md:space-y-4 p-3 md:p-4 border rounded-lg bg-gray-50">
                      {/* Saved Bank Details Selector */}
                      {savedBankDetails.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">Use Saved Bank Details</Label>
                          <Select onValueChange={(value) => loadBankDetails(savedBankDetails[parseInt(value)])}>
                            <SelectTrigger className="text-sm md:text-base">
                              <SelectValue placeholder="Select from saved banks..." />
                            </SelectTrigger>
                            <SelectContent>
                              {savedBankDetails.map((bank, index) => (
                                <SelectItem key={bank.id || index} value={index.toString()}>
                                  {bank.bank_name} - {bank.bank_account}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

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

              {/* Total Amount */}
              <div className="space-y-2">
                <Label className="text-sm md:text-base">Total Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  className="text-sm md:text-base"
                />
                <p className="text-xs text-muted-foreground">You can edit this field manually</p>
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
                {loading ? 'Creating Bill...' : 'Create Bill'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="mt-6 md:mt-0">
          <BillPreview
            billType={billType}
            billNumber={`${billType === 'kacchi' ? 'K' : 'P'}${String(nextBillNumber || 0).padStart(3, '0')}`}
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
  )
}

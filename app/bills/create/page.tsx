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
import { supabase, Bill, BillItem, FIXED_PRODUCTS, COMPANY_INFO, SavedBankDetail, numberToWords } from '@/lib/supabase'
import BillPreview from '@/components/bill-preview'
import BillItemForm from '@/components/bill-item-form'
import { PartySearch } from '@/components/party-search'
import { GSTToggle } from '@/components/gst-toggle'

export const dynamic = 'force-dynamic'

export default function CreateBillPage() {
  // Bill Type & Header
  const [billType, setBillType] = useState<'kacchi' | 'pakki'>('pakki')
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [nextBillNumber, setNextBillNumber] = useState<string | null>(null)

  // Party Information
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null)
  const [partyName, setPartyName] = useState('')
  const [partyGst, setPartyGst] = useState('')

  // Vehicle & Balance
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [balance, setBalance] = useState('')

  // GST Settings
  const [isGstEnabled, setIsGstEnabled] = useState(false)
  const [cgstPercent, setCgstPercent] = useState(0)
  const [igstPercent, setIgstPercent] = useState(0)

  // Bank Details
  const [bankName, setBankName] = useState('KARNATAKA BANK LTD.')
  const [bankIFSC, setBankIFSC] = useState('KARB0000729')
  const [bankAccount, setBankAccount] = useState('7292000100047001')
  const [showBankDetails, setShowBankDetails] = useState(true)
  const [savedBankDetails, setSavedBankDetails] = useState<SavedBankDetail[]>([])

  // Items & Calculations
  const [items, setItems] = useState<Partial<BillItem>[]>([])
  const [itemsTotal, setItemsTotal] = useState(0)
  const [gstTotal, setGstTotal] = useState(0)
  const [grandTotal, setGrandTotal] = useState(0)
  const [totalAmountWords, setTotalAmountWords] = useState('')

  // Additional Fields
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchNextBillNumber()
    fetchSavedBankDetails()
  }, [])

  // Auto-format vehicle number to uppercase
  useEffect(() => {
    if (vehicleNumber) {
      setVehicleNumber(vehicleNumber.toUpperCase())
    }
  }, [vehicleNumber])

  // Auto-calculate totals when items or GST change
  useEffect(() => {
    const calculatedItemsTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
    setItemsTotal(calculatedItemsTotal)

    if (billType === 'pakki' && isGstEnabled) {
      const cgstAmount = (calculatedItemsTotal * cgstPercent) / 100
      const igstAmount = (calculatedItemsTotal * igstPercent) / 100
      const calculatedGstTotal = cgstAmount + igstAmount
      setGstTotal(calculatedGstTotal)

      const balanceAmount = balance ? parseFloat(balance) : 0
      const calculatedGrandTotal = calculatedItemsTotal + calculatedGstTotal + balanceAmount
      setGrandTotal(calculatedGrandTotal)

      if (calculatedGrandTotal > 0) {
        setTotalAmountWords(numberToWords(calculatedGrandTotal))
      }
    } else {
      const balanceAmount = balance ? parseFloat(balance) : 0
      const calculatedGrandTotal = calculatedItemsTotal + balanceAmount
      setGrandTotal(calculatedGrandTotal)
      setGstTotal(0)

      if (calculatedGrandTotal > 0) {
        setTotalAmountWords(numberToWords(calculatedGrandTotal))
      }
    }
  }, [items, isGstEnabled, cgstPercent, igstPercent, balance, billType])

  const fetchNextBillNumber = async () => {
    // Simplified approach: just use default values
    // Bill numbers will be properly generated when saving
    const fallback = billType === 'pakki' ? 'P001' : 'K001'
    setNextBillNumber(fallback)
  }

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
    fetchNextBillNumber()

    // Reset GST when switching to Kacchi
    if (value === 'kacchi') {
      setIsGstEnabled(false)
    }
  }

  const handlePartySelect = (partyId: number | null, name: string) => {
    setSelectedPartyId(partyId)
    setPartyName(name)

    // Fetch party GST if party is selected
    if (partyId) {
      supabase
        .from('parties')
        .select('gst_number')
        .eq('id', partyId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setPartyGst(data.gst_number || '')
          }
        })
    } else {
      setPartyGst('')
    }
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

      if (saveError) throw saveError

      // Refresh saved bank details
      await fetchSavedBankDetails()
      toast.success('Bank details saved successfully!')
    } catch (error) {
      console.error('Error saving bank details:', error)
      toast.error('Failed to save bank details')
    }
  }

  const loadBankDetails = (bank: SavedBankDetail) => {
    setBankName(bank.bank_name)
    setBankIFSC(bank.bank_ifsc)
    setBankAccount(bank.bank_account)
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
    if (!selectedPartyId || !partyName.trim()) {
      toast.error('Please select a party')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.particular?.trim()) {
        toast.error(`Item ${i + 1}: Please enter a product name`)
        return
      }

      const isPaddy = item.particular?.toLowerCase().includes('paddy')
      if (isPaddy && (!item.weight_kg || item.weight_kg <= 0)) {
        toast.error(`Item ${i + 1} (${item.particular}): Weight is required for paddy`)
        return
      }

      if (!item.rate || item.rate <= 0) {
        toast.error(`Item ${i + 1} (${item.particular}): Please enter a valid rate`)
        return
      }

      if (!item.amount || item.amount <= 0) {
        toast.error(`Item ${i + 1} (${item.particular}): Amount calculation failed. Please check your inputs.`)
        return
      }
    }

    if (billType === 'pakki' && isGstEnabled && !COMPANY_INFO.gst) {
      toast.error('Company GST number is required for GST bills')
      return
    }

    console.log('Starting bill creation process...')
    console.log('Bill type:', billType)
    console.log('Items count:', items.length)
    console.log('Selected party:', selectedPartyId, partyName)
    setLoading(true)
    let billId: number | null = null

    try {
      // Generate fresh bill number before saving
      let billNumber = nextBillNumber
      if (!billNumber || billNumber === 'P001' || billNumber === 'K001') {
        try {
          const prefix = billType === 'pakki' ? 'P' : 'K'
          const { data } = await supabase
            .from('bills')
            .select('bill_number')
            .ilike('bill_number', `${prefix}%`)
            .order('bill_number', { ascending: false })
            .limit(1)

          let nextNumber = 1
          if (data && data.length > 0 && data[0].bill_number) {
            const billNumStr = data[0].bill_number
            if (billNumStr && billNumStr.startsWith(prefix)) {
              const numPart = billNumStr.substring(1)
              const currentNumber = parseInt(numPart, 10)
              if (!isNaN(currentNumber)) {
                nextNumber = currentNumber + 1
              }
            }
          }
          billNumber = `${prefix}${nextNumber.toString().padStart(3, '0')}`
        } catch (error) {
          // Use fallback if query fails
          billNumber = billType === 'pakki' ? 'P001' : 'K001'
        }
      }

      const billData = {
        bill_number: billNumber,
        bill_type: billType,
        party_id: selectedPartyId,
        bill_date: billDate,
        total_amount: grandTotal,
        total_amount_words: totalAmountWords,
        vehicle_number: vehicleNumber || null,
        balance: balance ? parseFloat(balance) : 0,
        // GST fields
        is_gst_enabled: isGstEnabled,
        company_gst_number: isGstEnabled ? COMPANY_INFO.gst : null,
        party_gst_number: isGstEnabled ? partyGst : null,
        cgst_percent: isGstEnabled ? cgstPercent : 0,
        igst_percent: isGstEnabled ? igstPercent : 0,
        sgst_percent: 0, // Always 0 since we removed SGST
        cgst_amount: isGstEnabled ? (itemsTotal * cgstPercent) / 100 : 0,
        igst_amount: isGstEnabled ? (itemsTotal * igstPercent) / 100 : 0,
        sgst_amount: 0, // Always 0 since we removed SGST
        gst_total: gstTotal,
        // Bank details
        bank_name: billType === 'pakki' ? bankName : null,
        bank_ifsc: billType === 'pakki' ? bankIFSC : null,
        bank_account: billType === 'pakki' ? bankAccount : null,
        notes: notes || null
      }

      const { data: billResult, error: billError } = await supabase
        .from('bills')
        .insert([billData])
        .select()

      if (billError) {
        console.error('Bill insert error:', billError)
        console.error('Bill data being inserted:', billData)
        throw billError
      }

      billId = billResult[0].id
      console.log('Bill created successfully with ID:', billId)

      // Create bill items
      const itemsToInsert = items.map(item => ({
        bill_id: billId,
        particular: item.particular || '',
        qty_bags: item.qty_bags || null,
        weight_kg: item.weight_kg || null,
        rate: item.rate || null,
        amount: item.amount || null
      }))

      console.log('Items to insert:', itemsToInsert)

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Items insert error:', itemsError)
        throw itemsError
      }

      console.log('Bill items created successfully')

      toast.success(`Bill created successfully! (${billType})`)
      window.location.href = `/bills/${billId}`
    } catch (error) {
      console.error('Error creating bill:', error)
      toast.error('Failed to create bill')

      // If bill was created but items failed, clean up
      if (billId) {
        try {
          await supabase.from('bills').delete().eq('id', billId)
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

              {/* 1. BILL TYPE SELECTION */}
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

              {/* 2. BILL HEADER SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Bill No.</Label>
                  <Input value={nextBillNumber || ''} disabled className="bg-muted text-sm md:text-base" />
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

              {/* 3. PARTY INFORMATION SECTION */}
              <PartySearch
                value={partyName}
                onChange={handlePartySelect}
                required
              />

              {/* 4. VEHICLE & BALANCE SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Vehicle Number</Label>
                  <Input
                    placeholder="e.g., MH-12-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
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
              </div>

              {/* 5. GST NUMBER SECTION (PAKKI ONLY) */}
              {billType === 'pakki' && (
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">GST Number</Label>
                  <Input
                    value={COMPANY_INFO.gst}
                    disabled
                    className="bg-muted text-sm md:text-base"
                  />
                </div>
              )}

              {/* 6. BANK DETAILS SECTION (PAKKI ONLY) */}
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

                      {/* Bank Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">Bank Name</Label>
                          <Input
                            placeholder="e.g., KARNATAKA BANK LTD."
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">IFSC Code</Label>
                          <Input
                            placeholder="e.g., KARB0000729"
                            value={bankIFSC}
                            onChange={(e) => setBankIFSC(e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
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
                    </div>
                  )}
                </div>
              )}

              {/* 7. ITEMS SECTION */}
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

                {/* Items Sub Total */}
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-sm">
                    <span className="font-medium">Sub Total: ₹{itemsTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 8. GST TOGGLE SECTION (PAKKI ONLY) */}
              {billType === 'pakki' && (
                <GSTToggle
                  isEnabled={isGstEnabled}
                  onToggle={setIsGstEnabled}
                  cgstPercent={cgstPercent}
                  igstPercent={igstPercent}
                  onPercentChange={(type, value) => {
                    if (type === 'cgst') setCgstPercent(value)
                    else if (type === 'igst') setIgstPercent(value)
                  }}
                  itemsTotal={itemsTotal}
                  partyGst={partyGst}
                  onPartyGstChange={setPartyGst}
                />
              )}

              {/* 9. TOTALS SECTION */}
              <div className="space-y-3 md:space-y-4 p-3 md:p-4 border rounded-lg bg-blue-50">
                <Label className="text-sm md:text-base font-semibold">Totals</Label>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items Total:</span>
                    <span>₹{itemsTotal.toFixed(2)}</span>
                  </div>
                  {billType === 'pakki' && isGstEnabled && (
                    <div className="flex justify-between text-sm">
                      <span>GST Total:</span>
                      <span>₹{gstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {balance && parseFloat(balance) !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Balance:</span>
                      <span>₹{parseFloat(balance).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Amount in Words</Label>
                  <Input
                    placeholder="Auto-generated from grand total"
                    value={totalAmountWords}
                    onChange={(e) => setTotalAmountWords(e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              {/* 10. NOTES */}
              <div className="space-y-2">
                <Label className="text-sm md:text-base">Notes</Label>
                <Input
                  placeholder="Add any additional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>

              {/* 11. CREATE BILL BUTTON */}
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
            billNumber={nextBillNumber || ''}
            billDate={billDate}
            partyName={partyName}
            partyGst={isGstEnabled ? partyGst : undefined}
            vehicleNumber={vehicleNumber}
            balance={balance ? parseFloat(balance) : undefined}
            bankName={billType === 'pakki' ? bankName : undefined}
            bankIFSC={billType === 'pakki' ? bankIFSC : undefined}
            bankAccount={billType === 'pakki' ? bankAccount : undefined}
            showBankDetails={showBankDetails}
            items={items}
            itemsTotal={itemsTotal}
            gstEnabled={isGstEnabled}
            cgstPercent={isGstEnabled ? cgstPercent : 0}
            igstPercent={isGstEnabled ? igstPercent : 0}
            gstTotal={gstTotal}
            grandTotal={grandTotal}
            totalAmountWords={totalAmountWords}
          />
        </div>
      </div>
    </div>
  )
}

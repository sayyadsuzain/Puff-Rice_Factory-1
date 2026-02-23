import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import { BillItem, FIXED_PRODUCTS } from '@/lib/supabase'

interface BillItemFormProps {
  index: number
  item: Partial<BillItem>
  onUpdate: (item: Partial<BillItem>) => void
  onRemove: () => void
}

export default function BillItemForm({ index, item, onUpdate, onRemove }: BillItemFormProps) {
  const handleParticulaChange = (value: string) => {
    onUpdate({ ...item, particular: value })
  }

  const handleQtyChange = (value: string) => {
    const qty_bags = value ? parseInt(value) : null
    const newItem = { ...item, qty_bags }

    // Auto-calculate amount if both qty_bags and rate exist
    if (qty_bags && newItem.rate) {
      newItem.amount = qty_bags * newItem.rate
    }

    onUpdate(newItem)
  }

  const handleWeightChange = (value: string) => {
    onUpdate({ ...item, weight_kg: value ? parseFloat(value) : null })
  }

  const handleRateChange = (value: string) => {
    const rate = value ? parseFloat(value) : null
    const newItem = { ...item, rate }

    // Auto-calculate amount if both qty_bags and rate exist
    if (newItem.qty_bags && rate) {
      newItem.amount = newItem.qty_bags * rate
    }

    onUpdate(newItem)
  }

  const handleAmountChange = (value: string) => {
    onUpdate({ ...item, amount: value ? parseFloat(value) : null })
  }

  return (
    <Card className="p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
        <div className="flex-1 space-y-3">
          {/* Product/Particular */}
          <div className="space-y-2">
            <Label className="text-xs md:text-sm">Product (Type or Select)</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={item.particular === undefined ? '' : item.particular} onValueChange={handleParticulaChange}>
                <SelectTrigger className="flex-1 text-sm md:text-base">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {FIXED_PRODUCTS.map(product => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Custom"
                value={item.particular || ''}
                onChange={(e) => handleParticulaChange(e.target.value)}
                className="flex-1 text-sm md:text-base"
              />
            </div>
          </div>

          {/* Quantity and Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">QTY (Bags)</Label>
              <Input
                type="number"
                placeholder="0"
                value={item.qty_bags || ''}
                onChange={(e) => handleQtyChange(e.target.value)}
                min="0"
                className="text-sm md:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Weight (kg)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={item.weight_kg || ''}
                onChange={(e) => handleWeightChange(e.target.value)}
                step="0.01"
                min="0"
                className="text-sm md:text-base"
              />
            </div>
          </div>

          {/* Rate and Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Rate (₹)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={item.rate || ''}
                onChange={(e) => handleRateChange(e.target.value)}
                step="0.01"
                min="0"
                className="text-sm md:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Amount (₹)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={item.amount || ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                step="0.01"
                min="0"
                className="text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="self-start sm:self-center h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

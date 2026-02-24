'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface GSTToggleProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  cgstPercent: number
  igstPercent: number
  onPercentChange: (type: 'cgst' | 'igst', value: number) => void
  itemsTotal: number
  partyGst?: string
  onPartyGstChange?: (gst: string) => void
}

export function GSTToggle({
  isEnabled,
  onToggle,
  cgstPercent,
  igstPercent,
  onPercentChange,
  itemsTotal,
  partyGst = '',
  onPartyGstChange
}: GSTToggleProps) {
  const [localPartyGst, setLocalPartyGst] = useState(partyGst)

  // Calculate GST amounts
  const cgstAmount = isEnabled ? (itemsTotal * cgstPercent) / 100 : 0
  const igstAmount = isEnabled ? (itemsTotal * igstPercent) / 100 : 0
  const gstTotal = cgstAmount + igstAmount

  useEffect(() => {
    setLocalPartyGst(partyGst)
  }, [partyGst])

  const handleToggle = (enabled: boolean) => {
    onToggle(enabled)
  }

  const handlePercentChange = (type: 'cgst' | 'igst', value: string) => {
    const numValue = parseFloat(value) || 0
    onPercentChange(type, Math.min(Math.max(numValue, 0), 100))
  }

  const handlePartyGstChange = (value: string) => {
    const upperValue = value.toUpperCase()
    setLocalPartyGst(upperValue)
    onPartyGstChange?.(upperValue)
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* GST Toggle Section */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center space-x-3">
          <Label className="text-sm md:text-base font-semibold">GST Bill</Label>
          <div className="text-xs text-muted-foreground">
            Enable GST calculations and party GST display
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-green-600"
        />
      </div>

      {/* GST Details Section (Conditional) */}
      {isEnabled && (
        <div className="space-y-3 md:space-y-4 p-3 md:p-4 border rounded-lg bg-blue-50">
          <Label className="text-sm md:text-base font-semibold">GST Details</Label>

          {/* Party GST Number */}
          <div className="space-y-2">
            <Label className="text-xs md:text-sm">Party GST Number</Label>
            <Input
              placeholder="e.g., 27ABCDE1234F1Z5"
              value={localPartyGst}
              onChange={(e) => handlePartyGstChange(e.target.value)}
              maxLength={15}
              className="text-sm md:text-base"
            />
          </div>

          {/* GST Percentages Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">CGST (%)</Label>
              <Input
                type="number"
                placeholder="0"
                value={cgstPercent || ''}
                onChange={(e) => handlePercentChange('cgst', e.target.value)}
                step="0.01"
                min="0"
                max="100"
                className="text-sm md:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">IGST (%)</Label>
              <Input
                type="number"
                placeholder="0"
                value={igstPercent || ''}
                onChange={(e) => handlePercentChange('igst', e.target.value)}
                step="0.01"
                min="0"
                max="100"
                className="text-sm md:text-base"
              />
            </div>
          </div>

          {/* GST Amounts Display */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 pt-2 border-t">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">CGST Amount</Label>
              <div className="text-sm font-medium">₹{cgstAmount.toFixed(2)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">IGST Amount</Label>
              <div className="text-sm font-medium">₹{igstAmount.toFixed(2)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">GST Total</Label>
              <div className="text-sm font-bold text-blue-600">₹{gstTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

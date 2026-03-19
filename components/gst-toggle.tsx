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
  originalPartyGst?: string
  shouldUpdatePartyGst?: boolean
  onShouldUpdatePartyGstChange?: (update: boolean) => void
  selectedPartyId?: number | null
}

export function GSTToggle({
  isEnabled,
  onToggle,
  cgstPercent,
  igstPercent,
  onPercentChange,
  itemsTotal,
  partyGst = '',
  onPartyGstChange,
  originalPartyGst = '',
  shouldUpdatePartyGst = false,
  onShouldUpdatePartyGstChange,
  selectedPartyId
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
        <div className="space-y-3 md:space-y-4 p-3 md:p-4 border rounded-lg bg-blue-50/50">
          <div className="flex items-center justify-between">
            <Label className="text-sm md:text-base font-bold text-blue-900 uppercase tracking-tight">GST Details</Label>
          </div>

          {/* Party GST Number */}
          <div className="space-y-2.5">
            <Label className="text-[10px] md:text-xs font-black text-indigo-800 uppercase tracking-widest pl-1">Party GST Number</Label>
            <div className="relative group">
              <Input
                placeholder="27ABCDE1234F1Z5"
                value={localPartyGst}
                onChange={(e) => handlePartyGstChange(e.target.value)}
                maxLength={15}
                className="h-10 md:h-11 bg-white font-mono uppercase font-bold border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all pl-9"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black">GST</span>
              </div>
            </div>

            {/* SYNC PROMPT: Relocated here as requested */}
            {localPartyGst !== originalPartyGst && selectedPartyId && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in slide-in-from-top-1">
                <input
                  type="checkbox"
                  id="sync-gst-toggle"
                  checked={shouldUpdatePartyGst}
                  onChange={(e) => onShouldUpdatePartyGstChange?.(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <Label htmlFor="sync-gst-toggle" className="text-[11px] font-bold text-amber-900 cursor-pointer">
                  Update this GST number in Party Settings?
                </Label>
              </div>
            )}
          </div>

          {/* GST Percentages Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] md:text-xs font-black text-indigo-800 uppercase tracking-widest pl-1">CGST (%)</Label>
              <Input
                type="number"
                placeholder="0"
                value={cgstPercent || ''}
                onChange={(e) => handlePercentChange('cgst', e.target.value)}
                step="0.01"
                min="0"
                max="100"
                className="h-10 md:h-11 bg-white font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] md:text-xs font-black text-indigo-800 uppercase tracking-widest pl-1">IGST (%)</Label>
              <Input
                type="number"
                placeholder="0"
                value={igstPercent || ''}
                onChange={(e) => handlePercentChange('igst', e.target.value)}
                step="0.01"
                min="0"
                max="100"
                className="h-10 md:h-11 bg-white font-bold"
              />
            </div>
          </div>

          {/* GST Amounts Display */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 border-t border-indigo-100">
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-gray-500 uppercase">CGST Amt</Label>
              <div className="text-sm font-black text-gray-900">₹{cgstAmount.toFixed(2)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-gray-500 uppercase">IGST Amt</Label>
              <div className="text-sm font-black text-gray-900">₹{igstAmount.toFixed(2)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-blue-600 uppercase">GST Total</Label>
              <div className="text-sm font-black text-blue-700">₹{gstTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

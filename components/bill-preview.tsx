'use client'

import { useRef, useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { BillItem, COMPANY_INFO, formatDate, numberToWords } from '@/lib/supabase'

interface BillPreviewProps {
  billType: 'kacchi' | 'pakki'
  billNumber: string
  billDate: string
  partyName: string
  partyGst?: string
  vehicleNumber?: string
  balance?: number
  bankName?: string
  bankIFSC?: string
  bankAccount?: string
  showBankDetails?: boolean
  items: Partial<BillItem>[]
  itemsTotal: number
  gstEnabled?: boolean
  cgstPercent?: number
  igstPercent?: number
  gstTotal?: number
  grandTotal: number
  totalAmountWords: string
}

// Natural bill dimensions (210mm x 297mm at 96dpi ≈ 794x1122px)
const BILL_W = 794
const BILL_H = 1122

export default function BillPreview({
  billType,
  billNumber,
  billDate,
  partyName,
  partyGst,
  vehicleNumber,
  balance,
  bankName,
  bankIFSC,
  bankAccount,
  showBankDetails = true,
  items,
  itemsTotal,
  gstEnabled = false,
  cgstPercent = 0,
  igstPercent = 0,
  gstTotal = 0,
  grandTotal,
  totalAmountWords
}: BillPreviewProps) {
  const isKacchi = billType === 'kacchi'
  const outerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const calculate = () => {
      const el = outerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      const pad = 16
      const scaleW = (width - pad * 2) / BILL_W
      const scaleH = (height - pad * 2) / BILL_H
      const s = Math.max(0.25, scaleW)
      setScale(s)
    }

    // Initial calculation after DOM renders
    const timer = setTimeout(calculate, 50)
    const observer = new ResizeObserver(calculate)
    if (outerRef.current) observer.observe(outerRef.current)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  // The wrapper div is sized to exactly the scaled bill dimensions
  // The bill is absolutely positioned inside and scaled from top-left
  const scaledW = Math.round(BILL_W * scale)
  const scaledH = Math.round(BILL_H * scale)

  return (
    <div
      ref={outerRef}
      style={{
        width: '100%',
        height: '100%',
        overflowX: 'hidden', overflowY: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: '#f3f4f6',
        borderRadius: '0.75rem',
        border: '1px dashed #d1d5db',
        padding: '8px',
      }}
    >
      {/* Sized to scaled dimensions so no layout overflow */}
      <div style={{ width: scaledW, height: scaledH, position: 'relative', flexShrink: 0 }}>
        {/* Bill at natural size, scaled from top-left corner */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: BILL_W,
            height: BILL_H,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
        >
          <Card
            className="p-8 bg-white text-black relative shadow-2xl border-none"
            style={{ fontFamily: 'Arial, sans-serif', width: BILL_W, height: BILL_H, margin: 0, overflow: 'hidden' }}
          >
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&display=swap" rel="stylesheet" />

            {/* Watermark — Centered and subtly improved */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 opacity-[0.05]"
              style={{ 
                fontSize: '280px', 
                fontWeight: 900, 
                letterSpacing: '20px', 
                fontFamily: '"Playfair Display", serif', 
                color: '#c0c0c0',
                textAlign: 'center',
                lineHeight: 1
              }}
            >
              MS
            </div>

            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="mb-4">
                <div className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-1">
                  {!isKacchi && <div>Subject to Sangli Jurisdiction</div>}
                </div>
                <div className="grid grid-cols-3 items-start mb-2">
                  <div className="text-[10px]"></div>
                  <div className="text-center">
                    <div className="inline-block bg-red-600 text-white px-8 py-1 rounded-sm text-[11px] font-black tracking-widest shadow-sm uppercase">
                      {isKacchi ? 'CASH / CREDIT MEMO' : 'CREDIT MEMO'}
                    </div>
                  </div>
                  <div className="text-right text-[10px] space-y-0.5 font-bold text-gray-800">
                    <div className="uppercase">Contact:</div>
                    <div>9860022450</div>
                    <div>9561420666</div>
                  </div>
                </div>
                <h1 className="text-center text-5xl font-bold text-red-600 tracking-tight mb-1 mt-1" style={{ textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.05)' }}>{COMPANY_INFO.name}</h1>
                <div className="text-center text-[10px] tracking-widest text-gray-700 font-bold uppercase">{COMPANY_INFO.address}</div>
                {!isKacchi && (
                  <p className="text-center text-[11px] font-bold mt-1 text-gray-800 tracking-widest uppercase">GST IN : {COMPANY_INFO.gst}</p>
                )}
                <div className="border-b-[4px] border-red-600 mt-2"></div>
                <div className="border-b-[1px] border-red-600 mt-[2px]"></div>
              </div>

              {/* Bill/Party Info Row */}
              <div className="grid grid-cols-2 gap-8 mb-4">
                <div className="border border-gray-300 rounded-md py-2 px-3">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Bill To:</div>
                  <div className="text-base font-bold leading-tight">
                    <span className="text-gray-500 text-xs">M/s. </span>
                    <span className="border-b border-dotted border-gray-400 min-w-[200px] inline-block">{partyName || '---'}</span>
                  </div>
                  {(vehicleNumber || (!isKacchi && gstEnabled && partyGst)) && (
                    <div className="text-[10px] mt-2 flex flex-col gap-0.5 font-bold text-gray-700 uppercase">
                      {vehicleNumber && <div>Vehicle: {vehicleNumber}</div>}
                      {!isKacchi && gstEnabled && partyGst && <div>GST: {partyGst}</div>}
                    </div>
                  )}
                </div>
                <div className="border border-gray-300 rounded-md py-2 px-3 flex flex-col justify-center">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-1 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Bill No:</span>
                    <span className="text-base font-black text-red-600">{billNumber || '---'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Date:</span>
                    <span className="text-sm font-bold">{billDate ? formatDate(billDate) : '--/--/----'}</span>
                  </div>
                </div>
              </div>

              {/* Table — Sized rigidly */}
              <div className="flex-1">
                <table className="w-full text-[13px] border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-50 border-t border-b border-gray-400">
                      <th className="border-l border-r border-gray-400 p-2 text-left font-black uppercase text-[10px] tracking-tight w-[45%]">Particulars</th>
                      <th className="border-l border-r border-gray-400 p-2 text-center font-black uppercase text-[10px] tracking-tight w-[12%]">Qty</th>
                      <th className="border-l border-r border-gray-400 p-2 text-center font-black uppercase text-[10px] tracking-tight w-[15%]">Weight (Kg)</th>
                      <th className="border-l border-r border-gray-400 p-2 text-center font-black uppercase text-[10px] tracking-tight w-[13%]">Rate</th>
                      <th className="border-l border-r border-gray-400 p-2 text-right font-black uppercase text-[10px] tracking-tight w-[15%]">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="border-b border-gray-400">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border border-gray-300 p-8 text-center text-gray-400 italic">
                          Add items to preview
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => {
                        const isPaddyItem = item.particular?.toLowerCase().includes('paddy')
                        return (
                          <tr key={idx} className="h-7 border-none">
                            <td className="border-l border-r border-gray-300 px-2 py-1 font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                              {item.particular || ''}
                            </td>
                            <td className="border-l border-r border-gray-200 px-1 py-1 text-center font-mono text-[11px]">{item.qty_bags || ''}</td>
                            <td className="border-l border-r border-gray-200 px-1 py-1 text-center font-mono text-[11px]">{item.weight_kg || ''}</td>
                            <td className="border-l border-r border-gray-200 px-1 py-1 text-center font-mono text-[11px]">{item.rate?.toFixed(2) || ''}</td>
                            <td className="border-l border-r border-gray-200 px-2 py-1 text-right font-bold font-mono text-[11px]">{item.amount?.toFixed(2) || ''}</td>
                          </tr>
                        )
                      })
                    )}
                    {items.length < 18 && Array.from({ length: 18 - items.length }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="h-7 border-none">
                        <td className="border-l border-r border-gray-100 p-1 text-gray-50 select-none">-</td>
                        <td className="border-l border-r border-gray-100 p-1 text-center text-gray-50 select-none">-</td>
                        <td className="border-l border-r border-gray-100 p-1 text-center text-gray-50 select-none">-</td>
                        <td className="border-l border-r border-gray-100 p-1 text-center text-gray-50 select-none">-</td>
                        <td className="border-l border-r border-gray-100 p-1 text-right text-gray-50 select-none">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary Section — Integrated into the same grid structure */}
                <div className="grid grid-cols-[45%_55%] border-b border-gray-400">
                  <div className="border-l p-3 bg-gray-50/30">
                    <div className="font-bold text-[9px] uppercase text-gray-500 mb-1">R.S. IN WORDS:</div>
                    <div className="text-[10px] font-black leading-tight italic uppercase text-gray-800">
                      {grandTotal > 0 ? `${totalAmountWords} Only.` : 'Zero Rupees Only.'}
                    </div>
                  </div>
                  <div className="border-l border-r border-gray-400">
                    <div className="flex justify-between items-center px-4 py-1.5 border-b border-gray-200 text-xs">
                      <span className="font-bold text-gray-500 uppercase">Sub Total</span>
                      <span className="font-bold font-mono">₹{itemsTotal.toFixed(2)}</span>
                    </div>
                    {!isKacchi && gstEnabled && gstTotal > 0 && (
                      <div className="px-4 py-1 border-b border-gray-200 bg-blue-50/20">
                        {cgstPercent > 0 && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-gray-500 italic">CGST @ {cgstPercent}%</span>
                            <span className="font-bold">₹{(itemsTotal * cgstPercent / 100).toFixed(2)}</span>
                          </div>
                        )}
                        {igstPercent > 0 && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-gray-500 italic">IGST @ {igstPercent}%</span>
                            <span className="font-bold">₹{(itemsTotal * igstPercent / 100).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {balance != null && balance > 0 && (
                      <div className="flex justify-between items-center px-4 py-1 border-b border-gray-200 text-xs">
                        <span className="font-bold text-gray-500 uppercase">Old Balance</span>
                        <span className="font-bold text-orange-600 font-mono">₹{balance.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
                      <span className="text-base font-black italic tracking-tighter">GRAND TOTAL</span>
                      <span className="text-xl font-black text-red-600">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer — Absolute bottom of the A4 layout */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end pb-4">
                <div className="text-left w-1/2">
                  {!isKacchi && showBankDetails && bankName && bankIFSC && bankAccount && (
                    <div className="text-[10px] border-l-2 border-red-100 pl-3">
                      <div className="font-black text-red-600 mb-1 uppercase tracking-widest text-[9px]">Bank Selection:</div>
                      <div className="space-y-0.5 font-bold uppercase text-gray-700">
                        <div className="flex gap-1"><span>BANK:</span><span className="text-gray-900">{bankName}</span></div>
                        <div className="flex gap-1"><span>IFSC:</span><span className="text-gray-900">{bankIFSC}</span></div>
                        <div className="flex gap-1"><span>A/C:</span><span className="text-gray-900">{bankAccount}</span></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-red-600 mb-12 uppercase tracking-widest italic opacity-80">For {COMPANY_INFO.name}</div>
                  <div className="text-[10px] font-black w-48 ml-auto text-center border-t-2 border-slate-900 pt-1 uppercase tracking-tighter text-slate-900">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

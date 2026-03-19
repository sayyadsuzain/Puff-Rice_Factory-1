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
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />

            {/* Watermark — Centered and subtly improved */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 opacity-[0.04]"
              style={{ 
                fontSize: '500px', 
                fontWeight: 900, 
                fontFamily: '"Inter", sans-serif', 
                color: '#000',
                textAlign: 'center',
                lineHeight: 1
              }}
            >
              MS
            </div>

            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="mb-2">
                <div className="grid grid-cols-3 items-start mb-1">
                  <div className="text-[10px]"></div>
                  <div className="text-center">
                    <div className="inline-block bg-red-600 text-white px-8 py-1 rounded-sm text-[11px] font-black tracking-widest uppercase">
                      CASH / CREDIT MEMO
                    </div>
                  </div>
                  <div className="text-right text-[10px] pr-2 space-y-0.5 font-bold text-gray-800 leading-none">
                    <div className="uppercase tracking-widest text-[9px] text-gray-500 mb-1">Contact:</div>
                    <div className="font-mono text-[11px] font-black">9860022450</div>
                    <div className="font-mono text-[11px] font-black">9561420666</div>
                  </div>
                </div>

                <h1 className="text-center text-7xl font-[900] text-red-600 tracking-tight leading-none mb-1 mt-4 uppercase font-sans">
                  {COMPANY_INFO.name}
                </h1>
                <div className="text-center text-[10px] tracking-[0.2em] text-gray-600 font-bold uppercase font-sans">
                  {COMPANY_INFO.address}
                </div>
                
                <div className="border-b-[4px] border-red-600 mt-4"></div>
              </div>

              {/* Bill/Party Info Block — Clean Unified row */}
              <div className="border-x border-t border-gray-400 mt-2">
                <div className="grid grid-cols-[1fr_200px_180px] border-b border-gray-400">
                  <div className="p-2 border-r border-gray-400 flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase">FROM :</span>
                    <span className="text-[14px] font-[900] uppercase text-gray-800">{COMPANY_INFO.name}</span>
                  </div>
                  <div className="p-2 border-r border-gray-400 flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-500 uppercase">NO.</span>
                    <span className="text-[20px] font-[900] text-red-600 italic tracking-tighter">{billNumber || '---'}</span>
                  </div>
                  <div className="p-2 flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase">DATE :</span>
                    <span className="text-[16px] font-[900] italic">{billDate ? formatDate(billDate) : '18/3/2026'}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-white flex flex-col gap-3 border-b border-gray-400">
                  <div className="flex items-baseline">
                    <span className="text-[16px] font-black mr-2 text-gray-800">M/s.</span>
                    <span className="text-[18px] font-bold flex-1 border-b border-dotted border-gray-400 pb-0.5 text-gray-900">
                      {partyName || 'Suzain Sayyad'}
                      <span className="text-gray-300 ml-1">........................................................................</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline">
                      <span className="text-[11px] text-gray-500 mr-2 font-black uppercase tracking-wider">Vehicle No.:</span>
                      <span className="text-[14px] font-black text-gray-900">{vehicleNumber || 'MH10BR9001'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="flex-1 flex flex-col">
                <table className="w-full text-[13px] border-collapse border-l border-r border-gray-400">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-400 h-10">
                      <th className="border-r border-gray-400 px-3 text-left font-black uppercase text-[10px] w-[40%]">PARTICULARS</th>
                      <th className="border-r border-gray-400 px-2 text-center font-black uppercase text-[10px] w-[14%]">QTY. BAGS</th>
                      <th className="border-r border-gray-400 px-2 text-center font-black uppercase text-[10px] w-[18%] text-nowrap">WEIGHT IN KG.</th>
                      <th className="border-r border-gray-400 px-2 text-center font-black uppercase text-[10px] w-[13%]">RATE</th>
                      <th className="px-3 text-right font-black uppercase text-[10px] w-[15%]">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="h-9 font-sans hover:bg-gray-50/30 transition-colors">
                        <td className="border-r border-gray-200 px-4 py-1.5 font-bold text-gray-800 uppercase text-[14px]">
                          {item.particular || ''}
                        </td>
                        <td className="border-r border-gray-200 px-2 py-1.5 text-center font-black text-[14px]">{item.qty_bags || ''}</td>
                        <td className="border-r border-gray-200 px-2 py-1.5 text-center font-black text-[14px]">{item.weight_kg || ''}</td>
                        <td className="border-r border-gray-200 px-2 py-1.5 text-center font-black text-[14px]">{item.rate?.toFixed(2) || ''}</td>
                        <td className="px-4 py-1.5 text-right font-black text-[14px]">{item.amount?.toFixed(2) || ''}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 16 - items.length) }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="h-9">
                        <td className="border-r border-gray-100 p-1"></td>
                        <td className="border-r border-gray-100 p-1"></td>
                        <td className="border-r border-gray-100 p-1"></td>
                        <td className="border-r border-gray-100 p-1"></td>
                        <td className="p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary Totals */}
                <div className="grid grid-cols-[1.2fr_1fr] border border-gray-400">
                  <div className="p-4 flex flex-col justify-end bg-gray-50/20">
                    <div className="font-black text-[10px] uppercase text-gray-400 mb-1">RS. IN WORDS:</div>
                    <div className="text-[14px] font-bold leading-tight italic text-gray-800">
                      {grandTotal > 0 ? `${totalAmountWords} Only.` : 'Zero Rupees Only.'}
                    </div>
                  </div>
                  
                  <div className="border-l border-gray-400 flex flex-col font-sans">
                    <div className="flex justify-between items-center px-5 py-2.5 border-b border-gray-200 text-[13px] font-bold">
                      <span className="text-gray-500 uppercase tracking-tighter">SUB TOTAL</span>
                      <span className="text-[15px] font-black">{itemsTotal.toFixed(2)}</span>
                    </div>
                    
                    {balance != null && (
                      <div className="flex justify-between items-center px-5 py-2.5 border-b border-gray-300 text-[13px] font-black italic">
                        <span className="text-red-500 uppercase">BALANCE</span>
                        <span className="text-[15px] text-red-500">{balance.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-5 py-5 bg-gray-50/40">
                      <span className="text-[24px] font-black italic tracking-tighter">TOTAL</span>
                      <div className="text-right">
                        <span className="text-[32px] font-[900] text-gray-900 tracking-tight">
                          {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="h-[5px] bg-gray-900 mt-1 rounded-full w-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="mt-8 flex flex-col items-end pr-6 pb-6">
                <div className="text-[16px] font-black text-red-600 mb-20 uppercase tracking-[0.15em] font-sans">
                  FOR {COMPANY_INFO.name}
                </div>
                <div className="w-64 border-t border-gray-400 pt-2 text-center">
                  <span className="font-black text-[12px] uppercase text-gray-700 tracking-widest">Auth. Signatory</span>
                </div>
              </div>

              {/* Bank Details (A4 Float) */}
              {showBankDetails && bankName && bankAccount && (
                <div className="absolute bottom-10 left-10 text-[10px] border border-gray-200 p-4 rounded-xl bg-white shadow-xl z-20 min-w-[240px]">
                  <div className="font-black text-red-600 mb-3 uppercase tracking-widest text-[9px] border-b pb-1">Primary Bank Details</div>
                  <div className="space-y-2 font-bold text-gray-700">
                    <div className="flex justify-between"><span className="text-gray-400 uppercase text-[8px]">Bank:</span><span className="text-gray-900">{bankName}</span></div>
                    {bankIFSC && <div className="flex justify-between"><span className="text-gray-400 uppercase text-[8px]">IFSC:</span><span className="text-gray-900">{bankIFSC}</span></div>}
                    <div className="flex justify-between"><span className="text-gray-400 uppercase text-[8px]">Account:</span><span className="text-gray-900">{bankAccount}</span></div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

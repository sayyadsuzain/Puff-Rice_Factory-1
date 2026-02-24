import { Card } from '@/components/ui/card'
import { BillItem, COMPANY_INFO, formatDate } from '@/lib/supabase'

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

  return (
    <Card className="p-8 bg-white text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4">
          {isKacchi ? (
            <>
              <div className="text-center">
                <div className="inline-block bg-red-600 text-white px-4 py-1 rounded text-sm font-bold mb-2">
                  CASH / CREDIT MEMO
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-2">
                <div className="text-xs text-gray-600">Subject to Sangli Jurisdiction</div>
              </div>
              <div className="text-center">
                <div className="inline-block bg-red-600 text-white px-4 py-1 rounded text-sm font-bold mb-2">
                  CREDIT MEMO
                </div>
              </div>
            </>
          )}

          <h1 className="text-center text-3xl font-bold text-red-600 mb-1">{COMPANY_INFO.name}</h1>
          <p className="text-center text-xs">{COMPANY_INFO.address}</p>
          {!isKacchi && (
            <p className="text-center text-xs mt-1">GST IN : {COMPANY_INFO.gst}</p>
          )}
        </div>

        {/* Bill Info */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-bold">From :</div>
            <div className="text-gray-600">{COMPANY_INFO.name}</div>
          </div>
          <div className="text-right">
            <div className="font-bold">No.</div>
            <div className="text-lg font-bold text-red-600">{billNumber}</div>
          </div>
          <div className="text-right">
            <div className="font-bold">Date :</div>
            <div className="font-bold">{formatDate(billDate)}</div>
          </div>
        </div>

        {/* Party Details */}
        <div className="border-t border-b border-gray-300 py-2">
          <div className="text-sm">
            <span className="font-bold">M/s. </span>
            <span>{partyName || '_'.repeat(40)}</span>
          </div>
          {(vehicleNumber || (!isKacchi && gstEnabled && partyGst)) && (
            <div className="text-sm mt-1 flex justify-between">
              {vehicleNumber && (
                <div>
                  <span className="font-bold">Vehicle No.: </span>
                  <span>{vehicleNumber}</span>
                </div>
              )}
              {!isKacchi && gstEnabled && partyGst && (
                <div className={vehicleNumber ? "text-right" : ""}>
                  <span className="font-bold">GST No.: </span>
                  <span>{partyGst}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items Table */}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 p-2 text-left font-bold">Particulars</th>
              <th className="border border-gray-400 p-2 text-center font-bold w-16">Qty. Bags</th>
              <th className="border border-gray-400 p-2 text-center font-bold w-20">Weight in Kg.</th>
              <th className="border border-gray-400 p-2 text-center font-bold w-16">Rate</th>
              <th className="border border-gray-400 p-2 text-right font-bold w-24">Amount ₹</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-gray-300 p-3 text-center text-gray-400">
                  Add items to preview
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const isPaddyItem = item.particular?.toLowerCase().includes('paddy')
                return (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-2">
                      <div>{item.particular || ''}</div>
                      {isPaddyItem && item.weight_kg && (
                        <div className="text-xs text-blue-600">
                          ({item.weight_kg}kg total)
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">{item.qty_bags || ''}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {isPaddyItem ? `${item.weight_kg || ''}kg` : (item.weight_kg || '')}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {item.rate ? `${item.rate.toFixed(2)} ${isPaddyItem ? '₹/kg' : '₹'}` : ''}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">{item.amount?.toFixed(2) || ''}</td>
                  </tr>
                )
              })
            )}
            {/* Empty rows for spacing */}
            {items.length < 3 && (
              Array.from({ length: 3 - items.length }).map((_, idx) => (
                <tr key={`empty-${idx}`}>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-bold">Rs. in Words:</div>
            <div className="text-xs mt-1">{totalAmountWords || ''}</div>
          </div>
          <div className="text-right">
            <div className="font-bold mb-1">SUB TOTAL</div>
            <div className="text-lg font-bold border-t border-black pt-1">₹ {itemsTotal.toFixed(2)}</div>

            {!isKacchi && gstEnabled && gstTotal > 0 && (
              <>
                <div className="mt-3 mb-2">
                  {cgstPercent > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">CGST @ {cgstPercent}%</span>
                      <span className="font-bold text-sm">₹ {(itemsTotal * cgstPercent / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {igstPercent > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">IGST @ {igstPercent}%</span>
                      <span className="font-bold text-sm">₹ {(itemsTotal * igstPercent / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-t border-gray-300 pt-2 mt-1">
                    <span className="text-sm font-semibold">GST Total:</span>
                    <span className="font-bold text-sm">₹ {gstTotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {balance && balance > 0 && (
              <>
                <div className="font-bold mb-1 mt-3 text-sm">BALANCE</div>
                <div className="text-lg font-bold mb-2">₹ {balance.toFixed(2)}</div>
              </>
            )}

            <div className="border-t-2 border-black pt-2 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">TOTAL</span>
                <span className="text-xl font-bold">₹ {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Company signature below total */}
            {!isKacchi && (
              <div className="text-xs font-bold text-red-600 mt-4 mb-4">
                For M S TRADING COMPANY
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex items-center justify-between text-xs">
          <div className="flex gap-4">
            <span className="font-bold text-red-600">Thank you</span>
          </div>
        </div>

        {/* Bank Details for Pakki */}
        {!isKacchi && showBankDetails && bankName && bankIFSC && bankAccount && (
          <div className="border-t pt-3 text-xs space-y-1">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="font-bold text-red-600">BANK : {bankName}</div>
                <div>IFSC CODE NO. : {bankIFSC}</div>
                <div>S. B. No. : {bankAccount}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-600">Contact:</div>
                <div>9860022450</div>
                <div>9561420666</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

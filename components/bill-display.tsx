import { Bill, BillItem, COMPANY_INFO, formatDate } from '@/lib/supabase'
import { Card } from '@/components/ui/card'

interface BillDisplayProps {
  bill: Bill
  items: BillItem[]
  partyName?: string
  partyGst?: string
}

export default function BillDisplay({ bill, items, partyName, partyGst }: BillDisplayProps) {
  const isKacchi = bill.bill_type === 'kacchi'

  // Debug logging
  console.log('BillDisplay received bill:', bill)
  console.log('Bill balance:', bill.balance, 'type:', typeof bill.balance)
  console.log('Bill gst_total:', bill.gst_total, 'type:', typeof bill.gst_total)
  console.log('Is Kacchi:', isKacchi, 'GST enabled:', bill.is_gst_enabled)

  return (
    <Card className="bill-display max-w-4xl mx-auto bg-white shadow-lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4">
          {isKacchi ? (
            <div className="text-center">
              <div className="inline-block bg-red-600 text-white px-4 py-1 rounded text-sm font-bold mb-2">
                CASH / CREDIT MEMO
              </div>
            </div>
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
            <div className="text-lg font-bold text-red-600">{bill.bill_type === 'kacchi' ? 'K' : 'P'}{String(bill.bill_number).padStart(3, '0')}</div>
          </div>
          <div className="text-right">
            <div className="font-bold">Date :</div>
            <div className="font-bold">{formatDate(bill.bill_date)}</div>
          </div>
        </div>

        {/* Party Details */}
        <div className="border-t border-b border-gray-300 py-2">
          <div className="text-sm">
            <span className="font-bold">M/s. </span>
            <span>{partyName || '_'.repeat(40)}</span>
          </div>
          {(bill.vehicle_number || (!isKacchi && partyGst)) && (
            <div className="text-sm mt-1 flex justify-between">
              {bill.vehicle_number && (
                <div>
                  <span className="font-bold">Vehicle No.: </span>
                  <span>{bill.vehicle_number}</span>
                </div>
              )}
              {!isKacchi && partyGst && (
                <div className={bill.vehicle_number ? "text-right" : ""}>
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
            {items.map((item, idx) => {
              const isPaddyItem = item.particular?.toLowerCase().includes('paddy')
              return (
                <tr key={idx}>
                  <td className="border border-gray-300 p-2">
                    <div>{item.particular}</div>
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
            })}
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

        {/* Total Section */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-bold">Rs. in Words:</div>
            <div className="text-xs mt-1">{bill.total_amount_words || ''}</div>
          </div>
          <div className="text-right">
            <div className="font-bold mb-1">SUB TOTAL</div>
            <div className="text-lg font-bold border-t border-black pt-1">₹ {bill.total_amount.toFixed(2)}</div>

            {/* GST Section - Only show if GST is enabled and total > 0 */}
            {!isKacchi && bill.is_gst_enabled && bill.gst_total > 0 && (
              <div className="mt-3 mb-2">
                {bill.cgst_percent > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm">CGST @ {bill.cgst_percent}%</span>
                    <span className="font-bold text-sm">₹ {bill.cgst_amount.toFixed(2)}</span>
                  </div>
                )}
                {bill.igst_percent > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm">IGST @ {bill.igst_percent}%</span>
                    <span className="font-bold text-sm">₹ {bill.igst_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 border-t border-gray-300 pt-2 mt-1">
                  <span className="text-sm font-semibold">GST Total:</span>
                  <span className="font-bold text-sm">₹ {bill.gst_total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Balance Section - Only show if balance > 0 */}
            {bill.balance && bill.balance > 0 && (
              <div className="mt-3">
                <div className="font-bold mb-1 text-sm">BALANCE</div>
                <div className="text-lg font-bold mb-2">₹ {bill.balance.toFixed(2)}</div>
              </div>
            )}

            <div className="border-t-2 border-black pt-2 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">TOTAL</span>
                <span className="text-xl font-bold">₹ {(bill.total_amount + (bill.gst_total || 0) + (bill.balance || 0)).toFixed(2)}</span>
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
        {!isKacchi && bill.bank_name && bill.bank_ifsc && bill.bank_account && (
          <div className="border-t pt-3 text-xs space-y-1">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="font-bold text-red-600">BANK : {bill.bank_name}</div>
                <div>IFSC CODE NO. : {bill.bank_ifsc}</div>
                <div>S. B. No. : {bill.bank_account}</div>
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

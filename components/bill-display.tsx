import { Bill, BillItem, COMPANY_INFO, formatDate } from '@/lib/supabase'
import { numberToWords } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface BillDisplayProps {
  bill: Bill
  items: BillItem[]
  partyName?: string
  partyGst?: string
}

export default function BillDisplay({ bill, items, partyName, partyGst }: BillDisplayProps) {
  const isKacchi = bill.bill_type === 'kacchi'

  // Calculate the final grand total
  const grandTotal = (bill.total_amount || 0) + (bill.gst_total || 0) + (bill.balance || 0)

  // Calculate total in words for the grand total
  const totalInWords = numberToWords(grandTotal)

  const handlePrint = () => {
    window.open(`/api/bill-pdf?id=${bill.id}`, '_blank')
  }

  return (
    <div
      className="bill-display"
      style={{
        maxWidth: '896px',
        margin: '0 auto',
        backgroundColor: 'white',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        padding: '16px'
      }}
    >
      {/* Print Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print PDF
        </Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid #dc2626', paddingBottom: '16px' }}>
          {isKacchi ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '4px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                CASH / CREDIT MEMO
              </div>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Subject to Sangli Jurisdiction</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  CREDIT MEMO
                </div>
              </div>
            </div>
          )}

          <h1 style={{
            textAlign: 'center',
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#dc2626',
            marginBottom: '4px'
          }}>
            {COMPANY_INFO.name}
          </h1>
          <p style={{ textAlign: 'center', fontSize: '12px' }}>
            {COMPANY_INFO.address}
          </p>
          {!isKacchi && (
            <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
              GST IN : {COMPANY_INFO.gst}
            </p>
          )}
        </div>

        {/* Bill Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '14px', marginTop: '16px' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>From :</div>
            <div style={{ color: '#6b7280' }}>{COMPANY_INFO.name}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>No.</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>{(() => {
              const billNum = String(bill.bill_number)
              if (billNum.startsWith('P') || billNum.startsWith('K')) {
                const numPart = billNum.substring(1)
                return billNum.charAt(0) + numPart.padStart(3, '0')
              } else {
                const prefix = bill.bill_type === 'kacchi' ? 'K' : 'P'
                return `${prefix}${billNum.padStart(3, '0')}`
              }
            })()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold' }}>Date :</div>
            <div style={{ fontWeight: 'bold' }}>{formatDate(bill.bill_date)}</div>
          </div>
        </div>

        {/* Party Details */}
        <div style={{
          borderTop: '1px solid #d1d5db',
          borderBottom: '1px solid #d1d5db',
          padding: '8px 0',
          marginTop: '16px'
        }}>
          <div style={{ fontSize: '14px' }}>
            <span style={{ fontWeight: 'bold' }}>M/s. </span>
            <span>{partyName || '_'.repeat(40)}</span>
          </div>
          {(bill.vehicle_number || (!isKacchi && partyGst)) && (
            <div style={{ fontSize: '14px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              {bill.vehicle_number && (
                <div>
                  <span style={{ fontWeight: 'bold' }}>Vehicle No.: </span>
                  <span>{bill.vehicle_number}</span>
                </div>
              )}
              {!isKacchi && partyGst && (
                <div style={bill.vehicle_number ? { textAlign: 'right' } : {}}>
                  <span style={{ fontWeight: 'bold' }}>GST No.: </span>
                  <span>{partyGst}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginTop: '16px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e5e7eb' }}>
              <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Particulars</th>
              <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '64px' }}>Qty. Bags</th>
              <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '80px' }}>Weight in Kg.</th>
              <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '64px' }}>Rate</th>
              <th style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '96px' }}>Amount ₹</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const isPaddyItem = item.particular?.toLowerCase().includes('paddy')
              return (
                <tr key={idx}>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>
                    <div>{item.particular}</div>
                    {isPaddyItem && item.weight_kg && (
                      <div style={{ fontSize: '11px', color: '#2563eb' }}>
                        ({item.weight_kg}kg total)
                      </div>
                    )}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'center' }}>{item.qty_bags || ''}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'center' }}>
                    {isPaddyItem ? `${item.weight_kg || ''}kg` : (item.weight_kg || '')}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'center' }}>
                    {item.rate ? `${item.rate.toFixed(2)} ${isPaddyItem ? '₹/kg' : '₹'}` : ''}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'right' }}>{item.amount?.toFixed(2) || ''}</td>
                </tr>
              )
            })}
            {items.length < 3 && Array.from({ length: 3 - items.length }).map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', marginTop: '16px' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Rs. in Words:</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>{totalInWords}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>SUB TOTAL</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', borderTop: '1px solid black', paddingTop: '4px' }}>₹ {(bill.total_amount || 0).toFixed(2)}</div>

            {!isKacchi && bill.is_gst_enabled && (bill.gst_total || 0) > 0 && (
              <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                {(bill.cgst_percent || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                    <span style={{ fontSize: '13px' }}>CGST @ {(bill.cgst_percent || 0)}%</span>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>₹ {(bill.cgst_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(bill.igst_percent || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                    <span style={{ fontSize: '13px' }}>IGST @ {(bill.igst_percent || 0)}%</span>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>₹ {(bill.igst_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderTop: '1px solid #d1d5db', paddingTop: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>GST Total:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '13px' }}>₹ {(bill.gst_total || 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            {bill.balance != null && bill.balance > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>BALANCE</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>₹ {bill.balance.toFixed(2)}</div>
              </div>
            )}

            <div style={{ borderTop: '2px solid black', paddingTop: '8px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>TOTAL</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>₹ {((bill.total_amount || 0) + (bill.gst_total || 0) + (bill.balance || 0)).toFixed(2)}</span>
              </div>
            </div>

            {!isKacchi && (
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626', marginTop: '16px', marginBottom: '16px' }}>
                For M S TRADING COMPANY
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid black', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontWeight: 'bold', color: '#dc2626' }}>Thank you</span>
          </div>
        </div>

        {/* Bank Details for Pakki */}
        {!isKacchi && bill.bank_name && bill.bank_ifsc && bill.bank_account && (
          <div style={{ borderTop: '1px solid black', paddingTop: '12px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#dc2626' }}>BANK : {bill.bank_name}</div>
                <div>IFSC CODE NO. : {bill.bank_ifsc}</div>
                <div>S. B. No. : {bill.bank_account}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#dc2626' }}>Contact:</div>
                <div>9860022450</div>
                <div>9561420666</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

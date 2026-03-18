import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── number→words helper (same as bill-pdf/route.ts) ────────────────────────
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertToWords(n: number): string {
    if (n === 0) return ''
    if (n < 10) return ones[n]
    if (n < 20) return teens[n - 10]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertToWords(n % 100) : '')
    if (n < 100000) return convertToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertToWords(n % 1000) : '')
    if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertToWords(n % 100000) : '')
    return convertToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertToWords(n % 10000000) : '')
  }

  const rupees = Math.floor(num)
  const paise = Math.round((num - rupees) * 100)
  let result = convertToWords(rupees) + ' Rupees'
  if (paise > 0) result += ' and ' + convertToWords(paise) + ' Paise'
  result += ' Only'
  return result
}

// ─── Bill HTML generator (same layout as bill-pdf/route.ts) ─────────────────
function generateBillHTML(bill: any, items: any[]): string {
  const isKacchi = bill.bill_type === 'kacchi'
  const partyName = bill.parties?.name || ''
  const partyGst = bill.parties?.gst_number || ''
  const grandTotal = (bill.total_amount || 0) + (bill.gst_total || 0) + (bill.balance || 0)
  const totalInWords = numberToWords(grandTotal)
  const companyGst = '27CQIPS6685K1ZU'

  const billNum = String(bill.bill_number)
  let formattedBillNo: string
  if (billNum.startsWith('P') || billNum.startsWith('K')) {
    const numPart = billNum.substring(1)
    formattedBillNo = billNum.charAt(0) + numPart.padStart(3, '0')
  } else {
    const prefix = isKacchi ? 'K' : 'P'
    formattedBillNo = `${prefix}${billNum.padStart(3, '0')}`
  }

  const billDateStr = new Date(bill.bill_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'numeric', year: 'numeric',
  })

  const itemRows = items.map((item: any) => {
    const isPaddyItem = item.particular?.toLowerCase().includes('paddy')
    return `
      <tr class="item-row">
        <td>
          <div>${item.particular}</div>
          ${isPaddyItem && item.weight_kg ? `<div style="font-size:10px;color:#2563eb;font-weight:bold;">(${item.weight_kg}kg total)</div>` : ''}
        </td>
        <td style="text-align:center;">${item.qty_bags || ''}</td>
        <td style="text-align:center;">${isPaddyItem ? `${item.weight_kg || ''}kg` : (item.weight_kg || '')}</td>
        <td style="text-align:center;">${item.rate ? `${item.rate.toFixed(2)}${isPaddyItem ? ' ₹/kg' : ''}` : ''}</td>
        <td style="text-align:right;font-weight:bold;">${item.amount?.toFixed(2) || ''}</td>
      </tr>`
  }).join('')

  const billBody = `
    <div class="a4-page">
      <div class="watermark-ms">MS</div>
      <div class="content-wrapper">
        <div class="header-top">
          <div class="jurisdiction">${!isKacchi ? 'Subject to Sangli Jurisdiction' : ''}</div>
          <div class="header-grid">
            <div></div>
            <div style="text-align:center;">
              <div class="memo-badge">${isKacchi ? 'CASH / CREDIT MEMO' : 'CREDIT MEMO'}</div>
            </div>
            <div class="contact-info">
              <div style="text-transform:uppercase;">Contact:</div>
              <div>9860022450</div>
              <div>9561420666</div>
            </div>
          </div>
          <h1 class="company-name">M S TRADING COMPANY</h1>
          <div class="company-address">KUPWAD MIDC NEAR NAV KRISHNA VALLEY, PLOT NO L-52</div>
          ${!isKacchi ? `<div class="company-gst">GST IN : ${companyGst}</div>` : ''}
          <div class="red-divider-main"></div>
          <div class="red-divider-sub"></div>
        </div>

        <div class="bill-info-grid">
          <div><div class="info-label">From :</div><div style="font-weight:bold;">M S TRADING COMPANY</div></div>
          <div style="text-align:center;"><div class="info-label">No.</div><div class="bill-no">${formattedBillNo}</div></div>
          <div style="text-align:right;"><div class="info-label">Date :</div><div style="font-weight:bold;font-size:16px;">${billDateStr}</div></div>
        </div>

        <div class="party-details">
          <div class="party-name-row">
            <span style="font-weight:bold;">M/s. </span>
            <span class="party-name-underline">${partyName || '_'.repeat(40)}</span>
          </div>
          ${(bill.vehicle_number || (!isKacchi && partyGst)) ? `
            <div class="vehicle-gst-row">
              ${bill.vehicle_number ? `<div><span style="color:#4b5563;">Vehicle No.: </span><span>${bill.vehicle_number}</span></div>` : '<div></div>'}
              ${!isKacchi && partyGst ? `<div><span style="color:#4b5563;">GST No.: </span><span>${partyGst}</span></div>` : ''}
            </div>` : ''}
        </div>

        <div class="items-table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th style="width:auto;">Particulars</th>
                <th style="width:96px;text-align:center;">Qty. Bags</th>
                <th style="width:112px;text-align:center;">Weight in Kg.</th>
                <th style="width:96px;text-align:center;">Rate</th>
                <th style="width:128px;text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              <tr class="spacer-row">
                <td style="border-bottom:1px solid #9ca3af;"></td>
                <td style="border-bottom:1px solid #9ca3af;"></td>
                <td style="border-bottom:1px solid #9ca3af;"></td>
                <td style="border-bottom:1px solid #9ca3af;"></td>
                <td style="border-bottom:1px solid #9ca3af;"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="form-footer">
          <div class="footer-grid">
            <div class="words-section">
              <div>
                <div style="font-weight:bold;font-size:10px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Rs. in Words:</div>
                <div style="font-size:11px;font-weight:bold;line-height:1.25;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">${totalInWords}</div>
              </div>
            </div>
            <div class="totals-section">
              <div class="total-row">
                <span class="total-label">SUB TOTAL</span>
                <span style="font-weight:bold;">₹ ${(bill.total_amount || 0).toFixed(2)}</span>
              </div>
              ${!isKacchi && bill.is_gst_enabled && (bill.gst_total || 0) > 0 ? `
                <div style="margin-top:4px;border-top:1px solid #f3f4f6;padding-top:4px;">
                  ${(bill.cgst_percent || 0) > 0 ? `<div class="total-row" style="font-size:12px;color:#4b5563;"><span>CGST @ ${bill.cgst_percent}%</span><span style="font-weight:bold;color:black;">₹ ${bill.cgst_amount.toFixed(2)}</span></div>` : ''}
                  ${(bill.igst_percent || 0) > 0 ? `<div class="total-row" style="font-size:12px;color:#4b5563;"><span>IGST @ ${bill.igst_percent}%</span><span style="font-weight:bold;color:black;">₹ ${bill.igst_amount.toFixed(2)}</span></div>` : ''}
                  <div class="total-row" style="font-size:12px;font-weight:bold;padding-top:4px;border-top:1px solid #f3f4f6;margin-top:2px;"><span>GST Total:</span><span>₹ ${bill.gst_total.toFixed(2)}</span></div>
                </div>` : ''}
              ${bill.balance > 0 ? `<div class="total-row" style="margin-top:4px;"><span class="total-label">BALANCE</span><span style="font-weight:bold;color:#ea580c;">₹ ${bill.balance.toFixed(2)}</span></div>` : ''}
              <div class="grand-total-section">
                <div class="grand-total-row">
                  <span class="grand-total-label">TOTAL</span>
                  <span class="grand-total-value">₹ ${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="signature-area">
            <div class="bank-info">
              ${(!isKacchi && bill.bank_name) ? `
                <div class="bank-title">BANK DETAILS:</div>
                <div class="bank-grid">
                  <div style="display:flex;gap:8px;"><span>BANK :</span><span style="color:#111827;">${bill.bank_name}</span></div>
                  <div style="display:flex;gap:8px;"><span>IFSC CODE NO. :</span><span style="color:#111827;">${bill.bank_ifsc}</span></div>
                  <div style="display:flex;gap:8px;"><span>S. B. No. :</span><span style="color:#111827;">${bill.bank_account}</span></div>
                </div>` : ''}
            </div>
            <div class="signatory-box">
              <div class="signatory-title">For M S TRADING COMPANY</div>
              <div class="signatory-line">Auth. Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bill.bill_number} - ${partyName}</title>
  <style>
    @page { size: A4; margin: 0; }
    html, body { height: 100%; margin: 0; padding: 0; -webkit-print-color-adjust: exact; box-sizing: border-box; }
    .a4-page { position: relative; width: 210mm; height: 297mm; margin: 0 auto; background-color: white; padding: 8mm 12mm; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; }
    .watermark-ms { position: absolute; top: 45%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; user-select: none; z-index: 0; opacity: 0.12; font-size: 300px; font-weight: 900; letter-spacing: 20px; color: #c0c0c0; }
    .content-wrapper { position: relative; z-index: 10; display: grid; grid-template-rows: auto auto auto 1fr auto; height: 100%; width: 100%; gap: 0; }
    .header-top { width: 100%; margin-bottom: 2px; }
    .jurisdiction { text-align: center; font-size: 8px; color: #6b7280; font-weight: bold; text-transform: uppercase; margin-bottom: 1px; }
    .header-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; }
    .memo-badge { display: inline-block; background-color: #dc2626; color: white; padding: 2px 20px; border-radius: 1px; font-size: 9px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
    .contact-info { text-align: right; font-size: 8px; font-weight: bold; color: #1f2937; }
    .company-name { text-align: center; font-size: 34px; font-weight: bold; color: #dc2626; letter-spacing: -0.02em; margin: 0; font-family: Georgia, serif; }
    .company-address { text-align: center; font-size: 9px; color: #4b5563; margin: 2px 0 1px; }
    .company-gst { text-align: center; font-size: 10px; color: #1f2937; font-weight: bold; }
    .red-divider-main { height: 3px; background: #dc2626; margin: 4px 0 1px; }
    .red-divider-sub { height: 1px; background: #dc2626; margin-bottom: 4px; }
    .bill-info-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; padding: 4px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 4px; }
    .info-label { font-size: 9px; color: #6b7280; text-transform: uppercase; font-weight: bold; }
    .bill-no { font-size: 18px; font-weight: 900; color: #dc2626; }
    .party-details { padding: 4px 0; margin-bottom: 4px; }
    .party-name-row { display: flex; align-items: baseline; gap: 4px; font-size: 14px; margin-bottom: 4px; }
    .party-name-underline { border-bottom: 1px solid #374151; flex: 1; font-weight: bold; }
    .vehicle-gst-row { display: flex; justify-content: space-between; font-size: 11px; color: #374151; }
    .items-table-container { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .items-table { width: 100%; border-collapse: collapse; height: 100%; }
    .items-table thead tr { background: #f9fafb; }
    .items-table th { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #374151; padding: 4px 6px; border: 0.5px solid #d1d5db; }
    .items-table td { font-size: 12px; padding: 3px 6px; border: 0.5px solid #e5e7eb; vertical-align: top; }
    .item-row td { border-bottom: 0.5px solid #f3f4f6; }
    .spacer-row { height: 100%; }
    .spacer-row td { height: 100%; }
    .form-footer { padding-top: 6px; }
    .footer-grid { display: grid; grid-template-columns: 1fr auto; gap: 16px; margin-bottom: 8px; align-items: end; }
    .words-section { font-size: 11px; }
    .totals-section { min-width: 200px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 2px 0; }
    .total-label { font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 11px; }
    .grand-total-section { border-top: 2px solid #dc2626; margin-top: 4px; padding-top: 4px; }
    .grand-total-row { display: flex; justify-content: space-between; align-items: center; }
    .grand-total-label { font-size: 14px; font-weight: 900; color: #dc2626; }
    .grand-total-value { font-size: 20px; font-weight: 900; color: #16a34a; }
    .signature-area { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px; border-top: 0.5px solid #e5e7eb; padding-top: 6px; }
    .bank-info { font-size: 10px; color: #4b5563; }
    .bank-title { font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 9px; }
    .bank-grid { display: flex; flex-direction: column; gap: 2px; font-size: 9px; }
    .signatory-box { text-align: right; }
    .signatory-title { font-size: 9px; font-weight: bold; color: #dc2626; margin-bottom: 20px; text-transform: uppercase; }
    .signatory-line { font-size: 8px; font-weight: 500; width: 140px; margin-left: auto; text-align: center; border-top: 0.5px solid #9ca3af; padding-top: 2px; color: #4b5563; }
  </style>
</head>
<body>${billBody}</body>
</html>`
}

// ─── API Handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const billId = searchParams.get('id')

  if (!billId) {
    return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 })
  }

  try {
    const authHeader = request.headers.get('Authorization')
    const queryToken = searchParams.get('token')
    let authToken = authHeader
    if (!authToken && queryToken) authToken = `Bearer ${queryToken}`

    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: { get(name: string) { return cookieStore.get(name)?.value } },
      global: { headers: authToken ? { Authorization: authToken } : undefined },
    })

    // Fetch bill
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', parseInt(billId))
      .single()

    if (billError || !bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    // Fetch party
    if (bill.party_id) {
      const { data: party } = await supabase
        .from('parties')
        .select('name, gst_number')
        .eq('id', bill.party_id)
        .single()
      if (party) bill.parties = party
    }

    // Fetch items
    const { data: items } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', parseInt(billId))
      .order('id')

    // Generate HTML inline (no self-fetch)
    const fullHTML = generateBillHTML(bill, items || [])

    // Convert to PDF with Puppeteer
    let browser
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless as any,
        ignoreHTTPSErrors: true,
      })

      const page = await browser.newPage()
      await page.setContent(fullHTML, { waitUntil: 'domcontentloaded' })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      })

      // Build a safe filename: replace "/" with "-"
      const partyName = bill.parties?.name || 'Bill'
      const safeBillNumber = String(bill.bill_number).replace(/\//g, '-')
      const safePartyName = partyName.replace(/[/\\?%*:|"<>]/g, '-').trim()
      const filename = `${safeBillNumber} - ${safePartyName}.pdf`

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    } finally {
      if (browser) await browser.close()
    }
  } catch (error) {
    console.error('❌ bill-pdf-download error:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

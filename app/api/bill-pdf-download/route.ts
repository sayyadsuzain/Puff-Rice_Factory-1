import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseUrl, supabaseAnonKey, COMPANY_INFO } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Replicating utility functions from lib/supabase.ts for accuracy
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  })
}

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return ''
    if (n < 10) return ones[n]
    if (n < 20) return teens[n - 10]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '')
  }

  const convert = (n: number): string => {
    if (n === 0) return 'Zero'
    let result = ''
    if (n >= 10000000) { result += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000 }
    if (n >= 100000) { result += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh '; n %= 100000 }
    if (n >= 1000) { result += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand '; n %= 1000 }
    if (n > 0) result += convertLessThanThousand(n)
    return result.trim()
  }

  const rupees = Math.floor(num)
  const paise = Math.round((num - rupees) * 100)
  let result = convert(rupees) + ' Rupees'
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise'
  result += ' Only'
  return result
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const billId = searchParams.get('id')
  if (!billId) return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 })

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

    const { data: bill, error: billError } = await supabase.from('bills').select('*').eq('id', parseInt(billId)).single()
    if (billError || !bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

    const { data: party } = bill.party_id ? await supabase.from('parties').select('name, gst_number').eq('id', bill.party_id).single() : { data: null }
    const { data: items } = await supabase.from('bill_items').select('*').eq('bill_id', parseInt(billId)).order('id')

    const isKacchi = bill.bill_type === 'kacchi'
    const partyName = party?.name || ''
    const partyGst = party?.gst_number || ''
    const grandTotal = (bill.total_amount || 0) + (bill.gst_total || 0) + (bill.balance || 0)
    const totalInWords = numberToWords(grandTotal)
    
    // Exact HTML Cloning from BillDisplay.tsx
    const billItems = items || []
    const itemRows = billItems.map((item) => {
      const isPaddyItem = item.particular?.toLowerCase().includes('paddy')
      return `
        <tr style="height: 32px; border: none;">
          <td style="border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; padding: 6px 8px; font-weight: 500;">
            <div>${item.particular || ''}</div>
            ${isPaddyItem && item.weight_kg ? `<div style="font-size: 10px; color: #2563eb; font-weight: bold;">(${item.weight_kg}kg total)</div>` : ''}
          </td>
          <td style="border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; padding: 6px 8px; text-align: center;">${item.qty_bags || ''}</td>
          <td style="border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; padding: 6px 8px; text-align: center;">${isPaddyItem ? `${item.weight_kg || ''}kg` : (item.weight_kg || '')}</td>
          <td style="border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; padding: 6px 8px; text-align: center;">${item.rate ? item.rate.toFixed(2) : ''}</td>
          <td style="border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; padding: 6px 8px; text-align: right; font-weight: bold;">${item.amount?.toFixed(2) || ''}</td>
        </tr>
      `
    }).join('')

    const emptyRows = Array.from({ length: Math.max(0, 18 - billItems.length) }).map(() => `
      <tr style="height: 32px; border: none;">
        <td style="border-left: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; color: transparent;">-</td>
        <td style="border-left: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; color: transparent;">-</td>
        <td style="border-left: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; color: transparent;">-</td>
        <td style="border-left: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; color: transparent;">-</td>
        <td style="border-left: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; color: transparent;">-</td>
      </tr>
    `).join('')

    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 0; }
          body { 
            margin: 0; padding: 0; 
            font-family: Arial, sans-serif; 
            -webkit-print-color-adjust: exact; 
            background: white;
          }
          .a4-container {
            width: 210mm;
            height: 297mm;
            padding: 15mm;
            box-sizing: border-box;
            position: relative;
            background: white;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .watermark {
            position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); 
            font-size: 320px; font-weight: 900; letter-spacing: 25px; 
            font-family: "Playfair Display", serif; 
            color: #c0c0c0; opacity: 0.06;
            pointer-events: none; z-index: 0;
          }
          .relative-content { position: relative; z-index: 10; display: flex; flex-direction: column; height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div class="a4-container">
          <div class="watermark">MS</div>
          <div class="relative-content">
            <!-- Header Section Cloned from BillDisplay.tsx -->
            <div style="width: 100%; margin-bottom: 8px;">
              <div style="text-align: center; font-size: 10px; color: #6b7280; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
                ${!isKacchi ? 'Subject to Sangli Jurisdiction' : ''}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; items-start; margin-bottom: 8px;">
                <div></div>
                <div style="text-align: center;">
                  <div style="background-color: #dc2626; color: white; padding: 4px 32px; border-radius: 2px; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                    ${isKacchi ? 'CASH / CREDIT MEMO' : 'CREDIT MEMO'}
                  </div>
                </div>
                <div style="text-align: right; font-size: 10px; font-weight: bold; color: #1f2937;">
                  <div style="text-transform: uppercase;">Contact:</div>
                  <div>9860022450</div>
                  <div>9561420666</div>
                </div>
              </div>
              <h1 style="text-align: center; font-size: 48px; font-weight: bold; color: #dc2626; margin: 4px 0; letter-spacing: -1px;">M S TRADING COMPANY</h1>
              <div style="text-align: center; font-size: 10px; font-weight: bold; color: #374151; text-transform: uppercase; letter-spacing: 1px;">KUPWAD MIDC NEAR NAV KRISHNA VALLEY, PLOT NO L-52</div>
              ${!isKacchi ? `<div style="text-align: center; font-size: 11px; font-weight: bold; color: #1f2937; margin-top: 4px;">GST IN : ${COMPANY_INFO.gst}</div>` : ''}
              <div style="border-bottom: 4px solid #dc2626; margin-top: 8px;"></div>
              <div style="border-bottom: 1px solid #dc2626; margin-top: 2px;"></div>
            </div>

            <!-- Bill Info Grid Cloned from BillDisplay.tsx -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: center; padding: 8px 0; margin-bottom: 16px;">
              <div>
                <div style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase;">From :</div>
                <div style="font-weight: bold; font-size: 14px;">M S TRADING COMPANY</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase;">No.</div>
                <div style="font-size: 20px; font-weight: 900; color: #dc2626;">${bill.bill_number}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase;">Date :</div>
                <div style="font-weight: bold; font-size: 16px;">${formatDate(bill.bill_date)}</div>
              </div>
            </div>

            <!-- Party Details Cloned from BillDisplay.tsx -->
            <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; margin-bottom: 24px;">
              <div style="font-size: 16px;"><span style="font-weight: bold;">M/s. </span><span style="border-bottom: 1px dotted #9ca3af; min-width: 300px; display: inline-block;">${partyName}</span></div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 14px; font-weight: 600;">
                ${bill.vehicle_number ? `<div><span style="color: #4b5563; font-weight: bold;">Vehicle No.: </span><span>${bill.vehicle_number}</span></div>` : '<div></div>'}
                ${!isKacchi && partyGst ? `<div><span style="color: #4b5563; font-weight: bold;">GST No.: </span><span>${partyGst}</span></div>` : ''}
              </div>
            </div>

            <!-- Items Table Cloned from BillDisplay.tsx -->
            <div style="flex: 1; min-height: 450px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background-color: #f9fafb; border-top: 1px solid #9ca3af; border-bottom: 1px solid #9ca3af;">
                    <th style="border-left: 1px solid #9ca3af; border-right: 1px solid #9ca3af; padding: 8px; text-align: left; font-weight: 900; text-transform: uppercase; font-size: 12px;">Particulars</th>
                    <th style="border-left: 1px solid #9ca3af; border-right: 1px solid #9ca3af; padding: 8px; text-align: center; font-weight: 900; text-transform: uppercase; font-size: 12px; width: 96px;">Qty. Bags</th>
                    <th style="border-left: 1px solid #9ca3af; border-right: 1px solid #9ca3af; padding: 8px; text-align: center; font-weight: 900; text-transform: uppercase; font-size: 12px; width: 112px;">Weight in Kg.</th>
                    <th style="border-left: 1px solid #9ca3af; border-right: 1px solid #9ca3af; padding: 8px; text-align: center; font-weight: 900; text-transform: uppercase; font-size: 12px; width: 96px;">Rate</th>
                    <th style="border-left: 1px solid #9ca3af; border-right: 1px solid #9ca3af; padding: 8px; text-align: right; font-weight: 900; text-transform: uppercase; font-size: 12px; width: 128px;">Amount</th>
                  </tr>
                </thead>
                <tbody style="border-bottom: 1px solid #9ca3af;">
                  ${itemRows}${emptyRows}
                </tbody>
              </table>
            </div>

            <!-- Footer Section Cloned from BillDisplay.tsx -->
            <div style="margin-top: 16px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <div style="font-weight: bold; font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Rs. in Words:</div>
                  <div style="text-size: 11px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">${totalInWords}</div>
                </div>
                <div style="text-align: right;">
                  <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                    <span style="font-weight: bold; color: #4b5563;">SUB TOTAL</span><span style="font-weight: bold;">₹ ${bill.total_amount.toFixed(2)}</span>
                  </div>
                  ${!isKacchi && bill.is_gst_enabled && (bill.gst_total || 0) > 0 ? `
                    <div style="border-top: 1px solid #f3f4f6; padding-top: 4px; margin-top: 4px;">
                      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4b5563;">
                        <span>GST TOTAL</span><span style="font-weight: bold; color: black;">₹ ${bill.gst_total.toFixed(2)}</span>
                      </div>
                    </div>
                  ` : ''}
                  ${bill.balance > 0 ? `
                    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 4px;">
                      <span style="font-weight: bold; color: #4b5563; text-transform: uppercase;">BALANCE</span>
                      <span style="font-weight: bold; color: #ea580c;">₹ ${bill.balance.toFixed(2)}</span>
                    </div>
                  ` : ''}
                  <div style="border-top: 3px solid black; padding-top: 8px; mt-8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 20px; font-weight: 900; font-style: italic;">TOTAL</span>
                    <span style="font-size: 24px; font-weight: 900;">₹ ${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div style="margin-top: auto; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 8px;">
                <div style="text-align: left; width: 50%;">
                  ${(!isKacchi && bill.bank_name) ? `
                    <div style="font-size: 11px; font-weight: bold; color: #dc2626; margin-bottom: 4px; text-transform: uppercase;">BANK DETAIL S:</div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 2px; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #1f2937;">
                      <div style="display: flex; gap: 8px;"><span>BANK :</span> <span style="color: #000;">${bill.bank_name}</span></div>
                      <div style="display: flex; gap: 8px;"><span>IFSC CODE NO. :</span> <span style="color: #000;">${bill.bank_ifsc}</span></div>
                      <div style="display: flex; gap: 8px;"><span>S. B. NO. :</span> <span style="color: #000;">${bill.bank_account}</span></div>
                    </div>
                  ` : ''}
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 11px; font-weight: bold; color: #dc2626; margin-bottom: 32px; text-transform: uppercase;">For M S TRADING COMPANY</div>
                  <div style="font-size: 10px; font-weight: 500; width: 176px; margin-left: auto; border-top: 1px solid #9ca3af; text-align: center; padding-top: 4px; color: #4b5563;">Auth. Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    let browser
    let step = 'init'
    try {
      step = 'launching browser'
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless as any,
        ignoreHTTPSErrors: true,
      })
      const page = await browser.newPage()
      step = 'setting content'
      await page.setContent(fullHTML, { waitUntil: 'domcontentloaded', timeout: 30000 })
      step = 'generating pdf'
      
      // Match margins from CA reports exactly
      const pdf = await page.pdf({
        format: 'a4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0',
          bottom: '0',
          left: '0',
          right: '0'
        }
      })

      const safeBillNo = String(bill.bill_number).replace(/\//g, '-')
      const filename = `${safeBillNo} - ${partyName}.pdf`
      return new NextResponse(pdf as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
          'Cache-Control': 'no-store, must-revalidate'
        }
      })
    } catch (e: any) {
      console.error(`❌ Puppeteer failed at step [${step}]:`, e)
      return NextResponse.json({ error: 'Failed to generate PDF', details: e.message, at: step }, { status: 500 })
    } finally {
      if (browser) await browser.close()
    }
  } catch (error: any) {
    console.error('❌ bill-pdf-download error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 })
  }
}

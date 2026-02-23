'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { supabase, Bill, BillItem } from '@/lib/supabase'
import { ArrowLeft, Printer, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import BillDisplay from '@/components/bill-display'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { ProtectedRoute } from '@/components/protected-route'

export default function BillDetailPage() {
  const params = useParams()
  const billId = parseInt(params.id as string)
  const [bill, setBill] = useState<Bill | null>(null)
  const [items, setItems] = useState<BillItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBillDetails()
  }, [billId])

  const fetchBillDetails = async () => {
    setLoading(true)
    try {
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single()

      if (billError) throw billError

      setBill(billData)

      const { data: itemsData, error: itemsError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)
        .order('id', { ascending: true })

      if (itemsError) throw itemsError

      setItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching bill details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Loading bill details...</p>
      </div>
    )
  }
  if (!bill) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-600">Bill not found</p>
      </div>
    )
  }

  const handlePrint = () => {
    // Create a new window with the exact bill content and styling
    const printWindow = window.open('', '_blank', 'width=900,height=700')

    if (printWindow) {
      // Get the bill HTML content
      const billElement = document.querySelector('.bill-display') as HTMLElement
      if (billElement) {
        const billHTML = billElement.outerHTML

        // Get all the CSS styles that affect the bill (filtered for compatibility)
        const styles = Array.from(document.styleSheets)
          .map(sheet => {
            try {
              return Array.from(sheet.cssRules)
                .map(rule => {
                  const cssText = rule.cssText
                  // Filter out rules with problematic color functions
                  if (cssText.includes('lab(') ||
                      cssText.includes('lch(') ||
                      cssText.includes('oklab(') ||
                      cssText.includes('oklch(') ||
                      cssText.includes('color(') ||
                      cssText.includes('hwb(')) {
                    return '' // Skip problematic rules
                  }
                  return cssText
                })
                .filter(rule => rule.trim() !== '') // Remove empty rules
                .join('\n')
            } catch (e) {
              return ''
            }
          })
          .join('\n')

        // Create the print page with exact styling
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Bill ${bill?.bill_type === 'kacchi' ? 'K' : 'P'}${String(bill?.bill_number).padStart(3, '0')}</title>
              <meta charset="UTF-8">
              <style>
                /* Import fonts */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

                /* Include all existing styles */
                ${styles}

                /* Override for print window */
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: 'Inter', system-ui, -apple-system, sans-serif;
                  background: white;
                  color: black;
                  line-height: 1.5;
                }

                .bill-display {
                  margin: 0 auto;
                  max-width: none !important;
                  width: 100% !important;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
                  border-radius: 0.5rem !important;
                  border: 1px solid #e5e7eb !important;
                  background: white !important;
                }

                /* Ensure colors print correctly */
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }

                /* Red text should remain red */
                .text-red-600 {
                  color: #dc2626 !important;
                }

                .text-red-500 {
                  color: #ef4444 !important;
                }

                .border-red-600 {
                  border-color: #dc2626 !important;
                }

                /* Table styling */
                table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                }

                th, td {
                  border: 1px solid #d1d5db !important;
                  padding: 8px !important;
                }

                th {
                  background-color: #f9fafb !important;
                  font-weight: bold !important;
                }

                /* Button styling - hide in print */
                button {
                  display: none !important;
                }

                @media print {
                  body {
                    margin: 0;
                    padding: 15mm;
                    background: white !important;
                  }

                  .bill-display {
                    box-shadow: none !important;
                    border: 1px solid #000 !important;
                    margin: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                  }

                  /* Preserve red colors for printing */
                  .text-red-600 {
                    color: #dc2626 !important;
                  }

                  .text-red-500 {
                    color: #ef4444 !important;
                  }

                  .bg-red-600 {
                    background-color: #dc2626 !important;
                    color: white !important;
                  }

                  /* Make sure borders are visible */
                  .border-t,
                  .border-b,
                  .border-l,
                  .border-r {
                    border-color: #000 !important;
                  }

                  .border-red-600 {
                    border-color: #dc2626 !important;
                  }
                }
              </style>
            </head>
            <body>
              <div class="bill-display">
                ${billHTML.replace(/<button[^>]*>.*?<\/button>/g, '')}
              </div>
            </body>
          </html>
        `)

        printWindow.document.close()

        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            // Don't close immediately to allow print dialog
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close()
              }
            }, 1000)
          }, 500)
        }

        // Fallback in case onload doesn't fire
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.print()
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close()
              }
            }, 1000)
          }
        }, 1500)
      } else {
        printWindow.close()
        toast.error('Bill content not found')
      }
    } else {
      toast.error('Please allow popups to print the bill')
    }
  }


  const handleEdit = () => {
    console.log('🚀 EDIT BUTTON CLICKED - Starting redirect process')
    console.log('Edit button clicked, billId:', billId, 'bill:', bill)
    if (!billId || isNaN(billId)) {
      toast.error('Invalid bill ID')
      return
    }
    const editUrl = `/bills/${billId}/edit`
    console.log('Redirecting to:', editUrl)
    console.log('🚀 REDIRECTING NOW...')
    window.location.href = editUrl
  }

  const handleDelete = async () => {
    if (!bill) return

    try {
      // Delete bill items first (due to foreign key constraint)
      await supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', billId)

      // Delete the bill
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId)

      if (error) throw error

      toast.success('Bill deleted successfully!')
      // Redirect to bills list
      window.location.href = '/bills'
    } catch (error) {
      console.error('Error deleting bill:', error)
      toast.error('Failed to delete bill')
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Responsive Header */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hidden-print">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Link href="/bills" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Bills</span>
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold truncate">
                Bill {bill.bill_type === 'kacchi' ? 'K' : 'P'}{String(bill.bill_number).padStart(3, '0')}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground truncate">{bill.party_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={bill.bill_type === 'kacchi' ? 'default' : 'secondary'} className="text-xs">
              {bill.bill_type === 'kacchi' ? 'Kacchi (Cash)' : 'Pakki (Credit/GST)'}
            </Badge>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print Bill as PDF</span>
              <span className="sm:hidden">Print</span>
            </Button>
            <Button
              variant="default"
              className="gap-2"
              onClick={handleEdit}
            >
              <Edit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Bill</span>
              <span className="sm:hidden">Edit</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete Bill</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base md:text-lg">Delete Bill</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm md:text-base">
                    Are you sure you want to delete bill {bill.bill_type === 'kacchi' ? 'K' : 'P'}{String(bill.bill_number).padStart(3, '0')}?
                    This action cannot be undone and will permanently remove the bill and all its items.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Bill Display */}
          <div className="lg:col-span-2">
            <BillDisplay bill={bill} items={items} />
          </div>

          {/* Bill Info Sidebar - Hidden during print */}
          <div className="space-y-4 hidden-print">
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Bill Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Bill Number</p>
                  <p className="text-base md:text-lg font-semibold">{bill.bill_type === 'kacchi' ? 'K' : 'P'}{String(bill.bill_number).padStart(3, '0')}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Date</p>
                  <p className="text-base md:text-lg font-semibold">{new Date(bill.bill_date).toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Party Name</p>
                  <p className="text-base md:text-lg font-semibold break-words">{bill.party_name}</p>
                </div>
                {bill.vehicle_number && (
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Vehicle Number</p>
                    <p className="text-base md:text-lg font-semibold break-all">{bill.vehicle_number}</p>
                  </div>
                )}
                {bill.balance !== null && bill.balance !== undefined && (
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Balance</p>
                    <p className="text-base md:text-lg font-semibold">₹{bill.balance.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl md:text-2xl font-bold">₹{bill.total_amount.toFixed(2)}</p>
                  {bill.balance !== null && bill.balance !== undefined && bill.balance > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Balance</p>
                      <p className="text-base md:text-lg font-bold">₹{bill.balance.toFixed(2)}</p>
                      <div className="border-t border-gray-300 pt-2">
                        <p className="text-xs md:text-sm text-muted-foreground">Grand Total</p>
                        <p className="text-lg md:text-3xl font-bold text-green-600">₹{(bill.total_amount + bill.balance).toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
                {bill.total_amount_words && (
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Amount in Words</p>
                    <p className="text-xs md:text-sm break-words">{bill.total_amount_words}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Created</p>
                  <p className="text-xs md:text-sm">{new Date(bill.created_at).toLocaleString('en-IN')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="pb-2 md:pb-3 border-b last:border-b-0">
                      <p className="text-sm md:text-base font-semibold break-words">{item.particular}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground mt-1">
                        {item.qty_bags && <p>Qty: {item.qty_bags} bags</p>}
                        {item.weight_kg && <p>Wt: {item.weight_kg} kg</p>}
                        {item.rate && <p>Rate: ₹{item.rate}</p>}
                        {item.amount && <p className="font-semibold text-foreground col-span-2 md:col-span-1">₹{item.amount.toFixed(2)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

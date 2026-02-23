import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Logo } from '@/components/logo'

export default function BillsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">MS</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MS Trading Co.</h1>
                <p className="text-sm text-gray-500">Bill Management System</p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>KUPWAD MIDC</p>
              <p>GST: 27CQIPS6685K1ZU</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>&copy; 2026 MS Trading Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

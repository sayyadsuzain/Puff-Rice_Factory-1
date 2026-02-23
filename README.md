# MS Trading Company - Bill Management System

A secure, responsive bill management system for MS Trading Company built with Next.js, TypeScript, and Supabase. Features single-user authentication and professional PDF generation.

## Features

### 🔐 Security & Authentication
- **Single Authorized User** - Restricted access to one user only
- **Persistent Sessions** - Stay logged in indefinitely on device
- **Secure Login** - Email/password authentication via Supabase

### 📄 Bill Management
- **Bill Types**: Kacchi (Cash) and Pakki (Credit/GST) bills
- **Auto Numbering** - Sequential bill number generation
- **Real-time Calculations** - Automatic total calculations with manual override
- **Professional PDFs** - Print-ready bills with exact styling

### 📱 Responsive Design
- **Mobile-First** - Optimized for all screen sizes
- **Hamburger Menu** - Mobile navigation with collapsible menu
- **Touch-Friendly** - Large buttons and easy navigation

### 🖨️ PDF Generation
- **Exact Styling** - Matches physical bill format perfectly
- **Color Preservation** - Red highlights and company branding maintained
- **Professional Output** - Print-ready with proper margins

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (Auth + PostgreSQL Database)
- **PDF Generation:** jsPDF + html2canvas
- **Deployment:** Vercel
- **UI Components:** shadcn/ui, Lucide Icons
- **State Management:** React Context + Supabase Real-time
- **Form Handling:** React Hook Form + Controlled Components

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Installation & Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd puff_rice_final
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials

4. **Database Setup**
   - Run the schema migration in Supabase
   - Enable Row Level Security (RLS) on tables

5. **Development**
   ```bash
   npm run dev
   ```

## Authentication

### Login Credentials
- **Email:** `mstradingcompany9001@gmail.com`
- **Password:** `Sayyad@9001`

### Features
- ✅ Single authorized user access only
- ✅ Persistent sessions (no expiration)
- ✅ Automatic redirects after login
- ✅ Secure logout functionality

## Deployment to Vercel

### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Method 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

### Vercel Configuration
The `vercel.json` file includes:
- Build optimization settings
- Security headers
- Function timeouts
- Regional deployment (Singapore)

## Usage Guide

### Creating Bills
1. Click "Create Bill" from dashboard
2. Select bill type (Kacchi/Pakki)
3. Fill party details and date
4. Add items with quantities and rates
5. Total auto-calculates (editable if needed)
6. Save bill

### Managing Bills
- **View:** Click "View" to see full bill details
- **Edit:** Modify existing bills with real-time preview
- **Print:** Generate professional PDFs
- **Delete:** Remove bills with confirmation

### PDF Generation
- Click "Print Bill as PDF" from any bill
- Popup window opens with styled bill
- Press Ctrl+P (Cmd+P on Mac) to save as PDF
- Professional output with red color highlights

## Database Schema

### Bills Table
- `id` (uuid, primary key)
- `bill_type` (kacchi/pakki)
- `bill_number` (integer, auto-increment)
- `party_name` (text)
- `bill_date` (date)
- `total_amount` (decimal)
- `total_amount_words` (text)
- `vehicle_number` (text, nullable)
- `balance` (decimal, nullable)
- `bank_name`, `bank_ifsc`, `bank_account` (pakki only)
- `notes` (text, nullable)
- `created_at`, `updated_at` (timestamps)

### Bill Items Table
- `id` (uuid, primary key)
- `bill_id` (uuid, foreign key)
- `particular` (text)
- `qty_bags`, `weight_kg`, `rate`, `amount` (decimals)

## Responsive Features

### Mobile Navigation
- Hamburger menu for mobile devices
- Collapsible user menu
- Touch-optimized buttons
- Responsive tables and forms

### Breakpoints
- **Mobile:** < 768px (hamburger menu)
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px (full navigation)

## Security Measures

- **Single User Access** - Only one authorized email
- **Supabase Auth** - Secure authentication
- **Row Level Security** - Database-level access control
- **HTTPS Enforcement** - Secure connections only
- **Session Persistence** - No automatic logout

## Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
# Run schema.sql in Supabase SQL editor
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Fast Loading** - Optimized Next.js build
- **Lazy Loading** - Components load on demand
- **Image Optimization** - Automatic image optimization
- **Caching** - Intelligent caching strategies

## Troubleshooting

### Login Issues
- Verify email and password are correct
- Check Supabase connection
- Clear browser cache

### PDF Issues
- Ensure popup blockers are disabled
- Check browser print settings
- Verify color preservation in print dialog

### Bill Creation Issues
- **"duplicate key value violates unique constraint"**: This is fixed - bill numbers are now globally unique
- **Rate limiting errors**: Resolved by optimizing API calls
- Check console for detailed error messages

### Edit Redirect Issues
- Edit button now redirects immediately to view page after updates
- No more 1.5-second delay
- Console shows "🚀 REDIRECTING BACK TO VIEW PAGE..." for debugging

### Mobile Issues
- Test hamburger menu functionality
- Check touch responsiveness
- Verify form inputs on mobile
- Action buttons stack vertically on small screens

## Contributing

1. Follow existing code style
2. Test on multiple devices/browsers
3. Update documentation
4. Create detailed pull requests

## License

Private - MS Trading Company Internal Use Only

## Support

For technical support or access issues, contact the system administrator.

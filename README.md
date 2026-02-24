# 📄 MS Trading Company - Bill Management System

A secure, responsive, and professional bill management system built for MS Trading Company to manage puff rice product billing with authentication, PDF generation, and mobile optimization.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sayyadsuzain/Puff_Rice_billing_System)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E)](https://supabase.com/)

## ✨ Features

### 🔐 Security & Authentication
- **Single Authorized User Access** - Restricted to one user account only
- **Supabase Authentication** - Secure email/password authentication
- **Persistent Sessions** - Stay logged in indefinitely on devices
- **Automatic Redirects** - Seamless login/logout flow
- **Session Security** - No automatic logout or expiration

### 📊 Bill Management
- **Dual Bill Types** - Kacchi (Cash) and Pakki (Credit/GST) bills
- **Sequential Numbering** - Auto-generated bill numbers (K001, P001, etc.)
- **Product Catalog** - Pre-defined products: Adsigiri (Bhadang Murmura), Kolhapuri, MP
- **Custom Products** - Add any additional product varieties
- **Real-time Calculations** - Automatic total calculations with manual override
- **Bill History** - Complete list with search and filtering
- **CRUD Operations** - Create, Read, Update, Delete bills

### 🖨️ Professional PDF Generation
- **Exact Bill Formatting** - Matches physical bill layout perfectly
- **Color Preservation** - Red company branding and highlights maintained
- **Print-Ready** - Professional margins and formatting
- **Cross-Platform** - Works on Windows, Mac, Linux, mobile
- **High-Quality Output** - Crisp text and proper scaling

### 📱 Mobile-First Responsive Design
- **Adaptive Layouts** - Optimized for all screen sizes
- **Touch-Friendly** - Large buttons and touch targets
- **Mobile Navigation** - Hamburger menu with collapsible user menu
- **Responsive Tables** - Horizontal scroll and column hiding
- **Progressive Enhancement** - Better experience on larger screens

### 🛠️ Advanced Features
- **Form Validation** - Real-time validation with error messages
- **Loading States** - Professional loading indicators
- **Toast Notifications** - Success/error feedback
- **Error Handling** - Comprehensive error recovery
- **Data Persistence** - Automatic saves and state management

## 🚀 Tech Stack

### Frontend Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with concurrent features
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 3** - Utility-first CSS framework

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database
- **Supabase Auth** - User authentication
- **Row Level Security** - Database security

### UI & Components
- **shadcn/ui** - High-quality React components
- **Lucide Icons** - Beautiful icon library
- **Sonner** - Toast notifications
- **Radix UI** - Accessible component primitives

### PDF & Utilities
- **jsPDF** - PDF generation library
- **html2canvas** - HTML to canvas conversion
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Development & Deployment
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Vercel** - Cloud deployment platform
- **GitHub** - Version control

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase** account for backend
- **Vercel** account for deployment (optional)

## 🔧 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/sayyadsuzain/Puff_Rice_billing_System.git
cd puff_rice_final
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Setup

#### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for setup completion

#### Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Copy the entire content of `scripts/01-create-bills-schema.sql`
3. Execute the SQL script

#### Create User Account
1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Enter:
   - **Email:** `mstradingcompany9001@gmail.com`
   - **Password:** `Sayyad@9001`
4. Click **"Add user"**

### 5. Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment to Vercel

### Method 1: One-Click Deploy
Click the **"Deploy with Vercel"** button at the top of this README.

### Method 2: Manual Vercel Setup

#### Step 1: Import Project
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. **"Import Git Repository"**
4. Connect your GitHub account
5. Select `sayyadsuzain/Puff_Rice_billing_System`

#### Step 2: Configure Build
- **Framework:** Next.js (auto-detected)
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

#### Step 3: Environment Variables
Add these in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

#### Step 4: Deploy
- Click **"Deploy"**
- Wait for build completion (2-3 minutes)
- Your app will be live!

## 🔑 Authentication

### Login Credentials
- **Email:** `mstradingcompany9001@gmail.com`
- **Password:** `Sayyad@9001`

### Security Features
- Single authorized user access
- Persistent sessions across browser restarts
- Automatic logout on session expiry
- Secure password hashing via Supabase

## 📖 Usage Guide

### Creating Bills

1. **Login** with authorized credentials
2. **Navigate** to Bills dashboard
3. **Click "Create Bill"**
4. **Select Bill Type:**
   - **Kacchi (Cash)** - Simple cash transactions
   - **Pakki (Credit/GST)** - Credit transactions with GST
5. **Fill Details:**
   - Party name (M/s.)
   - Bill date
   - Vehicle number (optional)
   - Balance (optional)
6. **Add Items:**
   - Select product from dropdown
   - Or type custom product name
   - Enter quantity, weight, rate
   - Amount calculates automatically
7. **Review Totals** and add notes
8. **Click "Create Bill"**

### Managing Bills

#### View Bills
- Browse all bills in dashboard
- Search by party name or bill number
- Filter by bill type (Kacchi/Pakki)

#### Edit Bills
- Click **"Edit"** on any bill
- Modify any details
- Add/remove items
- Update totals automatically
- Save changes (redirects to view)

#### Delete Bills
- Click **"Delete"** on bill detail page
- Confirm deletion in dialog
- Bill and items removed permanently

### PDF Generation

#### Generate PDFs
1. Go to any bill detail page
2. Click **"Print Bill as PDF"**
3. Popup window opens with bill
4. Click **Ctrl+P** (or **Cmd+P** on Mac)
5. Save as PDF

#### PDF Features
- Exact physical bill formatting
- Red color preservation
- Professional print margins
- High-quality text rendering

## 🗄️ Database Schema

### Bills Table
```sql
CREATE TABLE bills (
  id SERIAL PRIMARY KEY,
  bill_number INTEGER NOT NULL UNIQUE,
  bill_type VARCHAR(20) NOT NULL,
  party_name VARCHAR(255) NOT NULL,
  bill_date DATE NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  total_amount_words TEXT,
  vehicle_number VARCHAR(50),
  balance DECIMAL(12, 2),
  bank_name VARCHAR(100),
  bank_ifsc VARCHAR(20),
  bank_account VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bill Items Table
```sql
CREATE TABLE bill_items (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  particular VARCHAR(255) NOT NULL,
  qty_bags INTEGER,
  weight_kg DECIMAL(10, 2),
  rate DECIMAL(10, 2),
  amount DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Saved Bank Details Table
```sql
CREATE TABLE saved_bank_details (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  bank_ifsc VARCHAR(20) NOT NULL,
  bank_account VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bank_name, bank_ifsc, bank_account)
);
```

## 📱 Responsive Design

### Breakpoints
- **Mobile:** < 640px - Single column, hamburger menu
- **Tablet:** 640px - 1024px - Condensed layouts
- **Desktop:** > 1024px - Full feature layouts

### Mobile Optimizations
- Touch-friendly button sizes (minimum 44px)
- Horizontal scrolling tables
- Stacked form layouts
- Collapsible navigation menus
- Optimized typography scaling

## 🛡️ Security Measures

### Authentication Security
- Supabase Auth with secure token management
- Single authorized user access
- Automatic session refresh
- Secure logout functionality

### Data Security
- Row Level Security (RLS) on database tables
- HTTPS encryption in production
- Environment variable protection
- Input validation and sanitization

### Application Security
- TypeScript for type safety
- ESLint for code quality
- Dependency security audits
- Production build optimizations

## 🐛 Troubleshooting

### Build Issues
- **Lockfile conflicts:** Delete `pnpm-lock.yaml`, use `package-lock.json`
- **Missing dependencies:** Run `npm install` before deployment
- **Build failures:** Check Vercel build logs for specific errors

### Authentication Issues
- **Login fails:** Verify user exists in Supabase dashboard
- **Session expires:** Check Supabase project settings
- **Rate limiting:** Reduced API calls in auth provider

### Database Issues
- **Schema errors:** Run SQL migration in Supabase
- **Connection fails:** Verify environment variables
- **RLS policies:** Check table permissions

### PDF Issues
- **Colors not printing:** Disable popup blockers
- **Layout broken:** Check browser print settings
- **Missing content:** Ensure popup permissions

### Mobile Issues
- **Touch not working:** Check minimum touch target sizes
- **Layout broken:** Test on actual mobile devices
- **Navigation hidden:** Check hamburger menu functionality

## 📊 Performance

### Optimization Features
- **Next.js App Router** - Optimized routing and loading
- **Static Generation** - Fast initial page loads
- **Image Optimization** - Automatic image compression
- **Code Splitting** - Lazy-loaded components
- **Caching Strategies** - Intelligent data caching

### Bundle Analysis
- **Tree Shaking** - Unused code elimination
- **Minification** - Production code compression
- **Gzip Compression** - Network payload reduction
- **CDN Delivery** - Global content distribution

## 🧪 Testing

### Manual Testing Checklist
- [ ] User authentication flow
- [ ] Bill creation and validation
- [ ] PDF generation quality
- [ ] Mobile responsiveness
- [ ] Search and filtering
- [ ] Edit and delete operations
- [ ] Error handling scenarios

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

### Development Guidelines
- Follow existing TypeScript patterns
- Use Tailwind CSS for styling
- Maintain responsive design principles
- Add proper error handling
- Update documentation

## 📄 License

**Private - MS Trading Company Internal Use Only**

All rights reserved. This software is proprietary to MS Trading Company and may not be distributed, modified, or used without explicit permission.

## 📞 Support

For technical support or access issues:
- Contact the system administrator
- Check the troubleshooting section above
- Review Vercel deployment logs
- Verify Supabase configuration

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Supabase Team** - For the excellent backend platform
- **shadcn/ui** - For beautiful React components
- **Vercel Team** - For seamless deployment platform

---

**Built with ❤️ for MS Trading Company**

*Professional bill management system with modern web technologies*#   p u f f - r i c e - u p d a t e d  
 
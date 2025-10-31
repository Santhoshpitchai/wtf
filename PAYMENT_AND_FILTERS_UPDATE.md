# Payment Mode & Filters Update

## Overview
Enhanced the Add Client form with payment mode tracking and implemented working filters with dynamic date range selection.

## ✨ New Features

### 1. **Payment Mode Field**
- ✅ Dropdown field to track how payment was received
- ✅ Options:
  - **Cash** - Physical cash payment
  - **UPI** - UPI/Digital payment
  - **Card** - Credit/Debit card
  - **Bank Transfer** - Direct bank transfer
  - **Other** - Any other payment method
- ✅ Stored in database
- ✅ Optional field

### 2. **First Payment in INR**
- ✅ Label shows "First Payment (₹)" to indicate Indian Rupees
- ✅ Decimal support for precise amounts
- ✅ Example: ₹5000.00

### 3. **Working Filters**
- ✅ **Status Filter Dropdown**:
  - All Status (default)
  - Active Only
  - Inactive Only
- ✅ Visual indicator badge when filter is active
- ✅ Filters update results in real-time

### 4. **Dynamic Date Range Picker**
- ✅ Replaced static "April 11 - April 24" with dynamic date inputs
- ✅ Two date inputs: Start Date and End Date
- ✅ Filters clients by creation date
- ✅ Includes entire end date (23:59:59)
- ✅ Works with search and status filters

## 📋 Complete Form Fields

### Client Information
1. **Full Name** (required) - Text
2. **Email** (required) - Email validation
3. **Phone Number** (optional) - Tel
4. **Age** (optional) - Number (1-120)
5. **Gender** (optional) - Male/Female/Other

### Assignment & Duration
6. **Assign Trainer** (optional) - All trainers dropdown
7. **Session Type** (optional) - 1/3/6/12 months

### Payment Details
8. **First Payment (₹)** (optional) - Amount in INR
9. **Payment Mode** (optional) - Cash/UPI/Card/Bank Transfer/Other
10. **Balance** (optional) - Remaining amount

### Status
11. **Status** (optional) - Active/Inactive

## 🗄️ Database Schema

### Updated Clients Table
```sql
CREATE TABLE public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
  first_payment DECIMAL(10, 2) DEFAULT 0,
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer', 'other')),
  balance DECIMAL(10, 2) DEFAULT 0,
  session_type TEXT CHECK (session_type IN ('1 month', '3 months', '6 months', '12 months')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔍 Filter Functionality

### Search Filter
- Searches across:
  - Client ID
  - Full Name
  - Email
- Real-time filtering as you type
- Case-insensitive

### Status Filter
- **All Status**: Shows all clients (default)
- **Active Only**: Shows only active clients
- **Inactive Only**: Shows only inactive clients
- Badge indicator shows when filter is applied

### Date Range Filter
- Filter clients by creation date
- Dynamic date pickers (not hardcoded)
- Format: YYYY-MM-DD
- Includes entire end date
- Example: 2025-10-01 to 2025-10-31

### Combined Filtering
All three filters work together:
```
Search: "John" + Status: "Active" + Date: "Oct 2025"
= Shows only active clients named John created in October 2025
```

## 💾 Data Storage

### Insert with Payment Mode
```typescript
await supabase.from('clients').insert([{
  client_id: generatedId,
  full_name: formData.full_name,
  email: formData.email,
  phone_number: formData.phone_number || null,
  age: formData.age ? parseInt(formData.age) : null,
  gender: formData.gender || null,
  trainer_id: formData.trainer_id || null,
  first_payment: formData.first_payment ? parseFloat(formData.first_payment) : 0,
  payment_mode: formData.payment_mode || null,
  balance: formData.balance ? parseFloat(formData.balance) : 0,
  session_type: formData.session_type || null,
  status: formData.status
}])
```

## 🎨 UI Components

### Filter Dropdown
```tsx
<button onClick={() => setShowFilterMenu(!showFilterMenu)}>
  <Filter size={20} />
  Filters
  {statusFilter !== 'all' && (
    <span className="badge">1</span>
  )}
</button>
```

### Date Range Picker
```tsx
<div className="flex items-center gap-2">
  <Calendar size={20} />
  <input type="date" value={dateRange.start} />
  <span>-</span>
  <input type="date" value={dateRange.end} />
</div>
```

### Payment Mode Dropdown
```tsx
<select name="payment_mode">
  <option value="">Select payment mode</option>
  <option value="cash">Cash</option>
  <option value="upi">UPI</option>
  <option value="card">Card</option>
  <option value="bank_transfer">Bank Transfer</option>
  <option value="other">Other</option>
</select>
```

## 📝 Usage Examples

### Example 1: Adding Client with Payment Details
```
Full Name: Kavya
Email: kavyapitchai@gmail.com
Phone: +91 98765 43210
Age: 28
Gender: Female
Trainer: Ramesh Ramul
Session Type: 3 months
First Payment: ₹5000.00
Payment Mode: UPI
Balance: ₹2500.00
Status: Active
```

### Example 2: Using Filters
1. **Search for specific client**: Type "Kavya" in search
2. **Filter by status**: Click Filters → Active Only
3. **Filter by date**: Select Oct 1, 2025 to Oct 31, 2025
4. **Result**: Shows only active clients named Kavya created in October

### Example 3: Date Range Filtering
- Start Date: 2025-10-01
- End Date: 2025-10-31
- Shows all clients created in October 2025

## 🔧 Filter Logic

### Combined Filter Function
```typescript
const filteredClients = clients.filter(client => {
  // Search filter
  const matchesSearch = searchTerm === '' || 
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  
  // Status filter
  const matchesStatus = statusFilter === 'all' || client.status === statusFilter
  
  // Date range filter
  let matchesDate = true
  if (dateRange.start && dateRange.end) {
    const clientDate = new Date(client.created_at)
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59, 999)
    matchesDate = clientDate >= startDate && clientDate <= endDate
  }
  
  return matchesSearch && matchesStatus && matchesDate
})
```

## ✅ Benefits

1. **Payment Tracking**: Know exactly how each payment was received
2. **INR Currency**: Clear indication of Indian Rupees
3. **Working Filters**: Quickly find specific clients
4. **Dynamic Dates**: Not limited to hardcoded date ranges
5. **Combined Search**: Use multiple filters together
6. **Real-time Updates**: Filters apply instantly

## 🚀 Migration

### For Existing Databases
Run the migration file: `migration-add-client-fields.sql`

```sql
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS payment_mode TEXT 
CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer', 'other'));
```

## 📊 Payment Mode Analytics

With payment_mode tracking, you can:
- See which payment methods are most popular
- Track cash vs digital payments
- Generate payment method reports
- Analyze payment trends

## 🐛 Testing Checklist

- [ ] Payment mode dropdown shows all options
- [ ] First payment shows ₹ symbol
- [ ] Status filter dropdown works
- [ ] Active/Inactive filtering works correctly
- [ ] Date range picker appears
- [ ] Date filtering works correctly
- [ ] Search + Status filter work together
- [ ] Search + Date filter work together
- [ ] All three filters work together
- [ ] Filter badge appears when status filter active
- [ ] Date range includes entire end date
- [ ] Payment mode saves to database
- [ ] Existing clients load properly

## 🎯 Key Improvements

### Before
- ❌ No payment mode tracking
- ❌ Static "April 11 - April 24" date
- ❌ Filters not functional
- ❌ No currency indication

### After
- ✅ Payment mode dropdown (Cash/UPI/Card/etc.)
- ✅ Dynamic date range picker
- ✅ Working status filters
- ✅ INR (₹) symbol for payments
- ✅ All filters work together
- ✅ Real-time filter updates

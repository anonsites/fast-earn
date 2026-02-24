Project overview: 

FAST-EARN - Advertising Reward Platform (Rwanda-Focused)

**Tech Stack:** Next.js (App Router) + Supabase (PostgreSQL + Auth + RLS) + Vercel
**Languages:** English 🇬🇧 / Kinyarwanda 🇷🇼
**Tiers:** free / pro / pro_max
**Model:** Task-based earning (video, follow, subscribe, install, click)


# 📂 Project Folder Structure


fast-earn/
│
├── README.md
├── .env.local
├── package.json
│
├── /app
│   ├── /[locale]
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Home page
│   │   ├── /login
│   │   ├── /register
│   │   ├── /pricing
│   │   ├── /dashboard               # User dashboard
│   │   │   ├── page.tsx
│   │   │   ├── /tasks
│   │   │   ├── /wallet
│   │   │   ├── /withdrawals
│   │   │   ├── /profile
│   │   │   └── /subscription
│   │   ├── /admin
│   │   │   ├── page.tsx
│   │   │   ├── /users
│   │   │   ├── /tasks
│   │   │   ├── /withdrawals
│   │   │   ├── /subscriptions
│   │   │   └── /analytics
│   │
│   ├── api
│   │   ├── /tasks
│   │   ├── /complete-task
│   │   ├── /withdraw
│   │   ├── /upgrade
│   │   └── /fraud-check
│
├── /components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── LanguageSwitcher.tsx
│   ├── TaskCard.tsx
│   ├── WalletSummary.tsx
│   ├── AdminSidebar.tsx
│   └── ProtectedRoute.tsx
│
├── /lib
│   ├── supabaseClient.ts
│   ├── auth.ts
│   ├── tierUtils.ts
│   ├── fraud.ts
│   └── reward.ts
│
├── /messages
│   ├── en.json
│   └── rw.json
│
├── /middleware.ts
│
└── /database
    └── schema.sql


# 🧠 Folder Explanation


## `/app/[locale]`

Handles internationalization.

Routes:
/en
/rw

Each language renders same UI with translated text.

---

## 🏠 HOME PAGE (`/app/[locale]/page.tsx`)

Purpose:

* Landing page
* Explain how platform works
* Show pricing (free, pro, pro_max)
* CTA → Register

Sections:

* Hero section
* How it works
* Tier comparison
* Testimonials
* FAQ
* Footer

---

## 👤 USER SIDE (`/dashboard`)

### `/dashboard/page.tsx`

Overview:

* Balance
* Tier badge
* Available tasks
* Quick stats

---

### `/dashboard/tasks`

* List active tasks
* Filter by category
* Start task button

---

### `/dashboard/wallet`

* Balance history
* Transactions
* Earnings breakdown

---

### `/dashboard/withdrawals`

* Request withdrawal
* View status

---

### `/dashboard/profile`

* User info
* Change password
* Language preference

---

### `/dashboard/subscription`

* Upgrade tier
* Payment history
* Expiration date

---

## 🛡 ADMIN SIDE - PHASE 5 (Role-Based Access Control)

### Role System

Users in database have a `role` field: `'user' | 'admin'`

Authentication Flow:
1. Admin logs in at `/[locale]/login`
2. System checks user role from database
3. `useAdminRoute()` hook verifies admin status
4. Unauthorized access redirected to `/dashboard`

### Admin Panel Navigation (`/admin`)

Access requires: `role = 'admin'` in database

---

### `/admin` - Admin Dashboard

**Features:**
- 📊 Key statistics cards: Total users, Rewards distributed, Total payouts, Active tasks
- 📈 System health metrics: New users (30d), Transaction volume, Task completion rate
- 🚨 Recent fraud alerts table with severity levels
- 🎯 Quick action buttons to manage resources

**Data Computed:**
- Active user count and percentage
- Total reward distribution (sum of all wallet credits)
- Payout rate (approved withdrawals / distributed rewards)
- Fraud case severity breakdown

---

### `/admin/users` - User Management

**Features:**
- 👥 User list with pagination (50 per page)
- 🔍 Search by email or name
- 📋 Filter by verification status
- ✅ Verify unverified accounts
- 🚫 Suspend/unsuspend users
- 🚨 Flag users as fraud (auto-suspends)

**Columns Displayed:**
- User name & email
- Current tier (Free/Pro/Pro Max)
- Verification & suspension status
- Account balance (in RWF)
- Action buttons

**Admin Actions Logged:**
- User suspension/unsuspension
- Account verification
- Fraud flags with severity
- All changes tracked in `admin_activities` table

---

### `/admin/tasks` - Task Management

**Features:**
- 📝 All active/inactive tasks with filters
- 🏷 Filter by category (video, click, follow, subscribe, install)
- 💰 View base reward and budget info
- 📊 Visual budget usage progress bar
- ✅ Activate/deactivate tasks
- 🗑 Task status overview

**Displayed Metrics:**
- Task title & description preview
- Category badge
- Base reward per completion
- Total budget & remaining budget
- Budget spent percentage (visual bar)
- Active/Inactive status

**Admin Capabilities:**
- Deactivate running campaigns
- Reactivate paused campaigns
- Monitor budget consumption in real-time

---

### `/admin/withdrawals` - Withdrawal Approvals

**Features:**
- 💳 Pending withdrawal requests table
- 🏦 Filter by status (pending, approved, rejected, paid)
- 📱 Filter by method (MTN, Airtel, Bank)
- ✅ Quick approval (2-click)
- ❌ Rejection with reason modal
- 📋 Auto-refund on rejection

**Approval Workflow:**
1. Admin views pending withdrawals
2. Click ✅ to approve (immediate)
3. Click ❌ to reject with optional reason
4. System logs action in audit trail
5. On rejection: Amount automatically credited back to user wallet

**Displayed Info:**
- User name & contact details
- Withdrawal amount
- Payment method with icon
- Request date
- Status with color coding

---

### `/admin/subscriptions` - Subscription Analytics

**Features:**
- 📊 Tier distribution cards: Free, Pro, Pro Max counts
- 💰 Monthly revenue calculator (Pro: 5K RWF, Pro Max: 10K RWF)
- 📈 Subscription status tracking
- 📅 Start/end date monitoring

**Revenue Calculation:**
```
Monthly Revenue = (Pro Users × 5,000 RWF) + (Pro Max Users × 10,000 RWF)
```

**Displayed Data:**
- User email & tier
- Subscription status (Active/Expired/Cancelled)
- Monthly price per tier
- Subscription dates
- Pagination of all subscriptions

---

### `/admin/fraud` - Fraud Detection & Prevention

**Features:**
- 🚨 Fraud case dashboard with real-time stats
- 📊 Severity distribution (Critical, High, Medium, Low)
- 🔴 Critical cases with auto-suspension
- ⚠️ High-risk case flagging
- 📋 Detailed fraud logs with actions taken

**Statistics Tracked:**
- Total fraud cases
- Critical cases (auto-suspended users)
- High-risk cases (require review)
- Detection rate percentage

**Fraud Detection Triggers:**
- Multiple failed login attempts
- IP address spoofing/variations
- Device fingerprint mismatches
- Bot-like task completion patterns
- Rapid withdrawal requests
- Manual admin flagging

**Severity Levels:**
- 🔴 **Critical**: Auto-suspend account
- 🟠 **High**: Requires immediate review
- 🟡 **Medium**: Monitor activity
- 🔵 **Low**: Log for pattern analysis

**Logged Information:**
- User identification
- Fraud type detected
- Description of suspicious activity
- Action taken (suspension, investigation, etc.)
- Timestamp with full date & time

---

## 🔐 Admin Utilities (`/lib/admin.ts`)

### Key Functions:

```typescript
// Auth Check
isUserAdmin(userId: string): Promise<boolean>

// Logging
logAdminActivity(adminId, action, targetType, targetId, changes)

// Users
getAllUsers(limit, offset, filters)
toggleUserSuspension(userId, suspend, adminId)
verifyUser(userId, adminId)

// Tasks
getAllTasks(limit, offset, filters)
updateTask(taskId, updates, adminId)
deactivateTask(taskId, adminId)

// Withdrawals
getAllWithdrawals(limit, offset, filters)
approveWithdrawal(withdrawalId, adminId, notes)
rejectWithdrawal(withdrawalId, adminId, reason)

// Fraud
logFraud(userId, fraudType, severity, description, actionTaken)
getFraudLogs(limit, offset)

// Stats
getDashboardStats()
getSystemStats()
getAllSubscriptions(limit, offset)
```

---

## 📊 Admin Hooks (`/lib/hooks.ts`)

### `useAuth()`
Returns: `{ user, isAuthenticated, isAdmin, loading, logout }`

```typescript
const { user, isAuthenticated, isAdmin, loading, logout } = useAuth()

if (isAdmin) {
  // Show admin controls
}
```

### `useAdminRoute()`
Protects admin pages from non-admin users

```typescript
const { isProtected } = useAdminRoute()

useEffect(() => {
  if (!isProtected) return
  // Load admin data
}, [isProtected])
```

---

## 🗄 Database Schema Updates (Phase 5)

### Users Table (Enhanced)
```sql
role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user'
ip_addresses TEXT[] -- For fraud detection
device_fingerprints TEXT[] -- Device tracking
last_login TIMESTAMP
failed_login_attempts INT DEFAULT 0
```

### New Tables

**fraud_logs** - Suspicious activity tracking
```sql
user_id UUID, fraud_type TEXT, severity TEXT, 
description TEXT, action_taken TEXT, created_at TIMESTAMP
```

**admin_activities** - Audit trail
```sql
admin_id UUID, action TEXT, target_type TEXT,
target_id UUID, changes JSONB, created_at TIMESTAMP
```

**system_settings** - Configuration
```sql
key TEXT UNIQUE, value TEXT, updated_by UUID, updated_at TIMESTAMP
```

---

## 🔑 Environment Setup for Admin

Add admin user to database:
```sql
INSERT INTO users (email, full_name, role, tier, is_verified)
VALUES ('[email protected]', 'Admin User', 'admin', 'pro_max', true)
```

---

## 📋 Admin Workflow Example

1. **User Registration** → Role defaults to 'user'
2. **Dashboard Access** → User sees `/dashboard` content
3. **Admin Login** → Admin logs in
4. **Role Check** → System verifies `role = 'admin'`
5. **Admin Access** → Can access `/admin/*` routes
6. **Manage Users** → Verify, suspend, investigate fraud
7. **Manage Tasks** → Activate/deactivate campaigns
8. **Approve Withdrawals** → Review and approve/reject payouts
9. **Monitor Fraud** → Review fraud cases, take action
10. **Audit Trail** → All actions logged for compliance



---

### `/admin/subscriptions`

* Monitor tier upgrades
* Subscription revenue

---

### `/admin/analytics`

* Earnings vs payouts
* Task completion rates
* Fraud patterns

---

# 🗄 DATABASE STRUCTURE `descrbed in /database/chema.sql`

---

# 🌍 LANGUAGE FILES

---

## `/messages/en.json`

```json
{
  "welcome": "Welcome",
  "start_earning": "Start Earning",
  "dashboard": "Dashboard",
  "tasks": "Tasks",
  "wallet": "Wallet",
  "withdraw": "Withdraw",
  "upgrade": "Upgrade",
  "free": "Free",
  "pro": "Pro",
  "pro_max": "Pro Max"
}
```

---

## `/messages/rw.json`

```json
{
  "welcome": "Murakaza neza",
  "start_earning": "Tangira kubona amafaranga",
  "dashboard": "Imbonerahamwe",
  "tasks": "Imirimo",
  "wallet": "Igikapu",
  "withdraw": "Kubikuza",
  "upgrade": "Kuzamura konti",
  "free": "Ubuntu",
  "pro": "Pro",
  "pro_max": "Pro Max"
}
```
# Development Phases

---

#  PHASE 1 — Foundation

###  Home Page

* Navbar
* Hero
* Tier comparison
* Language switch
* Auth pages

###  Database setup

* Import schema.sql into Supabase
* Enable RLS

---

#  PHASE 2 — User Side (Core System)

### Tasks

* List tasks
* Complete task
* Reward calculation
* Wallet update

### Wallet

* Transaction logs
* Balance calculation

### Withdrawals

* Request
* Admin approval

---

#  PHASE 3 — Tier System

* Subscription purchase
* Tier multiplier logic
* Expiration cron job

---

#  PHASE 4 — Admin Panel

* Manage tasks
* Approve withdrawals
* Suspend users
* Fraud flags

---

#  PHASE 5 — Fraud & Optimization

* IP tracking
* Device fingerprinting
* Rate limiting
* Auto-suspension rules

---

# ⚠ Important To-Dos

* [ ] Implement Supabase RLS policies
* [ ] Never calculate rewards in frontend
* [ ] Use transactions when crediting wallet
* [ ] Minimum withdrawal threshold
* [ ] Audit suspicious activity
* [ ] Log every financial action
* [ ] Add Terms & Conditions page

---

# 🚀 Final Architecture Summary

* Next.js handles UI + API routes
* Supabase handles DB + Auth
* Vercel hosts frontend
* Fraud detection handled in backend logic
* Tier multipliers handled server-side
* Wallet system transaction-based

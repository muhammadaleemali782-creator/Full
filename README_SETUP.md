# 🚀 MLM PPC Commission System - Complete Project

## 📦 Folder Structure

```
backend/
├── models/               # Database models
│   ├── User.js          # ✅ UPDATED - New PPC wallet fields
│   ├── PPCSettings.js   # ✅ NEW - Admin configurable PPC rates
│   ├── WithdrawalRequest.js  # ✅ NEW - Withdrawal tracking
│   ├── Order.js
│   ├── Product.js
│   └── ...
├── routes/              # API routes
│   ├── orders.js        # ✅ UPDATED - PPC commission integration
│   ├── users.js
│   ├── withdrawal.routes.js     # ✅ NEW - Withdrawal APIs
│   └── ppcSettings.routes.js    # ✅ NEW - PPC settings APIs
├── commission/          # Commission logic
│   ├── ppcCommission.controller.js  # ✅ NEW - PPC commission system
│   └── commission.controller.js
├── middleware/          # Auth & role middleware
├── utils/              # Utilities
├── server.js           # ✅ UPDATED - New routes added
└── package.json

frontend/src/
├── pages/              # All pages
│   ├── PPCWallet.jsx                    # ✅ NEW - Multi-wallet view
│   ├── WithdrawalRequest.jsx            # ✅ NEW - Withdrawal UI
│   ├── AdminPPCSettings.jsx             # ✅ NEW - Admin PPC config
│   ├── AdminWithdrawalManagement.jsx    # ✅ NEW - Admin approvals
│   ├── Home.jsx
│   ├── Login.jsx
│   └── ...
├── components/         # Reusable components
│   ├── Navbar.jsx      # ✅ UPDATED - New menu items
│   └── ...
├── context/           # Context providers
│   ├── AuthContext.jsx
│   └── StoreContext.jsx
├── App.jsx            # ✅ UPDATED - New routing
└── index.js
```

---

## 🔧 Installation & Setup

### 1️⃣ Prerequisites
- Node.js v18+ 
- MongoDB (local or Atlas)
- VS Code or any IDE

### 2️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/mlm-db
JWT_SECRET=your-secret-key-here
PORT=5000
EOF

# Start server
npm start
# or
node server.js
```

**Backend will run on: http://localhost:5000**

### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Create .env file
echo "REACT_APP_BACKEND_URL=http://localhost:5000" > .env

# Start development server
npm start
# or
yarn start
```

**Frontend will run on: http://localhost:3000**

---

## 🌟 New Features Added

### 1. Multi-Wallet System
- **Distributor:**
  - Distributor Wallet (non-withdrawable, for promotion)
  - Seller Wallet (withdrawable after admin approval)
  
- **Seller:**
  - Seller Wallet (from downline sellers)
  - User Wallet (from downline users)
  
- **User:**
  - No wallet (generates PPC for upline)

### 2. PPC Commission Rules
- **Seller:** Configurable (% of sale or fixed amount)
- **Distributor:** 
  - ₹10 per sale (if seller exists in chain)
  - ₹20 per sale (direct connection, no seller)
- **Upline:** Recursive distribution based on hierarchy

### 3. Withdrawal System
- Users can request withdrawal
- Admin approval required
- Complete history tracking
- Payment method capture
- Transaction ID recording

### 4. Admin Configuration
- Configure PPC rates from UI
- Set minimum withdrawal limits
- Switch between percentage/fixed rates
- Real-time settings update

---

## 📱 Pages & Routes

### User Routes:
```
/ppc-wallet              - View multi-wallet dashboard
/withdrawal-request      - Request & track withdrawals
/my-commission          - Commission history
/my-network             - Network tree view
```

### Admin Routes:
```
/admin-ppc-settings              - Configure PPC rates
/admin-withdrawal-management     - Approve/reject requests
/admin-users                     - User management
/admin-orders                    - Order management
```

---

## 🔐 Default Login Credentials

**Admin:**
- Email: `admin@gmail.com`
- Password: `12345`

---

## 🧪 Testing Steps

1. **Login as Admin**
   - Go to http://localhost:3000
   - Login with admin credentials

2. **Configure PPC Settings**
   - Navigate to "💰 PPC Settings"
   - Set seller PPC rate (e.g., 10%)
   - Set distributor rates (₹10 / ₹20)
   - Set minimum withdrawal (₹100)
   - Click "Save Settings"

3. **Create Test Hierarchy**
   - Create Distributor
   - Create Seller under Distributor
   - Create User under Seller

4. **Create & Confirm Order**
   - Login as Seller/User
   - Create order
   - Login as Distributor → Approve
   - Login as Admin → Confirm (triggers PPC commission)

5. **Check Wallets**
   - Login as each user
   - Go to "💰 PPC Wallet"
   - Verify PPC distribution

6. **Test Withdrawal**
   - Login as Distributor/Seller
   - Go to "💸 Withdrawal"
   - Submit request
   - Login as Admin → Approve/Reject

---

## 🗄️ Database

The app will automatically create these collections:
- `users` - User data with new wallet fields
- `ppcsettings` - PPC configuration
- `withdrawalrequests` - Withdrawal tracking
- `orders` - Orders
- `products` - Products
- `commissions` - Commission records

---

## 📋 API Endpoints

### User APIs:
```
GET  /api/ppc/wallet/me              - My wallet info
POST /api/withdrawal/request         - Create withdrawal
GET  /api/withdrawal/my-requests     - My history
```

### Admin APIs:
```
GET  /api/ppc-settings                      - View settings
POST /api/ppc-settings/update               - Update settings
GET  /api/withdrawal/admin/all              - All requests
POST /api/withdrawal/admin/approve/:id      - Approve
POST /api/withdrawal/admin/reject/:id       - Reject
```

---

## 🎨 Mobile Responsive

All pages are fully mobile responsive:
- Touch-friendly UI (44px min touch targets)
- Responsive grid layouts
- Mobile-optimized tables
- Collapsible navigation
- Proper viewport settings

Tested on:
- Desktop (1920x1080+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

---

## ⚙️ Environment Variables

### Backend (.env):
```env
MONGO_URI=mongodb://localhost:27017/mlm-db
JWT_SECRET=your-secret-key-123
PORT=5000
```

### Frontend (.env):
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error:
```bash
# Start MongoDB service
sudo service mongod start
# or
mongod --dbpath /path/to/data
```

### Port Already in Use:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port in .env
PORT=5001
```

### Module Not Found:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### CORS Error:
- Backend already configured with `cors({ origin: true })`
- Ensure REACT_APP_BACKEND_URL is correct in frontend .env

---

## 📊 Commission Flow

```
Order Created (by Seller/User)
    ↓
Distributor Approves
    ↓
Admin Confirms
    ↓
🔥 PPC Commission Triggers
    ↓
├─→ Seller gets PPC (% or fixed)
├─→ Distributor gets ₹10 or ₹20
└─→ Upline gets recursive distribution
    ↓
Wallets Updated
```

---

## 🎯 Key Features

✅ Multi-level hierarchy (Admin → Distributor → Seller → User)
✅ Auto-generated unique IDs (DB001/DS001/US001)
✅ Role-based product assignment
✅ 3-level order approval flow
✅ Smart PPC commission distribution
✅ Multi-wallet system
✅ Withdrawal request & approval
✅ Admin configurable rates
✅ Mobile responsive design
✅ Real-time updates
✅ Complete audit trail

---

## 📞 Support

For issues or questions:
1. Check console logs (F12 in browser)
2. Check backend logs in terminal
3. Verify MongoDB connection
4. Ensure all env variables are set

---

## 🚀 Deployment

### Backend (Node.js):
- Deploy to Heroku, Railway, Render, or any Node.js host
- Set environment variables
- Ensure MongoDB is accessible

### Frontend (React):
- Build: `npm run build`
- Deploy build folder to Vercel, Netlify, or any static host
- Set REACT_APP_BACKEND_URL to production backend URL

---

## 📝 License

This is a custom MLM system with PPC commission. All rights reserved.

---

## 🎉 Happy Coding!

System complete hai with full PPC commission! 💰
Mobile responsive hai! 📱
Production ready hai! 🚀

Questions? Check migration guide or contact support!

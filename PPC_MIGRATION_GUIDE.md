# PPC Commission System - Migration Guide

## Overview
New hierarchical PPC (reward points) commission system has been implemented to replace the old coin/wallet system.

## Database Changes

### User Model - New Fields Added:
```javascript
// DISTRIBUTOR WALLETS
distributorWallet: Number (non-withdrawable, for promotion)
sellerWallet: Number (withdrawable after admin approval)

// SELLER WALLETS
sellerWalletAsSeller: Number (withdrawable)
userWalletAsSeller: Number (withdrawable)

// TRACKING
totalPPCEarned: Number
totalWithdrawn: Number

// LEGACY (kept for backward compatibility)
coinBalance, walletBalance, totalCommissionEarned, totalCoinEarned
```

### New Models:
1. **PPCSettings** - Admin configurable rates
2. **WithdrawalRequest** - Withdrawal tracking

## API Endpoints

### User APIs:
- `GET /api/ppc/wallet/me` - Get my PPC wallet info
- `POST /api/withdrawal/request` - Create withdrawal request
- `GET /api/withdrawal/my-requests` - My withdrawal history

### Admin APIs:
- `GET /api/ppc-settings` - Get PPC settings
- `POST /api/ppc-settings/update` - Update PPC settings
- `GET /api/withdrawal/admin/all` - View all withdrawal requests
- `POST /api/withdrawal/admin/approve/:id` - Approve withdrawal
- `POST /api/withdrawal/admin/reject/:id` - Reject withdrawal

## Commission Flow

### On Order Confirmation (Admin approves):

1. **Seller Commission:**
   - Calculated based on settings (percentage or fixed amount)
   - Credited to appropriate wallet

2. **Distributor Commission:**
   - ₹10 if seller exists in chain
   - ₹20 if direct connection (no seller between)
   - Credited to `sellerWallet`

3. **Upline Commission:**
   - Recursive calculation up the chain
   - Different wallets based on role and connection type

## Wallet Rules

### Distributor:
- **Distributor Wallet:** Non-withdrawable, for promotion only
- **Seller Wallet:** Withdrawable (requires admin approval)

### Seller:
- **Seller Wallet:** Earnings from downline sellers (withdrawable)
- **User Wallet:** Earnings from downline users (withdrawable)

### User:
- No wallet (generates PPC for upline)

## Frontend Pages

### User Pages:
- `/ppc-wallet` - View multi-wallet dashboard
- `/withdrawal-request` - Request withdrawal & view history

### Admin Pages:
- `/admin-ppc-settings` - Configure PPC rates
- `/admin-withdrawal-management` - Approve/reject requests

## Mobile Responsive
All pages are fully mobile responsive with:
- Touch-friendly buttons (44px min height)
- Responsive grid layouts
- Collapsible sections
- Mobile-optimized tables

## Testing Checklist

### Backend:
- [ ] PPC Settings creation on first run
- [ ] Commission calculation on order confirmation
- [ ] Wallet balance updates correctly
- [ ] Withdrawal request creation
- [ ] Admin approval/rejection

### Frontend:
- [ ] PPC Wallet page displays correctly
- [ ] Withdrawal request form works
- [ ] Admin can configure PPC settings
- [ ] Admin can approve/reject requests
- [ ] Mobile view works properly

### Integration:
- [ ] Order confirmation triggers PPC commission
- [ ] Multiple wallets display based on role
- [ ] Withdrawal reduces wallet balance
- [ ] History tracking works

## Migration Steps

1. **Database Migration (Automatic):**
   - New fields will be added automatically on first user save
   - No data loss (legacy fields preserved)

2. **Existing Users:**
   - Will have 0 balance in new PPC wallets
   - Old coinBalance/walletBalance preserved

3. **Future Orders:**
   - All new orders will use PPC commission system
   - Old commission system can be deprecated

## Configuration

Default PPC Settings:
- Seller PPC: 10% of sale
- Distributor Base: ₹10 per sale
- Distributor Direct: ₹20 per sale
- Min Withdrawal: ₹100

Admin can modify these from Admin PPC Settings page.

## Support

For any issues:
1. Check backend logs: `tail -f /var/log/supervisor/backend.*.log`
2. Check frontend logs: `tail -f /var/log/supervisor/frontend.*.log`
3. Verify MongoDB connection
4. Check API responses in browser console

## Next Steps (Optional)

1. Email notifications for withdrawal requests
2. SMS alerts for approvals
3. Detailed PPC analytics dashboard
4. Export withdrawal reports
5. Bulk withdrawal approvals
6. Auto-promotion based on distributorWallet balance

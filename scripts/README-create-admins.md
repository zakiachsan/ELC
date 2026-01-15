# Create Admin Accounts - Feature Implementation

**Feature ID**: 5bb7639f-71a7-4642-9435-91e1a84774d4  
**Feature Name**: User Admin  
**Objective**: Add 2 new admin accounts to the system

## Overview

This implementation creates 2 new admin accounts with full admin privileges:

1. **Admin User 2**
   - Email: admin2@elc.co.id
   - Password: Admin123!
   - Phone: 081000000002

2. **Admin User 3**
   - Email: admin3@elc.co.id
   - Password: Admin123!
   - Phone: 081000000003

Both accounts will have:
- Role: ADMIN
- Status: ACTIVE
- Branch: Surabaya
- Address: ELC Head Office

## Implementation Methods

### Method 1: Node.js Script (Recommended)

Run the Node.js script using environment variables:

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the script
node scripts/create-admin-accounts.js
```

**Prerequisites:**
- Node.js installed
- Supabase credentials in environment variables
- `@supabase/supabase-js` package installed

### Method 2: Using Supabase Dashboard

1. Go to Supabase Dashboard → Authentication
2. Click "Create New User"
3. Enter details for each admin:
   - Email: admin2@elc.co.id
   - Password: Admin123!
   - Auto-confirm email: ✅
4. Repeat for admin3@elc.co.id
5. Go to Table Editor → Profiles
6. Create profile records for the new users with role='ADMIN'

### Method 3: Using the Create User API Endpoint

If you have the create-user function deployed, you can call it:

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/create-user', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin2@elc.co.id',
    password: 'Admin123!',
    name: 'Admin User 2',
    role: 'ADMIN',
    phone: '081000000002',
    status: 'ACTIVE',
    branch: 'Surabaya',
    address: 'ELC Head Office'
  })
});
```

## Verification

After creating the accounts, verify they were created successfully by running this query in the Supabase SQL Editor:

```sql
SELECT id, name, email, phone, role, status, created_at 
FROM profiles 
WHERE role = 'ADMIN' 
ORDER BY created_at;
```

Expected output should show 3 admin accounts (the existing one + 2 new ones).

## Security Notes

⚠️ **Important Security Reminders:**

1. **Change Initial Passwords**: The new admins should change their passwords immediately after first login
2. **Use Strong Passwords**: The initial password `Admin123!` should be changed to a strong, unique password
3. **Environment Variables**: Never commit service role keys to version control
4. **Access Control**: Only existing admins should run this script
5. **Audit Trail**: This operation should be logged for security auditing

## Testing the New Admin Accounts

1. **Login Test**: Try logging in with each new admin account
2. **Admin Access**: Verify they can access admin-only features
3. **User Management**: Test if they can create/manage other users
4. **System Access**: Ensure they have appropriate system permissions

## Rollback

If you need to remove these admin accounts:

```sql
-- Get the user IDs first
SELECT id, email FROM profiles WHERE role = 'ADMIN' AND email IN ('admin2@elc.co.id', 'admin3@elc.co.id');

-- Delete profiles (this will cascade to auth.users due to ON DELETE CASCADE)
DELETE FROM profiles WHERE email IN ('admin2@elc.co.id', 'admin3@elc.co.id');
```

## Feature Acceptance Criteria

✅ **2 new admin accounts are successfully created**  
✅ **New admin accounts have appropriate admin privileges**  
✅ **New admin accounts can successfully log in and access admin functionality**
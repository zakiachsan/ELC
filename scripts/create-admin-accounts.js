/**
 * Create Admin Accounts Script
 * Feature: User Admin (5bb7639f-71a7-4642-9435-91e1a84774d4)
 * 
 * This script creates 2 new admin accounts in the system.
 * Run with: node scripts/create-admin-accounts.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
    process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Admin accounts to create
const adminAccounts = [
    {
        email: 'admin2@elc.co.id',
        password: 'Admin123!',
        name: 'Admin User 2',
        phone: '081000000002',
        role: 'ADMIN',
        status: 'ACTIVE',
        branch: 'Surabaya',
        address: 'ELC Head Office'
    },
    {
        email: 'admin3@elc.co.id',
        password: 'Admin123!',
        name: 'Admin User 3',
        phone: '081000000003',
        role: 'ADMIN',
        status: 'ACTIVE',
        branch: 'Surabaya',
        address: 'ELC Head Office'
    }
];

async function createAdminAccounts() {
    console.log('Creating admin accounts...\n');

    for (const admin of adminAccounts) {
        try {
            console.log(`Creating admin account: ${admin.email}`);
            
            // Step 1: Create user in auth.users
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: admin.email,
                password: admin.password,
                email_confirm: true, // Auto-confirm email
            });

            if (authError) {
                console.error(`❌ Failed to create auth user for ${admin.email}:`, authError.message);
                continue;
            }

            const userId = authData.user.id;
            console.log(`✅ Auth user created: ${userId}`);

            // Step 2: Create profile record
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                    phone: admin.phone,
                    status: admin.status,
                    branch: admin.branch,
                    address: admin.address,
                })
                .select()
                .single();

            if (profileError) {
                console.error(`❌ Failed to create profile for ${admin.email}:`, profileError.message);
                // Rollback: delete the auth user
                await supabase.auth.admin.deleteUser(userId);
                continue;
            }

            console.log(`✅ Profile created for: ${admin.name}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Phone: ${admin.phone}`);
            console.log(`   Password: ${admin.password}`);
            console.log('');

        } catch (error) {
            console.error(`❌ Error creating admin account for ${admin.email}:`, error.message);
        }
    }

    // Verify all admin accounts
    console.log('Verifying all admin accounts...\n');
    const { data: admins, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'ADMIN')
        .order('created_at');

    if (verifyError) {
        console.error('❌ Error verifying admin accounts:', verifyError.message);
    } else {
        console.log('✅ Current admin accounts:');
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.status}`);
        });
        console.log(`\nTotal admin accounts: ${admins.length}`);
    }

    console.log('\n✅ Admin account creation process completed!');
    console.log('Please save the credentials above for the new admin accounts.');
}

// Run the script
createAdminAccounts().catch(console.error);
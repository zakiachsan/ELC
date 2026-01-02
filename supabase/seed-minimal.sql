-- =====================================================
-- MINIMAL SEED: Locations & Teachers only
-- =====================================================
-- Run this first to test AccountManager functionality
-- =====================================================

-- 1. LOCATIONS (for school dropdown)
INSERT INTO locations (id, name, address, capacity, level) VALUES
('10000001-0000-0000-0000-000000000001', 'ELC Surabaya - Pakuwon Mall', 'Pakuwon Mall Lt. 3, Surabaya', 50, 'Premium'),
('10000002-0000-0000-0000-000000000002', 'ELC Surabaya - Galaxy Mall', 'Galaxy Mall Lt. 2, Surabaya', 40, 'Standard'),
('10000003-0000-0000-0000-000000000003', 'ELC Surabaya - Ciputra World', 'Ciputra World Lt. 1, Surabaya', 45, 'Premium')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address;

-- 2. TEACHERS (for teacher list)
-- Note: Using e1 prefix which is valid hex
INSERT INTO profiles (id, name, email, phone, role, status, branch, address, assigned_location_id) VALUES
('e1000001-0000-0000-0000-000000000001', 'Sarah Johnson', 'sarah.johnson@elc.co.id', '081234567890', 'TEACHER', 'ACTIVE', 'Surabaya', 'Jl. Raya Darmo 123', NULL),
('e1000002-0000-0000-0000-000000000002', 'James Williams', 'james.williams@elc.co.id', '081234567891', 'TEACHER', 'ACTIVE', 'Surabaya', 'Jl. Pemuda 456', NULL),
('e1000003-0000-0000-0000-000000000003', 'Anita Wijaya', 'anita.wijaya@elc.co.id', '081234567892', 'TEACHER', 'ACTIVE', 'Surabaya', 'Jl. Tunjungan 789', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status;

-- Done! You should now see:
-- - 3 Locations in dropdown
-- - 3 Teachers in the list

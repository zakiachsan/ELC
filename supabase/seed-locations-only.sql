-- =====================================================
-- SEED: Locations only (no FK constraints)
-- =====================================================

INSERT INTO locations (id, name, address, capacity, level) VALUES
('10000001-0000-0000-0000-000000000001', 'ELC Surabaya - Pakuwon Mall', 'Pakuwon Mall Lt. 3, Surabaya', 50, 'Premium'),
('10000002-0000-0000-0000-000000000002', 'ELC Surabaya - Galaxy Mall', 'Galaxy Mall Lt. 2, Surabaya', 40, 'Standard'),
('10000003-0000-0000-0000-000000000003', 'ELC Surabaya - Ciputra World', 'Ciputra World Lt. 1, Surabaya', 45, 'Premium')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address;

-- Done! Locations are now available in the dropdown.

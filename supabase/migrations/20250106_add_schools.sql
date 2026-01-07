-- =====================================================
-- Migration: Add Schools to Locations Table
-- Date: 2025-01-06
-- Description: Menghapus data sample dan menambahkan daftar sekolah real
--              berdasarkan jenjang (TK, SD, SMP, SMA, SMK)
-- =====================================================

-- =====================================================
-- HAPUS DATA SAMPLE EXISTING
-- =====================================================
DELETE FROM locations;

-- =====================================================
-- TK (Taman Kanak-Kanak) - KINDERGARTEN
-- =====================================================
INSERT INTO locations (name, address, level) VALUES
('TK ABDI SISWA BINTARO', 'Bintaro, Jakarta Selatan', 'KINDERGARTEN'),
('TK KRISTOFORUS 2', 'Jakarta', 'KINDERGARTEN'),
('TK KRISTOFORUS 1', 'Jakarta', 'KINDERGARTEN'),
('TK CHARITAS BATAM', 'Batam, Kepulauan Riau', 'KINDERGARTEN'),
('TK SANTA MARIA', 'Jakarta', 'KINDERGARTEN'),
('TK ST VINCENTIUS', 'Jakarta', 'KINDERGARTEN');

-- =====================================================
-- SD (Sekolah Dasar) - PRIMARY
-- =====================================================
INSERT INTO locations (name, address, level) VALUES
('SD ABDI SISWA ARIES', 'Jakarta', 'PRIMARY'),
('SD ABDI SISWA BINTARO', 'Bintaro, Jakarta Selatan', 'PRIMARY'),
('SD CHARITAS JKT', 'Jakarta', 'PRIMARY'),
('SD KRISTOFORUS 2', 'Jakarta', 'PRIMARY'),
('SD KRISTOFORUS 1', 'Jakarta', 'PRIMARY'),
('SD CHARITAS BATAM', 'Batam, Kepulauan Riau', 'PRIMARY'),
('SDK SANG TIMUR KARANG TENGAH', 'Karang Tengah, Tangerang', 'PRIMARY'),
('SD SANG TIMUR CAKUNG', 'Cakung, Jakarta Timur', 'PRIMARY'),
('SD SANTA MARIA', 'Jakarta', 'PRIMARY'),
('SD BHAKTI', 'Jakarta', 'PRIMARY'),
('SD TARAKANITA', 'Jakarta', 'PRIMARY'),
('SD ST VINCENTIUS', 'Jakarta', 'PRIMARY');

-- =====================================================
-- SMP (Sekolah Menengah Pertama) - JUNIOR
-- =====================================================
INSERT INTO locations (name, address, level) VALUES
('SMP ABDI SISWA ARIES', 'Jakarta', 'JUNIOR'),
('SMP ABDI SISWA BINTARO', 'Bintaro, Jakarta Selatan', 'JUNIOR'),
('SMP ABDI SISWA PATRA', 'Jakarta', 'JUNIOR'),
('SMP BHK', 'Jakarta', 'JUNIOR'),
('SMP CHARITAS JKT', 'Jakarta', 'JUNIOR'),
('SMP CHARITAS BATAM', 'Batam, Kepulauan Riau', 'JUNIOR'),
('SMP MARSUDIRINI', 'Jakarta', 'JUNIOR'),
('SMP SANG TIMUR KARANG TENGAH', 'Karang Tengah, Tangerang', 'JUNIOR'),
('SMP SANTA MARIA', 'Jakarta', 'JUNIOR'),
('SMP TARAKANITA', 'Jakarta', 'JUNIOR'),
('SMP ST VINCENTIUS', 'Jakarta', 'JUNIOR');

-- =====================================================
-- SMA (Sekolah Menengah Atas) - SENIOR
-- =====================================================
INSERT INTO locations (name, address, level) VALUES
('SMA ABDI SISWA BINTARO', 'Bintaro, Jakarta Selatan', 'SENIOR'),
('SMA ABDI SISWA PATRA', 'Jakarta', 'SENIOR'),
('SMA BHK', 'Jakarta', 'SENIOR');

-- =====================================================
-- SMK (Sekolah Menengah Kejuruan) - SENIOR (same level as SMA)
-- =====================================================
INSERT INTO locations (name, address, level) VALUES
('SMK SANTA MARIA', 'Jakarta', 'SENIOR');

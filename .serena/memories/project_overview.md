# ELC Management System - Project Overview

## Purpose
ELC (English Learning Center) Management System adalah aplikasi web untuk mengelola pusat belajar bahasa Inggris. Sistem ini mendukung multi-role user management dengan fitur lengkap untuk administrasi, guru, siswa, dan orang tua.

## Tech Stack
- **Frontend Framework**: React 19.2 + TypeScript 5.8
- **Build Tool**: Vite 6.2
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router DOM 7.11
- **UI**: Custom components dengan Tailwind CSS (utility classes)
- **Icons**: Lucide React
- **Charts**: Recharts
- **AI Integration**: Google GenAI (Gemini)
- **Testing**: Playwright

## Key Features
- Multi-role authentication (Admin, Teacher, Student, Parent)
- Class scheduling & attendance management
- Student grades & progress tracking
- Online learning materials
- Billing & transactions
- Olympiad management
- Teacher reviews
- Placement tests
- News management

## Environment Variables
Required env vars (see `.env.example`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `VITE_SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GEMINI_API_KEY` - Google Gemini API key

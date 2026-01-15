# Codebase Structure - ELC Project

```
ELC/
├── App.tsx                 # Main app component with providers
├── index.tsx               # React entry point
├── types.ts                # Global TypeScript types & enums
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
│
├── components/
│   ├── Button.tsx          # Reusable button component
│   ├── Card.tsx            # Reusable card component
│   ├── Toast.tsx           # Toast notifications
│   ├── NotFound.tsx        # 404 page
│   ├── Homepage.tsx        # Public homepage
│   ├── LoginPage.tsx       # Full page login
│   ├── LoginModal.tsx      # Modal login
│   ├── AdminLogin.tsx      # Admin-specific login
│   ├── ProtectedRoute.tsx  # Route guard component
│   │
│   ├── admin/              # Admin dashboard components
│   │   ├── StudentList.tsx
│   │   ├── TeacherManager.tsx
│   │   ├── ScheduleManager.tsx
│   │   ├── BillingManager.tsx
│   │   └── ...
│   │
│   ├── teacher/            # Teacher dashboard components
│   │   ├── TeacherView.tsx
│   │   ├── SessionManager.tsx
│   │   ├── StudentGrades.tsx
│   │   └── ...
│   │
│   ├── student/            # Student dashboard components
│   │   ├── StudentView.tsx
│   │   ├── StudentProgress.tsx
│   │   ├── StudentSchedule.tsx
│   │   └── ...
│   │
│   ├── parent/             # Parent dashboard components
│   │   ├── ParentDashboard.tsx
│   │   └── TeacherReview.tsx
│   │
│   └── shared/             # Shared components
│       └── FeedbackForm.tsx
│
├── contexts/
│   ├── AuthContext.tsx     # Authentication state & methods
│   ├── LanguageContext.tsx # i18n/language switching
│   └── SettingsContext.tsx # App settings (theme, etc.)
│
├── services/
│   ├── index.ts            # Service exports
│   ├── profiles.service.ts
│   ├── sessions.service.ts
│   ├── attendance.service.ts
│   ├── billing.service.ts
│   ├── tests.service.ts
│   └── ...
│
├── lib/
│   ├── supabase.ts         # Supabase client setup
│   ├── database.types.ts   # Auto-generated DB types
│   ├── utils.ts            # Utility functions
│   └── storage.ts          # Storage helpers
│
├── routes/
│   └── index.tsx           # Route definitions
│
├── layouts/
│   └── DashboardLayout.tsx # Dashboard wrapper layout
│
├── constants/
│   └── translations.ts     # i18n translations
│
├── supabase/
│   ├── schema.sql          # Database schema
│   ├── rls-policies.sql    # Row Level Security
│   ├── seed.sql            # Seed data
│   ├── config.toml         # Supabase config
│   ├── migrations/         # DB migrations
│   └── functions/          # Edge functions
│       ├── create-user/
│       └── import-students/
│
└── tests/                  # Playwright tests
```

## Key Entry Points
- `index.tsx` → `App.tsx` → Routes
- Auth flow: `AuthContext.tsx` → `LoginPage.tsx` / `ProtectedRoute.tsx`
- Data flow: Components → Services → Supabase

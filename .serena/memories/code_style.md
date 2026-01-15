# Code Style & Conventions - ELC Project

## TypeScript
- Strict mode enabled
- Target: ES2022
- Module: ESNext with bundler resolution
- Path alias: `@/*` maps to project root

## React Components
- Use functional components with `React.FC<Props>`
- Props interfaces defined inline or above component
- Named exports preferred: `export const ComponentName`
- File naming: PascalCase for components (e.g., `Button.tsx`)

## Styling
- Tailwind CSS utility classes
- Custom CSS variables for theming (`--primary-color`, `--accent-color`)
- Theme utility classes: `theme-bg-primary`, `theme-text-primary`, etc.
- No external UI libraries (no ShadCN, Material UI, etc.)
- Design philosophy: Modern, clean, professional

## Types & Enums
- Enums defined in `types.ts` at project root
- Use SCREAMING_SNAKE_CASE for enum values
- Interfaces for all data structures

## Services
- Service files in `services/` folder
- Named `*.service.ts`
- Export functions for CRUD operations
- Use Supabase client from `lib/supabase.ts`

## Context/State
- Context providers in `contexts/` folder
- Use React Context for global state (Auth, Language, Settings)
- Custom hooks exported from context files (e.g., `useAuth()`)

## File Organization
```
/components
  /admin      - Admin-specific components
  /teacher    - Teacher-specific components
  /student    - Student-specific components
  /parent     - Parent-specific components
  /shared     - Shared components
/contexts     - React context providers
/services     - API/data services
/lib          - Utilities and configurations
/routes       - Route definitions
/layouts      - Layout components
/constants    - Constants and translations
/supabase     - Database schema, migrations, functions
```

## Naming Conventions
- Components: PascalCase (`StudentList.tsx`)
- Services: camelCase with `.service.ts` suffix
- Contexts: PascalCase with `Context` suffix
- Hooks: camelCase with `use` prefix
- Constants: SCREAMING_SNAKE_CASE

# Suggested Commands for ELC Project

## Development
```bash
# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing
```bash
# Run Playwright tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run homepage screenshot test
npm run screenshot
```

## Git Commands (Windows)
```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "message"

# Push
git push

# Pull latest
git pull
```

## Windows System Utils
```bash
# List directory
dir

# List directory (brief)
dir /b

# List subdirectories only
dir /b /ad

# Find text in files
findstr /s /i "pattern" *.tsx

# Change directory
cd path\to\folder
```

## Supabase
```bash
# Login to Supabase CLI
npx supabase login

# Link to project
npx supabase link

# Push database changes
npx supabase db push

# Generate types
npx supabase gen types typescript --local > lib/database.types.ts
```

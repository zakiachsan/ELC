# Task Completion Checklist - ELC Project

## Before Completing Any Task

### 1. Code Quality
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] Code follows project conventions (see `code_style.md`)

### 2. For UI Changes
- [ ] Test on multiple screen sizes (desktop, tablet, mobile)
- [ ] Verify colors match brand/theme
- [ ] Check hover/active/disabled states
- [ ] Take screenshots for visual validation (use Playwright)
- [ ] Ensure responsive layout works

### 3. For Data/Logic Changes
- [ ] Test CRUD operations work correctly
- [ ] Verify RLS policies don't block legitimate access
- [ ] Check error handling is in place

### 4. Testing
- [ ] Run existing tests: `npm test`
- [ ] Add tests for new features if applicable

### 5. Build Verification
- [ ] Run production build: `npm run build`
- [ ] Verify build completes without errors

## Commands to Run Before Marking Complete
```bash
# 1. Type check (via build)
npm run build

# 2. Run tests
npm test

# 3. Start dev server and manually verify
npm run dev
```

## Design Guidelines (from CLAUDE.md)
- Prioritize modern, clean, professional design
- Avoid generic ShadCN purple UI patterns
- Always use visual validation via screenshots
- Iterate until result matches specification

## Visual Validation Loop
1. Make/modify code
2. Refresh browser, take screenshot
3. Analyze screenshot vs specification
4. Identify gaps/issues
5. Repeat until perfect

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for React to render - look for hero heading
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1000); // Extra wait for animations

    // Take screenshot
    await page.screenshot({ path: 'screenshots/homepage-desktop.png', fullPage: true });
  });

  test('should display login button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Check for login button
    const loginButton = page.locator('button:has-text("Login")');
    await expect(loginButton).toBeVisible();
  });
});

test.describe('Responsive Screenshots', () => {
  test('capture desktop view (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/desktop-1920x1080.png', fullPage: true });
  });

  test('capture tablet view (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/tablet-768x1024.png', fullPage: true });
  });

  test('capture mobile view (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/mobile-375x667.png', fullPage: true });
  });
});

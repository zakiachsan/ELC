import { test, expect } from '@playwright/test';

test.describe('Free Assessment Modal', () => {
  test('capture modal desktop view', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Click "Free CEFR Test" button
    await page.click('button:has-text("Free CEFR Test")');

    // Wait for modal to appear
    await page.waitForSelector('text=Free Assessment', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/modal-desktop.png' });
  });

  test('capture modal mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Click "Free CEFR Test" button
    await page.click('button:has-text("Free CEFR Test")');

    // Wait for modal to appear
    await page.waitForSelector('text=Free Assessment', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/modal-mobile.png' });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Olympiad Section', () => {
  test('capture Olympiad section desktop view', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Scroll to Olympiad section
    await page.locator('#featured-event').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot of the section
    await page.screenshot({ path: 'screenshots/olympiad-section-desktop.png', fullPage: false });
  });

  test('capture Olympiad section mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Scroll to Olympiad section
    await page.locator('#featured-event').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/olympiad-section-mobile.png', fullPage: false });
  });
});

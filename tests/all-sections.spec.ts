import { test, expect } from '@playwright/test';

test.describe('All Sections - Desktop View', () => {
  test('capture full page desktop view', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Take full page screenshot
    await page.screenshot({ path: 'screenshots/fullpage-desktop.png', fullPage: true });
  });

  test('capture CEFR section', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    await page.locator('#cefr-test').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/cefr-section-desktop.png', fullPage: false });
  });

  test('capture Hall of Fame section', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    await page.locator('#hall-of-fame').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/hall-of-fame-desktop.png', fullPage: false });
  });

  test('capture News section', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    await page.locator('#news').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/news-section-desktop.png', fullPage: false });
  });
});

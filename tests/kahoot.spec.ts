import { test, expect } from '@playwright/test';

test.describe('Kahoot Quiz Feature', () => {
  test('capture Kahoot section desktop view', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Scroll to Kahoot section
    await page.locator('#kahoot-quiz').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot of the section
    await page.screenshot({ path: 'screenshots/kahoot-section-desktop.png', fullPage: false });
  });

  test('capture Kahoot section mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Scroll to Kahoot section
    await page.locator('#kahoot-quiz').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/kahoot-section-mobile.png', fullPage: false });
  });

  test('capture quiz intro modal', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Scroll to Kahoot section and click Play Now
    await page.locator('#kahoot-quiz').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.click('button:has-text("Play Now")');
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/kahoot-intro-desktop.png' });
  });

  test('capture quiz playing view', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Start quiz
    await page.locator('#kahoot-quiz').scrollIntoViewIfNeeded();
    await page.click('button:has-text("Play Now")');
    await page.waitForTimeout(300);

    // Enter name and start
    await page.fill('input[placeholder="Your name..."]', 'Test Player');
    await page.click('button:has-text("Start Quiz")');
    await page.waitForTimeout(500);

    // Take screenshot of quiz in progress
    await page.screenshot({ path: 'screenshots/kahoot-playing-desktop.png' });
  });
});

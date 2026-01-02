import { test, expect } from '@playwright/test';

test('debug page load', async ({ page }) => {
  // Capture console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`ERROR: ${err.message}`));

  console.log('Navigating to localhost:3001...');

  const response = await page.goto('http://localhost:3001', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('Response status:', response?.status());

  // Wait a bit
  await page.waitForTimeout(3000);

  // Get page content
  const content = await page.content();
  console.log('Page HTML length:', content.length);
  console.log('First 500 chars:', content.substring(0, 500));

  // Log console messages
  console.log('Console logs:', consoleLogs);

  // Take screenshot anyway
  await page.screenshot({ path: 'screenshots/debug.png', fullPage: true });

  // Check if there's a root element
  const root = await page.$('#root');
  console.log('Root element exists:', !!root);

  if (root) {
    const innerHTML = await root.innerHTML();
    console.log('Root innerHTML length:', innerHTML.length);
    console.log('Root innerHTML preview:', innerHTML.substring(0, 200));
  }
});

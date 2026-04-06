import { test, expect } from '@playwright/test';
import { loginAs, goToCrud } from './auth.helpers';

test('debug: CLIENT acessa /deliveries', async ({ page }) => {
  // Captura requests de rede
  const requests: string[] = [];
  page.on('request', r => requests.push(`${r.method()} ${r.url()}`));
  page.on('response', r => {
    if (r.status() >= 400) requests.push(`  ❌ ${r.status()} ${r.url()}`);
  });
  page.on('console', msg => console.log(`  [console] ${msg.type()}: ${msg.text()}`));

  await loginAs(page, 'CLIENT');
  await goToCrud(page, '/deliveries');

  // Dump page content
  const html = await page.content();
  console.log('=== HTML length:', html.length);
  console.log('=== Body inner text:', await page.locator('body').innerText().catch(() => 'ERROR'));
  console.log('=== Failed requests:', requests.filter(r => r.includes('❌')).join('\n'));

  // Procura por qualquer elemento visível no main content
  const allText = await page.locator('body').innerText();
  console.log('=== Page text (first 500 chars):', allText.substring(0, 500));

  expect(true).toBe(true); // Sempre passa - é debug
});

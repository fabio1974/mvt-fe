import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { USERS, ROLES, PASSWORD, authFile, monitor } from './helpers';

/**
 * Login PELA UI para cada papel e salva o storageState (localStorage com authToken)
 * para os demais testes reaproveitarem.
 */
for (const role of ROLES) {
  setup(`login UI — ${role}`, async ({ page }) => {
    const mon = monitor(page);
    await page.goto('/login');
    await page.getByPlaceholder('Digite seu email ou CPF').fill(USERS[role]);
    await page.getByPlaceholder('Digite sua senha').fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('authToken')), { timeout: 20_000 }).toBeTruthy();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 });
    // O app recarrega a página após o login — espera estabilizar antes de mexer no localStorage
    let role_: string | null = null;
    for (let i = 0; i < 10; i++) {
      try {
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => localStorage.setItem('filtersCollapsed', 'false'));
        role_ = await page.evaluate(() => localStorage.getItem('userRole'));
        break;
      } catch { await page.waitForTimeout(1000); }
    }
    expect(role_ || '').toContain(role);
    fs.mkdirSync(path.dirname(authFile(role)), { recursive: true });
    await page.context().storageState({ path: authFile(role) });
    expect.soft(mon.failures, `respostas 4xx/5xx no login/home de ${role}`).toEqual([]);
  });
}

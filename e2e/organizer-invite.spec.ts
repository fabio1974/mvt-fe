import { test, expect } from '@playwright/test';
import { API, PASSWORD, authFile, monitor, saveResult } from './helpers';
import { dbAvailable, psql } from './db';

/**
 * Convite de gerente pelo admin (tela /gerentes/convidar) + primeiro acesso do convidado
 * ("Criar sua senha" obrigatório). Banco LOCAL: o e2e troca o hash da senha temporária do
 * convidado pelo hash conhecido de um seed (Teste@123) — a senha temporária nunca sai da API.
 * Cria e apaga a conta e2e.pw-invite.<ts>@mvt.com.
 */
const EMAIL = `e2e.pw-invite.${Date.now()}@mvt.com`;
const q = (v: string) => `'${v.replace(/'/g, "''")}'`;

function cleanup() {
  psql(`delete from organizations where owner_id in (select id from users where username = ${q(EMAIL)})`);
  psql(`delete from users where username = ${q(EMAIL)}`);
}

test.describe.serial('convite de gerente', () => {
  test.skip(!dbAvailable, 'banco local indisponível (docker zapi10-local-db)');
  test.afterAll(() => { if (dbAvailable) cleanup(); });

  test.describe('admin', () => {
    test.use({ storageState: authFile('ADMIN') });

    test('/gerentes/convidar — convida, mostra resultado e lista com filtros', async ({ page }) => {
      const mon = monitor(page);
      const firstList = page.waitForResponse((r) => r.url().startsWith(API) && new URL(r.url()).pathname === '/api/admin/organizer-invites' && r.request().method() === 'GET');
      await page.goto('/gerentes/convidar');
      expect((await firstList).status(), 'GET convites').toBe(200);
      await expect(page.getByRole('heading', { name: 'Gerentes convidados' })).toBeVisible();

      await page.locator('#invite-emails').fill(`${EMAIL}\nnao-e-email`);
      await expect(page.locator('#invite-name'), 'nome só para um e-mail').toBeDisabled();
      await page.locator('#invite-emails').fill(EMAIL);
      await page.locator('#invite-name').fill('Gerente Playwright');
      const post = page.waitForResponse((r) => r.url().startsWith(API) && new URL(r.url()).pathname === '/api/admin/organizer-invites' && r.request().method() === 'POST');
      await page.getByRole('button', { name: /enviar convite/i }).click();
      const resp = await post;
      expect(resp.status(), 'POST convite').toBe(200);
      const body = await resp.text();
      expect(body, 'resposta sem senha').not.toMatch(/password|senha|\$2a\$/i);
      const result = page.getByTestId('invite-result');
      await expect(result).toContainText(EMAIL);
      await expect(result).toContainText('Conta nova');

      const table = page.getByTestId('invited-table');
      const row = table.locator('tr', { hasText: EMAIL });
      await expect(row).toContainText('Gerente Playwright');
      await expect(row).toContainText('Aguardando troca de senha');

      // filtro Status (select)
      const status = page.getByLabel('Status');
      await status.selectOption('ACTIVE');
      await expect(row, 'Ativo esconde quem ainda não trocou a senha').toHaveCount(0);
      const activeRows = await table.locator('tbody tr').allInnerTexts();
      expect(activeRows.every((t) => !t.includes('Aguardando troca de senha')), 'Ativo só mostra ativos').toBe(true);
      await status.selectOption('PENDING');
      await expect(row).toHaveCount(1);
      const pendingRows = await table.locator('tbody tr').allInnerTexts();
      expect(pendingRows.every((t) => t.includes('Aguardando troca de senha')), 'Aguardando só mostra pendentes').toBe(true);
      await status.selectOption('');

      // busca por nome/e-mail
      const search = page.getByLabel('Buscar por nome ou e-mail');
      await search.fill('gerente playwright');
      await expect(table.locator('tbody tr')).toHaveCount(1);
      await expect(row).toHaveCount(1);
      await search.fill('nao-existe-ninguem-assim');
      await expect(table).toContainText('Nenhum gerente convidado com esses filtros');
      await search.fill('');

      // reenvio do mesmo e-mail → "Reenviado"
      await page.locator('#invite-emails').fill(EMAIL);
      await page.getByRole('button', { name: /enviar convite/i }).click();
      await expect(page.getByTestId('invite-result')).toContainText('Reenviado');

      saveResult(test.info(), { page: '/gerentes/convidar', role: 'ADMIN', failures: mon.failures, forbidden: mon.forbidden, console: mon.consoleErrors });
      expect.soft(mon.failures.map((f) => `${f.method} ${f.url} → ${f.status} ${f.body}`), 'respostas 4xx/5xx').toEqual([]);
      expect.soft(mon.forbidden, '403 inesperado').toEqual([]);
      expect.soft([...new Set(mon.consoleErrors)], 'erros no console').toEqual([]);
    });
  });

  test('convidado: 1º acesso força "Criar sua senha" antes de qualquer tela', async ({ page }) => {
    const mon = monitor(page);
    // hash conhecido (Teste@123) só no banco local; a flag temporary_password continua true
    psql(`update users set password = (select password from users where username = 'admin@mvt.com') where username = ${q(EMAIL)}`);
    expect(psql(`select temporary_password from users where username = ${q(EMAIL)}`)[0][0]).toBe('t');

    await page.goto('/login');
    await page.getByPlaceholder('Digite seu email ou CPF').fill(EMAIL);
    await page.getByPlaceholder('Digite sua senha').fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((u) => u.pathname === '/criar-senha', { timeout: 20_000 });
    await expect(page.getByText('CRIAR SUA SENHA')).toBeVisible();

    // qualquer outra tela volta pra "Criar sua senha" (guard central)
    await page.goto('/deliveries');
    await page.waitForURL((u) => u.pathname === '/criar-senha');
    await expect(page.locator('.sidebar-menu-item'), 'sem menu lateral').toHaveCount(0);

    await page.getByPlaceholder('Senha temporária', { exact: true }).fill(PASSWORD);
    await page.getByPlaceholder('Nova senha', { exact: true }).fill('MinhaSenha@1');
    await page.getByPlaceholder('Repita a nova senha').fill('MinhaSenha@1');
    await page.getByRole('button', { name: /criar senha/i }).click();
    await page.waitForURL((u) => u.pathname === '/', { timeout: 20_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    expect(psql(`select temporary_password from users where username = ${q(EMAIL)}`)[0][0]).toBe('f');

    await page.goto('/organizacao');
    await page.waitForLoadState('networkidle').catch(() => {});
    expect(new URL(page.url()).pathname, 'sem redirecionar depois da troca').toBe('/organizacao');

    const blocked = mon.forbidden.filter((f) => /PASSWORD_CHANGE_REQUIRED/.test(f.body || ''));
    saveResult(test.info(), { page: '/criar-senha', role: 'ORGANIZER', failures: mon.failures, forbidden: mon.forbidden, console: mon.consoleErrors });
    expect.soft(mon.failures.filter((f) => f.status >= 500).map((f) => `${f.method} ${f.url} → ${f.status}`), '5xx').toEqual([]);
    test.info().annotations.push({ type: 'info', description: `403 PASSWORD_CHANGE_REQUIRED durante o fluxo: ${blocked.length}` });
  });

  test('cadastro público não oferece Gerente', async ({ page }) => {
    for (const url of ['/login?tab=register&role=ORGANIZER&lockRole=true', '/login?tab=register&role=COURIER']) {
      await page.goto(url);
      await page.waitForLoadState('networkidle').catch(() => {});
      const values = await page.locator('select option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
      expect(values, url).not.toContain('ORGANIZER');
      await expect(page.getByText('Gerente Zapi10'), url).toHaveCount(0);
    }
  });
});

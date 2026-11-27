import { test, expect, type Page } from '@playwright/test';
import { API, authFile, monitor, saveResult, type Role } from './helpers';
import { dbAvailable, psql } from './db';

/**
 * Convite de estabelecimento, motorista e garçom (telas /estabelecimentos/convidar,
 * /motoristas/convidar e /garcons/convidar) com TODOS os filtros da lista (Status e busca), mais o
 * campo extra do admin (Grupo / Estabelecimento) e o cadastro público sem loja/garçom.
 * Banco LOCAL. Cria contas e2e.pw-sw.<ts>.*@mvt.com e apaga no fim.
 */
const TS = Date.now();
const em = (tag: string) => `e2e.pw-sw.${TS}.${tag}@mvt.com`;
const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
const LIKE = q(`e2e.pw-sw.${TS}.%`);

function cleanup() {
  const ids = `select id from users where username like ${LIKE}`;
  for (const [t, c] of [['link_invitations', 'invitee_id'], ['client_waiters', 'waiter_id'], ['client_contracts', 'client_id'],
    ['employment_contracts', 'courier_id'], ['customer_payment_preferences', 'user_id'], ['restaurant_tables', 'client_id']]) {
    psql(`delete from ${t} where ${c} in (${ids})`);
  }
  psql(`delete from users where username like ${LIKE}`);
}

const ENDPOINT: Record<string, string> = {
  '/estabelecimentos/convidar': '/api/account-invites/stores',
  '/motoristas/convidar': '/api/account-invites/couriers',
  '/garcons/convidar': '/api/account-invites/waiters',
};

/** Convida um e-mail e confere resultado + lista + filtros Status e busca. */
async function inviteAndFilter(page: Page, path: string, email: string, name: string, listTitle: string,
  singular: string, before?: (p: Page) => Promise<void>) {
  const endpoint = ENDPOINT[path];
  // Loja seed tem pedidos pendentes: o alerta "Pedido novo!" pode cobrir a tela — "Ver depois".
  // (um alerta por pedido: fecha um após o outro)
  await page.addLocatorHandler(page.getByRole('button', { name: 'Ver depois' }), async (b) => {
    for (let i = 0; i < 20 && (await b.isVisible()); i++) await b.click();
  }, { noWaitAfter: true });
  const firstList = page.waitForResponse((r) => r.url().startsWith(API) && new URL(r.url()).pathname === endpoint && r.request().method() === 'GET');
  await page.goto(path);
  expect((await firstList).status(), `GET ${endpoint}`).toBe(200);
  await expect(page.getByRole('heading', { name: listTitle })).toBeVisible();
  if (before) await before(page);

  await page.locator('#invite-emails').fill(email);
  await page.locator('#invite-name').fill(name);
  const post = page.waitForResponse((r) => r.url().startsWith(API) && new URL(r.url()).pathname === endpoint && r.request().method() === 'POST');
  await page.getByRole('button', { name: /enviar convite/i }).click();
  const resp = await post;
  expect(resp.status(), `POST ${endpoint}`).toBe(200);
  expect(await resp.text(), 'resposta sem senha').not.toMatch(/password|\$2a\$/i);
  await expect(page.getByTestId('invite-result')).toContainText(email);
  await expect(page.getByTestId('invite-result')).toContainText('Conta nova');

  const table = page.getByTestId('invited-table');
  const row = table.locator('tr', { hasText: email });
  await expect(row).toContainText(name);
  await expect(row).toContainText('Aguardando troca de senha');

  // filtro Status (select): cada valor contra o que o backend devolveu
  const status = page.getByLabel('Status');
  await status.selectOption('ACTIVE');
  await expect(row).toHaveCount(0);
  expect((await table.locator('tbody tr').allInnerTexts()).every((t) => !t.includes('Aguardando troca de senha'))).toBe(true);
  await status.selectOption('PENDING');
  await expect(row).toHaveCount(1);
  expect((await table.locator('tbody tr').allInnerTexts()).every((t) => t.includes('Aguardando troca de senha'))).toBe(true);
  await status.selectOption('');
  await expect(row).toHaveCount(1);

  // busca por nome e por e-mail
  const search = page.getByLabel('Buscar por nome ou e-mail');
  await search.fill(name.toLowerCase());
  await expect(row).toHaveCount(1);
  await search.fill(email.toUpperCase());
  await expect(row).toHaveCount(1);
  await search.fill('nao-existe-ninguem-assim');
  await expect(table).toContainText(`Nenhum ${singular} convidado com esses filtros`);
  await search.fill('');

  // reenvio
  await page.locator('#invite-emails').fill(email);
  await page.getByRole('button', { name: /enviar convite/i }).click();
  await expect(page.getByTestId('invite-result')).toContainText('Reenviado');
}

function finish(info: Parameters<typeof saveResult>[0], page: string, role: Role, mon: ReturnType<typeof monitor>) {
  saveResult(info, { page, role, failures: mon.failures, forbidden: mon.forbidden, console: mon.consoleErrors });
  expect.soft(mon.failures.map((f) => `${f.method} ${f.url} → ${f.status} ${f.body}`), 'respostas 4xx/5xx').toEqual([]);
  expect.soft(mon.forbidden, '403 inesperado').toEqual([]);
  expect.soft([...new Set(mon.consoleErrors)], 'erros no console').toEqual([]);
}

test.describe.serial('convite de loja, motorista e garçom', () => {
  test.skip(!dbAvailable, 'banco local indisponível (docker zapi10-local-db)');
  test.afterAll(() => { if (dbAvailable) cleanup(); });

  test.describe('gerente', () => {
    test.use({ storageState: authFile('ORGANIZER') });

    test('/estabelecimentos/convidar — loja nasce no grupo do gerente; filtros', async ({ page }) => {
      const mon = monitor(page);
      await inviteAndFilter(page, '/estabelecimentos/convidar', em('loja'), 'Loja Playwright', 'Estabelecimentos convidados', 'estabelecimento');
      await expect(page.getByLabel('Grupo'), 'gerente não escolhe grupo').toHaveCount(0);
      const contract = psql(`select c.status from client_contracts c join users u on u.id=c.client_id join organizations o on o.id=c.organization_id
        join users ow on ow.id=o.owner_id where u.username=${q(em('loja'))} and ow.username='organizer1@mvt.com'`);
      expect(contract[0]?.[0], 'contrato com o grupo do gerente').toBe('ACTIVE');
      // menu: grupo "Convidar" do gerente leva às duas telas
      await page.locator('.sidebar-group-header', { hasText: /^Convidar$/ }).click();
      await page.locator('.sidebar-menu-item', { hasText: 'Convidar motorista' }).click();
      await page.waitForURL((u) => u.pathname === '/motoristas/convidar');
      finish(test.info(), '/estabelecimentos/convidar', 'ORGANIZER', mon);
    });

    test('/motoristas/convidar — motorista nasce no grupo; filtros', async ({ page }) => {
      const mon = monitor(page);
      await inviteAndFilter(page, '/motoristas/convidar', em('motorista'), 'Motorista Playwright', 'Motoristas convidados', 'motorista');
      const ec = psql(`select ec.is_active from employment_contracts ec join users u on u.id=ec.courier_id where u.username=${q(em('motorista'))}`);
      expect(ec[0]?.[0], 'vínculo com o grupo').toBe('t');
      finish(test.info(), '/motoristas/convidar', 'ORGANIZER', mon);
    });
  });

  test.describe('loja', () => {
    test.use({ storageState: authFile('CLIENT') });

    test('/garcons/convidar — garçom nasce vinculado à loja; filtros', async ({ page }) => {
      const mon = monitor(page);
      await inviteAndFilter(page, '/garcons/convidar', em('garcom'), 'Garcom Playwright', 'Garçons convidados', 'garçom');
      await expect(page.locator('#invite-store'), 'loja não escolhe estabelecimento').toHaveCount(0);
      const link = psql(`select cw.active from client_waiters cw join users w on w.id=cw.waiter_id join users c on c.id=cw.client_id
        where w.username=${q(em('garcom'))} and c.username='client1@mvt.com'`);
      expect(link[0]?.[0], 'vínculo com a loja').toBe('t');
      finish(test.info(), '/garcons/convidar', 'CLIENT', mon);
    });
  });

  test.describe('admin', () => {
    test.use({ storageState: authFile('ADMIN') });

    test('/estabelecimentos/convidar — Grupo (select do banco) opcional; filtros', async ({ page }) => {
      const mon = monitor(page);
      const orgName = psql(`select o.name from organizations o join users u on u.id=o.owner_id where u.username='organizer1@mvt.com' limit 1`)[0][0];
      await inviteAndFilter(page, '/estabelecimentos/convidar', em('loja.admin'), 'Loja Admin Playwright', 'Estabelecimentos convidados',
        'estabelecimento', async (p) => {
          const grupo = p.getByLabel('Grupo');
          await expect(grupo.locator('option', { hasText: orgName })).toHaveCount(1);
          await grupo.selectOption({ label: orgName });
        });
      const contract = psql(`select o.name from client_contracts c join users u on u.id=c.client_id join organizations o on o.id=c.organization_id where u.username=${q(em('loja.admin'))}`);
      expect(contract[0]?.[0], 'loja no grupo escolhido').toBe(orgName);
      finish(test.info(), '/estabelecimentos/convidar', 'ADMIN', mon);
    });

    test('/motoristas/convidar — Grupo obrigatório', async ({ page }) => {
      const mon = monitor(page);
      await page.goto('/motoristas/convidar');
      await page.locator('#invite-emails').fill(em('motorista.admin'));
      await page.getByRole('button', { name: /enviar convite/i }).click();
      await expect(page.getByRole('alert')).toHaveText('Escolha o grupo.');
      finish(test.info(), '/motoristas/convidar', 'ADMIN', mon);
    });

    test('/garcons/convidar — Estabelecimento por typeahead (1ª letra); filtros', async ({ page }) => {
      const mon = monitor(page);
      const store = psql(`select name from users where username='client1@mvt.com'`)[0][0];
      await inviteAndFilter(page, '/garcons/convidar', em('garcom.admin'), 'Garcom Admin Playwright', 'Garçons convidados', 'garçom',
        async (p) => {
          const typeahead = p.locator('#invite-store');
          const search = p.waitForResponse((r) => r.url().startsWith(API) && new URL(r.url()).pathname === '/api/users' && r.request().method() === 'GET');
          await typeahead.fill(store.slice(0, 1));
          expect((await search).status(), 'typeahead de lojas').toBe(200);
          await typeahead.fill(store);
          await p.getByRole('option', { name: new RegExp(store) }).first().dispatchEvent('mousedown');
          await expect(typeahead).toHaveValue(store);
        });
      const link = psql(`select c.username from client_waiters cw join users w on w.id=cw.waiter_id join users c on c.id=cw.client_id where w.username=${q(em('garcom.admin'))}`);
      expect(link[0]?.[0], 'garçom na loja escolhida').toBe('client1@mvt.com');
      finish(test.info(), '/garcons/convidar', 'ADMIN', mon);
    });
  });

  test('cadastro público: só Cliente e Motorista / Entregador, com aviso de convite', async ({ page }) => {
    for (const url of ['/login?tab=register&role=CLIENT&lockRole=true', '/login?tab=register&role=WAITER', '/login?tab=register']) {
      await page.goto(url);
      await page.waitForLoadState('networkidle').catch(() => {});
      const values = await page.locator('select option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
      expect(values, url).not.toContain('CLIENT');
      expect(values, url).not.toContain('WAITER');
      await expect(page.getByText('Estabelecimento Comercial'), url).toHaveCount(0);
    }
  });
});

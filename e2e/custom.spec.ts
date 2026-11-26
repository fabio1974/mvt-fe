import { test, expect, Page } from '@playwright/test';
import { API, authFile, monitor, saveResult, hideOrderAlert } from './helpers';

/** Filtros/controles das telas customizadas (fora do EntityTable genérico). */

function waitApi(page: Page, path: string, pred: (q: URLSearchParams) => boolean = () => true, timeout = 12_000) {
  return page.waitForResponse((r) => {
    if (!r.url().startsWith(API)) return false;
    const u = new URL(r.url());
    return u.pathname === path && pred(u.searchParams);
  }, { timeout }).catch(() => null);
}

const noFail = (mon: ReturnType<typeof monitor>) =>
  expect.soft(mon.failures.map((f) => `${f.method} ${f.url} → ${f.status} ${f.body}`), 'respostas 4xx/5xx').toEqual([]);

test.describe('custom [ADMIN]', () => {
  test.use({ storageState: authFile('ADMIN') });

  test('/repasses — filtros status e janela', async ({ page }) => {
    const mon = monitor(page);
    const first = waitApi(page, '/api/pagarme-transfers/by-recipient', (q) => q.get('status') === 'PENDING');
    await page.goto('/repasses');
    expect.soft((await first)?.status(), 'carga PENDING').toBe(200);
    const log: string[] = [];
    const pPaid = waitApi(page, '/api/pagarme-transfers/by-recipient', (q) => q.get('status') === 'SUCCEEDED');
    await page.locator('.repasses-filter button', { hasText: 'Pagos' }).click();
    const rp = await pPaid; log.push(`status=SUCCEEDED → ${rp?.status()}`);
    expect.soft(rp?.status(), 'Pagos').toBe(200);
    const winBtns = page.locator('.repasses-filter').nth(1).locator('button');
    for (let i = 0; i < (await winBtns.count()); i++) {
      const b = winBtns.nth(i);
      if ((await b.getAttribute('class'))?.includes('active')) continue;
      const p = waitApi(page, '/api/pagarme-transfers/by-recipient');
      await b.click();
      const r = await p;
      log.push(`janela "${await b.innerText()}" since=${r ? new URL(r.url()).searchParams.get('since') : 'SEM REQUISIÇÃO'} → ${r?.status()}`);
      expect.soft(r?.status(), `janela ${await b.innerText()}`).toBe(200);
    }
    noFail(mon);
    saveResult(test.info(), { log, mon });
  });

  test('/ganhos — granularidade, datas e por gerente', async ({ page }) => {
    const mon = monitor(page);
    const log: string[] = [];
    const first = waitApi(page, '/api/reports/platform-earnings');
    await page.goto('/ganhos');
    const r0 = await first; log.push(`carga → ${r0?.status()} ${r0?.url().replace(API, '')}`);
    expect.soft(r0?.status()).toBe(200);
    const seg = page.locator('.pe-seg-btn');
    for (let i = 0; i < (await seg.count()); i++) {
      const b = seg.nth(i);
      if ((await b.getAttribute('class'))?.includes('active')) continue;
      // a tela só busca ao clicar em "Gerar"
      await b.click();
      const p = waitApi(page, '/api/reports/platform-earnings', (q) => !!q.get('granularity'));
      await page.locator('.pe-action').first().click();
      const r = await p;
      log.push(`granularidade ${r ? new URL(r.url()).searchParams.get('granularity') : 'SEM REQ'} → ${r?.status()}`);
      expect.soft(r?.status(), `granularidade ${await b.innerText()}`).toBe(200);
    }
    const from = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
    const pD = waitApi(page, '/api/reports/platform-earnings', (q) => q.get('from') === from);
    await page.locator('.pe-dates input[type="date"]').first().fill(from);
    await page.locator('.pe-action').first().click();
    const rD = await pD; log.push(`from=${from} → ${rD?.status() ?? 'SEM REQUISIÇÃO'}`);
    expect.soft(rD?.status(), 'filtro De').toBe(200);

    const pO = waitApi(page, '/api/reports/organizers');
    await page.locator('.pe-tab', { hasText: 'Por Gerente' }).click();
    const rO = await pO; log.push(`organizers → ${rO?.status()}`);
    expect.soft(rO?.status()).toBe(200);
    const sel = page.locator('select.pe-select');
    await sel.waitFor({ timeout: 10_000 }).catch(() => {});
    const vals = (await sel.locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value))).filter(Boolean);
    for (const v of vals) {
      const cur = await sel.inputValue();
      const p = waitApi(page, '/api/reports/organizer-earnings', (q) => q.get('organizerId') === v);
      if (cur !== v) await sel.selectOption(v);
      await page.locator('.pe-action').first().click();
      const r = await p;
      log.push(`organizerId=${v} → ${r?.status() ?? 'SEM REQUISIÇÃO'}`);
      expect.soft(r?.status(), `gerente ${v}`).toBe(200);
    }
    noFail(mon);
    saveResult(test.info(), { log, mon });
  });

  test('/zonas-especiais e /marketing carregam dados', async ({ page }) => {
    const mon = monitor(page);
    const p = waitApi(page, '/api/special-zones');
    await page.goto('/zonas-especiais');
    expect.soft((await p)?.status(), 'special-zones').toBe(200);
    await page.goto('/marketing');
    await page.waitForLoadState('networkidle').catch(() => {});
    noFail(mon);
    saveResult(test.info(), { mon });
  });
});

test.describe('custom [COURIER]', () => {
  test.use({ storageState: authFile('COURIER') });
  test('/meus-ganhos — filtro Recentes/Todas', async ({ page }) => {
    const mon = monitor(page);
    const p1 = waitApi(page, '/api/couriers/me/earnings', (q) => q.get('recent') === 'true');
    await page.goto('/meus-ganhos');
    expect.soft((await p1)?.status(), 'recent=true').toBe(200);
    const p2 = waitApi(page, '/api/couriers/me/earnings', (q) => q.get('recent') === 'false');
    await page.locator('.earnings-filter-tab', { hasText: 'Todas' }).click();
    expect.soft((await p2)?.status(), 'recent=false').toBe(200);
    const p3 = waitApi(page, '/api/payments/my-balance');
    await page.goto('/minha-carteira');
    // 422 NO_RECIPIENT = motoboy sem conta recebedora (estado de negócio, a tela mostra a mensagem)
    expect.soft([200, 422], 'my-balance').toContain((await p3)?.status());
    await expect.soft(page.locator('body')).not.toContainText(/Cannot read|undefined/);
    mon.failures.splice(0, mon.failures.length, ...mon.failures.filter((f) => !/NO_RECIPIENT/.test(f.body || '')));
    noFail(mon);
    saveResult(test.info(), { mon });
  });
});

test.describe('custom [CLIENT]', () => {
  test.use({ storageState: authFile('CLIENT') });
  test.beforeEach(async ({ page }) => { await hideOrderAlert(page); });

  test('/relatorios/caixa — intervalo de horário', async ({ page }) => {
    const mon = monitor(page);
    await page.goto('/relatorios/caixa');
    await page.waitForLoadState('networkidle').catch(() => {});
    const times = page.locator('.cash-report-filter input[type="time"]');
    await times.nth(0).fill('08:00');
    await times.nth(1).fill('20:00');
    const p = waitApi(page, '/api/reports/cash', (q) => q.get('startTime') === '08:00');
    await page.locator('.cash-report-apply').click();
    const r = await p;
    expect.soft(r?.status(), `GET /api/reports/cash ${r?.url().replace(API, '')}`).toBe(200);
    noFail(mon);
    saveResult(test.info(), { url: r?.url(), mon });
  });

  test('/cardapio — categorias e produtos', async ({ page }) => {
    const mon = monitor(page);
    const pc = waitApi(page, '/api/categories/me');
    const pp = waitApi(page, '/api/products/me');
    await page.goto('/cardapio');
    const [rc, rp] = [await pc, await pp];
    expect.soft(rc?.status(), 'categories/me').toBe(200);
    expect.soft(rp?.status(), 'products/me').toBe(200);
    await expect.soft(page.getByText('E2E Lanches').first()).toBeVisible();
    noFail(mon);
    saveResult(test.info(), { mon });
  });

  test('/mesas e /caixa', async ({ page }) => {
    const mon = monitor(page);
    const pt = waitApi(page, '/api/tables');
    await page.goto('/mesas');
    expect.soft((await pt)?.status(), 'GET /api/tables').toBe(200);
    const pc = waitApi(page, '/api/cash-register/current');
    await page.goto('/caixa');
    const rc = await pc;
    expect.soft([200, 204, 404]).toContain(rc?.status());
    noFail(mon);
    saveResult(test.info(), { mon });
  });
});

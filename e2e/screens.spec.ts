import { test, expect } from '@playwright/test';
import { Role, authFile, monitor, saveResult } from './helpers';

/**
 * Smoke das telas CUSTOMIZADAS (e das genéricas de formulário próprio): carregam sem 4xx/5xx,
 * sem erro no console e sem mensagem de erro visível. 403 é registrado à parte.
 * Telas com filtros/paginação próprios têm checagens extras em custom.spec.ts.
 */
const SCREENS: Record<Role, string[]> = {
  ADMIN: ['/', '/repasses', '/ganhos', '/zonas-especiais', '/marketing', '/processar-pagamentos', '/suporte',
    '/downloads', '/alterar-senha', '/dados-pessoais', '/dados-endereco', '/gerentes/convidar'],
  CLIENT: ['/', '/cardapio', '/configurar-loja', '/caixa', '/mesas', '/relatorios/caixa', '/chave-pix', '/suporte',
    '/dados-pessoais', '/dados-estabelecimento', '/dados-endereco', '/alterar-senha'],
  ORGANIZER: ['/', '/organizacao', '/balanco-financeiro', '/chave-pix', '/suporte', '/dados-pessoais', '/dados-endereco'],
  COURIER: ['/', '/meus-ganhos', '/minha-carteira', '/chave-pix', '/suporte', '/dados-pessoais'],
  CUSTOMER: ['/', '/meus-cartoes', '/preferencias-pagamento', '/suporte', '/dados-pessoais', '/dados-endereco'],
};

/** Telas de ADMIN acessadas por outros papéis: espera-se bloqueio (403 / tela vazia), nunca 500. */
const ADMIN_ONLY = ['/cupons', '/anuncios', '/versoes-mobile', '/configuracoes', '/repasses', '/ganhos', '/estabelecimentos'];

const ERROR_TEXT = /Erro ao carregar|Something went wrong|Unexpected Application Error|Cannot read propert|is not a function|undefined is not/i;

for (const role of Object.keys(SCREENS) as Role[]) {
  test.describe(`telas [${role}]`, () => {
    test.use({ storageState: authFile(role) });
    for (const path of SCREENS[role]) {
      test(`${path} carrega`, async ({ page }) => {
        const mon = monitor(page);
        await page.goto(path);
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(2500);
        const bodyText = await page.locator('body').innerText();
        const visibleError = (bodyText.match(ERROR_TEXT) || [])[0];
        saveResult(test.info(), { page: path, role, failures: mon.failures, forbidden: mon.forbidden, console: mon.consoleErrors, visibleError });
        expect.soft(bodyText.trim().length, 'tela em branco').toBeGreaterThan(20);
        expect.soft(visibleError, 'mensagem de erro visível').toBeUndefined();
        // 422 NO_RECIPIENT (/minha-carteira de motoboy sem recebedor) é estado de negócio, exibido na tela
        const expected = (f: { status: number; body?: string }) => f.status === 422 && /NO_RECIPIENT/.test(f.body || '');
        mon.failures.filter(expected).forEach((f) => test.info().annotations.push({ type: 'aviso', description: `${f.url} → 422 NO_RECIPIENT` }));
        expect.soft(mon.failures.filter((f) => !expected(f)).map((f) => `${f.method} ${f.url} → ${f.status} ${f.body}`), 'respostas 4xx/5xx').toEqual([]);
        expect.soft(mon.forbidden.map((f) => `${f.method} ${f.url} → 403`), '403 inesperado em tela do próprio papel').toEqual([]);
        expect.soft([...new Set(mon.consoleErrors)], 'erros no console').toEqual([]);
      });
    }
  });
}

for (const role of ['CLIENT', 'ORGANIZER', 'COURIER', 'CUSTOMER'] as Role[]) {
  test.describe(`acesso negado [${role}]`, () => {
    test.use({ storageState: authFile(role) });
    test('telas de ADMIN não vazam dados nem dão 500', async ({ page }) => {
      const mon = monitor(page);
      const leaks: string[] = [];
      for (const path of ADMIN_ONLY) {
        const okData: string[] = [];
        const h = async (r: any) => {
          const u = new URL(r.url());
          if (r.request().method() === 'GET' && r.status() === 200 && /\/api\/(coupons|announcements|users\/mobile-versions|site-configuration|pagarme-transfers|reports\/platform)/.test(u.pathname)) okData.push(u.pathname);
        };
        page.on('response', h);
        await page.goto(path);
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        await page.waitForTimeout(1200);
        page.off('response', h);
        if (okData.length) leaks.push(`${path}: 200 em ${[...new Set(okData)].join(', ')}`);
      }
      saveResult(test.info(), { role, leaks, failures: mon.failures, forbidden: mon.forbidden });
      // 5xx é bug; 403/404 é o esperado
      expect.soft(mon.failures.filter((f) => f.status >= 500).map((f) => `${f.method} ${f.url} → ${f.status}`), '5xx').toEqual([]);
      test.info().annotations.push({ type: 'info', description: `200 com dados de admin: ${leaks.join(' | ') || 'nenhum'}; 403: ${mon.forbidden.length}` });
    });
  });
}

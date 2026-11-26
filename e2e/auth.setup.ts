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

/**
 * Dados de apoio para os filtros (banco LOCAL, idempotente): sem isso alguns filtros só podem
 * ser conferidos "no vazio" (ex.: ninguém tem versão do app, nenhum pagamento tem vencimento).
 * Só mexe em registros dummy de e2e; nunca roda contra backend que não seja localhost.
 */
setup('dados de apoio dos filtros (banco local)', async () => {
  const { dbAvailable, psql } = await import('./db');
  setup.skip(!dbAvailable, 'banco local indisponível (docker zapi10-local-db)');
  // versões do app (select "Versão" do relatório de versões mobile)
  psql(`update users set mobile_app_version = case username when 'e2e.client@mvt.com' then 'v1.0.8-90' else 'v1.0.9-99' end,
          mobile_platform = case username when 'e2e.customer@mvt.com' then 'ios' else 'android' end,
          mobile_version_updated_at = coalesce(mobile_version_updated_at, now() - interval '2 days')
        where username in ('e2e.client@mvt.com','e2e.courier@mvt.com','e2e.customer@mvt.com')`);
  // cidade do GPS (typeahead "Cidade" das telas de usuário)
  psql(`update users set gps_city_id = (select id from cities where name='Sobral' and state_code='CE')
        where gps_city_id is null and username in ('client1@mvt.com','courier1@mvt.com','organizer1@mvt.com','e2e.client@mvt.com','e2e.courier@mvt.com')`);
  psql(`update users set gps_city_id = (select id from cities where name='Fortaleza' and state_code='CE')
        where gps_city_id is null and username in ('client3@mvt.com','courier2@mvt.com')`);
  // um usuário bloqueado (filtro "Blocked"); client4 não é usado para login em nenhum e2e
  psql(`update users set blocked = true where username = 'client4@mvt.com'`);
  // vencimento e mês de referência em 3 pagamentos (filtros "Vencimento" e "Mês de Referência")
  psql(`update payments set due_date = date '2026-12-10', reference_month = '2026-11'
        where id in (select id from payments order by id limit 3) and due_date is null`);
});

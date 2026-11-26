import { test, expect } from '@playwright/test';
import { API, Role, tokenOf } from './helpers';
import { dbAvailable, psql, oracleCount } from './db';

/**
 * Filtros que o BACKEND aceita mas que a tela não exibe para todos (ex.: faixas de distância/frete
 * escondidas na tela de corridas, pedidos), aliases antigos usados pelo app mobile, regras de
 * acesso (filtro só estreita) e respostas de erro (sort inválido → 400, relatório → 403).
 * Conferência independente: COUNT(*) no banco local.
 */
async function get(role: Role, path: string) {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${tokenOf(role)}` } });
  let body: any = null;
  try { body = await r.json(); } catch { /* sem corpo */ }
  return { status: r.status, body };
}
const total = (b: any) => (Array.isArray(b) ? b.length : b?.totalElements);
const one = (sql: string) => psql(sql)[0]?.[0];

test.describe('API — filtros do backend', () => {
  test.skip(!dbAvailable, 'banco local indisponível');

  test('corridas: faixas, paymentCaptured e aliases clientId/courierId (ADMIN)', async () => {
    const dist = one('select estimated_distance_km::text from deliveries where estimated_distance_km is not null order by 1 limit 1 offset 3');
    const fee = one('select estimated_shipping_fee::text from deliveries where estimated_shipping_fee is not null order by 1 desc limit 1');
    const client = one('select client_id::text from deliveries where client_id is not null group by 1 order by count(*) desc limit 1');
    const courier = one('select courier_id::text from deliveries where courier_id is not null group by 1 order by count(*) desc limit 1');
    const cases = [
      `estimatedDistanceKmMin=${dist}`,
      `estimatedDistanceKmMax=${dist}`,
      `estimatedShippingFeeMin=1&estimatedShippingFeeMax=${fee}`,
      `estimatedDistanceKm=${dist}`,
      'paymentCaptured=true',
      'paymentCaptured=false',
      `client=${client}`,
      `clientId=${client}`,
      `courier=${courier}`,
      `courierId=${courier}`,
      `client=${client}&preferredVehicleType=CAR&status=COMPLETED`,
    ];
    for (const qs of cases) {
      const { status, body } = await get('ADMIN', `/api/deliveries?size=1&${qs}`);
      expect.soft(status, qs).toBe(200);
      expect.soft(total(body), `${qs} x banco`).toBe(oracleCount('delivery', new URLSearchParams(qs)));
    }
    // valor inválido → 400 (antes: 500)
    expect.soft((await get('ADMIN', '/api/deliveries?client=xyz')).status).toBe(400);
    expect.soft((await get('ADMIN', '/api/deliveries?estimatedDistanceKmMin=abc')).status).toBe(400);
  });

  test('corridas: ordenar por coleção → 400; propriedade inexistente → 400', async () => {
    expect((await get('ADMIN', '/api/deliveries?size=2&sort=payments,asc')).status).toBe(400);
    expect((await get('ADMIN', '/api/deliveries?size=2&sort=naoExiste,asc')).status).toBe(400);
    expect((await get('ADMIN', '/api/payments?size=2&sort=deliveries,asc')).status).toBe(400);
    const ok = await get('ADMIN', '/api/deliveries?size=3&sort=createdAt,asc');
    expect(ok.status).toBe(200);
    const ids = ok.body.content.map((d: any) => d.createdAt);
    expect(ids).toEqual([...ids].sort()); // ordenação por coluna é respeitada
  });

  test('filtro só estreita: não-ADMIN filtrando por terceiro recebe vazio', async () => {
    const other = one(`select id::text from users where username='client2@mvt.com'`);
    const c = await get('CLIENT', `/api/deliveries?client=${other}`);
    expect.soft(c.status).toBe(200);
    expect.soft(total(c.body)).toBe(0);
    const cu = await get('COURIER', `/api/deliveries?courier=${one(`select id::text from users where username='courier2@mvt.com'`)}`);
    expect.soft(total(cu.body)).toBe(0);
    const p = await get('CLIENT', `/api/payments?payer=${one(`select id::text from users where username='demo.customer@zapi10.com'`)}`);
    expect.soft(p.status).toBe(200);
    expect.soft(total(p.body)).toBe(0);
    // ORGANIZER pedindo corridas de outro gerente continua 403
    const o = await get('ORGANIZER', `/api/deliveries?organizer=${one(`select id::text from users where username='organizer2@mvt.com'`)}`);
    expect.soft(o.status).toBe(403);
  });

  test('pedidos: faixas de subtotal/total/taxa/preparo (ADMIN)', async () => {
    for (const qs of ['totalMin=50', 'totalMax=40', 'subtotalMin=10&subtotalMax=30', 'deliveryFeeMin=1',
      'estimatedPreparationMinutesMax=20', 'total=50']) {
      const { status, body } = await get('ADMIN', `/api/orders?size=1&${qs}`);
      expect.soft(status, qs).toBe(200);
      expect.soft(total(body), `${qs} x banco`).toBe(oracleCount('foodOrder', new URLSearchParams(qs)));
    }
  });

  test('contas bancárias: bankCode e accountType (ADMIN)', async () => {
    for (const qs of ['bankCode=001', 'bankCode=341', 'accountType=CHECKING', 'accountType=SAVINGS', 'status=ACTIVE&bankCode=001']) {
      const p = new URLSearchParams(qs);
      const where = [...p.entries()].map(([k, v]) => `${{ bankCode: 'bank_code', accountType: 'account_type', status: 'status' }[k]} = '${v}'`).join(' and ');
      const { status, body } = await get('ADMIN', `/api/bank-accounts?size=1&${qs}`);
      expect.soft(status, qs).toBe(200);
      expect.soft(total(body), `${qs} x banco`).toBe(Number(one(`select count(*) from bank_accounts where ${where}`)));
    }
  });

  test('typeaheads/selects de apoio: bairros, versões do app, contrapartes de gerente', async () => {
    const n = await get('ADMIN', '/api/addresses/neighborhoods?search=c');
    expect(n.status).toBe(200);
    const expected = psql(`select distinct neighborhood from addresses where neighborhood <> '' and immutable_unaccent(lower(neighborhood)) like '%c%' order by 1 limit 20`).map((r) => r[0]);
    expect(n.body.map((x: any) => x.name)).toEqual(expected);
    expect((await get('CLIENT', '/api/addresses/neighborhoods?search=c')).status).toBe(403);

    const v = await get('ADMIN', '/api/users/mobile-versions/app-versions');
    expect(v.body.map((x: any) => x.value).sort())
      .toEqual(psql(`select distinct mobile_app_version from users where mobile_app_version <> ''`).map((r) => r[0]).sort());

    // CUSTOMER só acha gerentes das próprias corridas; o rótulo de quem não é contraparte é 403
    const me = one(`select id::text from users where username='demo.customer@zapi10.com'`);
    const org = await get('CUSTOMER', '/api/users/search/counterparts/organizers?search=a&limit=50');
    const allowed = psql(`select distinct organizer_id::text from deliveries where organizer_id is not null and (client_id = '${me}' or courier_id = '${me}')`).map((r) => r[0]);
    expect(org.body.every((u: any) => allowed.includes(u.id))).toBe(true);
    const stranger = one(`select id::text from users where role='ORGANIZER' and id::text not in (${allowed.map((a) => `'${a}'`).join(',') || "''"}) limit 1`);
    if (stranger) expect((await get('CUSTOMER', `/api/users/search/counterparts/organizers/${stranger}`)).status).toBe(403);
  });

  test('relatórios: não-ADMIN → 403 (antes 500)', async () => {
    expect((await get('CLIENT', '/api/reports/platform-earnings?from=2026-01-01&to=2026-01-31')).status).toBe(403);
    expect((await get('COURIER', '/api/reports/organizers')).status).toBe(403);
    expect((await get('COURIER', '/api/reports/cash?date=2026-11-01')).status).toBe(403);
  });
});

import { test, expect, Page, Response } from '@playwright/test';
import {
  API, Role, authFile, tokenOf, monitor, saveResult, waitList, rowCount, firstRowText,
  pageInfo, totalRecords, getPath, listOf, hideOrderAlert,
} from './helpers';
import { ORACLE, oracleCount, distinct } from './db';

/**
 * Sanity check das telas de LISTAGEM genéricas (EntityCRUD/EntityTable, dirigidas por /api/metadata):
 * carga, cada filtro (com checagem de coerência na resposta), paginação, tamanho de página e ordenação.
 */

interface TablePage {
  path: string;
  entity: string;            // chave em /api/metadata
  roles: Role[];
  /** Filtros que a tela usa como multi-seleção (multiSelectFilters) */
  multi?: string[];
}

const PAGES: TablePage[] = [
  { path: '/estabelecimentos', entity: 'user', roles: ['ADMIN'] },
  { path: '/gerentes', entity: 'user', roles: ['ADMIN'] },
  { path: '/motoboy', entity: 'user', roles: ['ADMIN'] },
  { path: '/organizacao/gerenciar', entity: 'organization', roles: ['ADMIN'] },
  { path: '/deliveries', entity: 'delivery', roles: ['ADMIN', 'ORGANIZER', 'CLIENT', 'COURIER', 'CUSTOMER'] },
  { path: '/pedidos', entity: 'foodOrder', roles: ['ADMIN', 'CLIENT'] },
  { path: '/pagamentos', entity: 'payment', roles: ['ADMIN', 'ORGANIZER', 'CLIENT', 'COURIER', 'CUSTOMER'], multi: ['status'] },
  { path: '/configuracoes', entity: 'siteConfiguration', roles: ['ADMIN'] },
  { path: '/cupons', entity: 'coupon', roles: ['ADMIN'] },
  { path: '/anuncios', entity: 'announcement', roles: ['ADMIN'] },
  { path: '/versoes-mobile', entity: 'mobileVersionReport', roles: ['ADMIN'] },
  { path: '/balanco-financeiro', entity: 'delivery', roles: ['ORGANIZER'] },
  { path: '/organizacao', entity: 'organization', roles: ['ORGANIZER'] },
];

type Status = 'ok' | 'falha' | 'n/a' | 'aviso';
interface Check { item: string; status: Status; detail?: string }

const metaCache: Record<string, any> = {};
async function metadataFor(role: Role) {
  if (!metaCache[role]) {
    const r = await fetch(`${API}/api/metadata`, { headers: { Authorization: `Bearer ${tokenOf(role)}` } });
    metaCache[role] = await r.json();
  }
  return metaCache[role];
}

const isList = (endpoint: string) => (r: Response) => {
  if (r.request().method() !== 'GET') return false;
  const u = new URL(r.url());
  return r.url().startsWith(API) && u.pathname === endpoint;
};

async function safeWait(p: Promise<Response>): Promise<Response | null> {
  try { return await p; } catch { return null; }
}

/** Aguarda a tabela terminar de renderizar após uma resposta. */
async function settle(page: Page) {
  await page.waitForTimeout(600);
  await page.locator('text=Carregando').first().waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
}

/** Espera a tabela exibir `expected` linhas (até 8s) e devolve a contagem final. */
async function rowsFor(page: Page, expected: number) {
  const t0 = Date.now();
  let n = await rowCount(page);
  while (n !== expected && Date.now() - t0 < 8000) { await page.waitForTimeout(250); n = await rowCount(page); }
  return n;
}

function sampleValue(items: any[], key: string): any {
  for (const it of items) {
    const v = getPath(it, key);
    if (v !== undefined && v !== null && v !== '' && typeof v !== 'object') return v;
  }
  return undefined;
}

/** Valor "comparável" de um item para o filtro (entidade → id). */
function itemValue(it: any, name: string): any {
  const v = getPath(it, name);
  if (v && typeof v === 'object') return v.id ?? v.value ?? JSON.stringify(v);
  if (v === undefined) {
    // convenções do BE: clientId / clientName etc.
    if (it[`${name}Id`] !== undefined) return it[`${name}Id`];
  }
  return v;
}

for (const tp of PAGES) {
  for (const role of tp.roles) {
    test.describe(`${tp.path} [${role}]`, () => {
      test.use({ storageState: authFile(role) });

      test(`lista, filtros, paginação, tamanho e ordenação`, async ({ page }) => {
        test.setTimeout(420_000);
        const checks: Check[] = [];
        const add = (item: string, status: Status, detail?: string) => {
          checks.push({ item, status, detail });
          if (status === 'falha') expect.soft(false, `${tp.path} [${role}] ${item}: ${detail || ''}`).toBe(true);
        };
        const mon = monitor(page);
        await hideOrderAlert(page);
        const meta = (await metadataFor(role))[tp.entity];
        expect(meta, `metadata de ${tp.entity} para ${role}`).toBeTruthy();
        const endpoint: string = meta.endpoint.startsWith('/') ? meta.endpoint : `/${meta.endpoint}`;
        const reload = async () => {
          const p = safeWait(page.waitForResponse(isList(endpoint), { timeout: 20_000 }));
          await page.goto(tp.path);
          await p;
          await page.locator('table.entity-table').first().waitFor({ timeout: 15_000 }).catch(() => {});
          await settle(page);
        };

        // ---------- 1. carga ----------
        const first = safeWait(page.waitForResponse(isList(endpoint), { timeout: 25_000 }));
        await page.goto(tp.path);
        const res0 = await first;
        if (!res0) {
          add('carga', 'falha', `nenhuma chamada GET ${endpoint}`);
          saveResult(test.info(), { page: tp.path, role, checks, mon });
          return;
        }
        if (res0.status() >= 400) {
          add('carga', 'falha', `GET ${res0.url().replace(API, '')} → ${res0.status()} ${(await res0.text()).slice(0, 200)}`);
          saveResult(test.info(), { page: tp.path, role, checks, mon });
          return;
        }
        const json0 = await res0.json();
        const isArray = Array.isArray(json0);
        const items0 = listOf(json0);
        await page.locator('table.entity-table').first().waitFor({ timeout: 20_000 });
        await settle(page);
        const initialQuery = new URL(res0.url()).searchParams;
        const size0 = Number(initialQuery.get('size') || 10);
        const total0 = isArray ? items0.length : json0.totalElements;
        const shown0 = await rowsFor(page, Math.min(size0, total0));
        add('carga', 'ok', `GET ${res0.url().replace(API, '')} total=${total0} linhas=${shown0}${isArray ? ' (resposta é ARRAY, sem paginação no BE)' : ''}`);
        if (shown0 !== Math.min(size0, total0)) {
          add('linhas exibidas x size', 'falha', `size=${size0} total=${total0} mas exibiu ${shown0} linhas${isArray ? ' — endpoint devolve array completo e a tabela não fatia' : ''}`);
        }
        if (await page.locator('text=Erro ao carregar dados').count()) add('carga', 'falha', 'mensagem "Erro ao carregar dados" visível');

        const footer = page.locator('.table-footer');
        const hasFooter = (await footer.count()) > 0;

        // ---------- 2. tamanho de página ----------
        try {
        if (hasFooter) {
          const opts = await page.locator('#pageSize option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
          for (const v of opts) {
            if (Number(v) === size0) continue;
            const p = safeWait(waitList(page, endpoint, (q) => q.get('size') === v));
            await page.locator('#pageSize').selectOption(v);
            const r = await p;
            if (!r) { add(`tamanho ${v}`, 'falha', 'requisição sem size'); continue; }
            if (r.status() >= 400) { add(`tamanho ${v}`, 'falha', `status ${r.status()}`); continue; }
            await settle(page);
            const j = await r.json();
            const tot = Array.isArray(j) ? j.length : j.totalElements;
            const exp = Math.min(Number(v), tot);
            const n = await rowsFor(page, exp);
            add(`tamanho ${v}`, n === exp ? 'ok' : 'falha', `linhas=${n} esperado=${exp} (total=${tot})`);
          }
          // deixa no menor tamanho para forçar várias páginas
          const smallest = String(Math.min(...opts.map(Number)));
          const p = safeWait(waitList(page, endpoint, (q) => q.get('size') === smallest));
          await page.locator('#pageSize').selectOption(smallest);
          await p; await settle(page);
        }
        } catch (e: any) {
          add('tamanho de página', 'falha', `exceção: ${String(e?.message || e).split('\n')[0].slice(0, 200)}`);
          await reload();
        }

        // ---------- 3. paginação ----------
        try {
        const pageSizeNow = hasFooter ? Number(await page.locator('#pageSize').inputValue()) : size0;
        const pi = await pageInfo(page);
        const btn = (t: string) => page.locator('.pagination-controls button', { hasText: t }).first();
        if (pi.total > 1) {
          const rowA = await firstRowText(page);
          const pNext = safeWait(waitList(page, endpoint, (q) => q.get('page') === '1'));
          await btn('›').click();
          const rN = await pNext;
          await settle(page);
          const rowB = await firstRowText(page);
          const infoB = await pageInfo(page);
          add('paginação próxima', rN && rN.status() < 400 && infoB.current === 2 && rowA !== rowB ? 'ok' : 'falha',
            rN ? `page=1 status=${rN.status()} pág.exibida=${infoB.current} linhasMudaram=${rowA !== rowB}` : 'próxima não enviou page=1');

          const lastIdx = String(pi.total - 1);
          // com 2 páginas já estamos na última (»» desabilitado) — só confere as linhas
          const pLast = pi.total > 2 ? safeWait(waitList(page, endpoint, (q) => q.get('page') === lastIdx)) : Promise.resolve(rN);
          if (pi.total > 2) await btn('»»').click();
          const rL = await pLast;
          await settle(page);
          const totNow = await totalRecords(page);
          const expLast = totNow - (pi.total - 1) * pageSizeNow;
          const nLast = await rowsFor(page, expLast);
          add('paginação última', rL && rL.status() < 400 && nLast === expLast ? 'ok' : 'falha',
            rL ? `page=${lastIdx} status=${rL.status()} linhas=${nLast} esperado=${expLast}` : `última não enviou page=${lastIdx}`);

          if (pi.total > 2) {
            const prevIdx = String(pi.total - 2);
            const pPrev = safeWait(waitList(page, endpoint, (q) => q.get('page') === prevIdx));
            await btn('‹').click();
            const rP = await pPrev;
            add('paginação anterior', rP && rP.status() < 400 ? 'ok' : 'falha', rP ? `page=${prevIdx} status=${rP.status()}` : 'anterior não enviou page');
          }
          const pFirst = safeWait(waitList(page, endpoint, (q) => q.get('page') === '0'));
          await btn('««').click();
          const rF = await pFirst;
          await settle(page);
          add('paginação primeira', rF && rF.status() < 400 && (await firstRowText(page)) === rowA ? 'ok' : 'falha',
            rF ? `page=0 status=${rF.status()}` : 'primeira não enviou page=0');
        } else {
          add('paginação', 'n/a', `apenas ${pi.total} página(s) (total=${await totalRecords(page)} size=${pageSizeNow})`);
        }
        } catch (e: any) {
          add('paginação', 'falha', `exceção: ${String(e?.message || e).split('\n')[0].slice(0, 200)}`);
          await reload();
        }

        // ---------- 4. ordenação ----------
        try {
        const sortable = page.locator('table.entity-table thead th[title="Clique pra ordenar"]');
        const sortLabels = (await sortable.allInnerTexts()).map((t) => t.replace(/[×▲▼]/g, '').trim());
        const nSort = sortLabels.length;
        const sortFails: string[] = [];
        let sortOk = 0;
        for (const label of sortLabels) {
          // clica no TEXTO do cabeçalho (o centro do <th> pode cair no "×" que esconde a coluna)
          const th = sortable.filter({ hasText: label }).first().locator('span > span').first();
          if (!(await th.isVisible().catch(() => false))) { await reload(); }
          if (!(await th.isVisible().catch(() => false))) { sortFails.push(`${label}: coluna sumiu`); continue; }
          const pA = safeWait(waitList(page, endpoint, (q) => (q.get('sort') || '').endsWith(',asc'), 10_000));
          await th.click();
          const rA = await pA;
          const sortParam = rA ? new URL(rA.url()).searchParams.get('sort') : null;
          if (!rA) sortFails.push(`${label}: clique não enviou sort`);
          else if (rA.status() >= 400) {
            sortFails.push(`${label}: sort=${sortParam} → ${rA.status()} ${(await rA.text()).slice(0, 120)}`);
            await reload(); continue; // a tabela vira "Erro ao carregar" — recarrega para seguir
          }
          else sortOk++;
          // desc e depois "sem ordenação" (3º clique) para voltar ao estado inicial
          const pD = safeWait(waitList(page, endpoint, (q) => (q.get('sort') || '').endsWith(',desc'), 10_000));
          await th.click();
          const rD = await pD;
          if (rD && rD.status() >= 400) sortFails.push(`${label}: sort=${sortParam?.replace('asc', 'desc')} → ${rD.status()}`);
          const pU = safeWait(waitList(page, endpoint, (q) => !q.has('sort'), 10_000));
          await th.click();
          await pU;
          await settle(page);
        }
        if (nSort === 0) add('ordenação', 'n/a', 'sem colunas ordenáveis');
        else add('ordenação', sortFails.length ? 'falha' : 'ok', `${sortOk}/${nSort} colunas ok${sortFails.length ? ' — ' + sortFails.join(' | ') : ''}`);
        } catch (e: any) {
          add('ordenação', 'falha', `exceção: ${String(e?.message || e).split('\n')[0].slice(0, 200)}`);
          await reload();
        }

        // ---------- 5. filtros ----------
        const filtersBox = page.locator('.form-condensed .form-container').filter({ hasText: 'Filtros' }).first();
        const hasFilters = (await filtersBox.count()) > 0;
        if (!hasFilters) {
          add('filtros', 'n/a', 'tela sem painel de filtros');
        } else {
          const baseItems = items0;
          const isAdmin = role === 'ADMIN';
          const spec = ORACLE[tp.entity];
          const clearBtn = filtersBox.locator('button', { hasText: 'Limpar Filtros' });
          const totalOf = (j: any) => (Array.isArray(j) ? j.length : j.totalElements);

          // Consulta independente (ADMIN): total da API = COUNT(*) no banco com os mesmos parâmetros
          const oracle = (r: Response, tot: number): string | null => {
            if (!isAdmin) return null;
            const qs = new URL(r.url()).searchParams;
            const exp = oracleCount(tp.entity, qs);
            if (exp === null) return null;
            return exp === tot ? `banco=${exp} ✓` : `DIVERGE do banco: API=${tot} banco=${exp}`;
          };
          if (isAdmin) {
            const o = oracle(res0, total0);
            if (o) add('carga x banco', o.startsWith('DIVERGE') ? 'falha' : 'ok', o);
          }
          // amostra direto do banco (ADMIN) quando o campo não vem na resposta
          const dbSample = (filterName: string, extraWhere = ''): string | undefined => {
            if (!isAdmin || !spec?.cols[filterName]) return undefined;
            const col = spec.cols[filterName].col;
            const v = distinct(`select ${col}::text from ${spec.from} where ${col} is not null ${extraWhere} order by 1 limit 1`);
            return v[0];
          };

          const clearAndCheck = async (label: string) => {
            const p = safeWait(waitList(page, endpoint, () => true));
            await clearBtn.click();
            const r = await p;
            await settle(page);
            if (!r || r.status() >= 400) { add(`${label} — limpar`, 'falha', r ? `status ${r.status()}` : 'sem requisição'); return; }
            const tot = totalOf(await r.json());
            if (tot !== total0) {
              // dados podem mudar durante a suíte (outras abas criam registros): confere no banco
              const o = oracle(r, tot);
              if (!o || o.startsWith('DIVERGE')) add(`${label} — limpar`, 'falha', `total após limpar=${tot} ≠ inicial=${total0}${o ? ' — ' + o : ''}`);
            }
          };

          /** Confere a resposta de um filtro aplicado: status, linhas na tela, coerência e banco. */
          const verify = async (r: Response | null, what: string, coherent: (it: any) => boolean | undefined,
                                opts: { expectRows?: boolean } = {}) => {
            if (!r) return { ok: false, msg: `${what}: NÃO enviou o parâmetro` };
            if (r.status() >= 400) return { ok: false, msg: `${what}: ${r.status()} ${(await r.text()).slice(0, 120)}` };
            await settle(page);
            const j = await r.json();
            const items = listOf(j);
            const tot = totalOf(j);
            const size = Number(new URL(r.url()).searchParams.get('size') || items.length);
            const shown = await rowsFor(page, Math.min(size, tot));
            const verdicts = items.map(coherent);
            const wrong = items.filter((_, i) => verdicts[i] === false);
            const unverifiable = items.length > 0 && verdicts.every((v) => v === undefined);
            const o = oracle(r, tot);
            const problems: string[] = [];
            if (wrong.length) problems.push(`${wrong.length}/${items.length} linhas incoerentes`);
            if (shown !== Math.min(size, tot)) problems.push(`exibiu ${shown} linhas, esperado ${Math.min(size, tot)}`);
            if (o && o.startsWith('DIVERGE')) problems.push(o);
            if (opts.expectRows && tot === 0) problems.push('valor existente → 0 resultados');
            if (unverifiable && !o) problems.push('campo ausente na resposta e sem consulta independente');
            return { ok: problems.length === 0, msg: `${what} → ${tot}${o && !o.startsWith('DIVERGE') ? ` (${o})` : ''}${problems.length ? ' — ' + problems.join('; ') : ''}` };
          };

          const fmtBR = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
          const asDay = (v: any) => (v == null ? undefined : String(v).length > 10
            ? new Date(String(v)).toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }) : String(v).slice(0, 10));

          for (const f of meta.filters as any[]) {
            if (f.visible === false) continue;
            const field = filtersBox.locator('.form-field').filter({ has: page.locator('label.form-label', { hasText: new RegExp(`^\\s*${f.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?\\s*$`) }) }).first();
            if ((await field.count()) === 0) { add(`filtro ${f.name}`, 'n/a', 'não exibido nesta tela/papel'); continue; }
            const type = String(f.type).toLowerCase();
            const name: string = f.name;
            const label = `filtro ${name} (${type})`;
            const isMulti = type === 'multiselect' || (tp.multi || []).includes(name);
            const csvHas = (v: any, want: string) => String(v).split(',').map((s) => s.trim()).includes(want);

            try {
              if (isMulti) {
                const opts = (f.options || []) as { value: string; label: string }[];
                const trigger = field.locator('.multi-select-trigger');
                const results: string[] = [];
                let bad = 0;
                for (const o of opts) {
                  // aplica exatamente um valor: abre, desmarca todos, marca o valor
                  await trigger.click();
                  const toggleAll = field.locator('label', { hasText: /Desmarcar todos|Selecionar todos/ }).first();
                  const txt = await toggleAll.innerText();
                  if (/Desmarcar/.test(txt)) { await toggleAll.locator('input').click(); }
                  else {
                    const checked = field.locator('label:not(:has-text("Selecionar todos")) input:checked');
                    while (await checked.count()) { await checked.first().click(); await page.waitForTimeout(150); }
                  }
                  const p = safeWait(waitList(page, endpoint, (q) => q.get(name) === o.value));
                  await field.locator('label', { hasText: new RegExp(`^\\s*${o.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) }).locator('input').first().click();
                  const r = await p;
                  await page.keyboard.press('Escape');
                  await page.mouse.click(5, 5);
                  const v = await verify(r, o.value, (it) => { const x = itemValue(it, name); return x === undefined || x === null ? undefined : csvHas(x, o.value); });
                  results.push(v.msg); if (!v.ok) bad++;
                }
                add(label, bad ? 'falha' : 'ok', results.join(', '));
                await clearAndCheck(label);
                continue;
              }

              // select de valores fixos, boolean e select carregado do banco (entity renderAs=select)
              const isEntitySelect = type === 'entity' && (f.entityConfig?.renderAs || 'select') === 'select';
              if (type === 'select' || type === 'boolean' || isEntitySelect) {
                const sel = field.locator('select').first();
                if (isEntitySelect) await expect(sel).toBeEnabled({ timeout: 10_000 });
                const values = (await sel.locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value))).filter(Boolean);
                if (!values.length) { add(label, 'falha', 'select sem opções'); continue; }
                const results: string[] = [];
                let bad = 0;
                // conta as requisições por mudança — deve sair UMA só. Mede até 2 opções: telas com
                // refresh em background (ex.: polling de pedidos) podem coincidir com uma medição.
                let countChecked = false;
                const countNotes: string[] = [];
                for (const [idx, v] of values.entries()) {
                  const measuring = !countChecked && idx < 2;
                  const reqs: string[] = [];
                  const onReq = (rq: any) => { if (rq.method() === 'GET' && new URL(rq.url()).pathname === endpoint) reqs.push(rq.url()); };
                  if (measuring) page.on('request', onReq);
                  const p = safeWait(waitList(page, endpoint, (q) => q.get(name) === v));
                  await sel.selectOption(v);
                  const r = await p;
                  const res = await verify(r, v, (it) => { const x = itemValue(it, name); return x === undefined || x === null ? undefined : String(x) === v; });
                  if (measuring) {
                    await page.waitForTimeout(700);
                    page.off('request', onReq);
                    if (reqs.length === 1) countChecked = true;
                    else countNotes.push(`${v}: ${reqs.length} requisições para 1 mudança`);
                  }
                  results.push(res.msg); if (!res.ok) bad++;
                }
                if (!countChecked && values.length) { results.push(...countNotes); bad++; }
                const p = safeWait(waitList(page, endpoint, (q) => !q.get(name)));
                await sel.selectOption('');
                await p;
                add(label, bad ? 'falha' : 'ok', results.join(', '));
                await clearAndCheck(label);
                continue;
              }

              if (type === 'text' || type === 'number') {
                const input = field.locator('input').first();
                let sample = sampleValue(baseItems, name);
                if (sample === undefined) sample = dbSample(name);
                if (sample === undefined) { add(label, 'falha', 'sem valor de amostra (nem na resposta nem no banco)'); continue; }
                const val = type === 'number' ? String(sample) : String(sample).slice(0, Math.min(4, String(sample).length));
                // digita tecla a tecla: com o debounce deve sair UMA requisição só (a do valor final)
                const reqs: string[] = [];
                const onReq = (rq: any) => { if (rq.method() === 'GET' && new URL(rq.url()).pathname === endpoint) reqs.push(rq.url()); };
                page.on('request', onReq);
                const p = safeWait(waitList(page, endpoint, (q) => q.get(name) === val));
                await input.pressSequentially(val, { delay: 40 });
                const r = await p;
                await page.waitForTimeout(700);
                page.off('request', onReq);
                const res = await verify(r, `${name}=${val}`, (it) => {
                  const x = getPath(it, name);
                  if (x == null) return undefined;
                  return type === 'number' ? Number(x) === Number(val) : String(x).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
                    .includes(val.toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''));
                }, { expectRows: true });
                const extra = reqs.length !== 1 ? ` — ${reqs.length} requisições ao digitar (esperado 1, com debounce)` : '';
                add(label, res.ok && !extra ? 'ok' : 'falha', res.msg + extra);
                await clearAndCheck(label);
                continue;
              }

              if (type === 'numberrange') {
                const inputs = field.locator('input');
                let sample: any = sampleValue(baseItems, name);
                if (sample === undefined) sample = dbSample(name);
                const lo = sample !== undefined ? Number(sample) : 0;
                const hi = sample !== undefined ? Number(sample) : 999999;
                const p = safeWait(waitList(page, endpoint, (q) => q.get(`${name}Min`) === String(lo) && q.get(`${name}Max`) === String(hi)));
                await inputs.nth(0).fill(String(lo));
                await inputs.nth(1).fill(String(hi));
                const r = await p;
                const res = await verify(r, `${name}Min=${lo}&${name}Max=${hi}`, (it) => {
                  const x = getPath(it, name); if (x == null) return undefined; return Number(x) >= lo && Number(x) <= hi;
                }, { expectRows: sample !== undefined });
                // faixa vazia (mín > máx) → 0 linhas
                const p2 = safeWait(waitList(page, endpoint, (q) => q.get(`${name}Min`) === String(hi + 1)));
                await inputs.nth(0).fill(String(hi + 1));
                const r2 = await p2;
                const tot2 = r2 && r2.status() < 400 ? totalOf(await r2.json()) : -1;
                const emptyOk = tot2 === 0;
                add(label, res.ok && emptyOk ? 'ok' : 'falha', `${res.msg}; mín>máx → ${tot2}${emptyOk ? '' : ' (esperado 0)'}${sample === undefined ? ' [sem amostra: faixa ampla]' : ''}`);
                await clearAndCheck(label);
                continue;
              }

              if (type === 'month') {
                const input = field.locator('input').first();
                let sample: any = sampleValue(baseItems, name);
                if (sample === undefined) sample = dbSample(name);
                const val = sample ? String(sample).slice(0, 7) : new Date().toISOString().slice(0, 7);
                const p = safeWait(waitList(page, endpoint, (q) => q.get(name) === val));
                await input.fill(val);
                const r = await p;
                const res = await verify(r, `${name}=${val}`, (it) => { const x = getPath(it, name); return x == null ? undefined : String(x) === val; },
                  { expectRows: !!sample });
                add(label, res.ok ? 'ok' : 'falha', res.msg);
                await clearAndCheck(label);
                continue;
              }

              if (type === 'entity') {
                const input = field.locator('input').first();
                const isCity = name === 'city' || name === 'cityId' || f.entityConfig?.entityName === 'city';
                const suggestPath = isCity ? '/api/cities/search' : (f.entityConfig?.endpoint || '');
                // amostra: nome do relacionado no próprio resultado (ou o 1º das sugestões)
                let sampleName: string | undefined = sampleValue(baseItems, `${name}.name`) ?? sampleValue(baseItems, `${name}Name`);
                if (!sampleName && isCity) sampleName = sampleValue(baseItems, `${name}.name`) ?? 'Sobral';
                // a) 1ª letra dispara a busca de sugestões (preferência do dono)
                const firstLetter = (sampleName || 'a').slice(0, 1);
                const pS = safeWait(page.waitForResponse((r) => r.url().startsWith(API) && new URL(r.url()).pathname.startsWith(suggestPath) && r.request().method() === 'GET', { timeout: 10_000 }));
                await input.fill(firstLetter);
                const rS = await pS;
                if (!rS) { add(label, 'falha', `1 letra ("${firstLetter}") não buscou sugestões em ${suggestPath}`); await clearAndCheck(label); continue; }
                const sugUrl = rS.url().replace(API, '');
                if (rS.status() >= 400) { add(label, 'falha', `sugestões GET ${sugUrl} → ${rS.status()} ${(await rS.text()).slice(0, 150)}`); await clearAndCheck(label); continue; }
                const sug = listOf(await rS.json());
                // b) com o nome da amostra, escolhe a sugestão correspondente
                let item = field.locator(isCity ? '.city-typeahead-item:not(.loading):not(.no-results)' : '.entity-typeahead-item').first();
                if (sampleName && sampleName.length > 1) {
                  const pS2 = safeWait(page.waitForResponse((r) => r.url().startsWith(API) && new URL(r.url()).pathname.startsWith(suggestPath), { timeout: 10_000 }));
                  await input.fill(sampleName.slice(0, 3));
                  await pS2;
                  const match = field.locator(isCity ? '.city-typeahead-item' : '.entity-typeahead-item', { hasText: sampleName }).first();
                  await match.waitFor({ timeout: 1500 }).catch(() => {});
                  if (await match.isVisible().catch(() => false)) item = match;
                }
                if (!(await item.isVisible().catch(() => false))) {
                  // o dropdown fecha sozinho após 3s sem interação: redigita a 1ª letra para reabrir
                  const pS3 = safeWait(page.waitForResponse((r) => r.url().startsWith(API) && new URL(r.url()).pathname.startsWith(suggestPath), { timeout: 10_000 }));
                  await input.fill('');
                  await input.fill(firstLetter);
                  await pS3;
                  item = field.locator(isCity ? '.city-typeahead-item:not(.loading):not(.no-results)' : '.entity-typeahead-item').first();
                }
                await item.waitFor({ timeout: 2000 }).catch(() => {});
                if (!(await item.isVisible().catch(() => false))) {
                  // sem nenhuma contraparte para escolher: só é aceitável se a 1ª letra trouxe 0 sugestões
                  add(label, sug.length === 0 ? 'ok' : 'falha', `GET ${sugUrl} → ${rS.status()} com ${sug.length} sugestões para "${firstLetter}"; nada para escolher`);
                  await clearAndCheck(label); continue;
                }
                const p = safeWait(waitList(page, endpoint, (q) => !!q.get(name)));
                await item.click();
                const r = await p;
                if (!r) { add(label, 'falha', 'escolheu sugestão e a requisição NÃO levou o parâmetro'); await clearAndCheck(label); continue; }
                const chosen = new URL(r.url()).searchParams.get(name)!;
                const res = await verify(r, `${name}=${chosen}`, (it) => {
                  const x = itemValue(it, name);
                  if (x === undefined || x === null) return undefined;
                  if (isCity && typeof x === 'string') return x.toLowerCase().includes(chosen.toLowerCase());
                  return String(x) === chosen;
                });
                add(label, res.ok ? 'ok' : 'falha', `sugestões ${sugUrl} (1 letra) → ${sug.length}; ${res.msg}`);
                await clearAndCheck(label);
                continue;
              }

              if (type === 'date' || type === 'datetime') {
                add(label, 'falha', 'filtro de data exata — deveria ser intervalo (daterange)');
                continue;
              }

              if (type === 'daterange') {
                const inputs = field.locator('input');
                let sample: string | undefined = asDay(sampleValue(baseItems, name));
                if (!sample && isAdmin && spec?.cols[name]) {
                  const c = spec.cols[name];
                  sample = distinct(`select ${c.kind === 'ts' ? `(${c.col} at time zone 'America/Fortaleza')::date` : c.col}::text from ${spec.from} where ${c.col} is not null order by 1 desc limit 1`)[0];
                }
                const fromS = sample || new Date(Date.now() - 30 * 864e5).toLocaleDateString('sv-SE');
                const toS = sample || new Date().toLocaleDateString('sv-SE');
                const p = safeWait(waitList(page, endpoint, (q) => q.get(`${name}From`) === fromS && q.get(`${name}To`) === toS));
                await inputs.nth(0).fill(fmtBR(fromS)); await inputs.nth(0).press('Enter'); await page.mouse.click(5, 5);
                await inputs.nth(1).fill(fmtBR(toS)); await inputs.nth(1).press('Enter'); await page.mouse.click(5, 5);
                const r = await p;
                const res = await verify(r, `${name}From=${fromS}&${name}To=${toS}`, (it) => {
                  const d = asDay(getPath(it, name)); if (!d) return undefined; return d >= fromS && d <= toS;
                }, { expectRows: !!sample });
                add(label, res.ok ? 'ok' : 'falha', res.msg + (r ? '' : ` [escolheu ${fromS}..${toS}; verifique fuso/formato]`));
                await clearAndCheck(label);
                continue;
              }

              add(label, 'falha', `tipo ${type} não coberto pelo teste`);
            } catch (e: any) {
              add(label, 'falha', `exceção no teste: ${String(e?.message || e).split('\n')[0].slice(0, 200)}`);
              await page.mouse.click(5, 5).catch(() => {});
            }
          }
        }

        // ---------- 6. rede / console ----------
        if (mon.failures.length) add('rede 4xx/5xx', 'falha', mon.failures.map((f) => `${f.method} ${f.url} → ${f.status} ${f.body?.slice(0, 120)}`).join(' | '));
        if (mon.forbidden.length) add('rede 403', 'aviso', mon.forbidden.map((f) => `${f.method} ${f.url}`).join(' | '));
        if (mon.consoleErrors.length) add('console', 'aviso', [...new Set(mon.consoleErrors)].slice(0, 6).join(' | '));

        saveResult(test.info(), { page: tp.path, role, entity: tp.entity, endpoint, checks });
        console.log(`\n### ${tp.path} [${role}]\n` + checks.map((c) => `  - [${c.status}] ${c.item}: ${c.detail || ''}`).join('\n'));
      });
    });
  }
}

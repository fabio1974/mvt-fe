import { test, expect, Page, Response } from '@playwright/test';
import {
  API, Role, authFile, tokenOf, monitor, saveResult, waitList, rowCount, firstRowText,
  pageInfo, totalRecords, getPath, listOf, hideOrderAlert,
} from './helpers';

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
          // base para amostras: primeira página com size maior
          const baseItems = items0;
          const clearBtn = filtersBox.locator('button', { hasText: 'Limpar Filtros' });
          const clearAndCheck = async (label: string) => {
            const p = safeWait(waitList(page, endpoint, () => true));
            await clearBtn.click();
            const r = await p;
            await settle(page);
            if (!r || r.status() >= 400) { add(`${label} — limpar`, 'falha', r ? `status ${r.status()}` : 'sem requisição'); return; }
            const j = await r.json();
            const tot = Array.isArray(j) ? j.length : j.totalElements;
            if (tot !== total0) add(`${label} — limpar`, 'falha', `total após limpar=${tot} ≠ inicial=${total0}`);
          };

          for (const f of meta.filters as any[]) {
            if (f.visible === false) continue;
            const field = filtersBox.locator('.form-field').filter({ has: page.locator('label.form-label', { hasText: new RegExp(`^\\s*${f.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?\\s*$`) }) }).first();
            if ((await field.count()) === 0) { add(`filtro ${f.name}`, 'n/a', 'não exibido nesta tela/papel'); continue; }
            const type = String(f.type).toLowerCase();
            const name: string = f.name;
            const label = `filtro ${name} (${type})`;
            const isMulti = type === 'multiselect' || (tp.multi || []).includes(name);

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
                    // desmarca os marcados individualmente
                    const checked = field.locator('label:not(:has-text("Selecionar todos")) input:checked');
                    while (await checked.count()) { await checked.first().click(); await page.waitForTimeout(150); }
                  }
                  const p = safeWait(waitList(page, endpoint, (q) => q.get(name) === o.value));
                  await field.locator('label', { hasText: new RegExp(`^\\s*${o.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) }).locator('input').first().click();
                  const r = await p;
                  await page.keyboard.press('Escape');
                  await page.mouse.click(5, 5);
                  if (!r) { results.push(`${o.value}: sem parâmetro`); bad++; continue; }
                  if (r.status() >= 400) { results.push(`${o.value}: ${r.status()}`); bad++; continue; }
                  const items = listOf(await r.json());
                  const wrong = items.filter((it) => itemValue(it, name) !== undefined && String(itemValue(it, name)) !== o.value);
                  if (wrong.length) { results.push(`${o.value}: ${wrong.length} linha(s) incoerente(s)`); bad++; }
                  else results.push(`${o.value}: ${items.length}`);
                }
                add(label, bad ? 'falha' : 'ok', results.join(', '));
                await clearAndCheck(label);
                continue;
              }

              if (type === 'select' || type === 'boolean') {
                const sel = field.locator('select').first();
                const values = (await sel.locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value))).filter(Boolean);
                const results: string[] = [];
                let bad = 0; let unverifiable = 0;
                for (const v of values) {
                  const p = safeWait(waitList(page, endpoint, (q) => q.get(name) === v));
                  await sel.selectOption(v);
                  const r = await p;
                  if (!r) { results.push(`${v}: NÃO enviou parâmetro`); bad++; continue; }
                  if (r.status() >= 400) { results.push(`${v}: ${r.status()} ${(await r.text()).slice(0, 100)}`); bad++; continue; }
                  await settle(page);
                  const j = await r.json();
                  const items = listOf(j);
                  const vals = items.map((it) => itemValue(it, name));
                  if (items.length && vals.every((x) => x === undefined)) unverifiable++;
                  const wrong = vals.filter((x) => x !== undefined && String(x) !== v);
                  const size = Number(new URL(r.url()).searchParams.get('size'));
                  const tot = Array.isArray(j) ? j.length : j.totalElements;
                  const shown = await rowsFor(page, Math.min(size, tot));
                  if (wrong.length) { results.push(`${v}: ${wrong.length}/${items.length} incoerentes (ex.: ${String(wrong[0])})`); bad++; }
                  else if (shown !== Math.min(size, tot)) { results.push(`${v}: exibiu ${shown} linhas, esperado ${Math.min(size, tot)}`); bad++; }
                  else results.push(`${v}: ${tot}`);
                }
                const p = safeWait(waitList(page, endpoint, (q) => !q.get(name)));
                await sel.selectOption('');
                await p;
                add(label, bad ? 'falha' : unverifiable === values.length && values.length ? 'aviso' : 'ok',
                  results.join(', ') + (unverifiable ? ` [campo "${name}" ausente na resposta em ${unverifiable} opção(ões) — coerência não verificável]` : ''));
                await clearAndCheck(label);
                continue;
              }

              if (type === 'text' || type === 'number') {
                const input = field.locator('input').first();
                const sample = sampleValue(baseItems, name);
                let val: string;
                if (sample === undefined) val = type === 'number' ? '1' : 'a';
                else val = type === 'number' ? String(sample) : String(sample).slice(0, Math.min(4, String(sample).length));
                const p = safeWait(waitList(page, endpoint, (q) => q.get(name) === val));
                await input.fill(val);
                const r = await p;
                if (!r) { add(label, 'falha', `digitou "${val}" e a requisição NÃO levou ${name}=`); await clearAndCheck(label); continue; }
                if (r.status() >= 400) { add(label, 'falha', `${name}=${val} → ${r.status()} ${(await r.text()).slice(0, 150)}`); await clearAndCheck(label); continue; }
                await settle(page);
                const j = await r.json();
                const items = listOf(j);
                const tot = Array.isArray(j) ? j.length : j.totalElements;
                let wrong: any[] = [];
                if (type === 'number') wrong = items.filter((it) => getPath(it, name) != null && Number(getPath(it, name)) !== Number(val));
                else wrong = items.filter((it) => getPath(it, name) != null && !String(getPath(it, name)).toLowerCase().includes(val.toLowerCase()));
                const ignored = sample !== undefined && tot === total0 && wrong.length === 0 && total0 > 1 && items.length > 0
                  && items.every((it) => String(getPath(it, name)).toLowerCase().includes(val.toLowerCase())) === false;
                if (wrong.length) add(label, 'falha', `${name}=${val}: ${wrong.length}/${items.length} linhas incoerentes (ex.: "${getPath(wrong[0], name)}") — filtro ignorado/errado no BE?`);
                else if (sample === undefined) add(label, 'aviso', `${name}=${val} → ${r.status()} total=${tot} (campo ausente na resposta; coerência não verificável)`);
                else if (tot === 0) add(label, 'falha', `${name}=${val} (valor existente) → 0 resultados`);
                else add(label, ignored ? 'aviso' : 'ok', `${name}=${val} → total=${tot}`);
                await clearAndCheck(label);
                continue;
              }

              if (type === 'entity') {
                const input = field.locator('input').first();
                const isCity = name === 'city' || name === 'cityId' || f.entityConfig?.entityName === 'city';
                const suggestPath = isCity ? '/api/cities' : (f.entityConfig?.endpoint || '');
                // amostra: nome do relacionado no próprio resultado
                let sampleName: string | undefined = sampleValue(baseItems, `${name}.name`) ?? sampleValue(baseItems, `${name}Name`);
                if (!sampleName) sampleName = isCity ? 'Sobral' : 'Ca';
                // a) 1ª letra dispara busca? (preferência do dono)
                let oneLetterFired = false;
                const onReq = (rq: any) => { if (rq.url().includes(suggestPath.replace('/api', ''))) oneLetterFired = true; };
                page.on('request', onReq);
                await input.fill(sampleName.slice(0, 1));
                await page.waitForTimeout(900);
                page.off('request', onReq);
                // b) 2 letras → sugestões
                const pS = safeWait(page.waitForResponse((r) => r.url().startsWith(API) && new URL(r.url()).pathname.startsWith(suggestPath) && r.request().method() === 'GET', { timeout: 10_000 }));
                await input.fill(sampleName.slice(0, 3));
                const rS = await pS;
                if (!rS) { add(label, 'falha', `typeahead não buscou sugestões em ${suggestPath}`); await clearAndCheck(label); continue; }
                const sugUrl = rS.url().replace(API, '');
                if (rS.status() >= 400) { add(label, 'falha', `sugestões GET ${sugUrl} → ${rS.status()} ${(await rS.text()).slice(0, 150)}`); await clearAndCheck(label); continue; }
                const sug = listOf(await rS.json());
                const item = field.locator(isCity ? '.city-typeahead-item:not(.loading):not(.no-results)' : '.entity-typeahead-item').first();
                if (!sug.length || !(await item.isVisible().catch(() => false))) {
                  await item.waitFor({ timeout: 4000 }).catch(() => {});
                }
                if (!(await item.isVisible().catch(() => false))) {
                  add(label, 'aviso', `GET ${sugUrl} → ${rS.status()} com ${sug.length} sugestões para "${sampleName.slice(0, 3)}"; nada para escolher${oneLetterFired ? '' : '; não busca com 1 letra'}`);
                  await clearAndCheck(label); continue;
                }
                const p = safeWait(waitList(page, endpoint, (q) => !!q.get(name)));
                await item.click();
                const r = await p;
                if (!r) { add(label, 'falha', 'escolheu sugestão e a requisição NÃO levou o parâmetro'); await clearAndCheck(label); continue; }
                const chosen = new URL(r.url()).searchParams.get(name)!;
                if (r.status() >= 400) { add(label, 'falha', `${name}=${chosen} → ${r.status()} ${(await r.text()).slice(0, 150)}`); await clearAndCheck(label); continue; }
                await settle(page);
                const items = listOf(await r.json());
                const vals = items.map((it) => itemValue(it, name));
                const wrong = vals.filter((x) => x !== undefined && String(x) !== chosen && !(isCity && typeof x === 'string'));
                const extra = `${oneLetterFired ? '' : ' [typeahead só busca a partir da 2ª letra]'}`;
                if (wrong.length) add(label, 'falha', `${name}=${chosen}: ${wrong.length}/${items.length} linhas de outro ${name}${extra}`);
                else add(label, items.length && vals.every((x) => x === undefined) ? 'aviso' : 'ok', `sugestões ${sugUrl} → ${rS.status()}; ${name}=${chosen} → ${items.length} linha(s)${extra}`);
                await clearAndCheck(label);
                continue;
              }

              if (type === 'date' || type === 'datetime') {
                const input = field.locator('input').first();
                const sample = sampleValue(baseItems, name);
                const d = sample ? new Date(String(sample).length === 10 ? `${sample}T12:00:00` : sample) : new Date();
                const br = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                const p = safeWait(waitList(page, endpoint, (q) => !!q.get(name)));
                await input.fill(type === 'datetime' ? `${br} 12:00` : br);
                await input.press('Enter');
                await page.mouse.click(5, 5);
                const r = await p;
                if (!r) { add(label, 'falha', `data ${br} não gerou parâmetro ${name}`); await clearAndCheck(label); continue; }
                const sent = new URL(r.url()).searchParams.get(name);
                if (r.status() >= 400) { add(label, 'falha', `${name}=${sent} → ${r.status()} ${(await r.text()).slice(0, 150)}`); await clearAndCheck(label); continue; }
                const items = listOf(await r.json());
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const tzShift = sent && type === 'date' && sent !== iso ? ` [ATENÇÃO: escolheu ${iso} e enviou ${sent}]` : '';
                const wrong = items.filter((it) => getPath(it, name) && !String(getPath(it, name)).startsWith(String(sent).slice(0, 10)));
                add(label, wrong.length || tzShift ? 'falha' : 'ok', `${name}=${sent} → ${items.length} linha(s)${wrong.length ? `; ${wrong.length} com outra data (ex.: ${getPath(wrong[0], name)})` : ''}${tzShift}`);
                await clearAndCheck(label);
                continue;
              }

              if (type === 'daterange') {
                const inputs = field.locator('input');
                const to = new Date(); const from = new Date(Date.now() - 30 * 864e5);
                const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                const p1 = safeWait(waitList(page, endpoint, (q) => !!q.get(`${name}From`)));
                await inputs.nth(0).fill(fmt(from)); await inputs.nth(0).press('Enter'); await page.mouse.click(5, 5);
                const r1 = await p1;
                const p2 = safeWait(waitList(page, endpoint, (q) => !!q.get(`${name}From`) && !!q.get(`${name}To`)));
                await inputs.nth(1).fill(fmt(to)); await inputs.nth(1).press('Enter'); await page.mouse.click(5, 5);
                const r2 = await p2;
                if (!r1 || !r2) { add(label, 'falha', `intervalo não gerou ${name}From/${name}To`); await clearAndCheck(label); continue; }
                const q = new URL(r2.url()).searchParams;
                if (r2.status() >= 400) { add(label, 'falha', `${q.toString()} → ${r2.status()}`); await clearAndCheck(label); continue; }
                const items = listOf(await r2.json());
                const fromS = q.get(`${name}From`)!; const toS = q.get(`${name}To`)!;
                const wrong = items.filter((it) => { const v = getPath(it, name); if (!v) return false; const s = String(v).slice(0, 10); return s < fromS || s > toS; });
                add(label, wrong.length ? 'falha' : 'ok', `${name}From=${fromS}&${name}To=${toS} → ${items.length} linha(s)${wrong.length ? `; ${wrong.length} fora do intervalo` : ''}`);
                await clearAndCheck(label);
                continue;
              }

              add(label, 'n/a', `tipo ${type} não coberto`);
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

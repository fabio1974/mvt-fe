import { Page, Response, TestInfo, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const API = process.env.E2E_API || 'http://localhost:8080';
export const PASSWORD = process.env.E2E_PASSWORD || 'Teste@123';

/** Usuários seed do banco local (senha de todos: Teste@123). */
export const USERS = {
  ADMIN: 'admin@mvt.com',
  CLIENT: 'client1@mvt.com',
  ORGANIZER: 'organizer1@mvt.com',
  COURIER: 'courier1@mvt.com',
  CUSTOMER: 'demo.customer@zapi10.com',
} as const;
export type Role = keyof typeof USERS;
export const ROLES = Object.keys(USERS) as Role[];

export const authFile = (role: Role) => path.join(HERE, '.auth', `${role}.json`);
export const RESULTS_DIR = path.join(HERE, '.results');

/** Token JWT salvo no storageState do papel (para chamadas de apoio, ex.: /api/metadata). */
export function tokenOf(role: Role): string {
  const st = JSON.parse(fs.readFileSync(authFile(role), 'utf8'));
  const origin = st.origins?.[0];
  const item = origin?.localStorage?.find((i: { name: string }) => i.name === 'authToken');
  return item?.value || '';
}

export interface NetIssue { method: string; url: string; status: number; body?: string }

/**
 * Monitora console (erros) e respostas 4xx/5xx da API durante o teste.
 * 403 fica separado (pode ser esperado em telas que o papel não deveria ver).
 */
export function monitor(page: Page) {
  const consoleErrors: string[] = [];
  const failures: NetIssue[] = [];
  const forbidden: NetIssue[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    // Ruído de terceiros / ambiente local (Google Maps, favicon, websocket do vite, React dev warnings)
    if (/maps\.googleapis|google|favicon|\[vite\]|Download the React DevTools|ERR_BLOCKED_BY_CLIENT|Failed to load resource/i.test(t)) return;
    consoleErrors.push(t.slice(0, 400));
  });
  page.on('response', async (res: Response) => {
    const url = res.url();
    if (!url.startsWith(API)) return;
    const st = res.status();
    if (st < 400) return;
    let body = '';
    try { body = (await res.text()).slice(0, 300); } catch { /* ignore */ }
    const issue = { method: res.request().method(), url: url.replace(API, ''), status: st, body };
    if (st === 403) forbidden.push(issue); else failures.push(issue);
  });
  return { consoleErrors, failures, forbidden };
}

/** Grava o resultado estruturado de um teste (para montar o relatório). */
export function saveResult(testInfo: TestInfo, data: unknown) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const name = testInfo.titlePath.slice(1).join(' » ').replace(/[^\w\-»]+/g, '_').slice(0, 180);
  fs.writeFileSync(path.join(RESULTS_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

/** Espera uma resposta GET da listagem (endpoint) cuja query satisfaça `pred`. */
export function waitList(page: Page, endpoint: string, pred: (q: URLSearchParams) => boolean = () => true, timeout = 15_000) {
  return page.waitForResponse((r) => {
    if (r.request().method() !== 'GET') return false;
    const u = new URL(r.url());
    if (!u.href.startsWith(API)) return false;
    if (u.pathname !== endpoint) return false;
    return pred(u.searchParams);
  }, { timeout });
}

/** Linhas de dados exibidas na tabela genérica (ignora a linha de "nenhum registro"). */
export async function dataRows(page: Page) {
  return page.locator('table.entity-table tbody tr:not(:has(td[colspan]))');
}

export async function rowCount(page: Page) {
  return (await dataRows(page)).count();
}

export async function firstRowText(page: Page) {
  const rows = await dataRows(page);
  if ((await rows.count()) === 0) return '';
  return (await rows.first().innerText()).trim();
}

/** Lê "Página X de N" do rodapé. */
export async function pageInfo(page: Page) {
  const t = (await page.locator('.pagination-info').first().innerText().catch(() => '')) || '';
  const m = t.match(/P[aá]gina\s+(\d+)\s+de\s+(\d+)/i);
  return m ? { current: Number(m[1]), total: Number(m[2]) } : { current: 0, total: 0 };
}

export async function totalRecords(page: Page) {
  const t = (await page.locator('.pagination-info-text').first().innerText().catch(() => '')) || '';
  const m = t.match(/de\s+(\d+)\s+registros/);
  return m ? Number(m[1]) : -1;
}

/** Garante que o painel "Filtros" esteja expandido (o estado colapsado fica no localStorage). */
export async function expandFilters(page: Page) {
  await page.evaluate(() => localStorage.setItem('filtersCollapsed', 'false')).catch(() => {});
}

/** Lê valor aninhado (a.b.c) de um objeto. */
export function getPath(obj: any, p: string): any {
  return p.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

export const listOf = (json: any): any[] => (Array.isArray(json) ? json : json?.content || []);

export async function softOk(res: Response, what: string) {
  expect.soft(res.status(), `${what} → ${res.request().method()} ${res.url().replace(API, '')} status`).toBeLessThan(400);
}

/**
 * Esconde (só no teste) o popup "Novo pedido!" da loja, que cobre a tela inteira quando há
 * pedido PLACED pago e bloquearia os cliques nos filtros/paginação.
 */
export async function hideOrderAlert(page: Page) {
  await page.addInitScript(() => {
    const css = '.new-order-alert-overlay{display:none!important}';
    const add = () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };
    if (document.head) add(); else document.addEventListener('DOMContentLoaded', add);
  });
}

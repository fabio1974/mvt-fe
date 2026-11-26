import { execFileSync } from 'node:child_process';
import { API } from './helpers';

/**
 * Consulta INDEPENDENTE no banco LOCAL (container docker zapi10-local-db) para conferir os
 * filtros das listagens: o total que a API devolve para um conjunto de parâmetros tem que bater
 * com um COUNT(*) feito direto no Postgres com as mesmas condições.
 *
 * Só roda contra backend local (localhost) — nunca aponte isso para outro banco.
 */
const CONTAINER = process.env.E2E_DB_CONTAINER || 'zapi10-local-db';
const DB_USER = process.env.E2E_DB_USER || 'mvt';
const DB_NAME = process.env.E2E_DB_NAME || 'mvt-events';

export const dbAvailable = (() => {
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(API)) return false;
  try { psql('select 1'); return true; } catch { return false; }
})();

export function psql(query: string): string[][] {
  const out = execFileSync('docker', ['exec', CONTAINER, 'psql', '-U', DB_USER, '-d', DB_NAME, '-At', '-F', '\t', '-c', query],
    { encoding: 'utf8', timeout: 20_000 });
  return out.split('\n').filter((l) => l.length).map((l) => l.split('\t'));
}

const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
const csv = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);
const TZ = `'America/Fortaleza'`;

type Kind =
  | 'like'        // texto: unaccent ilike %v%
  | 'in'          // enum/string (CSV → IN), case-insensitive
  | 'bool'
  | 'eq'          // igualdade literal (uuid/id/número)
  | 'num'         // número: x, xMin, xMax
  | 'date'        // coluna DATE: x, xFrom, xTo
  | 'ts'          // coluna timestamptz: dia no fuso America/Fortaleza
  | 'month'       // "yyyy-MM" (string)
  | 'csvAny'      // coluna CSV contém qualquer valor
  | 'cityOrId'    // gps_city: id numérico ou nome da cidade
  | 'search';     // nome OU e-mail (users.search)

interface Col { col: string; kind: Kind; expand?: Record<string, string[]> }
interface Spec { from: string; where?: string; cols: Record<string, Col> }

/** Entidade (chave do /api/metadata) → tabela e colunas dos filtros. Apenas visão de ADMIN. */
export const ORACLE: Record<string, Spec> = {
  user: {
    from: 'users t',
    cols: {
      name: { col: 't.name', kind: 'like' },
      search: { col: '', kind: 'search' },
      role: { col: 't.role', kind: 'in' },
      serviceType: { col: 't.service_type', kind: 'in' },
      enabled: { col: 't.enabled', kind: 'bool' },
      blocked: { col: 't.blocked', kind: 'bool' },
      confirmed: { col: 't.confirmed', kind: 'bool' },
      pagarmeStatus: { col: 't.pagarme_status', kind: 'in' },
      gpsCity: { col: 't.gps_city_id', kind: 'cityOrId' },
    },
  },
  organization: {
    from: 'organizations t',
    cols: {
      name: { col: 't.name', kind: 'like' },
      owner: { col: 't.owner_id', kind: 'eq' },
      status: { col: 't.status', kind: 'in' },
    },
  },
  delivery: {
    from: 'deliveries t',
    cols: {
      client: { col: 't.client_id', kind: 'eq' },
      clientId: { col: 't.client_id', kind: 'eq' },
      courier: { col: 't.courier_id', kind: 'eq' },
      courierId: { col: 't.courier_id', kind: 'eq' },
      organizer: { col: 't.organizer_id', kind: 'eq' },
      status: { col: 't.status', kind: 'in', expand: { PENDING: ['PENDING', 'WAITING_PAYMENT'] } },
      deliveryType: { col: 't.delivery_type', kind: 'in' },
      preferredVehicleType: { col: 't.preferred_vehicle_type', kind: 'in' },
      paymentCaptured: { col: 't.payment_captured', kind: 'bool' },
      estimatedDistanceKm: { col: 't.estimated_distance_km', kind: 'num' },
      estimatedShippingFee: { col: 't.estimated_shipping_fee', kind: 'num' },
    },
  },
  payment: {
    from: 'payments t',
    cols: {
      payer: { col: 't.payer_id', kind: 'eq' },
      payerId: { col: 't.payer_id', kind: 'eq' },
      status: { col: 't.status', kind: 'in' },
      paymentType: { col: 't.payment_type', kind: 'in' },
      dueDate: { col: 't.due_date', kind: 'date' },
      referenceMonth: { col: 't.reference_month', kind: 'month' },
    },
  },
  coupon: {
    from: 'coupons t',
    cols: {
      code: { col: 't.code', kind: 'like' },
      discountType: { col: 't.discount_type', kind: 'in' },
      discountValue: { col: 't.discount_value', kind: 'num' },
      maxDiscountValue: { col: 't.max_discount_value', kind: 'num' },
      minOrderValue: { col: 't.min_order_value', kind: 'num' },
      firstPurchaseOnly: { col: 't.first_purchase_only', kind: 'bool' },
      productScope: { col: 't.product_scope', kind: 'in' },
      couponsCount: { col: 't.coupons_count', kind: 'num' },
      budgetTotalCents: { col: 't.budget_total_cents', kind: 'num' },
      budgetUsedCents: { col: 't.budget_used_cents', kind: 'num' },
      validFrom: { col: 't.valid_from', kind: 'date' },
      validTo: { col: 't.valid_to', kind: 'date' },
      active: { col: 't.active', kind: 'bool' },
    },
  },
  announcement: {
    from: 'announcements t',
    cols: {
      title: { col: 't.title', kind: 'like' },
      rolesCsv: { col: 't.roles_csv', kind: 'csvAny' },
      isActive: { col: 't.is_active', kind: 'bool' },
    },
  },
  mobileVersionReport: {
    from: 'users t',
    cols: {
      mobilePlatform: { col: 't.mobile_platform', kind: 'in' },
      mobileAppVersion: { col: 't.mobile_app_version', kind: 'in' },
      role: { col: 't.role', kind: 'in' },
      enabled: { col: 't.enabled', kind: 'bool' },
      mobileVersionUpdatedAt: { col: 't.mobile_version_updated_at', kind: 'ts' },
    },
  },
  foodOrder: {
    from: 'orders t',
    cols: {
      orderType: { col: 't.order_type', kind: 'in' },
      tableNumberField: { col: 't.table_number', kind: 'eq' },
      status: { col: 't.status', kind: 'in' },
      subtotal: { col: 't.subtotal', kind: 'num' },
      deliveryFee: { col: 't.delivery_fee', kind: 'num' },
      total: { col: 't.total', kind: 'num' },
      estimatedPreparationMinutes: { col: 't.estimated_preparation_minutes', kind: 'num' },
    },
  },
  siteConfiguration: {
    from: 'site_configurations t',
    cols: { isActive: { col: 't.is_active', kind: 'bool' } },
  },
};

const IGNORED = new Set(['page', 'size', 'sort']);

/** Condição SQL de UM parâmetro, ou undefined se o parâmetro não é mapeado. */
function cond(spec: Spec, key: string, value: string): string | undefined | null {
  // nomes compostos: xMin/xMax, xFrom/xTo
  let base = key; let suffix = '';
  const m = /^(.*)(Min|Max|From|To)$/.exec(key);
  if (!spec.cols[key] && m && spec.cols[m[1]]) { base = m[1]; suffix = m[2]; }
  const c = spec.cols[base];
  if (!c) return undefined;
  const v = value.trim();
  switch (c.kind) {
    case 'like': return `immutable_unaccent(lower(${c.col})) like immutable_unaccent(lower(${q(`%${v}%`)}))`;
    case 'search': return `(immutable_unaccent(lower(t.name)) like immutable_unaccent(lower(${q(`%${v}%`)})) or immutable_unaccent(lower(t.username)) like immutable_unaccent(lower(${q(`%${v}%`)})))`;
    case 'in': {
      const vals = csv(v).flatMap((x) => c.expand?.[x.toUpperCase()] ?? [x]);
      return `lower(${c.col}::text) in (${vals.map((x) => q(x.toLowerCase())).join(',')})`;
    }
    case 'bool': return `${c.col} = ${v === 'true' ? 'true' : 'false'}`;
    case 'eq': return `${c.col}::text = ${q(v)}`;
    case 'num': {
      const n = Number(v); if (!isFinite(n)) return null;
      return suffix === 'Min' ? `${c.col} >= ${n}` : suffix === 'Max' ? `${c.col} <= ${n}` : `${c.col} = ${n}`;
    }
    case 'date': {
      const d = v.slice(0, 10);
      return suffix === 'From' ? `${c.col} >= ${q(d)}::date` : suffix === 'To' ? `${c.col} <= ${q(d)}::date` : `${c.col} = ${q(d)}::date`;
    }
    case 'ts': {
      const d = v.slice(0, 10);
      const day = `(${c.col} at time zone ${TZ})::date`;
      return suffix === 'From' ? `${day} >= ${q(d)}::date` : suffix === 'To' ? `${day} <= ${q(d)}::date` : `${day} = ${q(d)}::date`;
    }
    case 'month':
      return suffix === 'From' ? `${c.col} >= ${q(v)}` : suffix === 'To' ? `${c.col} <= ${q(v)}` : `${c.col} = ${q(v)}`;
    case 'csvAny': {
      const ors = csv(v).map((x) => `(',' || replace(upper(${c.col}), ' ', '') || ',') like ${q(`%,${x.toUpperCase()},%`)}`);
      return `(${ors.join(' or ')})`;
    }
    case 'cityOrId':
      return /^\d+$/.test(v) ? `${c.col} = ${v}`
        : `${c.col} in (select id from cities where immutable_unaccent(lower(name)) like immutable_unaccent(lower(${q(`%${v}%`)})))`;
  }
}

/**
 * COUNT(*) independente para a listagem de ADMIN com estes parâmetros.
 * Retorna null quando não há oráculo (entidade/parâmetro não mapeado).
 */
export function oracleCount(entity: string, params: URLSearchParams): number | null {
  const spec = ORACLE[entity];
  if (!spec || !dbAvailable) return null;
  const where: string[] = [];
  if (spec.where) where.push(spec.where);
  for (const [k, v] of params.entries()) {
    if (IGNORED.has(k) || v === '') continue;
    const c = cond(spec, k, v);
    if (c === undefined || c === null) return null;
    where.push(c);
  }
  const sql = `select count(*) from ${spec.from}${where.length ? ' where ' + where.join(' and ') : ''}`;
  return Number(psql(sql)[0][0]);
}

/** Valores distintos não-nulos de uma coluna (para escolher amostras que existem). */
export function distinct(sql: string): string[] {
  if (!dbAvailable) return [];
  return psql(sql).map((r) => r[0]);
}

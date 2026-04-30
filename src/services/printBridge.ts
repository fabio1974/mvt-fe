/**
 * Cliente da Zapi10 Print Bridge no FE.
 *
 * Fluxo:
 *   1. FE faz GET no BE pra obter os bytes ESC/POS do recibo
 *   2. FE faz POST nos bytes pra http://<bridge-ip>:9101/print
 *
 * O endereço do bridge fica salvo em localStorage (chave PRINT_BRIDGE_URL_KEY).
 * Se não estiver salvo, a UI deve abrir um modal pra o user configurar.
 */
import { api } from "./api";

const BRIDGE_URL_KEY = "zapi10.printBridgeUrl";
const HEALTH_TIMEOUT_MS = 1500;
const PRINT_TIMEOUT_MS = 8000;

export interface BridgeHealth {
  ok: boolean;
  version: string;
  printer: string;
  tcpPort: number;
  httpPort: number;
}

export function getSavedBridgeUrl(): string | null {
  return localStorage.getItem(BRIDGE_URL_KEY);
}

export function saveBridgeUrl(url: string): void {
  // Normaliza: remove trailing slash, garante http://
  let normalized = url.trim();
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "http://" + normalized;
  }
  normalized = normalized.replace(/\/+$/, "");
  localStorage.setItem(BRIDGE_URL_KEY, normalized);
}

export function clearBridgeUrl(): void {
  localStorage.removeItem(BRIDGE_URL_KEY);
}

/**
 * Detecta automaticamente uma bridge rodando em localhost.
 * Útil pra zero-config: se o user abrir zapi10.com no mesmo PC onde a bridge
 * está instalada, a gente acha sozinho e salva.
 *
 * Retorna a URL salva (http://localhost:9101) se achou, senão null.
 */
export async function tryAutoDetectLocalhost(): Promise<string | null> {
  if (getSavedBridgeUrl()) return getSavedBridgeUrl();
  const candidate = "http://localhost:9101";
  const health = await checkBridgeHealth(candidate);
  if (health && health.ok) {
    saveBridgeUrl(candidate);
    return candidate;
  }
  return null;
}

/** Faz GET /health pra confirmar que o bridge tá rodando e retorna metadata. */
export async function checkBridgeHealth(url: string): Promise<BridgeHealth | null> {
  const target = normalizeUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${target}/health`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data as BridgeHealth;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Tenta descobrir o bridge automaticamente varrendo IPs comuns na LAN.
 *
 * Limitação: browser não tem acesso ao IP local. Vamos tentar:
 *  - localhost (caso bridge rode na mesma máquina que o FE)
 *  - hostname.local
 *  - lista de subnets comuns (passada pelo caller via guesses)
 */
export async function tryDiscoverBridge(guesses?: string[]): Promise<string | null> {
  const candidates = [
    "http://localhost:9101",
    "http://127.0.0.1:9101",
    ...(guesses || []),
  ];
  // Faz checagens em paralelo com timeout curto
  const results = await Promise.all(
    candidates.map(async (url) => ({ url, health: await checkBridgeHealth(url) }))
  );
  const found = results.find((r) => r.health && r.health.ok);
  return found ? found.url : null;
}

type PrintResult = { ok: true } | { ok: false; error: string };

/**
 * Posta bytes ESC/POS pro bridge local. Helper interno.
 */
async function postBytesToBridge(bytes: ArrayBuffer): Promise<PrintResult> {
  const bridgeUrl = getSavedBridgeUrl();
  if (!bridgeUrl) {
    return { ok: false, error: "Bridge não configurado. Configure o IP da Print Bridge primeiro." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PRINT_TIMEOUT_MS);
  try {
    const res = await fetch(`${normalizeUrl(bridgeUrl)}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: bytes,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Bridge retornou ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (e: unknown) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : "Falha ao conectar com o bridge";
    return {
      ok: false,
      error: `${msg}. Verifique se o Zapi10 Print Bridge está rodando no PC e se o IP/porta estão corretos.`,
    };
  }
}

/**
 * Imprime um pedido completo: BE gera bytes ESC/POS → POSTa pro bridge.
 */
export async function printOrder(
  orderId: number,
  paperWidth: "58mm" | "80mm" = "80mm",
): Promise<PrintResult> {
  // Zero-config: tenta detectar bridge em localhost se não tem nada salvo
  if (!getSavedBridgeUrl()) {
    await tryAutoDetectLocalhost();
  }
  if (!getSavedBridgeUrl()) {
    return { ok: false, error: "Bridge não configurado. Configure o IP da Print Bridge primeiro." };
  }
  let bytes: ArrayBuffer;
  try {
    const res = await api.get(`/api/v1/print/order/${orderId}`, {
      params: { paperWidth },
      responseType: "arraybuffer",
    });
    bytes = res.data as ArrayBuffer;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Falha ao obter recibo do servidor";
    return { ok: false, error: msg };
  }
  return postBytesToBridge(bytes);
}

// -------- Round receipt (mesa: rodada de pedidos) --------

export interface RoundItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  commandLabel?: string | null;
}

export interface RoundReceiptData {
  orderId: number | null;
  tableNumber: number;
  establishmentName: string;
  waiterName: string;
  roundNumber?: number;
  storeDocument?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
  newItems: RoundItem[];
  cancelledItems: Array<{ productName: string; quantity: number; commandLabel?: string | null }>;
  notes?: string | null;
}

export async function printRound(
  data: RoundReceiptData,
  paperWidth: "58mm" | "80mm" = "80mm",
): Promise<PrintResult> {
  // Zero-config: tenta detectar bridge em localhost se não tem nada salvo
  if (!getSavedBridgeUrl()) {
    await tryAutoDetectLocalhost();
  }
  if (!getSavedBridgeUrl()) {
    return { ok: false, error: "Bridge não configurado." };
  }
  let bytes: ArrayBuffer;
  try {
    const res = await api.post(`/api/v1/print/round`, data, {
      params: { paperWidth },
      responseType: "arraybuffer",
    });
    bytes = res.data as ArrayBuffer;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Falha ao gerar recibo de rodada";
    return { ok: false, error: msg };
  }
  return postBytesToBridge(bytes);
}

// -------- Packaging receipt (mesa: empacotar) --------

export interface PackagingReceiptData {
  orderId: number;
  tableNumber: number | null;
  establishmentName: string;
  storeDocument?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
  groups: Array<{
    commandLabel: string;
    items: Array<{ productName: string; quantity: number; notes?: string | null }>;
  }>;
}

export async function printPackaging(
  data: PackagingReceiptData,
  paperWidth: "58mm" | "80mm" = "80mm",
): Promise<PrintResult> {
  // Zero-config: tenta detectar bridge em localhost se não tem nada salvo
  if (!getSavedBridgeUrl()) {
    await tryAutoDetectLocalhost();
  }
  if (!getSavedBridgeUrl()) {
    return { ok: false, error: "Bridge não configurado." };
  }
  let bytes: ArrayBuffer;
  try {
    const res = await api.post(`/api/v1/print/packaging`, data, {
      params: { paperWidth },
      responseType: "arraybuffer",
    });
    bytes = res.data as ArrayBuffer;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Falha ao gerar recibo de empacotamento";
    return { ok: false, error: msg };
  }
  return postBytesToBridge(bytes);
}

/**
 * Normaliza URL do bridge:
 *   - Garante prefixo http://
 *   - Adiciona porta 9101 (HTTP) se não tiver porta
 *   - Remove trailing slash
 *
 * Aceita: "192.168.1.42", "192.168.1.42:9101", "http://192.168.1.42",
 *          "localhost", "localhost:9101"
 */
function normalizeUrl(url: string): string {
  let n = url.trim();
  if (!n.startsWith("http://") && !n.startsWith("https://")) n = "http://" + n;
  // Remove trailing slash
  n = n.replace(/\/+$/, "");
  // Se não tem porta após o host, adiciona :9101
  // Match: http(s)://host[:porta][/path]
  const hasPort = /^https?:\/\/[^/]+:\d+/.test(n);
  if (!hasPort) {
    n = n.replace(/^(https?:\/\/[^/]+)/, "$1:9101");
  }
  return n;
}

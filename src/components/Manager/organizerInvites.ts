/** Tipos e helpers da tela "Convidar gerente" (separados do componente por causa do fast refresh). */

/** Resultado de cada e-mail do POST /api/admin/organizer-invites. */
export interface InviteResult {
  email: string;
  contaNova: boolean;
  enviado: boolean;
  erro: string | null;
}

export interface InviteResponse {
  convites: InviteResult[];
  invalidos: string[];
}

/** Gerente convidado (GET /api/admin/organizer-invites). */
export interface InvitedOrganizer {
  email: string;
  name: string;
  createdAt: string | null;
  invitedAt: string | null;
  temporaryPassword: boolean;
  lastLogin: string | null;
}

export type StatusFilter = "" | "PENDING" | "ACTIVE";

export const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Aguardando troca de senha" },
  { value: "ACTIVE", label: "Ativo" },
];

/** Separa e-mails por vírgula, ponto e vírgula, espaço ou quebra de linha. */
export function splitEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

/** Erro só de envio (a conta foi criada/atualizada, o e-mail é que não saiu). */
const NOT_SENT = /enviar o e-mail/i;

export function resultLabel(r: InviteResult): { text: string; color: string } {
  // Erro de conta (outro papel / falha ao criar): nada foi feito pra este e-mail.
  if (r.erro && !r.enviado && !NOT_SENT.test(r.erro)) return { text: r.erro, color: "#dc2626" };
  const base = r.contaNova ? "Conta nova" : "Reenviado";
  if (!r.enviado) return { text: `${base} — e-mail não enviado${r.erro ? ` (${r.erro})` : ""}`, color: "#b45309" };
  return { text: `${base} — e-mail enviado`, color: "#16a34a" };
}


/** Mensagem de erro da API (JSON {message} ou texto). */
export function apiError(e: unknown, fallback: string): string {
  const data = (e as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data) return data;
  if (data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string") {
    return (data as { message: string }).message;
  }
  return fallback;
}

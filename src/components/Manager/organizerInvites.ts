/**
 * Tipos e helpers das telas de convite (gerente, estabelecimento, motorista e garçom) — separados
 * do componente por causa do fast refresh.
 */

/**
 * Resultado de cada e-mail do POST de convite. {@code vinculo}: VINCULADO (conta no grupo/loja),
 * CONVITE_PENDENTE (já tinha conta: foi gerado o convite de vínculo, aceito no app) ou nulo.
 */
export interface InviteResult {
  email: string;
  contaNova: boolean;
  enviado: boolean;
  erro: string | null;
  vinculo?: "VINCULADO" | "CONVITE_PENDENTE" | null;
}

export type InviteKind = "organizer" | "store" | "courier" | "waiter";

/** Campo extra que só o admin preenche (em nome de quem a conta nasce vinculada). */
export type AdminTarget = "organization-optional" | "organization-required" | "store-required" | null;

export interface InviteKindConfig {
  endpoint: string;
  title: string;
  listTitle: string;
  singular: string; // "gerente", "estabelecimento", ...
  namePlaceholder: string;
  emailPlaceholder: string;
  description: string;
  adminTarget: AdminTarget;
}

/** Configuração de cada tela de convite (mesmo componente, papéis diferentes). */
export const INVITE_KINDS: Record<InviteKind, InviteKindConfig> = {
  organizer: {
    endpoint: "/api/admin/organizer-invites",
    title: "Convidar gerente",
    listTitle: "Gerentes convidados",
    singular: "gerente",
    namePlaceholder: "Nome do gerente",
    emailPlaceholder: "gerente@exemplo.com\noutro@exemplo.com",
    description:
      "Gerentes só entram por convite. Cada e-mail novo recebe uma conta de gerente com senha temporária; no " +
      "primeiro acesso a pessoa cria a própria senha. Convidar de novo reenvia o e-mail.",
    adminTarget: null,
  },
  store: {
    endpoint: "/api/account-invites/stores",
    title: "Convidar estabelecimento",
    listTitle: "Estabelecimentos convidados",
    singular: "estabelecimento",
    namePlaceholder: "Nome do estabelecimento",
    emailPlaceholder: "loja@exemplo.com\noutra@exemplo.com",
    description:
      "Estabelecimentos só entram por convite. Cada e-mail novo recebe uma conta de estabelecimento com senha " +
      "temporária; no primeiro acesso a pessoa cria a própria senha. Convidada pelo gerente, a loja já entra no " +
      "grupo dele. Se o e-mail já for de uma loja, ela recebe um convite para entrar no grupo.",
    adminTarget: "organization-optional",
  },
  courier: {
    endpoint: "/api/account-invites/couriers",
    title: "Convidar motorista",
    listTitle: "Motoristas convidados",
    singular: "motorista",
    namePlaceholder: "Nome do motorista",
    emailPlaceholder: "motorista@exemplo.com\noutro@exemplo.com",
    description:
      "O motorista convidado já entra no grupo e pode levar passageiros. Cada e-mail novo recebe uma conta com " +
      "senha temporária; no primeiro acesso a pessoa cria a própria senha. Se o e-mail já for de um motorista, " +
      "ele recebe um convite para entrar no grupo.",
    adminTarget: "organization-required",
  },
  waiter: {
    endpoint: "/api/account-invites/waiters",
    title: "Convidar garçom",
    listTitle: "Garçons convidados",
    singular: "garçom",
    namePlaceholder: "Nome do garçom",
    emailPlaceholder: "garcom@exemplo.com\noutro@exemplo.com",
    description:
      "Garçons só entram por convite do estabelecimento. Cada e-mail novo recebe uma conta de garçom, já " +
      "vinculada à loja, com senha temporária. Se o e-mail já for de um garçom, ele recebe um convite para a loja.",
    adminTarget: "store-required",
  },
};

export interface InviteResponse {
  convites: InviteResult[];
  invalidos: string[];
}

/** Conta convidada (GET das telas de convite). */
export interface InvitedAccount {
  email: string;
  name: string;
  createdAt: string | null;
  invitedAt: string | null;
  temporaryPassword: boolean;
  lastLogin: string | null;
}

/** Compatibilidade com o nome antigo. */
export type InvitedOrganizer = InvitedAccount;

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
  if (r.vinculo === "CONVITE_PENDENTE") {
    return { text: "Já tem conta — convite de vínculo enviado (aceite no app)", color: "#2563eb" };
  }
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

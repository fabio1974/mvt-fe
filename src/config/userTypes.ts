// Papéis que o cadastro público pode criar (espelha a whitelist do BE em
// AuthController.PUBLIC_SIGNUP_ROLES): só Cliente PF e Motorista/Entregador. Gerente
// (ORGANIZER), Estabelecimento (CLIENT) e Garçom (WAITER) só entram por convite. Fonte única usada pelo wizard de cadastro
// (AuthTabs) e pelo seletor de perfil do login com Google (GoogleSignInButton).
export type UserTypeOption = {
  value: string;
  label: string;
  description: string;
  icon: string;
};

export const USER_TYPE_OPTIONS: UserTypeOption[] = [
  {
    value: "CUSTOMER",
    label: "Cliente Pessoa Física",
    description: "Quero pedir comida, fazer uma corrida ou uma entrega de objeto",
    icon: "👤",
  },
  {
    value: "COURIER",
    label: "Motorista / Entregador",
    description: "Faço entregas ou levo passageiros, de moto ou de carro",
    icon: "🏍️",
  },
];

/** Aviso mostrado no cadastro: os outros perfis entram por convite. */
export const INVITE_ONLY_NOTICE = "Gerente, loja ou garçom? Essas contas entram por convite.";

/** Aviso do tipo de serviço no cadastro público: passageiro só com convite de gerente. */
export const PASSENGER_INVITE_NOTICE = "Para levar passageiros, peça o convite a um gerente";

/** Papéis aceitos no cadastro público (o resto — ADMIN, ORGANIZER, CLIENT, WAITER — é recusado pelo BE). */
export const PUBLIC_SIGNUP_ROLE_VALUES = USER_TYPE_OPTIONS.map((o) => o.value);

/** Papel pedido por link (?role=) só vale se for de cadastro público; senão, ignora. */
export function sanitizePublicRole(role?: string | null): string | undefined {
  if (!role) return undefined;
  const r = role.trim().toUpperCase();
  return PUBLIC_SIGNUP_ROLE_VALUES.includes(r) ? r : undefined;
}

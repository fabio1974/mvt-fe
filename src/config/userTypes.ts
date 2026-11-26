// Papéis que o cadastro público pode criar (espelha a whitelist do BE em
// AuthController.PUBLIC_SIGNUP_ROLES). Gerente (ORGANIZER) NÃO entra aqui: só por convite
// do admin (tela "Convidar gerente"). Fonte única usada pelo wizard de cadastro
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
    value: "CLIENT",
    label: "Estabelecimento Comercial",
    description: "Tenho um negócio e preciso de corridas para meus clientes",
    icon: "🏪",
  },
  {
    value: "COURIER",
    label: "Motoboy / Entregador",
    description: "Quero trabalhar como entregador na plataforma",
    icon: "🏍️",
  },
  {
    value: "WAITER",
    label: "Garçom",
    description: "Trabalho como garçom em um estabelecimento",
    icon: "🧑‍🍳",
  },
];

/** Papéis aceitos no cadastro público (o resto — ADMIN, ORGANIZER — é recusado pelo BE). */
export const PUBLIC_SIGNUP_ROLE_VALUES = USER_TYPE_OPTIONS.map((o) => o.value);

/** Papel pedido por link (?role=) só vale se for de cadastro público; senão, ignora. */
export function sanitizePublicRole(role?: string | null): string | undefined {
  if (!role) return undefined;
  const r = role.trim().toUpperCase();
  return PUBLIC_SIGNUP_ROLE_VALUES.includes(r) ? r : undefined;
}

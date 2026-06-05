// Papéis que o cadastro público pode criar (espelha a whitelist do BE em
// AuthController.PUBLIC_SIGNUP_ROLES). Fonte única usada pelo wizard de cadastro
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
    value: "ORGANIZER",
    label: "Gerente Zapi10",
    description:
      "Tenho uma equipe de motoristas e estabelecimentos comerciais e ganho com as corridas deles",
    icon: "👥",
  },
  {
    value: "WAITER",
    label: "Garçom",
    description: "Trabalho como garçom em um estabelecimento",
    icon: "🧑‍🍳",
  },
];

import { api } from "./api";

/**
 * Status de ativação do usuário logado — espelha o ActivationStatusResponse do BE.
 * O lojista (CLIENT) só opera no app quando `enabled=true`; enquanto houver itens
 * em `missing`, o FE mostra o modal bloqueante (ActivationPendingModal), igual ao
 * fluxo do mobile (activationService.ts + ActivationPendingModal.tsx).
 */
export interface ActivationStatus {
  enabled: boolean;
  role: string;
  missing: string[];
  messages: { [key: string]: string };
  suggested: string[];
}

/**
 * Mapa item-faltante → rota no FE + rótulo do botão de ação.
 * Chaves possíveis pra CLIENT no BE (UserService.buildActivationStatus):
 * phone, pixKey, paymentMethod, fleet (só se self-delivery ativo).
 */
export const MISSING_ITEM_ROUTES: { [key: string]: { route: string; label: string } } = {
  phone: { route: "/dados-pessoais", label: "Atualizar perfil" },
  pixKey: { route: "/chave-pix", label: "Cadastrar Chave PIX" },
  paymentMethod: { route: "/pagamentos", label: "Cadastrar pagamento" },
  fleet: { route: "/motoboy", label: "Adicionar motoboy à frota" },
  // chaves de outros roles (mostradas só por robustez, sem rota CLIENT própria)
  vehicle: { route: "/dados-pessoais", label: "Cadastrar veículo" },
  serviceType: { route: "/dados-pessoais", label: "Definir tipo de serviço" },
};

/** Busca o status de ativação em tempo real do BE. Null em caso de erro de rede. */
export async function fetchActivationStatus(): Promise<ActivationStatus | null> {
  try {
    const res = await api.get<ActivationStatus>("/api/users/me/activation-status");
    return res.data;
  } catch {
    return null;
  }
}

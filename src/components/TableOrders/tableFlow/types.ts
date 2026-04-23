/**
 * Tipos do fluxo de pedidos de mesa no FE. Paridade com mobile/src/screens/waiter/tableFlow/types.ts.
 *
 * Arquitetura: TableOrderModal wraper → navegação interna (FlowView) entre
 * DetailView / MenuView / ProductView. PendingItem tem identidade própria por draft.
 */

export interface RestaurantTable {
  id: number;
  number: number;
  seats: number | null;
  active: boolean;
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "UNAVAILABLE";
  clientId: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  description: string | null;
  available: boolean;
  categoryName: string | null;
  /** Fase 2: true quando serve como adicional (CHEDDAR, OVO, etc). */
  isAddon?: boolean;
}

export interface OrderItemAddon {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  observation?: string | null;
  addons?: OrderItemAddon[];
  commandId: number | null;
  packaged?: boolean;
}

export interface OrderInfo {
  id: number;
  status: string;
  total: number;
  notes: string | null;
  items: OrderItem[];
  mesaStatus?: "OPEN" | "PAID";
  mesaPaymentMethod?: string | null;
  mesaPaidAt?: string | null;
  storeName?: string | null;
  storeDocument?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
}

export interface OrderCommand {
  id: number;
  displayNumber: number;
  name: string | null;
  status?: "OPEN" | "PAID";
  paymentMethod?: string | null;
  paidAt?: string | null;
}

export interface CommandBreakdown {
  id: number;
  displayNumber: number;
  name: string | null;
  items: OrderItem[];
  subtotal: number;
  status: "OPEN" | "PAID";
  paymentMethod: string | null;
  paidAt: string | null;
}

export interface MesaBreakdown {
  items: OrderItem[];
  subtotal: number;
  status: "OPEN" | "PAID";
  paymentMethod: string | null;
  paidAt: string | null;
}

export interface BillBreakdown {
  commands: CommandBreakdown[];
  mesa: MesaBreakdown;
  grandTotal: number;
}

/** Adicional pendurado num PendingItem. Quantity é absoluta (não multiplica pelo parent). */
export interface PendingAddon {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Draft antes de enviar pro BE. Cada PendingItem tem identidade própria —
 * dois itens do mesmo produto com customização diferente ficam separados.
 */
export interface PendingItem {
  draftId: string;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  observation?: string;
  addons: PendingAddon[];
  commandId: number | null;
}

export type FlowView =
  | { kind: "detail" }
  | { kind: "menu"; categoryName?: string }
  | { kind: "product"; productId: number; editingDraftId?: string };

export interface TableFlowData {
  products: ProductSummary[];
  existingOrder: OrderInfo | null;
  setExistingOrder: React.Dispatch<React.SetStateAction<OrderInfo | null>>;
  commands: OrderCommand[];
  setCommands: React.Dispatch<React.SetStateAction<OrderCommand[]>>;
  tableStatus: RestaurantTable["status"];
  loading: boolean;
  refresh: () => Promise<void>;
}

export interface FlowViewProps {
  table: RestaurantTable;
  data: TableFlowData;
  activeCommandId: number | null;
  setActiveCommandId: (id: number | null) => void;
  pendingItems: PendingItem[];
  setPendingItems: React.Dispatch<React.SetStateAction<PendingItem[]>>;
  cancelledItemIds: Set<number>;
  setCancelledItemIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  onExit: () => void;
  onUpdated: () => void;
  navigate: (view: FlowView) => void;
  goBack: () => void;
}

export const PAYMENT_OPTIONS = [
  { key: "PIX", label: "PIX" },
  { key: "CREDIT_CARD", label: "Cartão Crédito" },
  { key: "DEBIT_CARD", label: "Cartão Débito" },
  { key: "CASH", label: "Dinheiro" },
  { key: "NOT_INFORMED", label: "Não Informado" },
];

export const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Livre",
  RESERVED: "Reservada",
  OCCUPIED: "Ocupada",
  UNAVAILABLE: "Indisponível",
};

export const TABLE_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#22c55e",
  RESERVED: "#f59e0b",
  OCCUPIED: "#8b5cf6",
  UNAVAILABLE: "#ef4444",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: "Novo",
  ACCEPTED: "Aceito",
  PREPARING: "Preparando",
  READY: "Pronto",
  DELIVERING: "Servido",
  AWAITING_PAYMENT: "Aguardando Pagamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PLACED: "#94a3b8",
  ACCEPTED: "#3b82f6",
  PREPARING: "#f59e0b",
  READY: "#22c55e",
  DELIVERING: "#8b5cf6",
  AWAITING_PAYMENT: "#f97316",
};

export const commandLabel = (c: OrderCommand) => c.name || `Comanda #${c.displayNumber}`;

export const newDraftId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

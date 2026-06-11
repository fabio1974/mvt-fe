/**
 * Tipos compartilhados do fluxo Zapi-Food na web (funil público + dashboard).
 * Espelham o modelo do mobile (foodService.ts): linha de carrinho com addons e
 * observação, addons agrupados por categoria, preço de delivery com prioridade.
 */

export interface FoodProduct {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  deliveryPrice?: number | null;
  imageUrl?: string | null;
  isAddon?: boolean;
  available?: boolean;
  categoryId?: number | null;
  categoryName?: string | null;
}

export interface CartAddon {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

/** Uma LINHA do carrinho (id próprio): mesma loja com addons diferentes = linhas diferentes. */
export interface CartLine {
  id: string;
  product: FoodProduct;
  quantity: number;
  notes: string;
  addons: CartAddon[];
}

/** Produtos is_addon da loja agrupados por categoria (montados pelo addonGroups.ts). */
export interface AddonGroup {
  categoryName: string;
  items: FoodProduct[];
}

export interface DeliveryAddress {
  address: string;
  latitude: number;
  longitude: number;
  complement?: string;
  number?: string;
  referencePoint?: string;
}

/** Preço efetivo do produto (delivery tem prioridade, como no app). */
export const productPrice = (p: FoodProduct): number => p.deliveryPrice ?? p.price;

/** Subtotal de uma linha = produto×qtd + Σ addon.unitPrice×qtd. */
export const lineTotal = (l: CartLine): number =>
  productPrice(l.product) * l.quantity +
  l.addons.reduce((s, a) => s + a.unitPrice * a.quantity, 0);

/** Id único de linha (sem depender de libs). */
export const newLineId = (): string =>
  `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

export const brl = (n: number): string => `R$ ${n.toFixed(2).replace(".", ",")}`;

// ─── DTOs da API de pedido (espelham foodService.ts do mobile) ───────────────

export type OrderType = "DELIVERY" | "PICKUP";

export interface CreateOrderRequest {
  clientId: string;
  items: Array<{
    productId: number;
    quantity: number;
    notes: string | null;
    addons?: Array<{ productId: number; quantity: number }>;
  }>;
  notes: string | null;
  deliveryAddress?: {
    address: string;
    latitude: number;
    longitude: number;
    complement?: string;
    referencePoint?: string;
  };
  orderType: OrderType;
  paymentTiming: "AT_CHECKOUT" | "ON_DELIVERY";
  couponCode?: string | null;
}

export interface FoodOrderInfo {
  id: number;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderType?: OrderType | "TABLE" | null;
  storeName?: string | null;
  storeAddress?: string | null;
  estimatedPreparationMinutes?: number | null;
  deliveryCode?: string | null;
  customerPaymentStatus?: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | null;
  pixQrCode?: string | null;
  pixQrCodeUrl?: string | null;
  pixExpiresAt?: string | null;
}

export interface DeliveryFeePreview {
  originLat: number | null;
  originLng: number | null;
  destLat: number;
  destLng: number;
  distanceKm: number | null;
  deliveryFee: number;
  routePolyline?: number[][];
  fallbackUsed?: boolean;
}

export interface CouponValidation {
  valid: boolean;
  code?: string;
  discount?: number;
  message?: string;
}

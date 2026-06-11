import { api } from "../../services/api";
import type {
  CouponValidation,
  CreateOrderRequest,
  DeliveryFeePreview,
  FoodOrderInfo,
} from "./foodTypes";
import type { PublicMenu, PublicStore } from "../PublicMenu/publicMenuApi";

/**
 * Cliente Zapi-Food (web) — porta dos endpoints que o mobile (foodService.ts) usa.
 * Usa o `api` (services/api.ts), que injeta o Bearer token e normaliza /api.
 * O menu PÚBLICO continua via publicMenuApi.fetchMenuBySlug (permitAll).
 */

/** Lojas próximas (fluxo do dashboard). */
export async function getStores(params: { lat: number; lng: number; openOnly?: boolean }): Promise<PublicStore[]> {
  const { data } = await api.get<PublicStore[]>("/stores", {
    params: { lat: params.lat, lng: params.lng, openOnly: params.openOnly ?? false },
  });
  return data;
}

/** Menu autenticado de uma loja (fluxo do dashboard). */
export async function getStoreMenu(storeId: string): Promise<PublicMenu> {
  const { data } = await api.get<PublicMenu>(`/stores/${encodeURIComponent(storeId)}/menu`);
  return data;
}

/** Frete + rota (Google Directions com fallback haversine). */
export async function previewFee(clientId: string, destLat: number, destLng: number): Promise<DeliveryFeePreview> {
  const { data } = await api.get<DeliveryFeePreview>("/orders/preview-fee", {
    params: { clientId, destLat, destLng },
  });
  return data;
}

/** Cria o pedido (autenticado — cliente vem do JWT). PIX é gerado no BE quando AT_CHECKOUT. */
export async function createOrder(body: CreateOrderRequest): Promise<FoodOrderInfo> {
  const { data } = await api.post<FoodOrderInfo>("/orders", body);
  return data;
}

/** Busca o pedido (polling do pagamento PIX). */
export async function getOrderById(id: number): Promise<FoodOrderInfo> {
  const { data } = await api.get<FoodOrderInfo>(`/orders/${id}`);
  return data;
}

/** Pedido PIX pendente do usuário (guard de "finalize/cancele antes"). 204 → null. */
export async function getMyPendingOrder(): Promise<FoodOrderInfo | null> {
  const { data } = await api.get<FoodOrderInfo | null>("/orders/me/pending");
  return data || null;
}

/** Cupom sugerido pro usuário (1ª compra etc.). 204 → null. */
export async function getAvailableCoupon(): Promise<{ code: string; description?: string } | null> {
  const { data } = await api.get<{ code: string; description?: string } | null>("/coupons/available");
  return data || null;
}

/** Valida um cupom contra o total do pedido. */
export async function validateCoupon(code: string, orderTotal: number): Promise<CouponValidation> {
  const { data } = await api.post<CouponValidation>("/coupons/validate", { code, orderTotal });
  return data;
}

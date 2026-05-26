import { api } from "../../services/api";

/**
 * Cliente da página pública de cardápio (zapi10.com.br/c/<slug>).
 * Consome os endpoints públicos by-slug do BE (StoreController):
 *   GET /api/stores/by-slug/{slug}/menu  → { store, categories[], uncategorized[] }
 * Endpoints permitAll: funcionam sem login (visitante do WhatsApp).
 */

export interface PublicStore {
  id: string;
  name: string;
  slug: string | null;
  serviceType?: string | null;
  enabled?: boolean;
  hasMenu?: boolean;
  pickupEnabled?: boolean;
  isOpen?: boolean;
  isOpenNow?: boolean;
  description?: string | null;
  logoUrl?: string | null;
  logoInvertible?: boolean;
  coverUrl?: string | null;
  minOrder?: number | null;
  avgPreparationMinutes?: number | null;
  todayHours?: string | null;
  address?: string | null;
}

export interface PublicProduct {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  deliveryPrice?: number | null;
  imageUrl?: string | null;
}

export interface PublicCategory {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  products: PublicProduct[];
}

export interface PublicMenu {
  store: PublicStore;
  categories: PublicCategory[];
  uncategorized?: PublicProduct[];
}

/** Preço efetivo do produto na vitrine (delivery tem prioridade, como no app). */
export function productPrice(p: PublicProduct): number {
  return p.deliveryPrice ?? p.price;
}

export async function fetchMenuBySlug(slug: string): Promise<PublicMenu> {
  const { data } = await api.get<PublicMenu>(`/stores/by-slug/${encodeURIComponent(slug)}/menu`);
  return data;
}

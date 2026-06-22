// Tipos espelhando o BE (mvt-events) — módulo Marketing

export type CampaignStatus =
  | "DRAFT"
  | "GENERATING"
  | "AWAITING_APPROVAL"
  | "PUBLISHING"
  | "PUBLISHED"
  | "FAILED";

export type CreativeStatus =
  | "GENERATED"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHING"
  | "PUBLISHED"
  | "FAILED";

export type TargetAudience =
  | "GENERAL"
  | "RESTAURANT_OWNER"
  | "END_CUSTOMER"
  | "COURIER"
  | "ORGANIZER"
  | "CITY_FORTALEZA"
  | "CITY_SOBRAL"
  | "CITY_IBIAPABA";

export type CreativeType = "IMAGE" | "CAROUSEL" | "VIDEO" | "REEL";

export interface MarketingCharacter {
  id: number;
  name: string;
  description: string | null;
  assetUrl: string;
  assetPublicId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCampaign {
  id: number;
  briefing: string;
  targetAudience: TargetAudience;
  instagramAccount: string;
  creativeType: CreativeType;
  status: CampaignStatus;
  requestedVariations: number;
  errorMessage?: string | null;
  storeId?: number | null;
  storeSlug?: string | null;
  storeName?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Loja (estabelecimento) ativa com cardápio público — pro select de campanhas. */
export interface MarketingStore {
  id: number;
  slug: string;
  name: string;
}

/** Relatório de funil do cardápio: visitantes únicos por estágio (total + por loja). */
export interface FunnelReport {
  days: number;
  total: Record<string, number>;
  stores: { slug: string; name: string; counts: Record<string, number> }[];
}

/** Resolução do link /c/<slug> da loja de um creative (auto-preenchimento no Ads). */
export interface CreativeStoreLink {
  storeId: number | null;
  storeSlug: string | null;
  storeName: string | null;
  link: string | null;
}

export interface MarketingCreative {
  id: number;
  variationIndex: number;
  creativeType: CreativeType;
  imagePrompt?: string | null;
  caption?: string | null;
  hashtags?: string | null;
  assetUrl?: string | null;
  assetPublicId?: string | null;
  status: CreativeStatus;
  instagramMediaId?: string | null;
  instagramPermalink?: string | null;
  publishedAt?: string | null;
  errorMessage?: string | null;
  storeName?: string | null;
  storeSlug?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetricSnapshot {
  id: number;
  capturedAt: string;
  impressions: number;
  reach: number;
  likes: number;
  saves: number;
  comments: number;
  shares: number;
  profileVisits: number;
}

export interface CampaignDetail {
  campaign: MarketingCampaign;
  creatives: MarketingCreative[];
}

export interface MarketingGuideline {
  id: number;
  text: string;
  scope?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mídia paga (Meta Marketing API) — Fase 2

export type PaidCampaignStatus = "DRAFT" | "CREATED" | "ACTIVE" | "PAUSED" | "FAILED";

export interface MarketingPaidCampaign {
  id: number;
  creativeId?: number | null;
  name: string;
  objective: string;
  linkUrl: string;
  dailyBudgetCents: number;
  status: PaidCampaignStatus;
  fbCampaignId?: string | null;
  fbAdsetId?: string | null;
  fbCreativeId?: string | null;
  fbAdId?: string | null;
  errorMessage?: string | null;
  scheduleSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdSpendSnapshot {
  id: number;
  capturedAt: string;
  spendCents: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpcCents: number;
  cpmCents: number;
}

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
  createdAt: string;
  updatedAt: string;
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

import { api } from "../../services/api";
import type {
  AdSpendSnapshot,
  CampaignDetail,
  CreativeStoreLink,
  MarketingCampaign,
  MarketingCharacter,
  MarketingCreative,
  MarketingGuideline,
  MarketingPaidCampaign,
  MarketingStore,
  MetricSnapshot,
  TargetAudience,
} from "./types";

const BASE = "/api/admin/marketing";
const GUIDELINES = `${BASE}/guidelines`;

export const marketingApi = {
  health: async () =>
    (await api.get<{ vertex_configured: boolean; instagram_configured: boolean; instagram_token_check: any }>(
      `${BASE}/health`
    )).data,

  listCampaigns: async () =>
    (await api.get<MarketingCampaign[]>(`${BASE}/campaigns`)).data,

  createCampaign: async (input: {
    briefing: string;
    targetAudience: TargetAudience;
    requestedVariations?: number;
    creativeType?: "IMAGE" | "CAROUSEL" | "VIDEO";
    character?: { id: number };
  }) => (await api.post<MarketingCampaign>(`${BASE}/campaigns`, input)).data,

  // Lojas ativas com cardápio (slug) pro multi-select de campanhas
  listStores: async () =>
    (await api.get<MarketingStore[]>(`${BASE}/stores`)).data,

  // Cria 1 campanha por loja selecionada (briefing personalizado); sem lojas = 1 institucional
  createCampaignBatch: async (input: {
    briefing: string;
    targetAudience: TargetAudience;
    requestedVariations?: number;
    creativeType?: "IMAGE" | "CAROUSEL" | "VIDEO";
    storeIds: number[];
  }) => (await api.post<MarketingCampaign[]>(`${BASE}/campaigns/batch`, input)).data,

  // Resolve o link /c/<slug> da loja de um creative (auto-preenchimento no Ads)
  creativeStoreLink: async (id: number) =>
    (await api.get<CreativeStoreLink>(`${BASE}/creatives/${id}/store-link`)).data,

  getCampaign: async (id: number) =>
    (await api.get<CampaignDetail>(`${BASE}/campaigns/${id}`)).data,

  deleteCampaign: async (id: number) =>
    (await api.delete<{ deleted: boolean; id: number }>(`${BASE}/campaigns/${id}`)).data,

  updateCampaign: async (id: number, patch: { briefing?: string; targetAudience?: TargetAudience; creativeType?: "IMAGE" | "CAROUSEL" | "VIDEO"; requestedVariations?: number }) =>
    (await api.patch<MarketingCampaign>(`${BASE}/campaigns/${id}`, patch)).data,

  regenerate: async (id: number) =>
    (await api.post<MarketingCampaign>(`${BASE}/campaigns/${id}/regenerate`)).data,

  observeMemory: async (observation: string) =>
    (await api.post<{ id: number; applied: boolean }>(`${BASE}/memory/observe`, { observation })).data,

  generate: async (id: number) =>
    (await api.post<MarketingCampaign>(`${BASE}/campaigns/${id}/generate`)).data,

  approveCreative: async (id: number, caption?: string) =>
    (
      await api.post<MarketingCreative>(`${BASE}/creatives/${id}/approve`, caption ? { caption } : {})
    ).data,

  rejectCreative: async (id: number) =>
    (await api.post<MarketingCreative>(`${BASE}/creatives/${id}/reject`)).data,

  publishCreative: async (id: number) =>
    (await api.post<MarketingCreative>(`${BASE}/creatives/${id}/publish`)).data,

  resetCreative: async (id: number) =>
    (await api.post<MarketingCreative>(`${BASE}/creatives/${id}/reset`)).data,

  publishCarousel: async (campaignId: number, creativeIds: number[]) =>
    (
      await api.post<MarketingCreative>(`${BASE}/campaigns/${campaignId}/publish-carousel`, {
        creativeIds,
      })
    ).data,

  listPublished: async () =>
    (await api.get<MarketingCreative[]>(`${BASE}/published`)).data,

  creativeMetrics: async (id: number) =>
    (await api.get<MetricSnapshot[]>(`${BASE}/creatives/${id}/metrics`)).data,

  refreshMetrics: async (id: number) =>
    (await api.post<MetricSnapshot[]>(`${BASE}/creatives/${id}/refresh-metrics`)).data,

  // Diretrizes (observações permanentes)
  listGuidelines: async () =>
    (await api.get<MarketingGuideline[]>(GUIDELINES)).data,

  createGuideline: async (input: { text: string; scope?: string | null; active?: boolean }) =>
    (await api.post<MarketingGuideline>(GUIDELINES, input)).data,

  patchGuideline: async (id: number, body: Partial<{ text: string; scope: string | null; active: boolean }>) =>
    (await api.patch<MarketingGuideline>(`${GUIDELINES}/${id}`, body)).data,

  deleteGuideline: async (id: number) =>
    (await api.delete<{ deleted: boolean; id: number }>(`${GUIDELINES}/${id}`)).data,

  // Personagens (image-to-video)
  listCharacters: async () =>
    (await api.get<MarketingCharacter[]>(`${BASE}/characters`)).data,

  uploadCharacter: async (file: File, name: string, description?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name);
    if (description) fd.append("description", description);
    return (
      await api.post<MarketingCharacter>(`${BASE}/characters/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data;
  },

  deleteCharacter: async (id: number) =>
    (await api.delete<{ deleted: boolean; id: number }>(`${BASE}/characters/${id}`)).data,

  // Mídia paga (Meta Marketing API) — Fase 2
  adsHealth: async () =>
    (await api.get<{ ads_configured: boolean }>(`${BASE}/ads/health`)).data,

  listPaidCampaigns: async () =>
    (await api.get<MarketingPaidCampaign[]>(`${BASE}/ads`)).data,

  audienceEstimate: async (link: string) =>
    (await api.get<{ lowerBound: number; upperBound: number; radiusKm: number; hasStore: boolean }>(
      `${BASE}/ads/audience-estimate`,
      { params: { link } }
    )).data,

  promoteCreative: async (input: { creativeId: number; dailyBudgetCents: number; linkUrl: string; startDate: string; endDate: string }) =>
    (await api.post<MarketingPaidCampaign>(`${BASE}/ads/promote`, input)).data,

  launchPaid: async (id: number) =>
    (await api.post<MarketingPaidCampaign>(`${BASE}/ads/${id}/launch`)).data,

  pausePaid: async (id: number) =>
    (await api.post<MarketingPaidCampaign>(`${BASE}/ads/${id}/pause`)).data,

  refreshAdSpend: async (id: number) =>
    (await api.post<AdSpendSnapshot>(`${BASE}/ads/${id}/refresh-spend`)).data,
};

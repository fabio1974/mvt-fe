import { api } from "../../services/api";
import type {
  CampaignDetail,
  MarketingCampaign,
  MarketingCreative,
  MarketingGuideline,
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
    creativeType?: "IMAGE" | "CAROUSEL";
  }) => (await api.post<MarketingCampaign>(`${BASE}/campaigns`, input)).data,

  getCampaign: async (id: number) =>
    (await api.get<CampaignDetail>(`${BASE}/campaigns/${id}`)).data,

  deleteCampaign: async (id: number) =>
    (await api.delete<{ deleted: boolean; id: number }>(`${BASE}/campaigns/${id}`)).data,

  updateCampaign: async (id: number, patch: { briefing?: string; targetAudience?: TargetAudience; creativeType?: "IMAGE" | "CAROUSEL"; requestedVariations?: number }) =>
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
};

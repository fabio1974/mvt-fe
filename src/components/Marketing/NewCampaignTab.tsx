import React, { useEffect, useMemo, useState } from "react";
import { marketingApi } from "./api";
import type { MarketingCampaign, MarketingCharacter, MarketingStore, TargetAudience } from "./types";
import GeneratingModal from "./GeneratingModal";

const AUDIENCES: { value: TargetAudience; label: string }[] = [
  { value: "GENERAL", label: "Geral (sem segmentação)" },
  { value: "END_CUSTOMER", label: "Consumidor final" },
  { value: "RESTAURANT_OWNER", label: "Donos de restaurante (B2B)" },
  { value: "COURIER", label: "Motoboys (B2B)" },
  { value: "ORGANIZER", label: "Gerentes Parceiros (B2B)" },
  { value: "CITY_FORTALEZA", label: "Fortaleza" },
  { value: "CITY_SOBRAL", label: "Sobral" },
  { value: "CITY_IBIAPABA", label: "Serra da Ibiapaba" },
];

interface Props {
  campaigns: MarketingCampaign[];
  onCreated: () => void;
}

const NewCampaignTab: React.FC<Props> = ({ campaigns, onCreated }) => {
  const [briefing, setBriefing] = useState("");
  const [audience, setAudience] = useState<TargetAudience>("END_CUSTOMER");
  const [variations, setVariations] = useState(5);
  const [creativeType, setCreativeType] = useState<"IMAGE" | "CAROUSEL" | "VIDEO">("IMAGE");
  const [characterId, setCharacterId] = useState<number | "">("");
  const [characters, setCharacters] = useState<MarketingCharacter[]>([]);
  const [stores, setStores] = useState<MarketingStore[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (creativeType === "VIDEO" && characters.length === 0) {
      marketingApi.listCharacters().then(setCharacters).catch(() => {});
    }
  }, [creativeType, characters.length]);

  useEffect(() => {
    marketingApi.listStores().then(setStores).catch(() => {});
  }, []);

  const isBatch = creativeType !== "VIDEO" && selectedStoreIds.length > 0;

  const filteredStores = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q));
  }, [stores, storeSearch]);

  const toggleStore = (id: number) =>
    setSelectedStoreIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const draftCampaigns = campaigns.filter((c) => c.status === "DRAFT" || c.status === "FAILED");

  const handleDelete = async (id: number) => {
    if (!confirm(`Deletar campanha #${id}? As imagens também serão removidas do Cloudinary.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      await marketingApi.deleteCampaign(id);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Erro ao deletar");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefing.trim()) return;
    if (creativeType === "VIDEO" && !characterId) {
      setError("Vídeo requer um personagem selecionado.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      if (isBatch) {
        // 1 campanha por loja — o BE personaliza o briefing (nome + produtos de cada loja)
        await marketingApi.createCampaignBatch({
          briefing: briefing.trim(),
          targetAudience: audience,
          requestedVariations: variations,
          creativeType: creativeType as "IMAGE" | "CAROUSEL",
          storeIds: selectedStoreIds,
        });
        setSelectedStoreIds([]);
      } else {
        const payload: any = {
          briefing: briefing.trim(),
          targetAudience: audience,
          requestedVariations: creativeType === "VIDEO" ? 1 : variations,
          creativeType,
        };
        if (creativeType === "VIDEO" && characterId) {
          payload.character = { id: characterId };
        }
        await marketingApi.createCampaign(payload);
      }
      setBriefing("");
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Erro ao criar");
    } finally {
      setCreating(false);
    }
  };

  const handleGenerate = async (id: number) => {
    setGeneratingId(id);
    setError(null);
    try {
      await marketingApi.generate(id);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Erro gerando variações");
    } finally {
      setGeneratingId(null);
    }
  };

  const generatingCampaign = generatingId != null ? campaigns.find((c) => c.id === generatingId) : null;

  return (
    <div>
      <GeneratingModal
        isOpen={generatingId != null}
        variationsCount={generatingCampaign?.requestedVariations ?? variations}
        mode="generate"
      />
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Nova campanha</h2>

        <label style={labelStyle}>Briefing</label>
        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          placeholder="Ex: Promo Tex Burger sexta — combo X-tudo + batata + refri por R$25"
          rows={4}
          style={inputStyle}
          required
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={labelStyle}>Público-alvo</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as TargetAudience)}
              style={inputStyle}
            >
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Tipo</label>
            <select
              value={creativeType}
              onChange={(e) => setCreativeType(e.target.value as "IMAGE" | "CAROUSEL" | "VIDEO")}
              style={inputStyle}
            >
              <option value="IMAGE">Post único</option>
              <option value="CAROUSEL">Carrossel (várias imagens)</option>
              <option value="VIDEO">Vídeo (Veo 3, ~8s)</option>
              <option value="REEL" disabled>Reels (em breve — não disponível)</option>
            </select>
          </div>

          {creativeType === "VIDEO" ? (
            <div>
              <label style={labelStyle}>Personagem</label>
              <select
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value ? Number(e.target.value) : "")}
                style={inputStyle}
                required
              >
                <option value="">— escolha um personagem —</option>
                {characters.filter((c) => c.enabled).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {characters.length === 0 && (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  Nenhum personagem cadastrado. Vá na aba <b>🎭 Personagens</b> primeiro.
                </div>
              )}
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Variações</label>
              <input
                type="number"
                min={1}
                max={10}
                value={variations}
                onChange={(e) => setVariations(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          )}
        </div>

        {creativeType !== "VIDEO" && (
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>
              Estabelecimentos (opcional) — cria 1 campanha por loja, personalizada com nome + produtos
            </label>
            {stores.length === 0 ? (
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Nenhuma loja ativa com cardápio (slug) encontrada.
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <input
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder="🔎 filtrar loja…"
                    style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedStoreIds(filteredStores.map((s) => s.id))}
                    style={chipBtn}
                  >
                    Selecionar todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStoreIds([])}
                    style={chipBtn}
                  >
                    Limpar
                  </button>
                </div>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 8,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 4,
                  }}
                >
                  {filteredStores.map((s) => (
                    <label
                      key={s.id}
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        fontSize: 13,
                        padding: "4px 6px",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: selectedStoreIds.includes(s.id) ? "#eff6ff" : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStoreIds.includes(s.id)}
                        onChange={() => toggleStore(s.id)}
                      />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name}
                      </span>
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: isBatch ? "#1d4ed8" : "#94a3b8", marginTop: 6 }}>
                  {isBatch
                    ? `📦 Vai criar ${selectedStoreIds.length} campanha(s) — 1 por loja, com ${variations} variações cada.`
                    : "Nenhuma loja selecionada → cria 1 campanha institucional (Zapi10)."}
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: "#991b1b", marginTop: 8, fontSize: 13 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={creating || !briefing.trim()}
          style={{
            marginTop: 16,
            padding: "10px 20px",
            background: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: creating ? "not-allowed" : "pointer",
            opacity: creating ? 0.6 : 1,
          }}
        >
          {creating
            ? "Criando…"
            : isBatch
            ? `Criar ${selectedStoreIds.length} campanhas (1 por loja)`
            : "Criar campanha"}
        </button>
      </form>

      {draftCampaigns.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Rascunhos prontos pra gerar</h3>
          {draftCampaigns.map((c) => (
            <div
              key={c.id}
              style={{
                background: "white",
                padding: 14,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  #{c.id} · {c.creativeType} · {c.requestedVariations} variações · {c.status}
                </div>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: 13,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.briefing}
                </div>
                {c.errorMessage && (
                  <div style={{ color: "#991b1b", fontSize: 12, marginTop: 4 }}>
                    ❌ {c.errorMessage}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleGenerate(c.id)}
                  disabled={generatingId !== null || deletingId !== null}
                  style={{
                    padding: "8px 16px",
                    background: "#1d4ed8",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    cursor: generatingId !== null ? "not-allowed" : "pointer",
                    opacity: generatingId !== null ? 0.6 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {generatingId === c.id ? "Gerando…" : "Gerar variações"}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId !== null || generatingId !== null}
                  title="Deletar campanha"
                  style={{
                    padding: "8px 12px",
                    background: "transparent",
                    color: "#dc2626",
                    border: "1px solid #dc2626",
                    borderRadius: 8,
                    cursor: deletingId !== null ? "not-allowed" : "pointer",
                    opacity: deletingId !== null ? 0.6 : 1,
                  }}
                >
                  {deletingId === c.id ? "…" : "🗑️"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#475569",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const chipBtn: React.CSSProperties = {
  padding: "6px 10px",
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export default NewCampaignTab;

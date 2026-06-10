import React, { useEffect, useState } from "react";
import PageContainer from "../Generic/PageContainer";
import ImageUploadField from "./ImageUploadField";
import { api } from "../../services/api";
import { maskCNPJ, isValidCNPJ, unmaskValue } from "../../utils/masks";

/**
 * Configurar Loja — porte web da StoreSettingsScreen.tsx do mobile (seção "all").
 * Edita capa, logo, identificação (nome fantasia + CNPJ), descrição, frete da
 * frota própria (só se selfDelivery) e horários de funcionamento.
 * Carrega/salva via GET/PUT /api/store-profile/me (PUT parcial no BE).
 */

interface StoreProfile {
  slug: string | null;
  isOpen: boolean;
  coverUrl: string | null;
  logoUrl: string | null;
  tradeName: string | null;
  cnpj: string | null;
  description: string | null;
  openingHours: Record<string, string[]> | null;
  selfDelivery?: boolean;
  deliveryMinFee?: number | null;
  deliveryPricePerKm?: number | null;
  pickupEnabled?: boolean;
}

const DAYS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

const TRADE_NAME_MAX = 200;
const DESCRIPTION_MAX = 500;

// Máscara HH:MM — aceita até 4 dígitos, insere ":" após os 2 primeiros, limita HH≤23 / MM≤59.
const maskTime = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  let hh = digits.slice(0, 2);
  let mm = digits.slice(2, 4);
  if (hh.length === 2 && parseInt(hh, 10) > 23) hh = "23";
  if (mm.length === 2 && parseInt(mm, 10) > 59) mm = "59";
  return mm.length > 0 ? `${hh}:${mm}` : hh;
};
const isValidTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

const StoreSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selfDelivery, setSelfDelivery] = useState(false);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState<Record<string, { start: string; end: string }>>({});
  const [deliveryMinFee, setDeliveryMinFee] = useState("");
  const [deliveryPricePerKm, setDeliveryPricePerKm] = useState("");
  const [pickupEnabled, setPickupEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<StoreProfile>("/api/store-profile/me");
        const p = res.data;
        setCoverUrl(p.coverUrl);
        setLogoUrl(p.logoUrl);
        setTradeName(p.tradeName || "");
        setCnpj(p.cnpj ? maskCNPJ(p.cnpj) : "");
        setDescription(p.description || "");
        setSelfDelivery(p.selfDelivery ?? false);
        setPickupEnabled(p.pickupEnabled ?? false);
        setDeliveryMinFee(p.deliveryMinFee != null ? String(p.deliveryMinFee).replace(".", ",") : "");
        setDeliveryPricePerKm(p.deliveryPricePerKm != null ? String(p.deliveryPricePerKm).replace(".", ",") : "");
        if (p.openingHours) {
          const h: Record<string, { start: string; end: string }> = {};
          for (const [day, slots] of Object.entries(p.openingHours)) {
            const first = Array.isArray(slots) ? slots[0] : String(slots);
            if (typeof first === "string" && first.includes("-")) {
              const [s, e] = first.split("-").map((x) => x.trim());
              h[day] = { start: s || "", end: e || "" };
            }
          }
          setHours(h);
        }
      } catch {
        // erro de rede tratado pelo interceptor
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateHour = (dayKey: string, field: "start" | "end", text: string) => {
    const masked = maskTime(text);
    setHours((prev) => ({ ...prev, [dayKey]: { ...(prev[dayKey] || { start: "", end: "" }), [field]: masked } }));
  };

  const handleSave = async () => {
    if (!tradeName.trim()) {
      window.alert("Informe o nome fantasia da empresa.");
      return;
    }
    const cnpjDigits = unmaskValue(cnpj);
    if (cnpjDigits.length > 0 && !isValidCNPJ(cnpjDigits)) {
      window.alert("CNPJ inválido. Verifique os dígitos.");
      return;
    }
    for (const [day, v] of Object.entries(hours)) {
      const hasStart = !!v.start;
      const hasEnd = !!v.end;
      if (hasStart !== hasEnd) {
        window.alert(`Preencha entrada E saída de ${day} — ou deixe ambos vazios.`);
        return;
      }
      if (hasStart && (!isValidTime(v.start) || !isValidTime(v.end))) {
        window.alert(`Horário inválido em ${day}. Use HH:MM (00:00–23:59).`);
        return;
      }
    }

    setSaving(true);
    try {
      const openingHours: Record<string, string[]> = {};
      for (const [day, v] of Object.entries(hours)) {
        if (v.start && v.end) openingHours[day] = [`${v.start}-${v.end}`];
      }
      await api.put("/api/store-profile/me", {
        coverUrl,
        logoUrl,
        tradeName: tradeName.trim() || null,
        cnpj: cnpjDigits || null,
        description: description.trim() || null,
        openingHours: Object.keys(openingHours).length > 0 ? openingHours : null,
        deliveryMinFee: deliveryMinFee ? parseFloat(deliveryMinFee.replace(",", ".")) : null,
        deliveryPricePerKm: deliveryPricePerKm ? parseFloat(deliveryPricePerKm.replace(",", ".")) : null,
        pickupEnabled,
      });
      window.alert("Configurações salvas com sucesso!");
    } catch (e: unknown) {
      const resp = (e as { response?: { data?: { message?: string } } })?.response;
      window.alert(resp?.data?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Configurar Loja">
      <div style={{ flex: 1, padding: "24px", background: "var(--app-bg)", minHeight: "calc(100vh - 180px)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center" }}>Carregando...</p>
          ) : (
            <>
              <SectionTitle>Capa</SectionTitle>
              {/* 3:1 — mesma proporção do banner exibido no card do cliente (MyStoreCard) e no cardápio público. */}
              <ImageUploadField value={coverUrl} onChange={setCoverUrl} folder="stores" aspectRatio={3 / 1} label="Adicionar capa" />
              <Hint>Banner que aparece no topo do seu cardápio público.</Hint>

              <SectionTitle>Logotipo</SectionTitle>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ImageUploadField value={logoUrl} onChange={setLogoUrl} folder="stores" aspectRatio={1} label="Logo" containerStyle={{ width: 120, height: 120 }} />
              </div>
              <Hint>Aparece no seu perfil público e nos recibos impressos.</Hint>

              <SectionTitle>Identificação</SectionTitle>
              <Label>Nome fantasia *</Label>
              <input style={inputStyle} value={tradeName} onChange={(e) => setTradeName(e.target.value)} maxLength={TRADE_NAME_MAX} placeholder="Ex: R&T Sorveteria" />
              <Hint>Como sua empresa aparece para os clientes. Diferente do nome do responsável (CPF).</Hint>

              <Label>CNPJ</Label>
              <input style={inputStyle} value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} inputMode="numeric" maxLength={18} placeholder="00.000.000/0000-00" />
              <Hint>Opcional. Aparece nos recibos térmicos.</Hint>

              <SectionTitle>Descrição</SectionTitle>
              <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={DESCRIPTION_MAX} placeholder="Conte um pouco sobre a sua empresa..." />

              <SectionTitle>Atendimento</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Retirada no balcão</div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>
                    Quando ativo, o cliente pode escolher "Retirar no balcão" e o pedido sai sem entregador.
                  </div>
                </div>
                <Toggle checked={pickupEnabled} onChange={setPickupEnabled} />
              </div>

              {selfDelivery && (
                <>
                  <SectionTitle>Frete da entrega própria</SectionTitle>
                  <Hint>Você entrega com a sua frota. Em branco = usa o padrão da plataforma.</Hint>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <Label>Frete mínimo (R$)</Label>
                      <input style={inputStyle} inputMode="decimal" value={deliveryMinFee} onChange={(e) => setDeliveryMinFee(e.target.value)} placeholder="8,00" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Label>Frete por km (R$)</Label>
                      <input style={inputStyle} inputMode="decimal" value={deliveryPricePerKm} onChange={(e) => setDeliveryPricePerKm(e.target.value)} placeholder="2,00" />
                    </div>
                  </div>
                </>
              )}

              <SectionTitle>Horários de funcionamento</SectionTitle>
              <Hint>Entrada e saída do dia (HH:MM). Deixe em branco para "Fechado".</Hint>
              {DAYS.map((day) => {
                const v = hours[day.key] || { start: "", end: "" };
                return (
                  <div key={day.key} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ width: 80, fontSize: 13, fontWeight: 600, color: "#475569" }}>{day.label}</span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      <input style={timeInputStyle} inputMode="numeric" maxLength={5} placeholder="--:--" value={v.start} onChange={(e) => updateHour(day.key, "start", e.target.value)} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>às</span>
                      <input style={timeInputStyle} inputMode="numeric" maxLength={5} placeholder="--:--" value={v.end} onChange={(e) => updateHour(day.key, "end", e.target.value)} />
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: "100%",
                  marginTop: 24,
                  border: "none",
                  borderRadius: 12,
                  padding: 16,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 700,
                  background: "#dbeafe",
                  color: "#1d4ed8",
                }}
              >
                {saving ? "Salvando..." : "💾 Salvar Configurações"}
              </button>
              <div style={{ height: 40 }} />
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 20, marginBottom: 8 }}>{children}</h3>
);
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4, display: "block" }}>{children}</label>
);
const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  // Colado no input acima (gap pequeno) e bem afastado do próximo campo abaixo,
  // pra não confundir a qual input o hint se refere.
  <p style={{ fontSize: 12, color: "#4b5563", fontStyle: "italic", marginTop: 2, marginBottom: 18 }}>{children}</p>
);

/** Switch on/off estilizado (verde quando ligado). */
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      flexShrink: 0,
      width: 48,
      height: 28,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      padding: 0,
      background: checked ? "#16a34a" : "#cbd5e1",
      position: "relative",
      transition: "background 0.15s",
    }}
  >
    <span
      style={{
        position: "absolute",
        top: 3,
        left: checked ? 23 : 3,
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        transition: "left 0.15s",
      }}
    />
  </button>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: 12,
  fontSize: 14,
  marginBottom: 3,
  boxSizing: "border-box",
};
const timeInputStyle: React.CSSProperties = {
  flex: 1,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  fontWeight: 600,
  textAlign: "center",
  boxSizing: "border-box",
};

export default StoreSettingsPage;

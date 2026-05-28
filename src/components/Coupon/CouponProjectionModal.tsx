import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { api } from "../../services/api";

interface CampaignCost {
  maxClientsByBudget: number;
  clients: number;
  cappedByBudget: boolean;
  assumedAvgOrderValue: number;
  grossDiscountPerClient: number;
  chargedPerClient: number;
  netCostPerClient: number;
  grossCostTotal: number;
  netCostTotal: number;
  ordersGrossTotal: number;
  chargedTotal: number;
  gatewayFeeTotal: number;
  platformMarginTotal: number;
  platformMarginPct: number;
  gatewayFeePct: number;
}

interface Props {
  couponId: number | string;
  couponCode?: string;
  onClose: () => void;
}

const brl = (v: number | string | null | undefined) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const pct = (v: number | string | null | undefined) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
};

const CouponProjectionModal: React.FC<Props> = ({ couponId, couponCode, onClose }) => {
  const [data, setData] = useState<CampaignCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<CampaignCost>(`/api/coupons/${couponId}/cost-projection`);
        setData(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Erro ao carregar projeção.");
      } finally {
        setLoading(false);
      }
    })();
  }, [couponId]);

  const cacLiquido = data && data.clients > 0
    ? data.netCostTotal / data.clients
    : 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 8, width: "min(720px, 92vw)",
          maxHeight: "90vh", overflow: "auto", padding: 24,
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            Projeção da Campanha {couponCode ? <span style={{ color: "#6b7280" }}>· {couponCode}</span> : null}
          </h2>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22 }}>
            <FiX />
          </button>
        </div>

        {loading && <div style={{ padding: 16, color: "#6b7280" }}>Calculando...</div>}
        {error && <div style={{ padding: 16, color: "#dc2626" }}>{error}</div>}

        {data && (
          <>
            <Section title="Resumo">
              <Row label="Quantidade de cupons" value={`${data.clients}`} />
              <Row label="Ticket médio assumido (pedido mínimo)" value={brl(data.assumedAvgOrderValue)} />
              <Row label="Margem da plataforma" value={pct(data.platformMarginPct)} hint="absorve parte do desconto" />
              <Row label="Taxa do gateway (Pagar.me)" value={pct(data.gatewayFeePct)} hint="custo sobre o valor cobrado" />
            </Section>

            <Section title="Por cliente">
              <Row label="Desconto bruto dado" value={brl(data.grossDiscountPerClient)} />
              <Row label="Valor cobrado (após desconto)" value={brl(data.chargedPerClient)} />
              <Row
                label="Custo líquido p/ plataforma"
                value={brl(data.netCostPerClient)}
                hint="desconto + taxa gateway − margem do pedido"
                emphasized
              />
            </Section>

            <Section title="Total da campanha">
              <Row label="Faturamento bruto (todos os pedidos)" value={brl(data.ordersGrossTotal)} />
              <Row label="Valor total cobrado" value={brl(data.chargedTotal)} />
              <Row label="Orçamento (desconto bruto distribuído)" value={brl(data.grossCostTotal)} hint="gasto bruto = qtd cupons × desconto máx" emphasized />
              <Row label="Taxa do gateway (Pagar.me)" value={brl(data.gatewayFeeTotal)} />
              <Row label="Margem da plataforma absorvida" value={`− ${brl(data.platformMarginTotal)}`} />
              <Row
                label="Custo líquido da campanha"
                value={brl(data.netCostTotal)}
                hint="gasto líquido (já com taxa Pagar.me e margem)"
                emphasized
              />
              <Row
                label="CAC líquido por cliente"
                value={brl(cacLiquido)}
                hint="custo líquido total / cupons considerados"
                emphasized
              />
            </Section>

          </>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}>
    <h3 style={{ fontSize: 14, color: "#374151", margin: "0 0 8px", borderBottom: "1px solid #e5e7eb", paddingBottom: 4 }}>{title}</h3>
    <div>{children}</div>
  </div>
);

const Row: React.FC<{ label: string; value: string; hint?: string; emphasized?: boolean }> = ({
  label, value, hint, emphasized,
}) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
    padding: "6px 0", fontSize: 14,
    fontWeight: emphasized ? 600 : 400,
    color: emphasized ? "#111827" : "#374151",
  }}>
    <div>
      {label}
      {hint && <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}>{hint}</div>}
    </div>
    <div style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div>
  </div>
);

export default CouponProjectionModal;

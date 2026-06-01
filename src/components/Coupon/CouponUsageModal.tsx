import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { api } from "../../services/api";

/**
 * Relatório de USO real da campanha (resgates), distinto da projeção de custo.
 *
 * "Usado" de verdade = CONSUMED (pedido pago, confirmado pelo webhook do PIX).
 * RESERVED é uma reserva temporária no checkout (segura o orçamento durante a
 * janela de pagamento); vira CONSUMED se pagar, ou RELEASED se o PIX expira.
 */
interface CouponReport {
  budget: { totalCents: number; usedCents: number; remainingCents: number; usedPct: number };
  redemptions: { reserved: number; consumed: number; released: number; total: number; conversionRatePct: number | null };
  financialRealized: {
    paidOrders: number;
    grossDiscountGiven: number;
    ordersGrossTotal: number;
    netCostRealized: number;
    realizedCacPerClient: number;
    platformMarginPct: number;
    gatewayFeePct: number;
  };
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
const brlCents = (cents: number | null | undefined) => brl((cents ?? 0) / 100);
const pct = (v: number | string | null | undefined) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;
};

const CouponUsageModal: React.FC<Props> = ({ couponId, couponCode, onClose }) => {
  const [data, setData] = useState<CouponReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<CouponReport>(`/api/coupons/${couponId}/report`);
        setData(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Erro ao carregar o relatório de uso.");
      } finally {
        setLoading(false);
      }
    })();
  }, [couponId]);

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
          background: "#fff", borderRadius: 8, width: "min(640px, 92vw)",
          maxHeight: "90vh", overflow: "auto", padding: 24,
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            Uso da Campanha {couponCode ? <span style={{ color: "#6b7280" }}>· {couponCode}</span> : null}
          </h2>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22 }}>
            <FiX />
          </button>
        </div>

        {loading && <div style={{ padding: 16, color: "#6b7280" }}>Carregando...</div>}
        {error && <div style={{ padding: 16, color: "#dc2626" }}>{error}</div>}

        {data && (
          <>
            <Section title="Resgates">
              <Row
                label="Usados (pedidos pagos)"
                value={`${data.redemptions.consumed}`}
                hint="cupom queimado de verdade — pagamento confirmado"
                emphasized
              />
              <Row
                label="Aguardando pagamento"
                value={`${data.redemptions.reserved}`}
                hint="PIX gerado, ainda não pago (reserva o orçamento)"
              />
              <Row
                label="Liberados (não pagaram)"
                value={`${data.redemptions.released}`}
                hint="PIX expirou/cancelou — orçamento devolvido"
              />
              <Row label="Total de resgates" value={`${data.redemptions.total}`} />
              {data.redemptions.conversionRatePct != null && (
                <Row label="Taxa de conversão" value={pct(data.redemptions.conversionRatePct)} hint="pagos / total de resgates" />
              )}
            </Section>

            <Section title="Orçamento">
              <Row label="Orçamento total" value={brlCents(data.budget.totalCents)} />
              <Row label="Usado" value={`${brlCents(data.budget.usedCents)} (${pct(data.budget.usedPct)})`} emphasized />
              <Row label="Restante" value={brlCents(data.budget.remainingCents)} />
            </Section>

            <Section title="Financeiro realizado (só pagos)">
              <Row label="Pedidos pagos" value={`${data.financialRealized.paidOrders}`} />
              <Row label="Desconto bruto concedido" value={brl(data.financialRealized.grossDiscountGiven)} />
              <Row label="Faturamento bruto gerado" value={brl(data.financialRealized.ordersGrossTotal)} />
              <Row
                label="Custo líquido real"
                value={brl(data.financialRealized.netCostRealized)}
                hint="já com taxa Pagar.me e margem absorvida"
                emphasized
              />
              <Row label="CAC real por cliente" value={brl(data.financialRealized.realizedCacPerClient)} />
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

export default CouponUsageModal;

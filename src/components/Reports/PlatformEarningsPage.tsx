import React, { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiTrendingUp, FiUser } from "react-icons/fi";
import { api } from "../../services/api";
import PageContainer from "../Generic/PageContainer";
import "./PlatformEarnings.css";

type Granularity = "DAY" | "WEEK" | "MONTH";
type Tab = "platform" | "organizer";

interface Bucket {
  periodStart: string;
  label: string;
  orderCount: number;
  gmv: number;
  repasses: number;
  pixInFee: number;
  netEarnings: number;
}
interface Totals {
  orderCount: number;
  gmv: number;
  repasses: number;
  pixInFee: number;
  netEarnings: number;
}
interface PlatformEarnings {
  granularity: Granularity;
  from: string;
  to: string;
  pixInFeePercentage: number;
  pixInFeeFixedCents: number;
  totals: Totals;
  buckets: Bucket[];
}

interface OrganizerOption {
  id: string;
  name: string;
}
interface OrganizerEarningDetail {
  transferId: number;
  deliveryId: number | null;
  foodOrderId: number | null;
  transferStatus: string;
  transferKind: string | null;
  completedAt: string | null;
  clientName: string | null;
  customerName: string | null;
  paymentType: string | null;
  organizerAmount: number;
}
interface OrganizerEarnings {
  totalDeliveries: number;
  totalEarnings: number;
  deliveries: OrganizerEarningDetail[];
}

const GRANULARITIES: Array<{ key: Granularity; label: string }> = [
  { key: "DAY", label: "Dia" },
  { key: "WEEK", label: "Semana" },
  { key: "MONTH", label: "Mês" },
];

const KIND_LABELS: Record<string, string> = {
  ORGANIZER_FOOD: "Comida",
  ORGANIZER_DELIVERY: "Frete",
  ORGANIZER_LEGACY: "Consolidado",
};

const fmtBRL = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

const firstOfMonth = (): string => {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
};

const fmtDay = (iso: string | null): string => {
  if (!iso) return "—";
  const d = iso.slice(0, 10).split("-");
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : iso;
};

const PlatformEarningsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>("platform");

  // ---- Aba Plataforma ----
  const [granularity, setGranularity] = useState<Granularity>("MONTH");
  const [from, setFrom] = useState<string>(firstOfMonth());
  const [to, setTo] = useState<string>(isoDate(new Date()));
  const [data, setData] = useState<PlatformEarnings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Aba Por Gerente ----
  const [organizers, setOrganizers] = useState<OrganizerOption[]>([]);
  const [organizerId, setOrganizerId] = useState<string>("");
  const [orgData, setOrgData] = useState<OrganizerEarnings | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  const loadPlatform = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PlatformEarnings>("/api/reports/platform-earnings", {
        params: { granularity, from, to },
      });
      setData(res.data);
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error || err?.message || "Falha ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }, [granularity, from, to]);

  const loadOrganizers = useCallback(async () => {
    try {
      const res = await api.get<OrganizerOption[]>("/api/reports/organizers");
      setOrganizers(res.data);
      if (res.data.length > 0 && !organizerId) setOrganizerId(res.data[0].id);
    } catch (e) {
      const err = e as { message?: string };
      setOrgError(err?.message || "Falha ao listar gerentes");
    }
  }, [organizerId]);

  const loadOrganizer = useCallback(async () => {
    if (!organizerId) return;
    setOrgLoading(true);
    setOrgError(null);
    try {
      const res = await api.get<OrganizerEarnings>("/api/reports/organizer-earnings", {
        params: { organizerId, from, to },
      });
      setOrgData(res.data);
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setOrgError(err?.response?.data?.error || err?.message || "Falha ao carregar ganhos do gerente");
    } finally {
      setOrgLoading(false);
    }
  }, [organizerId, from, to]);

  useEffect(() => {
    loadPlatform();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "organizer" && organizers.length === 0) loadOrganizers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const dateControls = (
    <div className="pe-dates">
      <label>
        De
        <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
      </label>
      <label>
        Até
        <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
      </label>
    </div>
  );

  return (
    <PageContainer title="Ganhos">
      <div className="pe-container">
        <div className="pe-tabs">
          <button
            className={`pe-tab ${tab === "platform" ? "active" : ""}`}
            onClick={() => setTab("platform")}
          >
            <FiTrendingUp size={16} /> Plataforma
          </button>
          <button
            className={`pe-tab ${tab === "organizer" ? "active" : ""}`}
            onClick={() => setTab("organizer")}
          >
            <FiUser size={16} /> Por Gerente
          </button>
        </div>

        {tab === "platform" && (
          <>
            <div className="pe-controls">
              <div className="pe-seg">
                {GRANULARITIES.map((g) => (
                  <button
                    key={g.key}
                    className={`pe-seg-btn ${granularity === g.key ? "active" : ""}`}
                    onClick={() => setGranularity(g.key)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              {dateControls}
              <button className="pe-action" onClick={loadPlatform} disabled={loading}>
                <FiRefreshCw size={15} className={loading ? "spinning" : ""} /> Gerar
              </button>
            </div>

            {error && <div className="pe-error">{error}</div>}

            {data && (
              <>
                <div className="pe-cards">
                  <div className="pe-card">
                    <span>Faturamento (GMV)</span>
                    <strong>{fmtBRL(data.totals.gmv)}</strong>
                    <small>{data.totals.orderCount} pedidos pagos</small>
                  </div>
                  <div className="pe-card">
                    <span>Repasses a terceiros</span>
                    <strong>{fmtBRL(data.totals.repasses)}</strong>
                    <small>loja + motoboy + gerente</small>
                  </div>
                  <div className="pe-card">
                    <span>Taxa PIX-in ({Number(data.pixInFeePercentage)}%)</span>
                    <strong>{fmtBRL(data.totals.pixInFee)}</strong>
                    <small>Pagar.me (absorvida)</small>
                  </div>
                  <div className="pe-card highlight">
                    <span>Líquido da plataforma</span>
                    <strong>{fmtBRL(data.totals.netEarnings)}</strong>
                    <small>GMV − repasses − taxa</small>
                  </div>
                </div>

                <div className="pe-table-wrap">
                  <table className="pe-table">
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th className="num">Pedidos</th>
                        <th className="num">GMV</th>
                        <th className="num">Repasses</th>
                        <th className="num">Taxa PIX-in</th>
                        <th className="num">Líquido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.buckets.length === 0 && (
                        <tr>
                          <td colSpan={6} className="pe-empty">
                            Nenhum pagamento no período.
                          </td>
                        </tr>
                      )}
                      {data.buckets.map((b) => (
                        <tr key={b.periodStart}>
                          <td>{b.label}</td>
                          <td className="num">{b.orderCount}</td>
                          <td className="num">{fmtBRL(b.gmv)}</td>
                          <td className="num">{fmtBRL(b.repasses)}</td>
                          <td className="num">{fmtBRL(b.pixInFee)}</td>
                          <td className="num strong">{fmtBRL(b.netEarnings)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {data.buckets.length > 0 && (
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td className="num">{data.totals.orderCount}</td>
                          <td className="num">{fmtBRL(data.totals.gmv)}</td>
                          <td className="num">{fmtBRL(data.totals.repasses)}</td>
                          <td className="num">{fmtBRL(data.totals.pixInFee)}</td>
                          <td className="num strong">{fmtBRL(data.totals.netEarnings)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {tab === "organizer" && (
          <>
            <div className="pe-controls">
              <select
                className="pe-select"
                value={organizerId}
                onChange={(e) => setOrganizerId(e.target.value)}
              >
                {organizers.length === 0 && <option value="">Carregando gerentes…</option>}
                {organizers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {dateControls}
              <button className="pe-action" onClick={loadOrganizer} disabled={orgLoading || !organizerId}>
                <FiRefreshCw size={15} className={orgLoading ? "spinning" : ""} /> Gerar
              </button>
            </div>

            {orgError && <div className="pe-error">{orgError}</div>}

            {orgData && (
              <>
                <div className="pe-cards">
                  <div className="pe-card highlight">
                    <span>Total recebido no período</span>
                    <strong>{fmtBRL(orgData.totalEarnings)}</strong>
                    <small>repasses já pagos (PIX)</small>
                  </div>
                  <div className="pe-card">
                    <span>Repasses</span>
                    <strong>{orgData.totalDeliveries}</strong>
                    <small>pedidos/corridas</small>
                  </div>
                </div>

                <div className="pe-table-wrap">
                  <table className="pe-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Referência</th>
                        <th>Cliente</th>
                        <th className="num">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgData.deliveries.length === 0 && (
                        <tr>
                          <td colSpan={5} className="pe-empty">
                            Nenhum repasse no período.
                          </td>
                        </tr>
                      )}
                      {orgData.deliveries.map((d) => (
                        <tr key={d.transferId}>
                          <td>{fmtDay(d.completedAt)}</td>
                          <td>{KIND_LABELS[d.transferKind ?? ""] ?? d.transferKind ?? "—"}</td>
                          <td>
                            {d.foodOrderId
                              ? `Pedido #${d.foodOrderId}`
                              : d.deliveryId
                              ? `Corrida #${d.deliveryId}`
                              : "—"}
                          </td>
                          <td>{d.customerName || d.clientName || "—"}</td>
                          <td className="num strong">{fmtBRL(d.organizerAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default PlatformEarningsPage;

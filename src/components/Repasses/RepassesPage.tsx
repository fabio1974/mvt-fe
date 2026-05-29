import React, { useCallback, useEffect, useState } from "react";
import { FiSend, FiRefreshCw, FiCopy } from "react-icons/fi";
import { api } from "../../services/api";
import PageContainer from "../Generic/PageContainer";
import "./Repasses.css";

type StatusFilter = "PENDING" | "SUCCEEDED";
type WindowFilter = "1d" | "7d" | "30d" | "90d";

const WINDOW_OPTIONS: Array<{ key: WindowFilter; label: string; days: number }> = [
  { key: "1d", label: "Último dia", days: 1 },
  { key: "7d", label: "Última semana", days: 7 },
  { key: "30d", label: "Último mês", days: 30 },
  { key: "90d", label: "Últimos 3 meses", days: 90 },
];

const sinceIsoFor = (w: WindowFilter): string => {
  const opt = WINDOW_OPTIONS.find((o) => o.key === w)!;
  const d = new Date();
  d.setDate(d.getDate() - opt.days);
  return d.toISOString();
};

interface TransferSummary {
  id: number;
  foodOrderId: number | null;
  deliveryId: number | null;
  amountCents: number;
  createdAt: string;
  executedAt: string | null;
  providerTransactionId: string | null;
}

interface RecipientDebt {
  recipientId: string;
  recipientName: string;
  role: "COURIER" | "ORGANIZER" | "CLIENT" | string | null;
  pixKey: string | null;
  pixKeyType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP" | null;
  totalCents: number;
  transfers: TransferSummary[];
}

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const roleLabel = (role: string | null | undefined): string => {
  if (role === "ORGANIZER") return "Gerente";
  if (role === "CLIENT") return "Estabelecimento";
  if (role === "COURIER") return "Motoboy";
  return "Recebedor";
};

const RepassesPage: React.FC = () => {
  const [debts, setDebts] = useState<RecipientDebt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [windowFilter, setWindowFilter] = useState<WindowFilter>("7d");
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<RecipientDebt[]>("/api/pagarme-transfers/by-recipient", {
        params: { status: statusFilter, since: sinceIsoFor(windowFilter) },
      });
      setDebts(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Falha ao carregar repasses");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, windowFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const mark = (recipientId: string) => {
    setWorking((s) => { const n = new Set(s); n.add(recipientId); return n; });
  };
  const unmark = (recipientId: string) => {
    setWorking((s) => { const n = new Set(s); n.delete(recipientId); return n; });
  };

  const selectedTransfers = (d: RecipientDebt) =>
    d.transfers.filter((t) => !excluded.has(t.id));
  const selectedTotal = (d: RecipientDebt) =>
    selectedTransfers(d).reduce((acc, t) => acc + t.amountCents, 0);

  const toggleTransfer = (transferId: number) => {
    setExcluded((s) => {
      const n = new Set(s);
      if (n.has(transferId)) n.delete(transferId);
      else n.add(transferId);
      return n;
    });
  };

  const handleSendPixAll = async (d: RecipientDebt) => {
    const selected = selectedTransfers(d);
    const total = selectedTotal(d);
    if (selected.length === 0) {
      alert("Nenhum transfer marcado pra esta pessoa.");
      return;
    }
    const allSelected = selected.length === d.transfers.length;
    if (!window.confirm(
      `Enviar 1 PIX único de ${fmtBRL(total)} para ${d.recipientName} ` +
      `(${selected.length} de ${d.transfers.length} transfer${d.transfers.length > 1 ? "s" : ""})?`
    )) return;
    mark(d.recipientId);
    try {
      const body = allSelected ? {} : { transferIds: selected.map((t) => t.id) };
      await api.post(`/api/pagarme-transfers/recipient/${d.recipientId}/send-pix-all`, body);
      await fetch();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Falha ao enviar PIX em lote");
    } finally {
      unmark(d.recipientId);
    }
  };

  const copyPixKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const totalAll = debts.reduce((acc, d) => acc + d.totalCents, 0);
  const isPending = statusFilter === "PENDING";

  return (
    <PageContainer
      title="Repasses"
      headerActions={
        <button className="repasses-refresh" onClick={fetch} disabled={loading}>
          <FiRefreshCw className={loading ? "spinning" : ""} />
          Atualizar
        </button>
      }
    >
      <div className="repasses-container">
        <div className="repasses-filter-row">
          <div className="repasses-filter">
            <button
              className={`filter-btn ${isPending ? "active" : ""}`}
              onClick={() => setStatusFilter("PENDING")}
            >
              Pendentes
            </button>
            <button
              className={`filter-btn ${!isPending ? "active" : ""}`}
              onClick={() => setStatusFilter("SUCCEEDED")}
            >
              Pagos
            </button>
          </div>
          <div className="repasses-filter">
            {WINDOW_OPTIONS.map((o) => (
              <button
                key={o.key}
                className={`filter-btn ${windowFilter === o.key ? "active" : ""}`}
                onClick={() => setWindowFilter(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="summary-bar">
          <div>
            <span>Total {isPending ? "a pagar" : "pago"}</span>
            <strong>{fmtBRL(totalAll)}</strong>
          </div>
          <div>
            <span>Colaboradores</span>
            <strong>{debts.length}</strong>
          </div>
          <div>
            <span>Transfers</span>
            <strong>{debts.reduce((a, d) => a + d.transfers.length, 0)}</strong>
          </div>
        </div>

        {error && <div className="repasses-error">{error}</div>}

        {debts.length === 0 && !loading ? (
          <div className="repasses-empty">
            {isPending ? "Nenhum repasse pendente. 👏" : "Nenhum repasse pago ainda."}
          </div>
        ) : (
          debts.map((d) => {
            const busy = working.has(d.recipientId);
            const selTotal = selectedTotal(d);
            const selCount = selectedTransfers(d).length;
            return (
              <div key={d.recipientId} className="repasses-card">
                <div className="repasses-card-header">
                  <div>
                    <h3>{d.recipientName || d.recipientId}</h3>
                    {d.pixKey ? (
                      <div className="pix-key">
                        <span className="pix-key-type">{d.pixKeyType}</span>
                        <span className="pix-key-value">{d.pixKey}</span>
                        <button onClick={() => copyPixKey(d.pixKey!)} title="Copiar chave PIX">
                          <FiCopy />
                        </button>
                      </div>
                    ) : (
                      <div className="pix-key-missing">⚠️ {roleLabel(d.role)} não cadastrou chave PIX</div>
                    )}
                  </div>
                  <div className="repasses-header-right">
                    <div className="repasses-total">
                      <span>Total {isPending ? "a pagar" : "pago"}</span>
                      <strong>{fmtBRL(d.totalCents)}</strong>
                    </div>
                    {isPending && (
                      <div className="repasses-header-actions">
                        <button
                          className="btn-send"
                          onClick={() => handleSendPixAll(d)}
                          disabled={busy || !d.pixKey || selCount === 0}
                          title={
                            !d.pixKey ? `${roleLabel(d.role)} sem chave PIX`
                            : selCount === 0 ? "Nenhum transfer marcado"
                            : "Disparar 1 PIX único com o total marcado"
                          }
                        >
                          <FiSend /> Enviar PIX ({fmtBRL(selTotal)})
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <table className="transfers-table">
                  <thead>
                    <tr>
                      {isPending && <th className="checkbox-col"></th>}
                      <th>Transfer</th>
                      <th>Pedido</th>
                      <th>Delivery</th>
                      <th>Valor</th>
                      <th>{isPending ? "Criado em" : "Pago em"}</th>
                      {!isPending && <th>Comprovante (Inter)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {[...d.transfers]
                      .sort((a, b) => {
                        const aDate = (isPending ? a.createdAt : a.executedAt) || a.createdAt;
                        const bDate = (isPending ? b.createdAt : b.executedAt) || b.createdAt;
                        return new Date(bDate).getTime() - new Date(aDate).getTime();
                      })
                      .map((t) => {
                      const isIncluded = !excluded.has(t.id);
                      return (
                        <tr key={t.id} className={isPending && !isIncluded ? "row-excluded" : ""}>
                          {isPending && (
                            <td className="checkbox-col">
                              <input
                                type="checkbox"
                                checked={isIncluded}
                                onChange={() => toggleTransfer(t.id)}
                                disabled={busy}
                                title={isIncluded ? "Marcado pra incluir no PIX" : "Desmarcado — não entra no PIX desta rodada"}
                              />
                            </td>
                          )}
                          <td>#{t.id}</td>
                          <td>{t.foodOrderId ? `#${t.foodOrderId}` : "—"}</td>
                          <td>{t.deliveryId ? `#${t.deliveryId}` : "—"}</td>
                          <td className="amount">{fmtBRL(t.amountCents)}</td>
                          <td>{new Date((isPending ? t.createdAt : t.executedAt) || t.createdAt).toLocaleString("pt-BR")}</td>
                          {!isPending && (
                            <td className="provider-tx">
                              {t.providerTransactionId ? (
                                <span className="provider-tx-cell" title={t.providerTransactionId}>
                                  <code>{t.providerTransactionId.slice(0, 8)}…</code>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(t.providerTransactionId!)}
                                    title="Copiar codigoSolicitacao Inter"
                                  >
                                    <FiCopy />
                                  </button>
                                </span>
                              ) : (
                                <span className="provider-tx-empty">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </PageContainer>
  );
};

export default RepassesPage;

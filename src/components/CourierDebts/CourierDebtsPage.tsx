import React, { useCallback, useEffect, useState } from "react";
import { FiSend, FiCheckCircle, FiXCircle, FiRefreshCw, FiCopy } from "react-icons/fi";
import { api } from "../../services/api";
import PageContainer from "../Generic/PageContainer";
import "./CourierDebts.css";

interface TransferSummary {
  id: number;
  foodOrderId: number | null;
  deliveryId: number | null;
  amountCents: number;
  createdAt: string;
}

interface CourierDebt {
  courierId: string;
  courierName: string;
  pixKey: string | null;
  pixKeyType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP" | null;
  totalCents: number;
  transfers: TransferSummary[];
}

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CourierDebtsPage: React.FC = () => {
  const [debts, setDebts] = useState<CourierDebt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<Set<number>>(new Set());

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<CourierDebt[]>("/api/pagarme-transfers/by-courier");
      setDebts(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Falha ao carregar dívidas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const mark = (id: number) => {
    setWorking((s) => { const n = new Set(s); n.add(id); return n; });
  };
  const unmark = (id: number) => {
    setWorking((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const handleSendPix = async (t: TransferSummary, courierName: string) => {
    if (!window.confirm(`Disparar PIX de ${fmtBRL(t.amountCents)} para ${courierName}?`)) return;
    mark(t.id);
    try {
      await api.post(`/api/pagarme-transfers/${t.id}/send-pix`);
      await fetch();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Falha ao enviar PIX");
    } finally {
      unmark(t.id);
    }
  };

  const handleMarkPaid = async (t: TransferSummary) => {
    const note = window.prompt(`Marcar ${fmtBRL(t.amountCents)} como pago. Observação (opcional):`);
    if (note === null) return;
    mark(t.id);
    try {
      await api.post(`/api/pagarme-transfers/${t.id}/mark-paid`, { note });
      await fetch();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Falha ao marcar pago");
    } finally {
      unmark(t.id);
    }
  };

  const handleMarkFailed = async (t: TransferSummary) => {
    const note = window.prompt(`Cancelar este transfer (${fmtBRL(t.amountCents)}). Motivo:`);
    if (note === null) return;
    mark(t.id);
    try {
      await api.post(`/api/pagarme-transfers/${t.id}/mark-failed`, { note });
      await fetch();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Falha ao cancelar");
    } finally {
      unmark(t.id);
    }
  };

  const copyPixKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const totalAll = debts.reduce((acc, d) => acc + d.totalCents, 0);

  return (
    <PageContainer
      title="Dívidas com Couriers"
      headerActions={
        <button className="courier-debts-refresh" onClick={fetch} disabled={loading}>
          <FiRefreshCw className={loading ? "spinning" : ""} />
          Atualizar
        </button>
      }
    >
      <div className="courier-debts-container">
        <div className="summary-bar">
          <div>
            <span>Total PENDING</span>
            <strong>{fmtBRL(totalAll)}</strong>
          </div>
          <div>
            <span>Couriers</span>
            <strong>{debts.length}</strong>
          </div>
          <div>
            <span>Transfers</span>
            <strong>{debts.reduce((a, d) => a + d.transfers.length, 0)}</strong>
          </div>
        </div>

        {error && <div className="courier-debts-error">{error}</div>}

        {debts.length === 0 && !loading ? (
          <div className="courier-debts-empty">Nenhuma dívida pendente. 👏</div>
        ) : (
          debts.map((d) => (
            <div key={d.courierId} className="courier-card">
              <div className="courier-card-header">
                <div>
                  <h3>{d.courierName || d.courierId}</h3>
                  {d.pixKey ? (
                    <div className="pix-key">
                      <span className="pix-key-type">{d.pixKeyType}</span>
                      <span className="pix-key-value">{d.pixKey}</span>
                      <button onClick={() => copyPixKey(d.pixKey!)} title="Copiar chave PIX">
                        <FiCopy />
                      </button>
                    </div>
                  ) : (
                    <div className="pix-key-missing">⚠️ Courier não cadastrou chave PIX</div>
                  )}
                </div>
                <div className="courier-total">
                  <span>Total a pagar</span>
                  <strong>{fmtBRL(d.totalCents)}</strong>
                </div>
              </div>

              <table className="transfers-table">
                <thead>
                  <tr>
                    <th>Transfer</th>
                    <th>Pedido</th>
                    <th>Delivery</th>
                    <th>Valor</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {d.transfers.map((t) => {
                    const busy = working.has(t.id);
                    return (
                      <tr key={t.id}>
                        <td>#{t.id}</td>
                        <td>{t.foodOrderId ? `#${t.foodOrderId}` : "—"}</td>
                        <td>{t.deliveryId ? `#${t.deliveryId}` : "—"}</td>
                        <td className="amount">{fmtBRL(t.amountCents)}</td>
                        <td>{new Date(t.createdAt).toLocaleString("pt-BR")}</td>
                        <td className="actions">
                          <button
                            className="btn-send"
                            onClick={() => handleSendPix(t, d.courierName)}
                            disabled={busy || !d.pixKey}
                            title={!d.pixKey ? "Courier sem chave PIX" : "Disparar PIX via provider"}
                          >
                            <FiSend /> Enviar PIX
                          </button>
                          <button
                            className="btn-mark-paid"
                            onClick={() => handleMarkPaid(t)}
                            disabled={busy}
                            title="Já enviei PIX por fora, só registrar"
                          >
                            <FiCheckCircle /> Marcar Pago
                          </button>
                          <button
                            className="btn-fail"
                            onClick={() => handleMarkFailed(t)}
                            disabled={busy}
                            title="Cancelar / marcar como falha"
                          >
                            <FiXCircle /> Cancelar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
};

export default CourierDebtsPage;

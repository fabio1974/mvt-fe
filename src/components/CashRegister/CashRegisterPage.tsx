import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlusCircle, FiMinusCircle, FiTrendingDown, FiLock, FiUnlock, FiRefreshCw } from "react-icons/fi";
import { api } from "../../services/api";
import PageContainer from "../Generic/PageContainer";
import "./CashRegister.css";

type MovementType = "ADDITION" | "WITHDRAWAL" | "SANGRIA";

interface CashMovement {
  id: number;
  sessionId: number;
  type: MovementType;
  amount: number;
  reason: string | null;
  createdAt: string;
  createdByName: string | null;
}

interface CashSession {
  id: number;
  status: "OPEN" | "CLOSED";
  openingBalance: number;
  closingBalanceActual: number | null;
  closingBalanceExpected: number | null;
  expectedBalance?: number;
  openedAt: string;
  closedAt: string | null;
  openedByName: string | null;
  closedByName: string | null;
  notes: string | null;
  movements: CashMovement[];
}

type CurrentResponse = CashSession | { status: "NONE" };

const fmtBRL = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parseAmount = (raw: string): number => {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

type DialogKind = "open" | "close" | MovementType | null;

const CashRegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<CashSession | null>(null);
  const [expectedBalance, setExpectedBalance] = useState(0);

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<CurrentResponse>("/api/cash-register/current");
      const data = res.data;
      if ("id" in data) {
        setSession(data);
        setExpectedBalance(data.expectedBalance ?? 0);
      } else {
        setSession(null);
        setExpectedBalance(0);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Falha ao carregar caixa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totals = useMemo(() => {
    if (!session) return { additions: 0, withdrawals: 0 };
    let a = 0, w = 0;
    for (const m of session.movements || []) {
      if (m.type === "ADDITION") a += Number(m.amount);
      else w += Number(m.amount);
    }
    return { additions: a, withdrawals: w };
  }, [session]);

  const closeDialog = () => {
    setDialog(null);
    setAmount("");
    setReason("");
  };

  const submit = async () => {
    const v = parseAmount(amount);
    if (dialog === "open" && v < 0) { alert("Valor inválido"); return; }
    if (dialog === "close" && v < 0) { alert("Valor inválido"); return; }
    if ((dialog === "ADDITION" || dialog === "WITHDRAWAL" || dialog === "SANGRIA") && v <= 0) {
      alert("Valor deve ser maior que zero"); return;
    }
    setSubmitting(true);
    try {
      if (dialog === "open") {
        await api.post("/api/cash-register/open", { openingBalance: v });
      } else if (dialog === "close") {
        await api.post("/api/cash-register/close", { closingBalanceActual: v });
      } else if (dialog) {
        await api.post("/api/cash-register/movements", {
          type: dialog, amount: v, reason: reason || undefined,
        });
      }
      closeDialog();
      await fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Falha");
    } finally {
      setSubmitting(false);
    }
  };

  const dialogTitle = (() => {
    switch (dialog) {
      case "open": return "Abrir Caixa";
      case "close": return "Fechar Caixa";
      case "ADDITION": return "Suprimento (entrada de dinheiro)";
      case "WITHDRAWAL": return "Retirada";
      case "SANGRIA": return "Sangria";
      default: return "";
    }
  })();

  return (
    <PageContainer
      title="Caixa"
      headerActions={
        <button className="cash-refresh" onClick={fetchData} disabled={loading}>
          <FiRefreshCw className={loading ? "spinning" : ""} />
          Atualizar
        </button>
      }
    >
      <div className="cash-page">
        {error && <div className="cash-error">{error}</div>}

        {!session ? (
          <div className="cash-empty">
            <h3>Nenhum caixa aberto</h3>
            <p>Abra um caixa para começar o turno e registrar movimentações.</p>
            <button className="cash-btn cash-btn-primary" onClick={() => setDialog("open")}>
              <FiUnlock /> Abrir Caixa
            </button>
          </div>
        ) : (
          <>
            <div className="cash-card">
              <div className="cash-card-header">
                <div>
                  <h3>Caixa em aberto</h3>
                  <small>Aberto em {new Date(session.openedAt).toLocaleString("pt-BR")}</small>
                  {session.openedByName && <small> por {session.openedByName}</small>}
                </div>
                <span className="cash-badge open">OPEN</span>
              </div>

              <div className="cash-stats">
                <Stat label="Fundo Inicial" value={fmtBRL(session.openingBalance)} />
                <Stat label="+ Adições" value={fmtBRL(totals.additions)} color="#15803d" />
                <Stat label="− Retiradas" value={fmtBRL(totals.withdrawals)} color="#b91c1c" />
              </div>

              <div className="cash-expected">
                <span>Saldo esperado (sistema)</span>
                <strong>{fmtBRL(expectedBalance)}</strong>
              </div>
            </div>

            <div className="cash-actions">
              <button className="cash-btn cash-btn-add" onClick={() => setDialog("ADDITION")}>
                <FiPlusCircle /> Suprimento
              </button>
              <button className="cash-btn cash-btn-out" onClick={() => setDialog("WITHDRAWAL")}>
                <FiMinusCircle /> Retirada
              </button>
              <button className="cash-btn cash-btn-sangria" onClick={() => setDialog("SANGRIA")}>
                <FiTrendingDown /> Sangria
              </button>
              <button className="cash-btn cash-btn-close" onClick={() => setDialog("close")}>
                <FiLock /> Fechar Caixa
              </button>
            </div>

            {session.movements && session.movements.length > 0 && (
              <div className="cash-card">
                <h3>Movimentações</h3>
                <table className="cash-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Motivo</th>
                      <th>Quem</th>
                      <th>Quando</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.movements.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <span className={`mov-tag mov-${m.type.toLowerCase()}`}>
                            {m.type === "ADDITION" ? "Suprimento" : m.type === "WITHDRAWAL" ? "Retirada" : "Sangria"}
                          </span>
                        </td>
                        <td className={m.type === "ADDITION" ? "value-positive" : "value-negative"}>
                          {m.type === "ADDITION" ? "+" : "−"} {fmtBRL(Number(m.amount))}
                        </td>
                        <td>{m.reason || "—"}</td>
                        <td>{m.createdByName || "—"}</td>
                        <td>{new Date(m.createdAt).toLocaleString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {dialog && (
          <div className="cash-modal-overlay" onClick={closeDialog}>
            <div className="cash-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{dialogTitle}</h3>
              {dialog === "close" && (
                <p className="cash-modal-hint">
                  Saldo esperado: <strong>{fmtBRL(expectedBalance)}</strong>. Informe o valor contado na gaveta.
                </p>
              )}
              <input
                type="text"
                inputMode="decimal"
                placeholder="Valor (ex: 50,00)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
              {(dialog === "ADDITION" || dialog === "WITHDRAWAL" || dialog === "SANGRIA") && (
                <input
                  type="text"
                  placeholder="Motivo (opcional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
              <div className="cash-modal-actions">
                <button className="cash-btn cash-btn-secondary" onClick={closeDialog} disabled={submitting}>
                  Cancelar
                </button>
                <button className="cash-btn cash-btn-primary" onClick={submit} disabled={submitting}>
                  {submitting ? "Enviando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="cash-stat">
    <span>{label}</span>
    <strong style={color ? { color } : undefined}>{value}</strong>
  </div>
);

export default CashRegisterPage;

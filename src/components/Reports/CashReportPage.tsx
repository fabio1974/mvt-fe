import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiRefreshCw, FiDownload } from "react-icons/fi";
import { api } from "../../services/api";
import PageContainer from "../Generic/PageContainer";
import "./CashReport.css";

type Channel = "BALCAO" | "MESAS" | "DELIVERY";

interface ChannelSummary {
  channel: Channel;
  orderCount: number;
  itemsTotal: number;
  deliveryFeeTotal: number;
  total: number;
}

interface ItemRow {
  productId: number;
  productName: string;
  quantity: number;
  total: number;
}

interface CashSummary {
  openingBalance: number;
  additions: number;
  withdrawals: number;
  cashSales: number;
  expectedBalance: number;
  actualBalance: number | null;
  status: "OPEN" | "CLOSED" | "NONE";
}

interface CashReport {
  storeName: string;
  storeDocument: string | null;
  storeAddress: string | null;
  date: string;
  channels: ChannelSummary[];
  paymentMethods: Record<string, number>;
  items: ItemRow[];
  grandTotal: number;
  cash: CashSummary | null;
}

const PM_LABELS: Record<string, string> = {
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  PIX: "PIX",
  BANK_SLIP: "Boleto",
  CASH: "Dinheiro",
  WALLET: "Carteira Digital",
  NOT_INFORMED: "Não Informado",
};

const fmtBRL = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const nowHHmm = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const CashReportPage: React.FC = () => {
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState(nowHHmm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CashReport | null>(null);

  const fetchReport = useCallback(async (overrideEnd?: string) => {
    const effectiveEnd = overrideEnd ?? endTime;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<CashReport>("/api/reports/cash", {
        params: { startTime, endTime: effectiveEnd },
      });
      setReport(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Falha ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }, [startTime, endTime]);

  /** Atualizar: força end=agora, atualiza o input e refetch. */
  const handleRefresh = useCallback(() => {
    const now = nowHHmm();
    setEndTime(now);
    fetchReport(now);
  }, [fetchReport]);

  const handleExportExcel = useCallback(async () => {
    if (!report) return;
    const xlsx = await import("xlsx");
    const wb = xlsx.utils.book_new();

    // Resumo
    const resumo: any[][] = [
      ["Estabelecimento", report.storeName],
      ["Documento", report.storeDocument || ""],
      ["Endereço", report.storeAddress || ""],
      ["Data", new Date(report.date).toLocaleDateString("pt-BR")],
      ["Período", `${startTime} → ${endTime}`],
      ["Total Geral", report.grandTotal],
    ];
    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(resumo), "Resumo");

    // Caixa
    if (report.cash && report.cash.status !== "NONE") {
      const c = report.cash;
      const caixa: any[][] = [
        ["Status", c.status],
        ["Fundo Inicial", c.openingBalance],
        ["Adições", c.additions],
        ["Retiradas/Sangrias", c.withdrawals],
        ["Vendas em Dinheiro", c.cashSales],
        ["Saldo Esperado", c.expectedBalance],
      ];
      if (c.actualBalance !== null) {
        caixa.push(["Saldo Contado", c.actualBalance]);
        caixa.push(["Diferença", c.actualBalance - c.expectedBalance]);
      }
      xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(caixa), "Caixa");
    }

    // Vendas por canal
    const total = report.channels.reduce((acc, c) => acc + c.orderCount, 0);
    const vendas: any[][] = [
      ["Canal", "Atendimentos", "Itens", "Entregas", "Total"],
      ...report.channels.map((c) => [
        c.channel,
        c.orderCount,
        Number(c.itemsTotal),
        Number(c.deliveryFeeTotal),
        Number(c.total),
      ]),
      ["TOTAL GERAL", total, "", "", Number(report.grandTotal)],
    ];
    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(vendas), "Vendas");

    // Pagamentos
    const pgto: any[][] = [
      ["Forma de Pagamento", "Valor"],
      ...Object.entries(report.paymentMethods).map(([k, v]) => [PM_LABELS[k] || k, Number(v)]),
      ["SOMA TOTAL", Number(report.grandTotal)],
    ];
    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(pgto), "Pagamentos");

    // Itens
    const itensSheet: any[][] = [
      ["Descrição", "Quantidade", "Total"],
      ...report.items.map((it) => [it.productName, it.quantity, Number(it.total)]),
    ];
    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(itensSheet), "Itens");

    const dateStr = new Date(report.date).toLocaleDateString("pt-BR").replace(/\//g, "-");
    const filename = `relatorio-caixa-${report.storeName.replace(/\s+/g, "_")}-${dateStr}_${startTime.replace(":", "")}-${endTime.replace(":", "")}.xlsx`;
    xlsx.writeFile(wb, filename);
  }, [report, startTime, endTime]);

  useEffect(() => {
    fetchReport(endTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const channelByType = useMemo(() => {
    const m: Record<Channel, ChannelSummary | undefined> = {
      BALCAO: undefined,
      MESAS: undefined,
      DELIVERY: undefined,
    };
    report?.channels.forEach((c) => (m[c.channel] = c));
    return m;
  }, [report]);

  const totalOrders = useMemo(() => {
    if (!report) return 0;
    return report.channels.reduce((acc, c) => acc + c.orderCount, 0);
  }, [report]);

  return (
    <PageContainer
      title="Relatórios"
      subPage="Relatório de Caixa"
      headerActions={
        <>
          <button
            className="cash-report-export"
            onClick={handleExportExcel}
            disabled={!report || loading}
            title="Exportar relatório para Excel"
          >
            <FiDownload />
            Exportar Excel
          </button>
          <button className="cash-report-refresh" onClick={handleRefresh} disabled={loading}>
            <FiRefreshCw className={loading ? "spinning" : ""} />
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </>
      }
    >
      <div className="cash-report-container">
        <div className="cash-report-filter">
          <div className="filter-row">
            <label>
              <span>De</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label>
              <span>Até</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
            <button className="cash-report-apply" onClick={() => fetchReport()} disabled={loading}>
              Aplicar
            </button>
          </div>
          {report && (
            <div className="filter-summary">
              {report.storeName} — {new Date(report.date).toLocaleDateString("pt-BR")} • {startTime} → {endTime}
            </div>
          )}
        </div>

        {error && <div className="cash-report-error">{error}</div>}

        {report && (
          <>
            {/* Caixa */}
            <section className="cash-report-section">
              <h2>Fundo de Caixa</h2>
              {!report.cash || report.cash.status === "NONE" ? (
                <div className="cash-report-empty">Nenhuma sessão de caixa aberta no período.</div>
              ) : (
                <>
                  <table className="cash-report-table">
                    <thead>
                      <tr>
                        <th>Fundo Inicial</th>
                        <th>+ Adições</th>
                        <th>− Retiradas / Sangrias</th>
                        <th>+ Vendas em Dinheiro</th>
                        <th>Saldo Esperado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{fmtBRL(report.cash.openingBalance)}</td>
                        <td className="value-positive">{fmtBRL(report.cash.additions)}</td>
                        <td className="value-negative">{fmtBRL(report.cash.withdrawals)}</td>
                        <td>{fmtBRL(report.cash.cashSales)}</td>
                        <td className="value-strong">{fmtBRL(report.cash.expectedBalance)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {report.cash.actualBalance !== null && (
                    <div className="cash-report-conference">
                      <div>
                        <strong>Esperado:</strong> {fmtBRL(report.cash.expectedBalance)}
                      </div>
                      <div>
                        <strong>Contado:</strong> {fmtBRL(report.cash.actualBalance)}
                      </div>
                      <div className={
                        report.cash.actualBalance - report.cash.expectedBalance === 0
                          ? "diff-ok"
                          : "diff-bad"
                      }>
                        <strong>Diferença:</strong>{" "}
                        {fmtBRL(report.cash.actualBalance - report.cash.expectedBalance)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Vendas */}
            <section className="cash-report-section">
              <h2>Vendas</h2>
              <table className="cash-report-table">
                <thead>
                  <tr>
                    <th>Informação</th>
                    <th>Mesas</th>
                    <th>Balcão</th>
                    <th>Delivery</th>
                    <th>Geral</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Atendimentos</td>
                    <td>{channelByType.MESAS?.orderCount ?? 0}</td>
                    <td>{channelByType.BALCAO?.orderCount ?? 0}</td>
                    <td>{channelByType.DELIVERY?.orderCount ?? 0}</td>
                    <td><strong>{totalOrders}</strong></td>
                  </tr>
                  <tr>
                    <td>Itens</td>
                    <td>{fmtBRL(channelByType.MESAS?.itemsTotal)}</td>
                    <td>{fmtBRL(channelByType.BALCAO?.itemsTotal)}</td>
                    <td>{fmtBRL(channelByType.DELIVERY?.itemsTotal)}</td>
                    <td><strong>{fmtBRL(
                      (channelByType.MESAS?.itemsTotal ?? 0) +
                      (channelByType.BALCAO?.itemsTotal ?? 0) +
                      (channelByType.DELIVERY?.itemsTotal ?? 0)
                    )}</strong></td>
                  </tr>
                  <tr>
                    <td>+Entregas</td>
                    <td>{fmtBRL(0)}</td>
                    <td>{fmtBRL(0)}</td>
                    <td>{fmtBRL(channelByType.DELIVERY?.deliveryFeeTotal)}</td>
                    <td><strong>{fmtBRL(channelByType.DELIVERY?.deliveryFeeTotal)}</strong></td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan={4} style={{ textAlign: "right" }}><strong>TOTAL:</strong></td>
                    <td><strong>{fmtBRL(report.grandTotal)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Forma de pagamento */}
            <section className="cash-report-section">
              <h2>Conferência por Forma de Pagamento</h2>
              <table className="cash-report-table">
                <thead>
                  <tr>
                    <th>Forma de Pagamento</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(report.paymentMethods).length === 0 ? (
                    <tr><td colSpan={2} style={{ textAlign: "center", color: "#999" }}>Sem dados</td></tr>
                  ) : (
                    Object.entries(report.paymentMethods).map(([pm, v]) => (
                      <tr key={pm}>
                        <td>{PM_LABELS[pm] || pm}</td>
                        <td>{fmtBRL(v)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="total-row">
                    <td><strong>SOMA TOTAL</strong></td>
                    <td><strong>{fmtBRL(report.grandTotal)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Itens */}
            <section className="cash-report-section">
              <h2>Saída de Itens</h2>
              <table className="cash-report-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Qnt</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: "center", color: "#999" }}>Sem itens</td></tr>
                  ) : (
                    report.items.map((it) => (
                      <tr key={it.productId}>
                        <td>{it.productName}</td>
                        <td>{it.quantity}</td>
                        <td>{fmtBRL(it.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default CashReportPage;

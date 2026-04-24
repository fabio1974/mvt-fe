import React, { useState, useEffect } from "react";
import { FiBookmark, FiXCircle, FiUnlock, FiLock, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { api } from "../../services/api";
import PageContainer from "../Generic/PageContainer";
import TableOrderModal from "./TableOrderModal";
import "./TableOrders.css";

interface RestaurantTable {
  id: number;
  number: number;
  seats: number | null;
  active: boolean;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'UNAVAILABLE';
  clientId: string;
}

interface CreateBatchRequest {
  clientId?: string;
  from: number;
  to: number;
  seats: number | null;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: "Aguardando",
  ACCEPTED: "Aceito",
  PREPARING: "Preparando",
  READY: "Pronto",
  DELIVERING: "Servindo",
  AWAITING_PAYMENT: "Aguardando Pgto",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  PLACED: "#94a3b8",
  ACCEPTED: "#3b82f6",
  PREPARING: "#f59e0b",
  READY: "#22c55e",
  DELIVERING: "#8b5cf6",
  AWAITING_PAYMENT: "#f97316",
};

const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Livre",
  RESERVED: "Reservada",
  OCCUPIED: "Ocupada",
  UNAVAILABLE: "Indisponível",
};

const TABLE_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#22c55e",
  RESERVED: "#f59e0b",
  OCCUPIED: "#8b5cf6",
  UNAVAILABLE: "#ef4444",
};

const TablesCRUDPage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orderStatusMap, setOrderStatusMap] = useState<Record<number, { status: string; orderId: number }>>({});
  const [loading, setLoading] = useState(true);
  const [initialCount, setInitialCount] = useState(10);
  const [adjusting, setAdjusting] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    if (isFullscreen) document.body.classList.add("fullscreen-mesas");
    else document.body.classList.remove("fullscreen-mesas");
    return () => document.body.classList.remove("fullscreen-mesas");
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  };

  const handleChangeStatus = async (tableId: number, status: string) => {
    try {
      await api.patch(`/api/tables/${tableId}/status`, { status });
      fetchTables();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao trocar status");
    }
  };

  const fetchTables = async () => {
    try {
      const [tablesRes, statusRes] = await Promise.all([
        api.get<RestaurantTable[]>("/api/tables", { params: { activeOnly: false } }),
        api.get<Record<number, { status: string; orderId: number }>>("/api/tables/order-status"),
      ]);
      setTables(tablesRes.data);
      setOrderStatusMap(statusRes.data);
    } catch (e) {
      console.error("Erro ao carregar mesas:", e);
    } finally {
      setLoading(false);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const openTableParam = searchParams.get("openTable");

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Ao carregar a lista, se houver ?openTable=N na URL, abre o popup daquela mesa e limpa o param
  useEffect(() => {
    if (!openTableParam || tables.length === 0) return;
    const num = Number(openTableParam);
    const target = tables.find((t) => t.number === num);
    if (target) {
      setSelectedTable(target);
      searchParams.delete("openTable");
      setSearchParams(searchParams, { replace: true });
    }
  }, [openTableParam, tables]);

  const GRID_COLS = 5;

  const handleCreateInitial = async () => {
    if (initialCount < 1) return;
    setAdjusting(true);
    try {
      await api.post("/api/tables/batch", {
        from: 1,
        to: initialCount,
        seats: 4,
      } as CreateBatchRequest);
      fetchTables();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao criar mesas");
    } finally {
      setAdjusting(false);
    }
  };

  const handleAddTables = async (count: number) => {
    const maxNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0;
    setAdjusting(true);
    try {
      await api.post("/api/tables/batch", {
        from: maxNumber + 1,
        to: maxNumber + count,
        seats: 4,
      } as CreateBatchRequest);
      fetchTables();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao criar mesas");
    } finally {
      setAdjusting(false);
    }
  };

  const handleRemoveTables = async (count: number) => {
    const sorted = [...tables].sort((a, b) => b.number - a.number);
    const toRemove = sorted.slice(0, count);
    const occupied = toRemove.filter(t => orderStatusMap[t.id]);
    if (occupied.length > 0) {
      alert(`Não é possível remover: mesa(s) #${occupied.map(t => t.number).join(", #")} tem pedido ativo.`);
      return;
    }
    if (!window.confirm(`Remover ${toRemove.length} mesa(s) (#${toRemove.map(t => t.number).join(", #")})?`)) return;
    setAdjusting(true);
    try {
      const results = await Promise.allSettled(toRemove.map(t => api.delete(`/api/tables/${t.id}`)));
      const failed = results.filter(r => r.status === "rejected");
      if (failed.length > 0) {
        const msg = failed.length === toRemove.length
          ? "Nenhuma mesa pôde ser removida — todas possuem pedidos vinculados."
          : `${toRemove.length - failed.length} mesa(s) removida(s), mas ${failed.length} não pôde(m) ser removida(s) por ter(em) pedidos vinculados.`;
        alert(msg);
      }
      fetchTables();
    } catch (e: any) {
      alert("Erro ao remover mesas");
    } finally {
      setAdjusting(false);
    }
  };



  if (loading) return <div className="to-loading">Carregando...</div>;

  return (
    <>
    <button
      className="to-fullscreen-btn"
      onClick={toggleFullscreen}
      title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
    >
      {isFullscreen ? <FiMinimize2 size={30} strokeWidth={3} /> : <FiMaximize2 size={30} strokeWidth={3} />}
    </button>
    <PageContainer
      title="Mesas"
      headerActions={
        tables.length > 0 ? (
          <div className="to-adj-group">
            {[-10, -5, -1].map(n => (
              <button
                key={n}
                className="to-adj-btn to-adj-minus"
                disabled={adjusting || tables.length < Math.abs(n)}
                onClick={() => handleRemoveTables(Math.abs(n))}
              >
                {n}
              </button>
            ))}
            <div className="to-adj-count">
              <strong>{tables.length}</strong>
              <span>mesas</span>
            </div>
            {[1, 5, 10].map(n => (
              <button
                key={n}
                className="to-adj-btn to-adj-plus"
                disabled={adjusting}
                onClick={() => handleAddTables(n)}
              >
                +{n}
              </button>
            ))}
          </div>
        ) : undefined
      }
    >
      {tables.length === 0 && !loading && (
        <div className="to-initial-setup">
          <h3>Configuração inicial</h3>
          <p>Quantas mesas o estabelecimento possui?</p>
          <div className="to-initial-row">
            <label>
              Mesas:
              <input
                type="number"
                min={1}
                value={initialCount}
                onChange={(e) => setInitialCount(+e.target.value || 1)}
              />
            </label>
            <button className="to-btn to-btn-primary" onClick={handleCreateInitial} disabled={adjusting}>
              {adjusting ? "Criando..." : "Criar Mesas"}
            </button>
          </div>
        </div>
      )}

      {tables.length > 0 && (
      <div className="to-grid-wrapper">
          <div className="to-grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
            {tables.map((table) => (
              <div
                key={table.id}
                className={`to-table-card ${table.active ? "" : "inactive"}`}
              >
                <div className="to-table-number-badge">{table.number}</div>
                <div className="to-table-info" onClick={() => setSelectedTable(table)} style={{ cursor: "pointer" }}>
                  <div
                    className="to-table-status"
                    style={{ background: TABLE_STATUS_COLORS[table.status] || "#94a3b8" }}
                  >
                    {TABLE_STATUS_LABELS[table.status] || table.status}
                  </div>
                  {orderStatusMap[table.id] && (
                    <div
                      className="to-table-status"
                      style={{ background: ORDER_STATUS_COLORS[orderStatusMap[table.id].status] || "#94a3b8", marginTop: 4 }}
                    >
                      {ORDER_STATUS_LABELS[orderStatusMap[table.id].status] || orderStatusMap[table.id].status} #{orderStatusMap[table.id].orderId}
                    </div>
                  )}
                </div>
                <div className="to-table-actions">
                  {(table.status === "AVAILABLE") && (
                    <>
                      <button className="to-action-icon to-action-reserve" title="Reservar" onClick={() => handleChangeStatus(table.id, "RESERVED")}><FiBookmark size={14} /></button>
                      <button className="to-action-icon to-action-unavail" title="Indisponível" onClick={() => handleChangeStatus(table.id, "UNAVAILABLE")}><FiXCircle size={14} /></button>
                    </>
                  )}
                  {(table.status === "RESERVED") && (
                    <>
                      <button className="to-action-icon to-action-free" title="Liberar" onClick={() => handleChangeStatus(table.id, "AVAILABLE")}><FiUnlock size={14} /></button>
                      <button className="to-action-icon to-action-unavail" title="Indisponível" onClick={() => handleChangeStatus(table.id, "UNAVAILABLE")}><FiXCircle size={14} /></button>
                    </>
                  )}
                  {(table.status === "UNAVAILABLE") && (
                    <button className="to-action-icon to-action-free" title="Liberar" onClick={() => handleChangeStatus(table.id, "AVAILABLE")}><FiUnlock size={14} /></button>
                  )}
                  {(table.status === "OCCUPIED") && (
                    <span className="to-action-occupied"><FiLock size={12} /></span>
                  )}
                </div>
              </div>
            ))}
          </div>
      </div>
      )}

      {selectedTable && (
        <TableOrderModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onUpdated={fetchTables}
        />
      )}
    </PageContainer>
    </>
  );
};

export default TablesCRUDPage;

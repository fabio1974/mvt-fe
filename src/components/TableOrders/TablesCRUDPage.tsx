import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiPower, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import { api } from "../../services/api";
import PageContainer from "../Generic/PageContainer";
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
  const [orderStatusMap, setOrderStatusMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchFrom, setBatchFrom] = useState(1);
  const [batchTo, setBatchTo] = useState(10);
  const [batchSeats, setBatchSeats] = useState<number | "">(4);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSeats, setEditSeats] = useState<number | "">(0);

  const fetchTables = async () => {
    try {
      const [tablesRes, statusRes] = await Promise.all([
        api.get<RestaurantTable[]>("/api/tables", { params: { activeOnly: false } }),
        api.get<Record<number, string>>("/api/tables/order-status"),
      ]);
      setTables(tablesRes.data);
      setOrderStatusMap(statusRes.data);
    } catch (e) {
      console.error("Erro ao carregar mesas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const GRID_COLS = 6;

  const handleCreateBatch = async () => {
    try {
      await api.post("/api/tables/batch", {
        from: batchFrom,
        to: batchTo,
        seats: batchSeats || null,
      } as CreateBatchRequest);
      setShowBatchForm(false);
      fetchTables();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao criar mesas");
    }
  };

  const handleToggle = async (table: RestaurantTable) => {
    try {
      await api.put(`/api/tables/${table.id}`, { active: !table.active });
      fetchTables();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao atualizar mesa");
    }
  };

  const handleSaveEdit = async (table: RestaurantTable) => {
    try {
      await api.put(`/api/tables/${table.id}`, {
        seats: editSeats || null,
      });
      setEditingId(null);
      fetchTables();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao atualizar mesa");
    }
  };

  const handleDelete = async (table: RestaurantTable) => {
    if (!window.confirm(`Remover mesa #${table.number}?`)) return;
    try {
      await api.delete(`/api/tables/${table.id}`);
      fetchTables();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao remover mesa");
    }
  };

  if (loading) return <div className="to-loading">Carregando...</div>;

  return (
    <PageContainer
      title="Mesas"
      headerActions={
        <>
          <div className="to-grid-stats">
            <span><span className="stat-dot active" /> {tables.filter(t => t.active).length} ativas</span>
            <span><span className="stat-dot inactive" /> {tables.filter(t => !t.active).length} inativas</span>
          </div>
          <button
            className="breadcrumb-action-btn btn-create"
            onClick={() => setShowBatchForm(!showBatchForm)}
          >
            <FiPlus />
            <span>Criar Mesas</span>
          </button>
        </>
      }
    >
      {showBatchForm && (
        <div className="to-batch-form">
          <div className="to-batch-row">
            <label>
              De:
              <input type="number" min={1} value={batchFrom} onChange={(e) => setBatchFrom(+e.target.value)} />
            </label>
            <label>
              Até:
              <input type="number" min={1} value={batchTo} onChange={(e) => setBatchTo(+e.target.value)} />
            </label>
            <label>
              Lugares:
              <input type="number" min={1} value={batchSeats} onChange={(e) => setBatchSeats(+e.target.value || "")} />
            </label>
            <button className="to-btn to-btn-primary" onClick={handleCreateBatch}>Criar</button>
            <button className="to-btn" onClick={() => setShowBatchForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="to-grid-wrapper">
        {tables.length === 0 ? (
          <div className="to-empty">
            Nenhuma mesa cadastrada. Clique em "Criar Mesas" para começar.
          </div>
        ) : (
          <div className="to-grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
            {tables.map((table) => (
              <div
                key={table.id}
                className={`to-table-card ${table.active ? "" : "inactive"}`}
              >
                <div className="to-table-header">
                  <div className="to-table-number-badge">{table.number}</div>
                  {table.seats && <div className="to-table-seats">{table.seats} lugares</div>}
                </div>
                {editingId === table.id ? (
                  <>
                    <div className="to-table-edit">
                      <input
                        type="number"
                        placeholder="Lugares"
                        value={editSeats}
                        onChange={(e) => setEditSeats(+e.target.value || "")}
                      />
                    </div>
                    <div className="to-table-actions">
                      <button className="to-icon-btn" title="Salvar" onClick={() => handleSaveEdit(table)}>
                        <FiCheck size={16} color="#22c55e" />
                      </button>
                      <button className="to-icon-btn" title="Cancelar" onClick={() => setEditingId(null)}>
                        <FiX size={16} color="#ef4444" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="to-table-info">
                      {orderStatusMap[table.id] ? (
                        <div
                          className="to-table-status"
                          style={{ background: ORDER_STATUS_COLORS[orderStatusMap[table.id]] || "#94a3b8" }}
                        >
                          {ORDER_STATUS_LABELS[orderStatusMap[table.id]] || orderStatusMap[table.id]}
                        </div>
                      ) : table.status !== 'AVAILABLE' ? (
                        <div
                          className="to-table-status"
                          style={{ background: TABLE_STATUS_COLORS[table.status] || "#94a3b8" }}
                        >
                          {TABLE_STATUS_LABELS[table.status] || table.status}
                        </div>
                      ) : null}
                    </div>
                    <div className="to-table-actions">
                      <button
                        className="to-icon-btn"
                        title="Editar"
                        onClick={() => {
                          setEditingId(table.id);
                          setEditSeats(table.seats || 0);
                        }}
                      >
                        <FiEdit2 size={16} color="#64748b" />
                      </button>
                      <button
                        className="to-icon-btn"
                        title={table.active ? "Desativar" : "Ativar"}
                        onClick={() => handleToggle(table)}
                      >
                        <FiPower size={16} color={table.active ? "#f59e0b" : "#3b82f6"} />
                      </button>
                      <button
                        className="to-icon-btn"
                        title="Remover"
                        onClick={() => handleDelete(table)}
                      >
                        <FiTrash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TablesCRUDPage;

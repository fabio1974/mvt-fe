import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import "./TableOrders.css";

interface RestaurantTable {
  id: number;
  number: number;
  label: string | null;
  seats: number | null;
  active: boolean;
  clientId: string;
}

interface CreateBatchRequest {
  clientId?: string;
  from: number;
  to: number;
  seats: number | null;
}

const TablesCRUDPage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchFrom, setBatchFrom] = useState(1);
  const [batchTo, setBatchTo] = useState(10);
  const [batchSeats, setBatchSeats] = useState<number | "">(4);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSeats, setEditSeats] = useState<number | "">(0);

  const fetchTables = async () => {
    try {
      const res = await api.get<RestaurantTable[]>("/api/tables", {
        params: { activeOnly: false },
      });
      setTables(res.data);
    } catch (e) {
      console.error("Erro ao carregar mesas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

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
        label: editLabel || null,
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
    <div className="to-page">
      <div className="to-header">
        <h2>Mesas</h2>
        <button className="to-btn to-btn-primary" onClick={() => setShowBatchForm(!showBatchForm)}>
          + Criar Mesas
        </button>
      </div>

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

      <div className="to-grid">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`to-table-card ${table.active ? "" : "inactive"}`}
          >
            <div className="to-table-number">#{table.number}</div>
            {editingId === table.id ? (
              <div className="to-table-edit">
                <input
                  placeholder="Label (ex: VIP)"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Lugares"
                  value={editSeats}
                  onChange={(e) => setEditSeats(+e.target.value || "")}
                />
                <div className="to-table-actions">
                  <button className="to-btn to-btn-sm to-btn-primary" onClick={() => handleSaveEdit(table)}>Salvar</button>
                  <button className="to-btn to-btn-sm" onClick={() => setEditingId(null)}>X</button>
                </div>
              </div>
            ) : (
              <>
                {table.label && <div className="to-table-label">{table.label}</div>}
                {table.seats && <div className="to-table-seats">{table.seats} lugares</div>}
                <div className="to-table-actions">
                  <button
                    className="to-btn to-btn-sm"
                    onClick={() => {
                      setEditingId(table.id);
                      setEditLabel(table.label || "");
                      setEditSeats(table.seats || 0);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className={`to-btn to-btn-sm ${table.active ? "to-btn-warn" : "to-btn-primary"}`}
                    onClick={() => handleToggle(table)}
                  >
                    {table.active ? "Desativar" : "Ativar"}
                  </button>
                  <button className="to-btn to-btn-sm to-btn-danger" onClick={() => handleDelete(table)}>
                    Remover
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="to-empty">
          Nenhuma mesa cadastrada. Clique em "Criar Mesas" para começar.
        </div>
      )}
    </div>
  );
};

export default TablesCRUDPage;

import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import "./TableOrders.css";

interface ClientWaiter {
  id: number;
  clientId: string;
  clientName: string;
  waiterId: string;
  waiterName: string;
  waiterEmail: string;
  pin: string | null;
  active: boolean;
}

const WaitersCRUDPage: React.FC = () => {
  const [waiters, setWaiters] = useState<ClientWaiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPin, setNewPin] = useState("");
  const [editingPinId, setEditingPinId] = useState<number | null>(null);
  const [editPin, setEditPin] = useState("");

  const fetchWaiters = async () => {
    try {
      const res = await api.get<ClientWaiter[]>("/api/waiters/by-client");
      setWaiters(res.data);
    } catch (e) {
      console.error("Erro ao carregar garçons:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  const handleLink = async () => {
    if (!newEmail.trim()) return;
    try {
      await api.post("/api/waiters/link", {
        waiterEmail: newEmail.trim(),
        pin: newPin.trim() || null,
      });
      setShowAddForm(false);
      setNewEmail("");
      setNewPin("");
      fetchWaiters();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao vincular garçom");
    }
  };

  const handleToggle = async (cw: ClientWaiter) => {
    try {
      await api.patch("/api/waiters/toggle", {
        waiterId: cw.waiterId,
        active: !cw.active,
      });
      fetchWaiters();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao atualizar");
    }
  };

  const handleSavePin = async (cw: ClientWaiter) => {
    try {
      await api.patch("/api/waiters/pin", {
        waiterId: cw.waiterId,
        pin: editPin.trim() || null,
      });
      setEditingPinId(null);
      fetchWaiters();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao atualizar PIN");
    }
  };

  const handleUnlink = async (cw: ClientWaiter) => {
    if (!window.confirm(`Desvincular ${cw.waiterName}?`)) return;
    try {
      await api.delete("/api/waiters/unlink", {
        params: { waiterId: cw.waiterId },
      });
      fetchWaiters();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao desvincular");
    }
  };

  if (loading) return <div className="to-loading">Carregando...</div>;

  return (
    <div className="to-page">
      <div className="to-header">
        <h2>Garçons</h2>
        <button className="to-btn to-btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          + Vincular Garçom
        </button>
      </div>

      {showAddForm && (
        <div className="to-batch-form">
          <div className="to-batch-row">
            <label>
              Email do garçom:
              <input
                type="email"
                placeholder="garcom@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </label>
            <label>
              PIN (opcional):
              <input
                type="text"
                maxLength={6}
                placeholder="1234"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
              />
            </label>
            <button className="to-btn to-btn-primary" onClick={handleLink}>Vincular</button>
            <button className="to-btn" onClick={() => setShowAddForm(false)}>Cancelar</button>
          </div>
          <p className="to-hint">O garçom precisa ter uma conta com role WAITER.</p>
        </div>
      )}

      <table className="entity-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>PIN</th>
            <th>Status</th>
            <th style={{ width: 200 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {waiters.map((cw) => (
            <tr key={cw.id}>
              <td>{cw.waiterName}</td>
              <td>{cw.waiterEmail}</td>
              <td>
                {editingPinId === cw.id ? (
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <input
                      type="text"
                      maxLength={6}
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value)}
                      style={{ width: 70 }}
                    />
                    <button className="to-btn to-btn-sm to-btn-primary" onClick={() => handleSavePin(cw)}>OK</button>
                    <button className="to-btn to-btn-sm" onClick={() => setEditingPinId(null)}>X</button>
                  </div>
                ) : (
                  <span
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => {
                      setEditingPinId(cw.id);
                      setEditPin(cw.pin || "");
                    }}
                  >
                    {cw.pin || "—"}
                  </span>
                )}
              </td>
              <td>
                <span className={`to-status-badge ${cw.active ? "active" : "inactive"}`}>
                  {cw.active ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className={`to-btn to-btn-sm ${cw.active ? "to-btn-warn" : "to-btn-primary"}`}
                    onClick={() => handleToggle(cw)}
                  >
                    {cw.active ? "Desativar" : "Ativar"}
                  </button>
                  <button className="to-btn to-btn-sm to-btn-danger" onClick={() => handleUnlink(cw)}>
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {waiters.length === 0 && (
        <div className="to-empty">
          Nenhum garçom vinculado. Clique em "Vincular Garçom" para adicionar.
        </div>
      )}
    </div>
  );
};

export default WaitersCRUDPage;

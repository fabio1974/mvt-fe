import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiSend, FiRefreshCw } from "react-icons/fi";
import { api } from "../../services/api";
import PageContainer from "../Generic/PageContainer";
import {
  STATUS_OPTIONS,
  apiError,
  fmtDate,
  resultLabel,
  splitEmails,
  type InviteResponse,
  type InvitedOrganizer,
  type StatusFilter,
} from "./organizerInvites";

const cell: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "left" };
const card: React.CSSProperties = {
  background: "var(--card-bg, #fff)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
  marginBottom: 20,
};
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
};

/**
 * Admin convida gerentes (ORGANIZER) por e-mail — gerente não se cadastra sozinho. A conta
 * nasce com senha temporária enviada por e-mail; no 1º acesso a troca é obrigatória.
 */
const OrganizerInvitesPage: React.FC = () => {
  const [emails, setEmails] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<InviteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [list, setList] = useState<InvitedOrganizer[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");

  const parsed = useMemo(() => splitEmails(emails), [emails]);
  const single = parsed.length <= 1;

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await api.get<InvitedOrganizer[]>("/api/admin/organizer-invites");
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setListError(apiError(e, "Falha ao carregar os convites."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setResult(null);
    if (parsed.length === 0) {
      setError("Informe ao menos um e-mail.");
      return;
    }
    setSending(true);
    try {
      const res = await api.post<InviteResponse>("/api/admin/organizer-invites", {
        emails: parsed,
        ...(single && name.trim() ? { name: name.trim() } : {}),
      });
      setResult(res.data);
      setEmails("");
      setName("");
      load();
    } catch (e) {
      setError(apiError(e, "Falha ao enviar os convites."));
    } finally {
      setSending(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((o) => {
      if (status === "PENDING" && !o.temporaryPassword) return false;
      if (status === "ACTIVE" && o.temporaryPassword) return false;
      if (q && !`${o.name} ${o.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, status, search]);

  return (
    <PageContainer title="Convidar gerente">
      <div style={{ padding: "0 4px" }}>
        <form style={card} onSubmit={send} aria-label="Convidar gerente">
          <h3 style={{ marginTop: 0 }}>Convidar gerente</h3>
          <p style={{ color: "#64748b", marginTop: 0 }}>
            Gerentes só entram por convite. Cada e-mail novo recebe uma conta de gerente com senha temporária; no
            primeiro acesso a pessoa cria a própria senha. Convidar de novo reenvia o e-mail.
          </p>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }} htmlFor="invite-emails">
            E-mails (um por linha ou separados por vírgula)
          </label>
          <textarea
            id="invite-emails"
            rows={4}
            style={{ ...input, fontFamily: "inherit", resize: "vertical" }}
            placeholder={"gerente@exemplo.com\noutro@exemplo.com"}
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
          />
          <label style={{ display: "block", fontWeight: 600, margin: "12px 0 6px" }} htmlFor="invite-name">
            Nome (opcional — só para um único e-mail)
          </label>
          <input
            id="invite-name"
            style={{ ...input, opacity: single ? 1 : 0.5 }}
            placeholder="Nome do gerente"
            value={name}
            disabled={!single}
            onChange={(e) => setName(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              type="submit"
              disabled={sending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontWeight: 600,
                background: "linear-gradient(90deg, #5b4cfa, #4c9aff)",
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              <FiSend /> {sending ? "Enviando..." : `Enviar convite${parsed.length > 1 ? "s" : ""}`}
            </button>
          </div>
          {error && (
            <div role="alert" style={{ color: "#dc2626", marginTop: 10 }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: 16 }} data-testid="invite-result">
              <h4 style={{ margin: "0 0 8px" }}>Resultado</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {result.convites.map((r) => {
                  const l = resultLabel(r);
                  return (
                    <li key={r.email} style={{ padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <strong>{r.email}</strong> — <span style={{ color: l.color }}>{l.text}</span>
                    </li>
                  );
                })}
                {result.invalidos.map((e) => (
                  <li key={`inv-${e}`} style={{ padding: "6px 0", color: "#dc2626" }}>
                    <strong>{e}</strong> — e-mail inválido
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        <div style={card}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 12 }}>
            <h3 style={{ margin: 0, flex: "1 1 200px" }}>Gerentes convidados</h3>
            <label style={{ display: "flex", flexDirection: "column", fontSize: 13, gap: 4 }}>
              Status
              <select
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                style={{ ...input, width: 230 }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", fontSize: 13, gap: 4 }}>
              Buscar por nome ou e-mail
              <input
                aria-label="Buscar por nome ou e-mail"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...input, width: 240 }}
                placeholder="Nome ou e-mail"
              />
            </label>
            <button
              type="button"
              onClick={load}
              title="Atualizar"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "transparent", cursor: "pointer" }}
            >
              <FiRefreshCw />
            </button>
          </div>
          {listError && <div style={{ color: "#dc2626" }}>{listError}</div>}
          {loading ? (
            <div>Carregando...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }} data-testid="invited-table">
                <thead>
                  <tr>
                    <th style={cell}>Nome</th>
                    <th style={cell}>E-mail</th>
                    <th style={cell}>Convidado em</th>
                    <th style={cell}>Status</th>
                    <th style={cell}>Último acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td style={cell} colSpan={5}>
                        Nenhum gerente convidado{status || search ? " com esses filtros" : ""}.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => (
                      <tr key={o.email}>
                        <td style={cell}>{o.name}</td>
                        <td style={cell}>{o.email}</td>
                        <td style={cell}>{fmtDate(o.invitedAt || o.createdAt)}</td>
                        <td style={cell}>
                          {o.temporaryPassword ? (
                            <span style={{ color: "#b45309", fontWeight: 600 }}>Aguardando troca de senha</span>
                          ) : (
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>Ativo</span>
                          )}
                        </td>
                        <td style={cell}>{fmtDate(o.lastLogin)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default OrganizerInvitesPage;

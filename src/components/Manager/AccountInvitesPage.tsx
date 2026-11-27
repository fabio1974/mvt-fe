import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiSend, FiRefreshCw } from "react-icons/fi";
import { api } from "../../services/api";
import { isAdmin } from "../../utils/auth";
import PageContainer from "../Generic/PageContainer";
import {
  INVITE_KINDS,
  STATUS_OPTIONS,
  apiError,
  fmtDate,
  resultLabel,
  splitEmails,
  type InviteKind,
  type InviteResponse,
  type InvitedAccount,
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

interface OrgOption {
  id: number;
  name: string;
}

interface StoreOption {
  id: string;
  name: string;
  username: string;
}

/** Typeahead de estabelecimento (busca desde a 1ª letra) — admin escolhe a loja do garçom. */
const StoreTypeahead: React.FC<{ value: StoreOption | null; onChange: (s: StoreOption | null) => void }> = ({
  value,
  onChange,
}) => {
  const [term, setTerm] = useState("");
  const [options, setOptions] = useState<StoreOption[]>([]);
  useEffect(() => {
    const t = term.trim();
    if (!t || (value && t === value.name)) {
      setOptions([]);
      return;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ content?: StoreOption[] }>("/api/users", {
          params: { role: "CLIENT", search: t, size: 10 },
        });
        if (alive) setOptions(res.data?.content ?? []);
      } catch {
        if (alive) setOptions([]);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [term, value]);
  return (
    <div style={{ position: "relative" }}>
      <input
        id="invite-store"
        aria-label="Estabelecimento"
        style={input}
        placeholder="Digite o nome ou e-mail da loja"
        value={value ? value.name : term}
        onChange={(e) => {
          onChange(null);
          setTerm(e.target.value);
        }}
      />
      {options.length > 0 && !value && (
        <ul
          role="listbox"
          style={{
            position: "absolute", zIndex: 10, left: 0, right: 0, margin: 0, padding: 0, listStyle: "none",
            background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, maxHeight: 220, overflowY: "auto",
          }}
        >
          {options.map((o) => (
            <li
              key={o.id}
              role="option"
              aria-selected={false}
              style={{ padding: "8px 12px", cursor: "pointer" }}
              onMouseDown={() => {
                onChange(o);
                setTerm(o.name);
                setOptions([]);
              }}
            >
              {o.name} <span style={{ color: "#64748b" }}>({o.username})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * Convite de conta por e-mail — gerente (admin), estabelecimento (admin/gerente), motorista
 * (admin/gerente) e garçom (admin/loja). A conta nasce com senha temporária enviada por e-mail;
 * no 1º acesso a troca é obrigatória. Quando convida o gerente/a loja, a conta já nasce no grupo/na
 * loja de quem convidou; o admin escolhe o grupo/a loja no campo extra.
 */
const AccountInvitesPage: React.FC<{ kind?: InviteKind }> = ({ kind = "organizer" }) => {
  const cfg = INVITE_KINDS[kind];
  const admin = isAdmin();
  const target = admin ? cfg.adminTarget : null;
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [orgId, setOrgId] = useState("");
  const [store, setStore] = useState<StoreOption | null>(null);
  const [emails, setEmails] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<InviteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [list, setList] = useState<InvitedAccount[]>([]);
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
      const res = await api.get<InvitedAccount[]>(cfg.endpoint);
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setListError(apiError(e, "Falha ao carregar os convites."));
    } finally {
      setLoading(false);
    }
  }, [cfg.endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  // Admin: grupos para o select (lista pequena, do banco).
  useEffect(() => {
    if (target !== "organization-optional" && target !== "organization-required") return;
    api
      .get<{ content?: OrgOption[] }>("/api/organizations", { params: { size: 200, sort: "name,asc" } })
      .then((res) => setOrgs(res.data?.content ?? []))
      .catch(() => setOrgs([]));
  }, [target]);

  const send = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setResult(null);
    if (parsed.length === 0) {
      setError("Informe ao menos um e-mail.");
      return;
    }
    if (target === "organization-required" && !orgId) {
      setError("Escolha o grupo.");
      return;
    }
    if (target === "store-required" && !store) {
      setError("Escolha o estabelecimento.");
      return;
    }
    setSending(true);
    try {
      const res = await api.post<InviteResponse>(cfg.endpoint, {
        emails: parsed,
        ...(single && name.trim() ? { name: name.trim() } : {}),
        ...(target && target.startsWith("organization") && orgId ? { organizationId: Number(orgId) } : {}),
        ...(target === "store-required" && store ? { storeId: store.id } : {}),
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
    <PageContainer title={cfg.title}>
      <div style={{ padding: "0 4px" }}>
        <form style={card} onSubmit={send} aria-label={cfg.title}>
          <h3 style={{ marginTop: 0 }}>{cfg.title}</h3>
          <p style={{ color: "#64748b", marginTop: 0 }}>{cfg.description}</p>
          {(target === "organization-optional" || target === "organization-required") && (
            <>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }} htmlFor="invite-org">
                Grupo{target === "organization-optional" ? " (opcional)" : ""}
              </label>
              <select
                id="invite-org"
                aria-label="Grupo"
                style={{ ...input, marginBottom: 12 }}
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                <option value="">{target === "organization-optional" ? "Sem grupo" : "Escolha o grupo"}</option>
                {orgs.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
            </>
          )}
          {target === "store-required" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }} htmlFor="invite-store">
                Estabelecimento
              </label>
              <StoreTypeahead value={store} onChange={setStore} />
            </div>
          )}
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }} htmlFor="invite-emails">
            E-mails (um por linha ou separados por vírgula)
          </label>
          <textarea
            id="invite-emails"
            rows={4}
            style={{ ...input, fontFamily: "inherit", resize: "vertical" }}
            placeholder={cfg.emailPlaceholder}
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
          />
          <label style={{ display: "block", fontWeight: 600, margin: "12px 0 6px" }} htmlFor="invite-name">
            Nome (opcional — só para um único e-mail)
          </label>
          <input
            id="invite-name"
            style={{ ...input, opacity: single ? 1 : 0.5 }}
            placeholder={cfg.namePlaceholder}
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
            <h3 style={{ margin: 0, flex: "1 1 200px" }}>{cfg.listTitle}</h3>
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
                        Nenhum {cfg.singular} convidado{status || search ? " com esses filtros" : ""}.
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

export default AccountInvitesPage;

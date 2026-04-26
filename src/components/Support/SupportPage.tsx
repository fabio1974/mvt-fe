import React, { useEffect, useState, useRef, useCallback } from "react";
import { FiSend, FiCheckCircle, FiRefreshCw, FiUser, FiRotateCcw } from "react-icons/fi";
import PageContainer from "../Generic/PageContainer";
import { supportService } from "../../services/supportService";
import type { SupportMessage, ConversationSummary } from "../../services/supportService";
import { getUserRole } from "../../utils/auth";
import "./Support.css";

type ConversationFilter = "active" | "resolved" | "all";

const POLL_INTERVAL_MS = 30_000;

const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};
const fmtDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
};

/** Bifurcador: ADMIN vê lista de conversas, demais users veem o próprio thread. */
const SupportPage: React.FC = () => {
  const role = getUserRole();
  const isAdmin = role === "ROLE_ADMIN";
  return isAdmin ? <AdminConversationsView /> : <UserChatView />;
};

// ============================================================
// USER VIEW — chat 1:1 com o suporte
// ============================================================

const UserChatView: React.FC = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (markAsRead: boolean = true) => {
    try {
      const list = await supportService.getMyMessages();
      setMessages(list);
      if (markAsRead && list.some((m) => m.fromAdmin && !m.readAt)) {
        await supportService.markMyAsRead();
      }
    } catch (e) {
      console.warn("Erro ao carregar mensagens:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(false), POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      const msg = await supportService.sendMyMessage(trimmed);
      setMessages((prev) => [...prev, msg]);
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <PageContainer title="Fale Conosco">
      <div className="support-chat">
        <div className="support-messages" ref={scrollRef}>
          {loading ? (
            <div className="support-empty">Carregando…</div>
          ) : messages.length === 0 ? (
            <div className="support-empty">
              <h3>Olá!</h3>
              <p>Envie sua primeira mensagem. Vamos te responder o mais rápido possível.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`support-bubble-row ${m.fromAdmin ? "left" : "right"}`}>
                <div className={`support-bubble ${m.fromAdmin ? "from-admin" : "from-me"}`}>
                  <div className="support-bubble-text">{m.text}</div>
                  <div className="support-bubble-time">{fmtTime(m.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="support-input-bar">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite sua mensagem..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button onClick={handleSend} disabled={!text.trim() || sending} className="support-send-btn">
            <FiSend /> Enviar
          </button>
        </div>
      </div>
    </PageContainer>
  );
};

// ============================================================
// ADMIN VIEW — lista de conversas + painel de chat
// ============================================================

const AdminConversationsView: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConversationFilter>("active");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await supportService.listConversations();
      setConversations(list);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (userId: string) => {
    try {
      const list = await supportService.getConversation(userId);
      setMessages(list);
      // marca como lidas
      if (list.some((m) => !m.fromAdmin && !m.readAt)) {
        await supportService.markUserAsRead(userId);
        loadConversations();
      }
    } catch (e) {
      console.warn("Erro ao carregar conversa:", e);
    }
  }, [loadConversations]);

  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    if (selectedUserId) {
      loadConversation(selectedUserId);
      const t = setInterval(() => loadConversation(selectedUserId), POLL_INTERVAL_MS);
      return () => clearInterval(t);
    }
  }, [selectedUserId, loadConversation]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  }, [messages.length]);

  const handleSend = async () => {
    if (!selectedUserId) return;
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      const msg = await supportService.replyToUser(selectedUserId, trimmed);
      setMessages((prev) => [...prev, msg]);
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedUserId) return;
    if (!window.confirm("Marcar conversa como resolvida?")) return;
    await supportService.resolve(selectedUserId);
    loadConversations();
  };

  const handleReopen = async () => {
    if (!selectedUserId) return;
    await supportService.reopen(selectedUserId);
    loadConversations();
  };

  const selectedConv = conversations.find((c) => c.userId === selectedUserId);
  const isResolved = !!selectedConv?.resolvedAt;

  // Filtra conversas conforme o filtro selecionado
  const filteredConversations = conversations.filter((c) => {
    if (filter === "active") return !c.resolvedAt;
    if (filter === "resolved") return !!c.resolvedAt;
    return true;
  });

  return (
    <PageContainer
      title="Suporte — Conversas"
      headerActions={
        <button className="support-refresh-btn" onClick={loadConversations} disabled={loading}>
          <FiRefreshCw /> Atualizar
        </button>
      }
    >
      <div className="support-admin-layout">
        {/* Lista de conversas + filtro */}
        <div className="support-conv-list">
          {/* Filtros */}
          <div className="support-filter-tabs">
            <button
              className={`support-filter-tab ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
            >
              Ativas ({conversations.filter((c) => !c.resolvedAt).length})
            </button>
            <button
              className={`support-filter-tab ${filter === "resolved" ? "active" : ""}`}
              onClick={() => setFilter("resolved")}
            >
              Resolvidas ({conversations.filter((c) => !!c.resolvedAt).length})
            </button>
            <button
              className={`support-filter-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Todas
            </button>
          </div>

          {loading ? (
            <div className="support-empty">Carregando…</div>
          ) : filteredConversations.length === 0 ? (
            <div className="support-empty">
              {filter === "active" && "Nenhuma conversa ativa."}
              {filter === "resolved" && "Nenhuma conversa resolvida."}
              {filter === "all" && "Nenhuma conversa ainda."}
            </div>
          ) : (
            filteredConversations.map((c) => (
              <div
                key={c.userId}
                className={`support-conv-item ${selectedUserId === c.userId ? "active" : ""} ${c.unreadCount > 0 ? "has-unread" : ""} ${c.resolvedAt ? "is-resolved" : ""}`}
                onClick={() => setSelectedUserId(c.userId)}
              >
                <div className="support-conv-header">
                  <span className="support-conv-name">{c.userName || c.userEmail}</span>
                  {c.unreadCount > 0 && <span className="support-unread-pill">{c.unreadCount}</span>}
                </div>
                <div className="support-conv-meta">
                  <span className="support-conv-role">{c.userRole}</span>
                  {c.resolvedAt && <span className="support-conv-resolved">✓ Resolvida</span>}
                </div>
                <div className="support-conv-preview">{c.lastMessageText}</div>
                <div className="support-conv-time">{fmtDateTime(c.lastMessageAt)}</div>
              </div>
            ))
          )}
        </div>

        {/* Chat panel */}
        <div className="support-chat-panel">
          {!selectedUserId ? (
            <div className="support-empty support-chat-placeholder">
              <FiUser size={48} />
              <p>Selecione uma conversa à esquerda</p>
            </div>
          ) : (
            <>
              <div className="support-chat-header">
                <div>
                  <strong>{selectedConv?.userName || selectedConv?.userEmail}</strong>
                  <div className="support-chat-header-sub">
                    {selectedConv?.userEmail} · {selectedConv?.userRole}
                    {isResolved && (
                      <span className="support-chat-header-resolved">
                        {" "}· ✓ Resolvida em {fmtDateTime(selectedConv!.resolvedAt!)}
                      </span>
                    )}
                  </div>
                </div>
                {isResolved ? (
                  <button className="support-reopen-btn" onClick={handleReopen}>
                    <FiRotateCcw /> Reabrir
                  </button>
                ) : (
                  <button className="support-resolve-btn" onClick={handleResolve}>
                    <FiCheckCircle /> Marcar resolvida
                  </button>
                )}
              </div>

              <div className="support-messages" ref={scrollRef}>
                {messages.map((m) => (
                  <div key={m.id} className={`support-bubble-row ${m.fromAdmin ? "right" : "left"}`}>
                    <div className={`support-bubble ${m.fromAdmin ? "from-me" : "from-admin"}`}>
                      <div className="support-bubble-text">{m.text}</div>
                      <div className="support-bubble-time">{fmtTime(m.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="support-input-bar">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Responder..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button onClick={handleSend} disabled={!text.trim() || sending} className="support-send-btn">
                  <FiSend /> Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SupportPage;

import React, { useEffect, useState } from "react";
import { FiCopy, FiShare2, FiCheck } from "react-icons/fi";
import { api } from "../../services/api";

/**
 * Card pro estabelecimento (CLIENT) copiar/compartilhar o link público do
 * cardápio (zapi10.com.br/c/<slug>) — funil pro download do app. Renderizado
 * no dashboard, logo abaixo do preview "Como seus clientes te veem".
 *
 * Busca o slug em /api/store-profile/me. Some se a loja ainda não tem slug.
 */
const ShareMenuCard: React.FC = () => {
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ slug?: string | null }>("/api/store-profile/me");
        setSlug(res.data?.slug ?? null);
      } catch {
        setSlug(null);
      }
    })();
  }, []);

  if (!slug) return null;

  const url = `${window.location.origin}/c/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link do seu cardápio:", url);
    }
  };

  const share = async () => {
    const text = `Confira nosso cardápio e peça pelo app Zapi10: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Cardápio Zapi10", text, url });
        return;
      } catch {
        /* usuário cancelou — cai pro WhatsApp abaixo */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: 16, marginTop: 12,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        📣 Compartilhe o link do seu cardápio
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
        Mande pros seus clientes no WhatsApp, Instagram e onde quiser.
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <code style={{
          flex: "1 1 240px", background: "#f3f4f6", borderRadius: 6, padding: "8px 12px",
          fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {url}
        </code>
        <button
          onClick={copy}
          style={{
            display: "flex", alignItems: "center", gap: 6, border: "none", borderRadius: 6,
            padding: "8px 14px", cursor: "pointer", fontSize: 14,
            background: "#dbeafe", color: "#1d4ed8",
          }}
        >
          {copied ? <FiCheck /> : <FiCopy />} {copied ? "Copiado!" : "Copiar"}
        </button>
        <button
          onClick={share}
          style={{
            display: "flex", alignItems: "center", gap: 6, border: "none", borderRadius: 6,
            padding: "8px 14px", cursor: "pointer", fontSize: 14,
            background: "#16a34a", color: "#fff",
          }}
        >
          <FiShare2 /> Compartilhar
        </button>
      </div>
    </div>
  );
};

export default ShareMenuCard;

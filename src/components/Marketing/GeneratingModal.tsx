import React, { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  variationsCount: number;
  mode?: "generate" | "regenerate";
}

interface Phase {
  fromSec: number;
  label: string;
  emoji: string;
}

const buildPhases = (n: number): Phase[] => [
  { fromSec: 0, emoji: "🧠", label: "Refinando briefing e preparando prompts…" },
  { fromSec: 5, emoji: "✍️", label: `Gerando ${n} variações de texto com Gemini…` },
  { fromSec: 25, emoji: "🎨", label: `Gerando imagens com Imagen 3 (uma por uma)…` },
  { fromSec: 60, emoji: "☁️", label: "Subindo imagens pro Cloudinary com overlay do logo…" },
  { fromSec: 90, emoji: "⏳", label: "Quota do Vertex AI atingida — aguardando 30s pra retry…" },
  { fromSec: 130, emoji: "🔁", label: "Retry automático em andamento (backoff 60s)…" },
  { fromSec: 200, emoji: "🔁", label: "Última tentativa antes de marcar como FAILED (backoff 120s)…" },
  { fromSec: 320, emoji: "🤞", label: "Quase lá, finalizando…" },
];

const GeneratingModal: React.FC<Props> = ({ isOpen, variationsCount, mode = "generate" }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  if (!isOpen) return null;

  const phases = buildPhases(variationsCount);
  const currentPhase = [...phases].reverse().find((p) => elapsed >= p.fromSec) ?? phases[0];

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  // Assintótica: chega em ~90% por volta de 120s, depois rasteja
  const progress = Math.min(95, 100 * (1 - Math.exp(-elapsed / 60)));

  const title = mode === "regenerate" ? "Regerando variações" : "Gerando variações";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: "28px 32px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 12, animation: "mktSpin 2.5s linear infinite", display: "inline-block" }}>
          {currentPhase.emoji}
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
        <p style={{ margin: "12px 0 0", fontSize: 14, color: "#475569", minHeight: 40, lineHeight: 1.4 }}>
          {currentPhase.label}
        </p>

        <div style={{ marginTop: 20, marginBottom: 8 }}>
          <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                transition: "width 1s ease-out",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginTop: 8 }}>
          <span>
            ⏱️ {mm}:{ss}
          </span>
          <span>
            {variationsCount} {variationsCount === 1 ? "variação" : "variações"}
          </span>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
          Não feche esta janela.
          <br />
          Esse processo costuma levar de <b>30s</b> até <b>3min</b> dependendo do rate limit do Vertex AI.
        </p>
      </div>

      <style>{`
        @keyframes mktSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default GeneratingModal;

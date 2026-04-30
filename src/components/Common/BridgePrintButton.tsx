import { useState } from "react";
import { FiPrinter, FiSettings, FiCheck, FiX } from "react-icons/fi";
import {
  getSavedBridgeUrl,
  saveBridgeUrl,
  checkBridgeHealth,
  printOrder,
  type BridgeHealth,
} from "../../services/printBridge";

/**
 * Botão "Imprimir (Térmica)" — chama o BE pra obter bytes ESC/POS e
 * encaminha pra Print Bridge configurada (rodando no PC do estabelecimento).
 *
 * Se o user ainda não configurou o IP:porta da bridge, abre modal pedindo.
 * Salva em localStorage pra reuso.
 */
interface Props {
  orderId: number;
  paperWidth?: "58mm" | "80mm";
  /** Texto opcional do botão. Default: "Imprimir Térmica" */
  label?: string;
}

export default function BridgePrintButton({ orderId, paperWidth = "80mm", label = "Imprimir Térmica" }: Props) {
  const [printing, setPrinting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [inputUrl, setInputUrl] = useState(getSavedBridgeUrl() ?? "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<BridgeHealth | { error: string } | null>(null);

  const handlePrint = async () => {
    const saved = getSavedBridgeUrl();
    if (!saved) {
      setShowConfig(true);
      return;
    }
    setPrinting(true);
    try {
      const r = await printOrder(orderId, paperWidth);
      if (!r.ok) {
        alert(`Falha ao imprimir:\n\n${r.error}`);
      }
    } finally {
      setPrinting(false);
    }
  };

  const handleTestBridge = async () => {
    setTestResult(null);
    setTesting(true);
    try {
      const health = await checkBridgeHealth(inputUrl);
      if (health) setTestResult(health);
      else setTestResult({ error: "Bridge não respondeu. Verifique o IP, a porta e se o serviço está rodando." });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndPrint = () => {
    if (!inputUrl.trim()) return;
    saveBridgeUrl(inputUrl);
    setShowConfig(false);
    handlePrint();
  };

  return (
    <>
      <button
        onClick={handlePrint}
        disabled={printing}
        title="Imprimir na impressora térmica via Print Bridge"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 8,
          background: "#1d4ed8", color: "#fff",
          border: "none", cursor: printing ? "wait" : "pointer",
          fontSize: 13, fontWeight: 600,
          opacity: printing ? 0.7 : 1,
        }}
      >
        <FiPrinter size={14} />
        {printing ? "Imprimindo..." : label}
        <FiSettings
          size={12}
          style={{ marginLeft: 4, opacity: 0.7, cursor: "pointer" }}
          onClick={(e) => { e.stopPropagation(); setShowConfig(true); }}
          title="Configurar Print Bridge"
        />
      </button>

      {showConfig && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={() => setShowConfig(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 12, padding: 24, maxWidth: 480, width: "100%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Configurar Print Bridge</h3>
            <p style={{ marginTop: 8, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
              Informe o endereço HTTP da Print Bridge instalada no seu computador.
              No PC, abra <strong>show-status</strong> (ícone Zapi10 no Menu Iniciar) pra ver o IP e a porta HTTP (padrão 9101).
            </p>

            <label style={{ display: "block", marginTop: 16, fontSize: 12, fontWeight: 600, color: "#475569" }}>
              URL do Bridge (IP:porta)
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="192.168.1.42:9101"
              style={{
                width: "100%", padding: "10px 12px", marginTop: 4,
                border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14,
                fontFamily: "monospace",
              }}
            />

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                onClick={handleTestBridge}
                disabled={!inputUrl.trim() || testing}
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  background: "#dbeafe", color: "#1d4ed8",
                  border: "none", cursor: testing ? "wait" : "pointer",
                  fontSize: 13, fontWeight: 600,
                  opacity: testing ? 0.7 : 1,
                }}
              >
                {testing ? "Testando..." : "Testar conexão"}
              </button>
            </div>

            {testResult && (
              <div
                style={{
                  marginTop: 12, padding: 12, borderRadius: 8,
                  background: "error" in testResult ? "#fef2f2" : "#f0fdf4",
                  border: `1px solid ${"error" in testResult ? "#fecaca" : "#bbf7d0"}`,
                  fontSize: 13, color: "error" in testResult ? "#991b1b" : "#166534",
                }}
              >
                {"error" in testResult ? (
                  <>
                    <FiX size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    {testResult.error}
                  </>
                ) : (
                  <>
                    <FiCheck size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    <strong>Bridge v{testResult.version}</strong> rodando.<br />
                    Impressora: <code>{testResult.printer || "(nenhuma configurada no SO)"}</code><br />
                    Portas: TCP {testResult.tcpPort} / HTTP {testResult.httpPort}
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfig(false)}
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  background: "#fff", color: "#64748b",
                  border: "1px solid #cbd5e1", cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAndPrint}
                disabled={!inputUrl.trim()}
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  background: "#1d4ed8", color: "#fff",
                  border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  opacity: !inputUrl.trim() ? 0.5 : 1,
                }}
              >
                Salvar e imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useMemo, useState } from "react";
import {
  FiDownload,
  FiInfo,
  FiCheckCircle,
  FiExternalLink,
} from "react-icons/fi";
import PageContainer from "../Generic/PageContainer";

type OS = "windows" | "mac" | "linux" | "other";

const RELEASE_BASE =
  "https://github.com/fabio1974/zapi10-print-bridge/releases/latest/download";

interface Asset {
  label: string;
  filename: string;
  description: string;
  primary?: boolean;
}

interface PlatformBlock {
  os: OS;
  title: string;
  intro: string;
  assets: Asset[];
}

const PLATFORMS: PlatformBlock[] = [
  {
    os: "windows",
    title: "Windows 10/11",
    intro:
      'Instalador único: clique duplo, "Sim" no UAC, "Avançar → Instalar → Concluir". Roda em background como serviço Windows e inicia sozinho no boot.',
    assets: [
      {
        label: "Baixar instalador (.exe)",
        filename: "Zapi10PrintBridgeSetup.exe",
        description:
          "Recomendado. ~50MB. Instalador completo com JRE embutida + atalho no Menu Iniciar.",
        primary: true,
      },
      {
        label: "Versão portable (.zip)",
        filename: "zapi10-print-bridge-windows.zip",
        description:
          "Pacote alternativo. Extrair e clicar direito em install.bat → Executar como administrador.",
      },
    ],
  },
  {
    os: "mac",
    title: "macOS",
    intro:
      "Instalador .dmg ou pacote .zip. Roda em background como LaunchAgent — inicia automaticamente quando o Mac é ligado.",
    assets: [
      {
        label: "Baixar instalador (.dmg)",
        filename: "Zapi10PrintBridge-1.0.0.dmg",
        description:
          "Recomendado. Abre, arraste o app pra Aplicativos. Funciona em Macs Intel e Apple Silicon.",
        primary: true,
      },
      {
        label: "Versão portable (.zip)",
        filename: "zapi10-print-bridge-mac.zip",
        description:
          "Pacote alternativo. Extrair e duplo-clique em install.command. Inclui ferramenta show-status.",
      },
    ],
  },
  {
    os: "linux",
    title: "Linux",
    intro:
      "Pacote .deb (Debian/Ubuntu) ou .rpm (Fedora/RHEL). O tarball traz instalação completa com systemd + auto-detect de porta.",
    assets: [
      {
        label: "Tarball + systemd (.tar.gz)",
        filename: "zapi10-print-bridge-linux.tar.gz",
        description:
          "Recomendado. Extrair e rodar sudo ./install.sh. Configura systemd e abre porta no firewall (ufw/firewalld).",
        primary: true,
      },
      {
        label: "Pacote Debian (.deb)",
        filename: "zapi10-print-bridge_1.0.0_amd64.deb",
        description: "Para Debian, Ubuntu, Mint. Instala via sudo dpkg -i.",
      },
      {
        label: "Pacote Red Hat (.rpm)",
        filename: "zapi10-print-bridge-1.0.0-1.x86_64.rpm",
        description: "Para Fedora, RHEL, CentOS. Instala via sudo rpm -i.",
      },
    ],
  },
];

function detectOS(): OS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "mac";
  if (ua.includes("linux") || ua.includes("x11")) return "linux";
  return "other";
}

export default function DownloadsPage() {
  const userOS = useMemo(() => detectOS(), []);
  const [showOthers, setShowOthers] = useState(userOS === "other");

  const detected = PLATFORMS.find((p) => p.os === userOS);
  const others = PLATFORMS.filter((p) => p.os !== userOS);

  return (
    <PageContainer title="Downloads de Software">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <FiInfo size={20} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 14, color: "#1e3a8a", lineHeight: 1.6 }}>
            <strong>Zapi10 Print Bridge</strong> — programinha que permite ao app
            Zapi10 do celular imprimir em uma impressora térmica conectada ao seu
            computador (USB ou rede). Instale em <strong>1 computador por
            estabelecimento</strong>; ele roda em background e não atrapalha
            outros sistemas.
          </div>
        </div>

        {detected && (
          <PlatformCard
            platform={detected}
            highlighted
            badge="Recomendado para o seu sistema"
          />
        )}

        {others.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <button
              onClick={() => setShowOthers(!showOthers)}
              style={{
                background: "transparent",
                border: "none",
                color: "#3b82f6",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {showOthers ? "▾" : "▸"} Outros sistemas operacionais
            </button>
            {showOthers && (
              <div style={{ marginTop: 12 }}>
                {others.map((p) => (
                  <PlatformCard key={p.os} platform={p} />
                ))}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 32,
            padding: 16,
            background: "#f8fafc",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 13,
            color: "#475569",
            lineHeight: 1.7,
            textAlign: "left",
          }}
        >
          <strong style={{ color: "#1e293b" }}>Após instalar:</strong>
          <ol style={{ paddingLeft: 24, margin: "8px 0 0 0", textAlign: "left" }}>
            <li>
              {userOS === "windows" && (
                <>Abra o Zapi10 Print Bridge no computador: <strong>Menu Iniciar → "Zapi10 Status"</strong> pra ver o IP e a porta.</>
              )}
              {userOS === "mac" && (
                <>Abra o Zapi10 Print Bridge no computador: <strong>pasta de instalação → "show-status.command"</strong> pra ver o IP e a porta.</>
              )}
              {userOS === "linux" && (
                <>Abra o Zapi10 Print Bridge no computador: rode <code>./show-status.sh</code> na pasta de instalação pra ver o IP e a porta.</>
              )}
              {userOS === "other" && (
                <>Abra o Zapi10 Print Bridge no computador (Windows: Menu Iniciar → "Zapi10 Status" — Mac: pasta de instalação → "show-status.command" — Linux: <code>./show-status.sh</code>) pra ver o IP e a porta.</>
              )}
            </li>
            <li>
              No app Zapi10 do celular (mesma rede Wi-Fi que o computador): Menu lateral →{" "}
              <strong>Impressoras</strong> → "Adicionar Impressora" → digite o IP e a porta vistos no passo 1.
            </li>
            <li>
              Clique em <strong>Teste</strong> — o recibo deve sair na impressora.
            </li>
          </ol>
          <div style={{ marginTop: 12 }}>
            Mais detalhes e código-fonte em{" "}
            <a
              href="https://github.com/fabio1974/zapi10-print-bridge"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#3b82f6", fontWeight: 600 }}
            >
              github.com/fabio1974/zapi10-print-bridge
              <FiExternalLink size={12} style={{ marginLeft: 4 }} />
            </a>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function PlatformCard({
  platform,
  highlighted,
  badge,
}: {
  platform: PlatformBlock;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: highlighted ? "2px solid #3b82f6" : "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        boxShadow: highlighted ? "0 4px 12px rgba(59,130,246,0.15)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
          {platform.title}
        </h3>
        {badge && (
          <span
            style={{
              background: "#dbeafe",
              color: "#1d4ed8",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiCheckCircle size={12} />
            {badge}
          </span>
        )}
      </div>

      <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
        {platform.intro}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {platform.assets.map((asset) => (
          <a
            key={asset.filename}
            href={`${RELEASE_BASE}/${asset.filename}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              border: asset.primary ? "none" : "1px solid #e2e8f0",
              background: asset.primary ? "#3b82f6" : "#fff",
              color: asset.primary ? "#fff" : "#1e293b",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FiDownload size={18} />
            <div style={{ flex: 1 }}>
              <div>{asset.label}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  marginTop: 2,
                  color: asset.primary ? "rgba(255,255,255,0.85)" : "#64748b",
                }}
              >
                {asset.description}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

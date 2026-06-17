import { getUserName, getUserEmail } from "../../../utils/auth";

interface Props {
  /** Se passado, mostra o botão "Trocar" (troca de conta). Omitido = identidade read-only. */
  onSwitchAccount?: () => void;
  /** Alinhamento do bloco. "right" agrupa nome/e-mail/Trocar à direita (usado no banner). */
  align?: "left" | "right";
}

/**
 * "Pedindo como <nome>" + e-mail (fonte minúscula) — reforça em todo o checkout qual
 * conta está finalizando o pedido (evita a confusão de "pedi sem conta" / "conta errada").
 * Só renderiza quando há sessão logada (authToken). "Trocar" é opcional: faz sentido no
 * carrinho e no banner, mas não nos passos seguintes (trocar lá descartaria o endereço).
 */
export default function OrderingAsBadge({ onSwitchAccount, align = "left" }: Props) {
  const logged = typeof localStorage !== "undefined" && localStorage.getItem("authToken");
  const name = logged ? getUserName() : null;
  if (!name) return null;
  const email = getUserEmail();
  const right = align === "right";

  const trocarBtn = onSwitchAccount && (
    <button
      onClick={onSwitchAccount}
      style={{ border: "none", background: "transparent", color: "#2563eb", cursor: "pointer", fontWeight: 600, padding: 0, flexShrink: 0 }}
    >
      Trocar
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: right ? "flex-end" : "space-between",
        alignItems: right ? "flex-end" : "center",
        color: "#6b7280",
        padding: "0 2px",
      }}
    >
      <div style={{ minWidth: 0, textAlign: right ? "right" : "left" }}>
        <div style={{ fontSize: 13 }}>
          Pedindo como <strong style={{ color: "#374151" }}>{name}</strong>
        </div>
        {email && (
          <div style={{ fontSize: 10.5, color: "#9ca3af", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email}
          </div>
        )}
        {/* À direita, "Trocar" fica logo abaixo do e-mail. */}
        {right && trocarBtn && <div style={{ marginTop: 2, fontSize: 12.5 }}>{trocarBtn}</div>}
      </div>
      {/* À esquerda (carrinho/header), "Trocar" fica na ponta direita da linha. */}
      {!right && trocarBtn && <div style={{ marginLeft: 8 }}>{trocarBtn}</div>}
    </div>
  );
}

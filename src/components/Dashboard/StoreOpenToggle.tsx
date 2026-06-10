import React from "react";

/**
 * Switch "Loja aberta/fechada" no canto direito do breadcrumb do Dashboard (só CLIENT).
 * Componente controlado: o estado e a ação de alternar vivem no Dashboard, que
 * compartilha o mesmo `isOpen` com o badge do MyStoreCard — assim os dois
 * sincronizam ao vivo, sem refresh.
 */
interface StoreOpenToggleProps {
  isOpen: boolean | null;
  busy: boolean;
  onToggle: () => void;
}

const StoreOpenToggle: React.FC<StoreOpenToggleProps> = ({ isOpen, busy, onToggle }) => {
  if (isOpen === null) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      title={isOpen ? "Tocar para fechar a loja" : "Tocar para abrir a loja"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.35)",
        background: "rgba(255,255,255,0.12)",
        color: "#fff",
        fontSize: "0.8rem",
        fontWeight: 600,
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.7 : 1,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span>{isOpen ? "Loja aberta" : "Loja fechada"}</span>
      <span
        aria-hidden
        style={{
          width: 32,
          height: 18,
          borderRadius: 9,
          backgroundColor: isOpen ? "#22c55e" : "rgba(255,255,255,0.35)",
          position: "relative",
          transition: "background-color 0.15s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: isOpen ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            transition: "left 0.15s ease",
          }}
        />
      </span>
    </button>
  );
};

export default StoreOpenToggle;

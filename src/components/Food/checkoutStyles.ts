/** Estilos compartilhados do CheckoutWizard e seus passos (mobile-first). */

export const cs: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2200,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  },
  sheet: {
    background: "#fff", width: "100%", maxWidth: 560, height: "100dvh", maxHeight: "100dvh",
    display: "flex", flexDirection: "column",
  },
  header: {
    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
    borderBottom: "1px solid #eef0f2", flexShrink: 0,
  },
  headerTitle: { fontSize: 17, fontWeight: 800, color: "#111827", margin: 0, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  iconBtn: { border: "none", background: "transparent", color: "#374151", cursor: "pointer", padding: 4, lineHeight: 0 },
  body: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 },
  footer: {
    flexShrink: 0, borderTop: "1px solid #eef0f2", background: "#fff",
    padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8,
  },
  primaryBtn: {
    width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
    background: "#f59e0b", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  primaryBtnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  ghostBtn: {
    width: "100%", padding: "11px 0", borderRadius: 12, border: "1px solid #e5e7eb",
    background: "#fff", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  label: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7280", marginBottom: 6 },
  input: {
    width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db",
    fontSize: 15, boxSizing: "border-box", fontFamily: "inherit",
  },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, fontSize: 18, color: "#111827" },
  muted: { color: "#6b7280", fontSize: 14 },
  error: { color: "#ef4444", fontSize: 13, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 10, textAlign: "center" },
  card: { border: "1px solid #eef0f2", borderRadius: 12, padding: 12, background: "#fafafa" },
};

export const progressPct: Record<string, number> = {
  cart: 16, auth: 33, address: 50, summary: 66, pix: 84, success: 100,
};

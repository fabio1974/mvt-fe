import InfoPanel from "./InfoPanel";
import AuthTabs from "./AuthTabs";
import { useSearchParams } from "react-router-dom";
import "./LoginRegisterPage.css";

export default function LoginRegisterPage() {
  const [params] = useSearchParams();
  const reason = params.get("reason");

  return (
    <div className="login-register-layout">
      {reason === "expired" && (
        <div
          style={{
            background: "#fef3c7",
            color: "#92400e",
            padding: "12px 16px",
            borderRadius: 8,
            margin: "12px 16px 0",
            border: "1px solid #fcd34d",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          role="status"
        >
          <span>🔒</span>
          <span>Sua sessão expirou. Faça login novamente para continuar.</span>
        </div>
      )}
      <AuthTabs />
      <InfoPanel />
    </div>
  );
}

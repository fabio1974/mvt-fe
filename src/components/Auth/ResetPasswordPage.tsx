import InfoPanel from "./InfoPanel";
import ResetPasswordForm from "./ResetPasswordForm";
import "./LoginRegisterPage.css";

export default function ResetPasswordPage() {
  return (
    <div className="login-register-layout">
      <InfoPanel />
      <div
        style={{
          flex: 1,
          padding: "48px 32px",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            fontSize: "1.5rem",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Recuperar Senha
        </h2>
        <ResetPasswordForm />
      </div>
    </div>
  );
}

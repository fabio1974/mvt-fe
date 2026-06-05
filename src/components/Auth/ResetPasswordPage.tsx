import ResetPasswordForm from "./ResetPasswordForm";
import "./LoginRegisterPage.css";

export default function ResetPasswordPage() {
  return (
    <div className="login-register-layout">
      <div className="auth-panel">
        <h2>Recuperar Senha</h2>
        <ResetPasswordForm />
      </div>
    </div>
  );
}

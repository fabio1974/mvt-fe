import InfoPanel from "./InfoPanel";
import AuthTabs from "./AuthTabs";
import "./LoginRegisterPage.css";

export default function LoginRegisterPage() {
  return (
    <div className="login-register-layout">
      <AuthTabs />
      <InfoPanel />
    </div>
  );
}

import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  return (
    <div className="auth-panel">
      <div className="auth-tabs">
        <button
          className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
          onClick={() => setActiveTab("login")}
        >
          ACESSAR CONTA
        </button>
        <button
          className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          CRIAR CONTA
        </button>
      </div>
      {activeTab === "login" ? (
        <LoginForm />
      ) : (
        <RegisterForm onSuccess={() => setActiveTab("login")} />
      )}
    </div>
  );
}

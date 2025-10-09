import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  return (
    <div
      style={{
        flex: 1,
        padding: "24px 32px",
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
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        Acessar conta na Corridas da Serra
      </h2>
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}
      >
        <button
          style={{
            border: "none",
            background: "none",
            fontWeight: activeTab === "login" ? 700 : 400,
            color: activeTab === "login" ? "#0099ff" : "#888",
            borderBottom:
              activeTab === "login"
                ? "2px solid #0099ff"
                : "2px solid transparent",
            padding: "8px 24px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
          onClick={() => setActiveTab("login")}
        >
          ACESSAR CONTA
        </button>
        <button
          style={{
            border: "none",
            background: "none",
            fontWeight: activeTab === "register" ? 700 : 400,
            color: activeTab === "register" ? "#0099ff" : "#888",
            borderBottom:
              activeTab === "register"
                ? "2px solid #0099ff"
                : "2px solid transparent",
            padding: "8px 24px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
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

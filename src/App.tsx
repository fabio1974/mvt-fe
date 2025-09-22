import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./components/Home/Home";
import LoginRegisterPage from "./components/Auth/LoginRegisterPage";
import Sidebar from "./components/Sidebar/Sidebar";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

function App() {
  // Usuário está logado se existe token no localStorage
  const isLoggedIn = Boolean(localStorage.getItem("authToken"));
  // Inicializa collapsed conforme tamanho da tela
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.innerWidth <= 600
  );
  // Responsividade: força collapsed em telas pequenas
  // Responsividade: força collapsed em telas pequenas e impede expandir
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 600) {
        setSidebarCollapsed(true);
      }
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Impede expandir manualmente em telas pequenas
  useEffect(() => {
    if (window.innerWidth <= 600 && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [sidebarCollapsed]);
  const sidebarWidth = isLoggedIn ? (sidebarCollapsed ? 60 : 220) : 0;
  return (
    <div className="App" style={{ display: "flex", minHeight: "100vh" }}>
      {isLoggedIn && (
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          marginLeft: sidebarWidth,
        }}
      >
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginRegisterPage />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
}

export default App;

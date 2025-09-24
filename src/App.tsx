import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./components/Home/Home";
import LoginRegisterPage from "./components/Auth/LoginRegisterPage";
import CreateEventPage from "./components/Events/CreateEventPage";
import MyEventsPage from "./components/Events/MyEventsPage";
import EventDetailPage from "./components/Events/EventDetailPage";
import OrganizationPage from "./components/Organization/OrganizationPage";
import Sidebar from "./components/Sidebar/Sidebar";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

function App() {
  // Usuário está logado se existe token no localStorage
  const isLoggedIn = Boolean(localStorage.getItem("authToken"));
  
  // Estados do sidebar
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);
  const [sidebarVisible, setSidebarVisible] = useState(false); // Para dispositivos pequenos
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 600);

  // Controle de responsividade
  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 600;
      setIsMobile(mobile);
      
      if (mobile) {
        setSidebarCollapsed(true); // Sempre collapsed em mobile
        setSidebarVisible(false); // Oculto por padrão em mobile
      } else {
        setSidebarVisible(true); // Sempre visível em desktop
      }
    }
    
    window.addEventListener("resize", handleResize);
    handleResize(); // Executa na inicialização
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Função para toggle do sidebar em mobile
  const toggleSidebarMobile = () => {
    if (isMobile) {
      setSidebarVisible(!sidebarVisible);
    }
  };

  // Calcular largura do sidebar
  const getSidebarWidth = () => {
    if (!isLoggedIn) return 0;
    if (isMobile) return sidebarVisible ? 60 : 0;
    return sidebarCollapsed ? 60 : 220;
  };

  const sidebarWidth = getSidebarWidth();
  return (
    <div className="App" style={{ display: "flex", minHeight: "100vh" }}>
      {isLoggedIn && sidebarVisible && (
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          isMobile={isMobile}
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
        />
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          marginLeft: sidebarWidth,
          transition: "margin-left 0.3s ease"
        }}
      >
        <Header 
          isMobile={isMobile}
          isLoggedIn={isLoggedIn}
          onToggleSidebar={toggleSidebarMobile}
          sidebarVisible={sidebarVisible}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginRegisterPage />} />
          <Route path="/criar-evento" element={<CreateEventPage />} />
          <Route path="/meus-eventos" element={<MyEventsPage />} />
          <Route path="/evento/:slug" element={<EventDetailPage />} />
          <Route path="/organizacao" element={<OrganizationPage />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
}

export default App;

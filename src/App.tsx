import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import LandingPage from "./components/LandingPage/LandingPage";
import LoginRegisterPage from "./components/Auth/LoginRegisterPage";
import ResetPasswordPage from "./components/Auth/ResetPasswordPage";
import OrganizationCRUDPage from "./components/Organization/OrganizationCRUDPage";
import OrganizerOrganizationPage from "./components/Organization/OrganizerOrganizationPage";
import CourierCRUDPage from "./components/Courier/CourierCRUDPage";
import ClientCRUDPage from "./components/Client/ClientCRUDPage";
import DeliveryCRUDPage from "./components/Delivery/DeliveryCRUDPage";
import DailyPaymentPage from "./components/Delivery/DailyPaymentPage";
import OrganizerFinancialPage from "./components/Delivery/OrganizerFinancialPage";
import PaymentSuccessPage from "./components/Payment/PaymentSuccessPage";
import PaymentCancelPage from "./components/Payment/PaymentCancelPage";
import PersonalDataPage from "./components/User/PersonalDataPage";
import SiteConfigurationCRUDPage from "./components/SiteConfiguration/SiteConfigurationCRUDPage";
import SpecialZonesMapPage from "./components/SpecialZones/SpecialZonesMapPage";
import Sidebar from "./components/Sidebar/Sidebar";
import Toast from "./components/Common/Toast";
import MetadataLoader from "./components/Common/MetadataLoader";
import { MetadataProvider } from "./contexts/MetadataContext";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { registerToast } from "./utils/toast";

interface ToastState {
  message: string;
  type: "success" | "error" | "warning" | "info";
}

function App() {
  // Usuário está logado se existe token no localStorage
  const isLoggedIn = Boolean(localStorage.getItem("authToken"));

  // Estados do sidebar
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);
  const [sidebarVisible, setSidebarVisible] = useState(false); // Para dispositivos pequenos
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.innerWidth <= 600
  );

  // Estado do toast
  const [toast, setToast] = useState<ToastState | null>(null);

  // Registrar callback do toast
  useEffect(() => {
    registerToast((message, type) => {
      setToast({ message, type });
    });
  }, []);

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
    return sidebarCollapsed ? 78 : 280;
  };

  const sidebarWidth = getSidebarWidth();
  return (
    <MetadataProvider>
      <MetadataLoader>
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
              transition: "margin-left 0.3s ease",
            }}
          >
            <Header
              isMobile={isMobile}
              isLoggedIn={isLoggedIn}
              onToggleSidebar={toggleSidebarMobile}
              sidebarVisible={sidebarVisible}
              sidebarCollapsed={sidebarCollapsed}
            />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginRegisterPage />} />
              <Route path="/recuperar-senha" element={<ResetPasswordPage />} />
              <Route path="/organizacao" element={<OrganizerOrganizationPage />} />
              <Route
                path="/organizacao/gerenciar"
                element={<OrganizationCRUDPage />}
              />
              <Route path="/estabelecimentos" element={<ClientCRUDPage />} />
              <Route path="/motoboy" element={<CourierCRUDPage />} />
              <Route path="/deliveries" element={<DeliveryCRUDPage />} />
              <Route path="/pagamento-diario" element={<DailyPaymentPage />} />
              <Route path="/balanco-financeiro" element={<OrganizerFinancialPage />} />
              <Route path="/dados-pessoais" element={<PersonalDataPage />} />
              <Route path="/configuracoes" element={<SiteConfigurationCRUDPage />} />
              <Route path="/zonas-especiais" element={<SpecialZonesMapPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/cancel" element={<PaymentCancelPage />} />
            </Routes>
            <Footer isLoggedIn={isLoggedIn} sidebarWidth={sidebarWidth} />
          </div>

          {/* Toast Global */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </MetadataLoader>
    </MetadataProvider>
  );
}

export default App;

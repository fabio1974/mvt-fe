import "./App.css";
import { lazy, Suspense } from "react";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Sidebar from "./components/Sidebar/Sidebar";
import Toast from "./components/Common/Toast";
import MetadataLoader from "./components/Common/MetadataLoader";
import { MetadataProvider } from "./contexts/MetadataContext";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { registerToast } from "./utils/toast";

// Lazy load das páginas para code splitting
const LandingPage = lazy(() => import("./components/LandingPage/LandingPage"));
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const LoginRegisterPage = lazy(() => import("./components/Auth/LoginRegisterPage"));
const ResetPasswordPage = lazy(() => import("./components/Auth/ResetPasswordPage"));
const ForgotPasswordPage = lazy(() => import("./components/Auth/ForgotPasswordPage"));
const NewPasswordPage = lazy(() => import("./components/Auth/NewPasswordPage"));
const ConfirmEmailPage = lazy(() => import("./components/Auth/ConfirmEmailPage"));
const ResendConfirmationPage = lazy(() => import("./components/Auth/ResendConfirmationPage"));
const OrganizationCRUDPage = lazy(() => import("./components/Organization/OrganizationCRUDPage"));
const OrganizerOrganizationPage = lazy(() => import("./components/Organization/OrganizerOrganizationPage"));
const CourierCRUDPage = lazy(() => import("./components/Courier/CourierCRUDPage"));
const ClientCRUDPage = lazy(() => import("./components/Client/ClientCRUDPage"));
const ManagerCRUDPage = lazy(() => import("./components/Manager/ManagerCRUDPage"));
const DeliveryCRUDPage = lazy(() => import("./components/Delivery/DeliveryCRUDPage"));
const OrganizerFinancialPage = lazy(() => import("./components/Delivery/OrganizerFinancialPage"));
const PaymentSuccessPage = lazy(() => import("./components/Payment/PaymentSuccessPage"));
const PaymentCancelPage = lazy(() => import("./components/Payment/PaymentCancelPage"));
const PaymentCRUDPage = lazy(() => import("./components/Payment/PaymentCRUDPage"));
const PersonalDataPage = lazy(() => import("./components/User/PersonalDataPage"));
const AddressPage = lazy(() => import("./components/User/AddressPage"));
const ConsolidatedPaymentProcessor = lazy(() => import("./components/ConsolidatedPayment/ConsolidatedPaymentProcessor"));
const SiteConfigurationCRUDPage = lazy(() => import("./components/SiteConfiguration/SiteConfigurationCRUDPage"));
const SpecialZonesMapPage = lazy(() => import("./components/SpecialZones/SpecialZonesMapPage"));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    minHeight: "50vh",
    color: "#666"
  }}>
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 40,
        height: 40,
        border: "3px solid #e5e7eb",
        borderTop: "3px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 16px"
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      Carregando...
    </div>
  </div>
);

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
              sidebarVisible={sidebarVisible}
              sidebarCollapsed={sidebarCollapsed}
            />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={isLoggedIn ? <Dashboard /> : <LandingPage />} />
                <Route path="/login" element={<LoginRegisterPage />} />
                <Route path="/confirm-email" element={<ConfirmEmailPage />} />
                <Route path="/confirmar-email" element={<ConfirmEmailPage />} />
                <Route path="/reenviar-confirmacao" element={<ResendConfirmationPage />} />
                <Route path="/recuperar-senha" element={<ResetPasswordPage />} />
                <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
                <Route path="/nova-senha" element={<NewPasswordPage />} />
                <Route path="/organizacao" element={<OrganizerOrganizationPage />} />
                <Route
                  path="/organizacao/gerenciar"
                  element={<OrganizationCRUDPage />}
                />
                <Route path="/estabelecimentos" element={<ClientCRUDPage />} />
                <Route path="/gerentes" element={<ManagerCRUDPage />} />
                <Route path="/motoboy" element={<CourierCRUDPage />} />
                <Route path="/deliveries" element={<DeliveryCRUDPage />} />
                <Route path="/pagamentos" element={<PaymentCRUDPage />} />
                <Route path="/balanco-financeiro" element={<OrganizerFinancialPage />} />
                <Route path="/dados-pessoais" element={<PersonalDataPage />} />

                <Route path="/dados-endereco" element={<AddressPage />} />
                <Route path="/processar-pagamentos" element={<ConsolidatedPaymentProcessor />} />
                <Route path="/configuracoes" element={<SiteConfigurationCRUDPage />} />
                <Route path="/zonas-especiais" element={<SpecialZonesMapPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
              </Routes>
            </Suspense>
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

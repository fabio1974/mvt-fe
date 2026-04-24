import "./App.css";
import { lazy, Suspense } from "react";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Sidebar from "./components/Sidebar/Sidebar";
import Toast from "./components/Common/Toast";
import MetadataLoader from "./components/Common/MetadataLoader";
import { MetadataProvider } from "./contexts/MetadataContext";
import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { registerToast } from "./utils/toast";
import { getUserRole } from "./utils/auth";

// Página pública de rastreamento (sem layout autenticado)
const TrackingPage = lazy(() => import("./components/Tracking/TrackingPage"));

// Lazy load das páginas para code splitting
const LandingPage = lazy(() => import("./components/LandingPage/LandingPage"));
const PartnerPage = lazy(() => import("./components/LandingPage/PartnerPage"));
const ParceiroCliente = lazy(() => import("./components/LandingPage/ParceiroCliente"));
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const LoginRegisterPage = lazy(() => import("./components/Auth/LoginRegisterPage"));
const ResetPasswordPage = lazy(() => import("./components/Auth/ResetPasswordPage"));
const ForgotPasswordPage = lazy(() => import("./components/Auth/ForgotPasswordPage"));
const NewPasswordPage = lazy(() => import("./components/Auth/NewPasswordPage"));
const ConfirmEmailPage = lazy(() => import("./components/Auth/ConfirmEmailPage"));
const ResendConfirmationPage = lazy(() => import("./components/Auth/ResendConfirmationPage"));
const ChangePasswordPage = lazy(() => import("./components/Auth/ChangePasswordPage"));
const PublicRouteGuard = lazy(() => import("./components/Auth/PublicRouteGuard"));
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
const BankAccountPage = lazy(() => import("./components/User/BankAccountPage"));
const CourierEarningsPage = lazy(() => import("./components/Courier/CourierEarningsPage"));
const CourierWalletPage = lazy(() => import("./components/Courier/CourierWalletPage"));
const CreditCardsPage = lazy(() => import("./components/Client/CreditCardsPage"));
const PaymentPreferencePage = lazy(() => import("./components/Client/PaymentPreferencePage"));
const FoodOrderCRUDPage = lazy(() => import("./components/FoodOrder/FoodOrderCRUDPage"));
const TablesCRUDPage = lazy(() => import("./components/TableOrders/TablesCRUDPage"));
const CashReportPage = lazy(() => import("./components/Reports/CashReportPage"));
const CashRegisterPage = lazy(() => import("./components/CashRegister/CashRegisterPage"));
const CourierDebtsPage = lazy(() => import("./components/CourierDebts/CourierDebtsPage"));

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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) return saved === "true";
    return window.innerWidth <= 1024;
  });

  // Persistir estado do sidebar no localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Estado do header (collapse/expand) — só para CLIENT (estabelecimento)
  const userRole = getUserRole();
  const isClientRole = userRole === "ROLE_CLIENT" || userRole === "CLIENT";
  const [headerCollapsed, setHeaderCollapsed] = useState(() => {
    return localStorage.getItem("headerCollapsed") === "true";
  });

  // Dark theme apenas para CLIENT (estabelecimento) logado — melhora contraste em computador de restaurante
  useEffect(() => {
    const shouldUseDark = isLoggedIn && isClientRole;
    if (shouldUseDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [isLoggedIn, isClientRole]);

  useEffect(() => {
    localStorage.setItem("headerCollapsed", String(headerCollapsed));
  }, [headerCollapsed]);

  // Sincronizar headerCollapsed com localStorage (quando breadcrumb muda o valor)
  useEffect(() => {
    const onStorage = () => {
      const val = localStorage.getItem("headerCollapsed") === "true";
      setHeaderCollapsed(val);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
      const w = window.innerWidth;
      const mobile = w <= 600;
      const medium = w > 600 && w <= 1024;

      setIsMobile(mobile);

      if (mobile) {
        setSidebarCollapsed(true);
        setSidebarVisible(false);
      } else if (medium) {
        setSidebarCollapsed(true); // só ícones em telas médias
        setSidebarVisible(true);
      } else {
        // desktop largo: expande (mas só se o usuário não tiver colapsado manualmente)
        setSidebarVisible(true);
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
  const location = useLocation();

  // Rota pública de rastreamento — renderiza fora do layout principal
  if (location.pathname.startsWith("/rastreio/")) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/rastreio/:token" element={<TrackingPage />} />
        </Routes>
      </Suspense>
    );
  }

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
            className={isLoggedIn && isClientRole && headerCollapsed ? "header-hidden" : ""}
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              marginLeft: sidebarWidth,
              width: `calc(100% - ${sidebarWidth}px)`,
              boxSizing: "border-box",
              minWidth: 0,
              paddingBottom: "60px", // Espaço para o footer fixo
              transition: "margin-left 0.3s ease, width 0.3s ease",
            }}
          >
            {(!isLoggedIn || !isClientRole || !headerCollapsed) && (
              <Header
                isMobile={isMobile}
                isLoggedIn={isLoggedIn}
                sidebarVisible={sidebarVisible}
                sidebarCollapsed={sidebarCollapsed}
                headerCollapsed={headerCollapsed}
                onToggleHeader={() => setHeaderCollapsed(!headerCollapsed)}
              />
            )}
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={isLoggedIn ? <Dashboard /> : <LandingPage />} />
                <Route path="/parceiros" element={<PartnerPage />} />
                <Route path="/parceiro-cliente" element={<ParceiroCliente />} />
                <Route path="/login" element={<PublicRouteGuard><LoginRegisterPage /></PublicRouteGuard>} />
                <Route path="/confirm-email" element={<PublicRouteGuard><ConfirmEmailPage /></PublicRouteGuard>} />
                <Route path="/confirmar-email" element={<PublicRouteGuard><ConfirmEmailPage /></PublicRouteGuard>} />
                <Route path="/reenviar-confirmacao" element={<PublicRouteGuard><ResendConfirmationPage /></PublicRouteGuard>} />
                <Route path="/recuperar-senha" element={<PublicRouteGuard><ResetPasswordPage /></PublicRouteGuard>} />
                <Route path="/esqueci-senha" element={<PublicRouteGuard><ForgotPasswordPage /></PublicRouteGuard>} />
                <Route path="/nova-senha" element={<PublicRouteGuard><NewPasswordPage /></PublicRouteGuard>} />
                <Route path="/alterar-senha" element={<ChangePasswordPage />} />
                <Route path="/organizacao" element={<OrganizerOrganizationPage />} />
                <Route
                  path="/organizacao/gerenciar"
                  element={<OrganizationCRUDPage />}
                />
                <Route path="/estabelecimentos" element={<ClientCRUDPage />} />
                <Route path="/gerentes" element={<ManagerCRUDPage />} />
                <Route path="/motoboy" element={<CourierCRUDPage />} />
                <Route path="/deliveries" element={<DeliveryCRUDPage />} />
                <Route path="/pedidos" element={<FoodOrderCRUDPage />} />
                <Route path="/mesas" element={<TablesCRUDPage />} />
                <Route path="/relatorios/caixa" element={<CashReportPage />} />
                <Route path="/caixa" element={<CashRegisterPage />} />
                <Route path="/dividas-couriers" element={<CourierDebtsPage />} />
                <Route path="/pagamentos" element={<PaymentCRUDPage />} />
                <Route path="/balanco-financeiro" element={<OrganizerFinancialPage />} />
                <Route path="/dados-pessoais" element={<PersonalDataPage />} />

                <Route path="/dados-endereco" element={<AddressPage />} />
                <Route path="/processar-pagamentos" element={<ConsolidatedPaymentProcessor />} />
                <Route path="/configuracoes" element={<SiteConfigurationCRUDPage />} />
                <Route path="/zonas-especiais" element={<SpecialZonesMapPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/dados-bancarios" element={<BankAccountPage />} />
                <Route path="/meus-ganhos" element={<CourierEarningsPage />} />
                <Route path="/minha-carteira" element={<CourierWalletPage />} />
                <Route path="/meus-cartoes" element={<CreditCardsPage />} />
                <Route path="/preferencias-pagamento" element={<PaymentPreferencePage />} />
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

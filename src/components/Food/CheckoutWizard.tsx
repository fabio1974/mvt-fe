import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { PublicStore } from "../PublicMenu/publicMenuApi";
import type { FoodCart } from "./useFoodCart";
import type { DeliveryAddress, FoodOrderInfo, OrderType } from "./foodTypes";
import * as foodApi from "./foodApi";
import { cs, progressPct } from "./checkoutStyles";
import CartStep from "./steps/CartStep";
import AuthGateStep from "./steps/AuthGateStep";
import AddressStep from "./steps/AddressStep";
import SummaryStep from "./steps/SummaryStep";
import PixStep from "./steps/PixStep";
import SuccessStep from "./steps/SuccessStep";
import OrderingAsBadge from "./steps/OrderingAsBadge";
import { track } from "../PublicMenu/funnel";
import "./checkout.css";

type Step = "cart" | "auth" | "address" | "summary" | "pix" | "success";

/**
 * Considera logado SÓ se houver token E ele não estiver expirado. Antes checava só a
 * existência — um token vencido (ou de conta deletada, pego depois via 401) fazia o
 * wizard PULAR o login e morrer no "Authentication required" no resumo. A validade real
 * (assinatura/usuário existe) é confirmada pelo BE; aqui só descartamos o óbvio (exp).
 */
const isAuthed = () => {
  const t = localStorage.getItem("authToken");
  if (!t) return false;
  try {
    const payload = t.split(".")[1] || "";
    const exp = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))?.exp;
    if (exp && exp * 1000 < Date.now()) return false; // expirado
  } catch {
    return false; // token malformado = inútil
  }
  return true;
};

const AUTH_KEYS = [
  "authToken", "userId", "userName", "userEmail", "userRole",
  "organizationId", "latitude", "longitude", "userAddress",
];

interface Props {
  store: PublicStore;
  cart: FoodCart;
  onClose: () => void;
}

/**
 * Checkout do Zapi-Food (web). Máquina de passos: carrinho → [auth] → endereço →
 * resumo → PIX → sucesso. PICKUP pula o endereço. A auth acontece AQUI (callback,
 * sem reload), então o carrinho/estado sobrevive. Reusado pelo funil público e
 * pelo dashboard.
 */
export default function CheckoutWizard({ store, cart, onClose }: Props) {
  const [step, setStep] = useState<Step>("cart");
  const [fulfillment, setFulfillment] = useState<OrderType>("DELIVERY");
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [order, setOrder] = useState<FoodOrderInfo | null>(null);
  const [pendingOrder, setPendingOrder] = useState<FoodOrderInfo | null>(null);
  // Força recomputar a identidade exibida no CartStep ao trocar de conta.
  const [authNonce, setAuthNonce] = useState(0);

  // Guard de pedido pendente (parity com mobile): se já há um PIX aguardando, oferece
  // retomar em vez de criar outro. Só pra quem está logado.
  useEffect(() => {
    if (!isAuthed()) return;
    let cancelled = false;
    foodApi
      .getMyPendingOrder()
      .then((o) => {
        if (!cancelled && o && o.customerPaymentStatus === "PENDING") setPendingOrder(o);
      })
      .catch(() => {
        /* sem pendente / erro — segue normal */
      });
    return () => {
      cancelled = true;
    };
  }, [authNonce]);

  // Funil: cada passo do checkout vira um evento (checkout_step_<step>).
  useEffect(() => {
    track("checkout_step_" + step);
  }, [step]);

  const afterAuth = (): Step => (fulfillment === "PICKUP" ? "summary" : "address");

  const fromCart = () => {
    if (!isAuthed()) return setStep("auth");
    setStep(afterAuth());
  };

  const switchAccount = () => {
    AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    setPendingOrder(null);
    setAuthNonce((n) => n + 1);
    setStep("auth");
  };

  const resumePending = () => {
    if (!pendingOrder) return;
    setOrder(pendingOrder);
    setStep("pix");
  };

  const close = () => {
    if (step === "success") cart.clear();
    onClose();
  };

  const titles: Record<Step, string> = {
    cart: "Seu pedido",
    auth: "Entrar",
    address: "Endereço",
    summary: "Resumo",
    pix: "Pagamento",
    success: "Pronto!",
  };

  return (
    <div style={cs.overlay} onClick={(e) => e.target === e.currentTarget && step !== "pix" && close()}>
      <div className="fco-sheet-desktop" style={cs.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={cs.header}>
          <h2 style={cs.headerTitle}>{titles[step]}</h2>
          <button style={cs.iconBtn} onClick={close} aria-label="Fechar">
            <X size={22} />
          </button>
        </div>
        <div className="fco-progress">
          <div className="fco-progress-fill" style={{ width: `${progressPct[step]}%` }} />
        </div>

        {/* Identidade do pedido em todos os passos (auto-oculta se não logado). "Trocar"
            só no carrinho — trocar de conta nos passos seguintes descartaria o endereço. */}
        <div style={{ padding: "8px 16px 0" }}>
          <OrderingAsBadge key={authNonce} onSwitchAccount={step === "cart" ? switchAccount : undefined} />
        </div>

        {step === "cart" && (
          <CartStep
            store={store}
            cart={cart}
            fulfillment={fulfillment}
            setFulfillment={setFulfillment}
            onContinue={fromCart}
            pendingOrder={pendingOrder}
            onResumePending={resumePending}
          />
        )}
        {step === "auth" && (
          <AuthGateStep onAuthenticated={() => { setAuthNonce((n) => n + 1); setStep(afterAuth()); }} onBack={() => setStep("cart")} />
        )}
        {step === "address" && (
          <AddressStep
            initial={address}
            onConfirm={(a) => {
              setAddress(a);
              setStep("summary");
            }}
            onBack={() => setStep("cart")}
          />
        )}
        {step === "summary" && (
          <SummaryStep
            store={store}
            cart={cart}
            fulfillment={fulfillment}
            deliveryAddress={address}
            onSubmit={(o) => {
              track("order_placed");
              setOrder(o);
              if (o.pixQrCode) {
                setStep("pix");
              } else {
                track("checkout_step_success"); // não-PIX: pedido já concluído na tela
                setStep("success");
              }
            }}
            onAuthExpired={switchAccount}
            onBack={() => setStep(fulfillment === "PICKUP" ? "cart" : "address")}
          />
        )}
        {step === "pix" && order && (
          <PixStep
            order={order}
            onPaid={(o) => {
              track("checkout_step_success"); // PIX confirmado na tela
              setOrder(o);
              setStep("success");
            }}
          />
        )}
        {step === "success" && order && (
          <SuccessStep order={order} store={store} fulfillment={fulfillment} onClose={close} />
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { CheckCircle2, Smartphone } from "lucide-react";
import type { PublicStore } from "../../PublicMenu/publicMenuApi";
import type { FoodOrderInfo, OrderType } from "../foodTypes";
import { brl } from "../foodTypes";
import { cs } from "../checkoutStyles";
import AppDownloadModal from "../../PublicMenu/AppDownloadModal";

interface Props {
  order: FoodOrderInfo;
  store: PublicStore;
  fulfillment: OrderType;
  onClose: () => void;
}

export default function SuccessStep({ order, store, fulfillment, onClose }: Props) {
  const isPickup = fulfillment === "PICKUP";
  const [appOpen, setAppOpen] = useState(false);
  return (
    <>
      <div style={{ ...cs.body, alignItems: "center", textAlign: "center", justifyContent: "center" }}>
        <CheckCircle2 size={64} color="#16a34a" />
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Pedido confirmado! 🎉</h2>
        <p style={cs.muted}>
          Pedido #{order.id} · {brl(order.total)} — pagamento confirmado.
        </p>

        {order.deliveryCode && (
          <div style={{ ...cs.card, width: "100%", textAlign: "center" }}>
            <div style={cs.label}>{isPickup ? "Código de retirada" : "Código de entrega"}</div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 4, color: "#111827" }}>{order.deliveryCode}</div>
            <div style={{ ...cs.muted, fontSize: 12 }}>
              {isPickup ? "Informe na loja ao retirar." : "Informe ao entregador na chegada."}
            </div>
          </div>
        )}

        {isPickup ? (
          <p style={cs.muted}>Retire em <strong>{store.name}</strong>. Avisaremos quando estiver pronto.</p>
        ) : (
          <p style={cs.muted}>Acompanhe a preparação e a entrega em tempo real pelo app.</p>
        )}
      </div>

      <div style={cs.footer}>
        <button style={cs.primaryBtn} onClick={() => setAppOpen(true)}>
          <Smartphone size={18} /> Acompanhar pelo app
        </button>
        <button style={cs.ghostBtn} onClick={onClose}>Concluir aqui</button>
      </div>

      <AppDownloadModal
        open={appOpen}
        onClose={() => setAppOpen(false)}
        storeName={store.name}
        lines={[]}
        total={0}
      />
    </>
  );
}

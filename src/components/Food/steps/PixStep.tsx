import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import type { FoodOrderInfo } from "../foodTypes";
import { brl } from "../foodTypes";
import * as foodApi from "../foodApi";
import { cs } from "../checkoutStyles";

interface Props {
  order: FoodOrderInfo;
  onPaid: (order: FoodOrderInfo) => void;
}

/**
 * Pagamento PIX: mostra o QR (imagem do BE) + copia-e-cola, e faz polling do
 * pedido a cada 5s até customerPaymentStatus virar PAID (igual ao CheckoutScreen
 * do mobile). FAILED/CANCELLED mostra erro.
 */
export default function PixStep({ order, onPaid }: Props) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const paidRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const o = await foodApi.getOrderById(order.id);
        if (cancelled || paidRef.current) return;
        if (o.customerPaymentStatus === "PAID") {
          paidRef.current = true;
          onPaid(o);
        } else if (o.customerPaymentStatus === "FAILED" || o.customerPaymentStatus === "CANCELLED") {
          setFailed(true);
        }
      } catch {
        /* ignora erro de rede pontual no polling */
      }
    };
    const id = setInterval(tick, 5000);
    tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [order.id, onPaid]);

  const copy = async () => {
    if (!order.pixQrCode) return;
    try {
      await navigator.clipboard.writeText(order.pixQrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard indisponível */
    }
  };

  return (
    <div style={cs.body}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#111827" }}>Pague com PIX</h2>
        <p style={cs.muted}>Pedido #{order.id} · {brl(order.total)}</p>
      </div>

      {order.pixQrCodeUrl ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img
            src={order.pixQrCodeUrl}
            alt="QR Code PIX"
            style={{ width: 220, height: 220, borderRadius: 12, border: "1px solid #eef0f2" }}
          />
        </div>
      ) : (
        <p style={{ ...cs.muted, textAlign: "center" }}>Use o código copia-e-cola abaixo no seu banco.</p>
      )}

      {order.pixQrCode && (
        <button style={{ ...cs.ghostBtn, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={copy}>
          {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
          {copied ? "Código copiado!" : "Copiar código PIX"}
        </button>
      )}

      {failed ? (
        <div style={cs.error}>O pagamento não foi confirmado (falhou ou expirou). Você pode tentar de novo.</div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#6b7280", fontSize: 14 }}>
          <Loader2 size={16} className="pm-spin-inline" />
          Aguardando confirmação do pagamento…
        </div>
      )}

      <p style={{ ...cs.muted, textAlign: "center", fontSize: 12 }}>
        Assim que o PIX cair, seu pedido vai automaticamente pra cozinha.
      </p>
    </div>
  );
}

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AddressMapPicker, type AddressData } from "../../Common/AddressMapPicker";
import type { DeliveryAddress } from "../foodTypes";
import { cs } from "../checkoutStyles";

interface Props {
  initial?: DeliveryAddress | null;
  onConfirm: (addr: DeliveryAddress) => void;
  onBack: () => void;
}

/**
 * Endereço de entrega — reusa o AddressMapPicker (mapa + pin + reverse-geocode +
 * autocomplete + "usar minha localização") e adiciona complemento/número/referência.
 * Exige latitude/longitude (pra calcular o frete) e um texto de endereço.
 */
export default function AddressStep({ initial, onConfirm, onBack }: Props) {
  const [addr, setAddr] = useState<AddressData>(() => ({
    address: initial?.address ?? "",
    latitude: initial?.latitude ?? 0,
    longitude: initial?.longitude ?? 0,
    city: "",
    state: "",
    zipCode: "",
    number: initial?.number ?? "",
  }));
  const [complement, setComplement] = useState(initial?.complement ?? "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [referencePoint, setReferencePoint] = useState(initial?.referencePoint ?? "");
  const [error, setError] = useState("");

  const hasCoords = addr.latitude !== 0 || addr.longitude !== 0;
  const hasAddress = addr.address.trim() !== "";
  const canConfirm = hasCoords && hasAddress;

  const confirm = () => {
    if (!canConfirm) {
      setError("Posicione o pin no mapa e confirme o endereço.");
      return;
    }
    onConfirm({
      address: addr.address.trim(),
      latitude: addr.latitude,
      longitude: addr.longitude,
      complement: complement.trim() || undefined,
      number: number.trim() || undefined,
      referencePoint: referencePoint.trim() || undefined,
    });
  };

  return (
    <>
      <div style={cs.body}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Endereço de entrega</h2>
          <p style={cs.muted}>Arraste o mapa pra posicionar o pin no seu endereço.</p>
        </div>

        <AddressMapPicker value={addr} onChange={setAddr} />

        <div>
          <div style={cs.label}>Número</div>
          <input style={cs.input} inputMode="numeric" placeholder="Ex: 123" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <div>
          <div style={cs.label}>Complemento (opcional)</div>
          <input style={cs.input} placeholder="Apto, bloco, casa..." value={complement} onChange={(e) => setComplement(e.target.value)} />
        </div>
        <div>
          <div style={cs.label}>Ponto de referência (opcional)</div>
          <input style={cs.input} placeholder="Perto de..." value={referencePoint} onChange={(e) => setReferencePoint(e.target.value)} />
        </div>

        {error && <div style={cs.error}>{error}</div>}
      </div>

      <div style={cs.footer}>
        <button style={{ ...cs.primaryBtn, ...(canConfirm ? {} : cs.primaryBtnDisabled) }} disabled={!canConfirm} onClick={confirm}>
          Continuar
        </button>
        <button style={cs.ghostBtn} onClick={onBack}>
          <ChevronLeft size={14} style={{ verticalAlign: "middle" }} /> Voltar
        </button>
      </div>
    </>
  );
}

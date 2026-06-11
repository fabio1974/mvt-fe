import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageOff, MapPin, X } from "lucide-react";
import type { PublicStore } from "../PublicMenu/publicMenuApi";
import * as foodApi from "./foodApi";
import { cs } from "./checkoutStyles";

interface Props {
  onClose: () => void;
}

/** Coordenadas do usuário: geolocalização do navegador → fallback no que a sessão
 *  guardou (persistAuthSession) → fallback Fortaleza. */
function getCoords(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    const fallback = () => {
      const la = parseFloat(localStorage.getItem("latitude") || "");
      const lo = parseFloat(localStorage.getItem("longitude") || "");
      if (!Number.isNaN(la) && !Number.isNaN(lo) && (la !== 0 || lo !== 0)) {
        resolve({ lat: la, lng: lo });
      } else {
        resolve({ lat: -3.7327, lng: -38.5267 });
      }
    };
    if (!("geolocation" in navigator)) return fallback();
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => fallback(),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  });
}

/**
 * Lista de lojas Zapi-Food próximas (dashboard). Ao escolher uma loja, navega pro
 * cardápio público `/c/<slug>` — que já tem menu + addons + checkout (o passo de
 * auth se pula porque o usuário está logado). Reuso total, sem duplicar a MenuView.
 */
export default function StorePickerModal({ onClose }: Props) {
  const navigate = useNavigate();
  const [stores, setStores] = useState<PublicStore[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { lat, lng } = await getCoords();
        const list = await foodApi.getStores({ lat, lng });
        if (!cancelled) setStores(list);
      } catch {
        if (!cancelled) setError("Não foi possível carregar as lojas próximas.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openStore = (s: PublicStore) => {
    if (!s.slug) return;
    onClose();
    navigate(`/c/${s.slug}`);
  };

  return (
    <div style={cs.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...cs.sheet, maxWidth: 480, height: "auto", maxHeight: "85vh", borderRadius: 16, margin: 16 }} onClick={(e) => e.stopPropagation()}>
        <div style={cs.header}>
          <h2 style={cs.headerTitle}>Fazer um pedido</h2>
          <button style={cs.iconBtn} onClick={onClose} aria-label="Fechar">
            <X size={22} />
          </button>
        </div>

        <div style={cs.body}>
          {error && <div style={cs.error}>{error}</div>}

          {!stores && !error && <p style={cs.muted}>Buscando lojas perto de você…</p>}

          {stores && stores.length === 0 && (
            <p style={cs.muted}>Nenhuma loja Zapi-Food num raio próximo. Tente mais tarde.</p>
          )}

          {stores?.map((s) => {
            const open = s.isOpenNow !== false;
            const disabled = !s.slug;
            return (
              <button
                key={s.id}
                onClick={() => openStore(s)}
                disabled={disabled}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                  padding: 12, borderRadius: 12, border: "1px solid #eef0f2", background: "#fff",
                  cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <ImageOff size={22} color="#9ca3af" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                    <span style={{ color: open ? "#16a34a" : "#ef4444", fontWeight: 600 }}>{open ? "Aberto" : "Fechado"}</span>
                    {s.distanceKm != null && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={12} /> {s.distanceKm} km
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

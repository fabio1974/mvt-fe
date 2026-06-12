import { useState } from "react";
import type { SlideCallout } from "./promotionsData";

interface PhoneMockupProps {
  /** caminho do screenshot em public/, ex.: "/promocoes/passo-3-cupom.png" */
  image?: string;
  /** rótulo do placeholder enquanto o screenshot real não existir */
  screenLabel?: string;
  /** balão explicativo sobre a tela */
  callout?: SlideCallout;
}

/**
 * Frame de celular envolvendo um screenshot real do app. Enquanto o PNG real não
 * existir em public/promocoes/, mostra um placeholder rotulado — assim a página
 * fica pronta e basta soltar a imagem depois.
 */
export default function PhoneMockup({ image, screenLabel, callout }: PhoneMockupProps) {
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !image || imgError;

  return (
    <div className="pp-phone">
      <div className="pp-phone-notch" />
      <div className="pp-phone-screen">
        {showPlaceholder ? (
          <div className="pp-screen-placeholder">
            <div className="pp-screen-placeholder-icon">🖼️</div>
            <div className="pp-screen-placeholder-label">{screenLabel || "Screenshot do app"}</div>
            <div className="pp-screen-placeholder-hint">screenshot em breve</div>
          </div>
        ) : (
          <img
            src={image}
            alt={screenLabel || "Tela do app Zapi10"}
            className="pp-screen-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {callout && (
          <div
            className={`pp-callout pp-callout-${callout.align || "center"}`}
            style={{ top: callout.top || "44%" }}
          >
            <span className="pp-callout-text">{callout.text}</span>
            <span className="pp-callout-arrow" />
          </div>
        )}
      </div>
    </div>
  );
}

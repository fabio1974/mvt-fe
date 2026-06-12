import { useRef, useState } from "react";
import type { Campaign, CampaignSlide } from "./promotionsData";
import PhoneMockup from "./PhoneMockup";
import { APP_STORE_URL, PLAY_STORE_URL } from "../PublicMenu/platform";

interface CampaignDeckProps {
  campaign: Campaign;
}

/**
 * Deck de slides de uma campanha — navegação manual (swipe no mobile, setas e
 * bolinhas no desktop, setas do teclado quando o deck está focado).
 */
export default function CampaignDeck({ campaign }: CampaignDeckProps) {
  const slides = campaign.slides;
  const last = slides.length - 1;
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const go = (i: number) => setIndex(Math.max(0, Math.min(last, i)));
  const prev = () => go(index - 1);
  const next = () => go(index + 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };

  return (
    <div
      className="pp-deck"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="group"
      aria-roledescription="carrossel"
      aria-label={`Como funciona: ${campaign.name}`}
    >
      <div className="pp-viewport">
        <div className="pp-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((slide, i) => (
            <div className="pp-slide" key={i} aria-hidden={i !== index}>
              {renderSlide(slide, campaign)}
            </div>
          ))}
        </div>
      </div>

      <button
        className="pp-arrow pp-arrow-prev"
        onClick={prev}
        disabled={index === 0}
        aria-label="Slide anterior"
      >
        ‹
      </button>
      <button
        className="pp-arrow pp-arrow-next"
        onClick={next}
        disabled={index === last}
        aria-label="Próximo slide"
      >
        ›
      </button>

      <div className="pp-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`pp-dot${i === index ? " pp-dot-active" : ""}`}
            onClick={() => go(i)}
            aria-label={`Ir para o slide ${i + 1}`}
            aria-current={i === index}
          />
        ))}
      </div>
    </div>
  );
}

function renderSlide(slide: CampaignSlide, campaign: Campaign) {
  if (slide.kind === "intro") {
    return (
      <div className="pp-slide-intro">
        <div className="pp-kicker pp-kicker-dark">{campaign.badge}</div>
        <div className="pp-bigoff">{campaign.highlight}</div>
        <div className="pp-intro-sub">
          na sua <b>primeira compra</b> de comida 🍔
        </div>
        {campaign.code && (
          <div className="pp-coupon">
            <span className="pp-coupon-tag">🎟️ cupom</span> {campaign.code}
          </div>
        )}
        <div className="pp-fineprint">{campaign.terms}</div>
        <div className="pp-swipe-hint">arraste para ver como funciona →</div>
      </div>
    );
  }

  if (slide.kind === "cta") {
    return (
      <div className="pp-slide-cta">
        <div className="pp-kicker">Baixe agora e aproveite</div>
        <h3 className="pp-cta-title">Comida boa, com R$15 de desconto</h3>
        <div className="pp-store-buttons">
          <a className="pp-store-btn" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
             App Store
          </a>
          <a className="pp-store-btn" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
            ▶ Google Play
          </a>
        </div>
        {campaign.code && (
          <div className="pp-cta-note">
            Use o cupom <b>{campaign.code}</b> no carrinho.
          </div>
        )}
      </div>
    );
  }

  // step
  return (
    <div className="pp-slide-step">
      <div className="pp-step-text">
        <div className="pp-step-chip">Passo {slide.stepNumber}</div>
        <h3 className="pp-step-title">{slide.title}</h3>
        <p className="pp-step-caption">{slide.caption}</p>
      </div>
      <PhoneMockup image={slide.image} screenLabel={slide.screenLabel} callout={slide.callout} />
    </div>
  );
}

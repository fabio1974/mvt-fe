import { useEffect } from "react";
import { Link } from "react-router-dom";
import LOGO_PATH from "../../config/logo";
import BrandMark from "../Brand/BrandMark";
import BrandName from "../Brand/BrandName";
import { CAMPAIGNS } from "./promotionsData";
import CampaignDeck from "./CampaignDeck";
import "./Promotions.css";

const PAGE_TITLE = "Promoções Zapi10 — descontos no app de comida";
const PAGE_DESC =
  "Aproveite as promoções do Zapi10. Hoje: R$15 de desconto na primeira compra de comida com o cupom ZAPI10.";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function PromotionsPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    const ogImage =
      typeof window !== "undefined" ? `${window.location.origin}${LOGO_PATH}` : LOGO_PATH;
    const url = typeof window !== "undefined" ? window.location.href : "";

    upsertMeta("name", "description", PAGE_DESC);
    upsertMeta("property", "og:title", PAGE_TITLE);
    upsertMeta("property", "og:description", PAGE_DESC);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:url", url);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", PAGE_TITLE);
    upsertMeta("name", "twitter:description", PAGE_DESC);

    return () => {
      document.title = prevTitle;
    };
  }, []);

  const activeCount = CAMPAIGNS.filter((c) => c.active).length;

  return (
    <div className="pp-page">
      <header className="pp-topbar">
        <Link to="/" className="pp-brand" aria-label="Zapi10 — início">
          <BrandMark onDark height={30} />
        </Link>
        <Link to="/" className="pp-topbar-link">
          Voltar ao site
        </Link>
      </header>

      <section className="pp-hero">
        <span className="pp-hero-kicker">Promoções</span>
        <h1 className="pp-hero-title">
          Promoções <BrandName onDark />
        </h1>
        <p className="pp-hero-sub">
          {activeCount > 0
            ? "Aproveite as campanhas ativas — é só baixar o app e usar."
            : "Nenhuma campanha ativa no momento. Volte em breve!"}
        </p>
      </section>

      <main className="pp-campaigns">
        {CAMPAIGNS.map((campaign) => (
          <section className="pp-campaign" key={campaign.id}>
            <div className="pp-campaign-head">
              <span className="pp-badge">{campaign.badge}</span>
              <h2 className="pp-campaign-name">
                {campaign.name}
                {!campaign.active && <span className="pp-tag-ended">encerrada</span>}
              </h2>
              <p className="pp-campaign-tagline">{campaign.tagline}</p>
            </div>
            <CampaignDeck campaign={campaign} />
          </section>
        ))}
      </main>

      <footer className="pp-foot">
        <p className="pp-foot-note">
          As regras de cada promoção valem enquanto a campanha estiver ativa. Sujeito a
          disponibilidade na sua região.
        </p>
        <p className="pp-foot-copy">© {new Date().getFullYear()} Moveltrack Sistemas · <BrandName onDark /></p>
      </footer>
    </div>
  );
}

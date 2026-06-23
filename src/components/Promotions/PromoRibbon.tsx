import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicPromo, promoDiscountLabel, type PublicPromoCoupon } from "../Food/foodApi";
import "./PromoRibbon.css";

/**
 * Faixa diagonal (45°) no canto superior direito da landing, por cima do header,
 * chamando atenção pra promoção de 1ª compra. Clica → /promocoes. CSS puro.
 *
 * O valor do desconto vem da campanha no BE (/coupons/public/promo) — nada fixo.
 * Se não houver promoção ativa/válida com verba, a faixa simplesmente não aparece.
 *
 * Enquanto montada (e com promo), marca o <body> com `has-promo-ribbon` pra abrir
 * espaço à direita do header (senão a faixa cobre o botão "Entrar").
 */
export default function PromoRibbon() {
  const [promo, setPromo] = useState<PublicPromoCoupon | null>(null);

  useEffect(() => {
    let alive = true;
    getPublicPromo().then((p) => {
      if (alive) setPromo(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!promo) return;
    document.body.classList.add("has-promo-ribbon");
    return () => document.body.classList.remove("has-promo-ribbon");
  }, [promo]);

  if (!promo) return null;

  const label = promoDiscountLabel(promo);

  return (
    <div className="promo-ribbon-wrap">
      <Link
        to="/promocoes"
        className="promo-ribbon"
        aria-label={`Promoção: ${label} na primeira compra — ver promoções`}
      >
        <span className="promo-ribbon-l1">{label}</span>
        <span className="promo-ribbon-l2">1ª compra →</span>
      </Link>
    </div>
  );
}

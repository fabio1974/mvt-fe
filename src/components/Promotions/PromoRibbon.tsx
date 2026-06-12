import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./PromoRibbon.css";

/**
 * Faixa diagonal (45°) no canto superior direito da landing, por cima do header,
 * chamando atenção pra promoção de 1ª compra. Clica → /promocoes.
 * CSS puro (texto nítido, sem IA).
 *
 * Enquanto montada, marca o <body> com `has-promo-ribbon` pra abrir espaço à
 * direita do header (senão a faixa cobre o botão "Entrar"). Some ao desmontar.
 */
export default function PromoRibbon() {
  useEffect(() => {
    document.body.classList.add("has-promo-ribbon");
    return () => document.body.classList.remove("has-promo-ribbon");
  }, []);

  return (
    <div className="promo-ribbon-wrap">
      <Link
        to="/promocoes"
        className="promo-ribbon"
        aria-label="Promoção: R$15 de desconto na primeira compra — ver promoções"
      >
        <span className="promo-ribbon-l1">R$15 OFF</span>
        <span className="promo-ribbon-l2">1ª compra →</span>
      </Link>
    </div>
  );
}

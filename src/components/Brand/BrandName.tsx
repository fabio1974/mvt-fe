import type { CSSProperties } from "react";
import "./BrandName.css";

interface BrandNameProps {
  /**
   * true quando o nome fica sobre fundo ESCURO: aplica o degradê branco→azul
   * sutil (igual ao logo escuro). Sem isso (fundo claro), as letras herdam a cor
   * do texto (navy/escuro). O "i" laranja é constante nos dois casos.
   */
  onDark?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Nome "Zapi10" para TEXTO CORRIDO (frases/títulos), sem virar imagem.
 * Segue a paleta do logo: "i" laranja (#FB7600) + (em fundo escuro) degradê
 * branco→azul nas demais letras. Para o LOGOTIPO use <BrandMark/>.
 */
export default function BrandName({ onDark = false, className, style }: BrandNameProps) {
  const cls = `zapi-brand${onDark ? " zapi-brand-ondark" : ""}${className ? " " + className : ""}`;
  return (
    <span className={cls} style={style}>
      Zap<span className="zapi-brand-i">i</span>10
    </span>
  );
}

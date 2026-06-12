import type { CSSProperties } from "react";
import "./BrandName.css";

interface BrandNameProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Nome "Zapi10" para TEXTO CORRIDO (dentro de frases/títulos), sem virar imagem.
 * Segue a paleta do logo: o "i" em laranja (#FB7600, a assinatura da marca) + negrito.
 * As demais letras herdam a cor do texto ao redor — então funciona igual em fundo
 * claro ou escuro, sem precisar saber o contexto.
 *
 * Para o LOGOTIPO (header, rodapé, topo de página), use <BrandMark/> em vez deste.
 */
export default function BrandName({ className, style }: BrandNameProps) {
  return (
    <span className={`zapi-brand${className ? " " + className : ""}`} style={style}>
      Zap<span className="zapi-brand-i">i</span>10
    </span>
  );
}

import type { CSSProperties } from "react";
import wordmarkLight from "../../assets/zapi10-wordmark-light.png";
import wordmarkDark from "../../assets/zapi10-wordmark-dark.png";

interface BrandMarkProps {
  /** true quando o logo fica sobre fundo ESCURO (usa a versão branca/degradê). */
  onDark?: boolean;
  /** altura do wordmark em px (a largura é automática). */
  height?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Marca oficial "Zapi10" — fonte ÚNICA do wordmark em todas as páginas públicas.
 * Mesmo logotipo em duas versões (mesma tipografia + pingo laranja do "i"):
 *  - fundo claro  -> navy com degradê (zapi10-wordmark-light.png)
 *  - fundo escuro -> branco com degradê azul (zapi10-wordmark-dark.png)
 *
 * Gerados a partir do logo da TV — ver marketing/brand/make_dark_logo.py.
 * Para clicar/navegar, envolva num <Link>/<a> no chamador.
 */
export default function BrandMark({ onDark = false, height = 32, className, style }: BrandMarkProps) {
  return (
    <img
      src={onDark ? wordmarkDark : wordmarkLight}
      alt="Zapi10"
      className={className}
      style={{ height, width: "auto", display: "block", ...style }}
    />
  );
}

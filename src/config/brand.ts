/**
 * Paleta oficial da marca Zapi10 — FONTE ÚNICA DE VERDADE.
 *
 * Estes hex são "travados" pelo teste src/tests/brand-palette.test.ts: mudar
 * qualquer valor aqui (ou nos CSS que os usam) quebra o build de propósito, pra
 * evitar drift acidental da identidade visual. Mudança real = atualizar este
 * arquivo E o teste, conscientemente.
 *
 * Componentes da marca: src/components/Brand/BrandMark (logotipo) e BrandName
 * (nome em texto corrido). Geração dos logos: marketing/brand/make_dark_logo.py.
 */
export const BRAND = {
  /** fundo escuro base (TV/promo) */
  navy: "#0f172a",
  /** fundo escuro 2 — cards/superfícies */
  navy2: "#1e293b",
  /** acento azul da identidade (TV/promo) */
  cyan: "#22d3ee",
  /** laranja de acento de UI (TV/promo, landing) */
  orange: "#f59e0b",
  /** laranja do "i" do logo/wordmark (usado no BrandName) */
  orangeMark: "#fb7600",
  /** texto suave sobre fundo escuro */
  muted: "#cbd5e1",
} as const;

export type BrandColor = keyof typeof BRAND;

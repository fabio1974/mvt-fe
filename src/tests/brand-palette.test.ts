import { describe, it, expect } from "vitest";
import { BRAND } from "../config/brand";
import brandNameCss from "../components/Brand/BrandName.css?raw";
import promotionsCss from "../components/Promotions/Promotions.css?raw";
import wordmarkLight from "../assets/zapi10-wordmark-light.png";
import wordmarkDark from "../assets/zapi10-wordmark-dark.png";

/**
 * LOCK da paleta de marca Zapi10.
 *
 * Trava os hex oficiais E garante que os CSS reais (BrandName, Promotions) e os
 * assets do logo continuem usando esses valores. Se alguém alterar a identidade
 * sem querer, este teste quebra no build (o script "build" roda vitest antes).
 *
 * Lê os CSS via `?raw` do Vite (sem node:fs) pra typecheckar no tsconfig do app.
 */
const lower = (s: string) => s.toLowerCase();

describe("lock da paleta de marca", () => {
  it("BRAND mantém os hex oficiais travados", () => {
    expect(BRAND).toEqual({
      navy: "#0f172a",
      navy2: "#1e293b",
      cyan: "#22d3ee",
      orange: "#f59e0b",
      orangeMark: "#fb7600",
      muted: "#cbd5e1",
    });
  });

  it('BrandName usa o laranja do "i" do logo', () => {
    expect(lower(brandNameCss)).toContain(BRAND.orangeMark);
  });

  it("Promotions.css declara os tokens da paleta (sem drift)", () => {
    const css = lower(promotionsCss);
    expect(css).toContain(`--navy: ${BRAND.navy}`);
    expect(css).toContain(`--navy-2: ${BRAND.navy2}`);
    expect(css).toContain(`--cyan: ${BRAND.cyan}`);
    expect(css).toContain(`--orange: ${BRAND.orange}`);
    expect(css).toContain(`--muted: ${BRAND.muted}`);
  });

  it("os dois wordmarks (claro/escuro) existem para o BrandMark", () => {
    expect(wordmarkLight).toBeTruthy();
    expect(wordmarkDark).toBeTruthy();
  });
});

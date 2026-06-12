import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND } from "../config/brand";

/**
 * LOCK da paleta de marca Zapi10.
 *
 * Trava os hex oficiais E garante que os CSS reais (BrandName, Promotions) e os
 * assets do logo continuem usando esses valores. Se alguém alterar a identidade
 * sem querer, este teste quebra no build (o script "build" roda vitest antes).
 */
const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(resolve(here, rel), "utf8").toLowerCase();

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
    const css = read("../components/Brand/BrandName.css");
    expect(css).toContain(BRAND.orangeMark);
  });

  it("Promotions.css declara os tokens da paleta (sem drift)", () => {
    const css = read("../components/Promotions/Promotions.css");
    expect(css).toContain(`--navy: ${BRAND.navy}`);
    expect(css).toContain(`--navy-2: ${BRAND.navy2}`);
    expect(css).toContain(`--cyan: ${BRAND.cyan}`);
    expect(css).toContain(`--orange: ${BRAND.orange}`);
    expect(css).toContain(`--muted: ${BRAND.muted}`);
  });

  it("os dois wordmarks (claro/escuro) existem para o BrandMark", () => {
    expect(existsSync(resolve(here, "../assets/zapi10-wordmark-light.png"))).toBe(true);
    expect(existsSync(resolve(here, "../assets/zapi10-wordmark-dark.png"))).toBe(true);
  });
});

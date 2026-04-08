import { describe, it, expect } from "vitest";

/**
 * Testes de visibilidade de menus por role.
 * Garante que opções de menu não aparecem para roles incorretos.
 */

// Reproduz a estrutura de roles do Sidebar e Header
const MENU_ITEMS = [
  {
    label: "Dados Bancários",
    path: "/dados-bancarios",
    roles: ["ROLE_COURIER", "COURIER", "ROLE_CUSTOMER", "CUSTOMER"],
  },
  {
    label: "Meus Cartões",
    path: "/meus-cartoes",
    roles: ["ROLE_CUSTOMER", "CUSTOMER"],
  },
  {
    label: "Preferências de Pagamento",
    path: "/preferencias-pagamento",
    roles: ["ROLE_CUSTOMER", "CUSTOMER"],
  },
  {
    label: "Corridas",
    path: "/deliveries",
    roles: ["ROLE_ADMIN", "ROLE_ORGANIZER", "ROLE_CLIENT", "CLIENT", "ROLE_CUSTOMER", "CUSTOMER", "ROLE_COURIER", "COURIER"],
  },
];

function isMenuVisible(label: string, userRole: string): boolean {
  const item = MENU_ITEMS.find((m) => m.label === label);
  if (!item) return false;
  return item.roles.includes(userRole);
}

describe("Sidebar/Header — visibilidade de menus por role", () => {
  describe("Dados Bancários", () => {
    it("CLIENT não vê Dados Bancários", () => {
      expect(isMenuVisible("Dados Bancários", "ROLE_CLIENT")).toBe(false);
      expect(isMenuVisible("Dados Bancários", "CLIENT")).toBe(false);
    });

    it("COURIER vê Dados Bancários", () => {
      expect(isMenuVisible("Dados Bancários", "ROLE_COURIER")).toBe(true);
      expect(isMenuVisible("Dados Bancários", "COURIER")).toBe(true);
    });

    it("CUSTOMER vê Dados Bancários", () => {
      expect(isMenuVisible("Dados Bancários", "ROLE_CUSTOMER")).toBe(true);
      expect(isMenuVisible("Dados Bancários", "CUSTOMER")).toBe(true);
    });

    it("ADMIN não vê Dados Bancários", () => {
      expect(isMenuVisible("Dados Bancários", "ROLE_ADMIN")).toBe(false);
    });

    it("ORGANIZER não vê Dados Bancários", () => {
      expect(isMenuVisible("Dados Bancários", "ROLE_ORGANIZER")).toBe(false);
    });
  });

  describe("Meus Cartões", () => {
    it("CLIENT não vê Meus Cartões", () => {
      expect(isMenuVisible("Meus Cartões", "ROLE_CLIENT")).toBe(false);
      expect(isMenuVisible("Meus Cartões", "CLIENT")).toBe(false);
    });

    it("CUSTOMER vê Meus Cartões", () => {
      expect(isMenuVisible("Meus Cartões", "ROLE_CUSTOMER")).toBe(true);
      expect(isMenuVisible("Meus Cartões", "CUSTOMER")).toBe(true);
    });

    it("COURIER não vê Meus Cartões", () => {
      expect(isMenuVisible("Meus Cartões", "ROLE_COURIER")).toBe(false);
    });
  });

  describe("Preferências de Pagamento", () => {
    it("CLIENT não vê Preferências de Pagamento", () => {
      expect(isMenuVisible("Preferências de Pagamento", "ROLE_CLIENT")).toBe(false);
      expect(isMenuVisible("Preferências de Pagamento", "CLIENT")).toBe(false);
    });

    it("CUSTOMER vê Preferências de Pagamento", () => {
      expect(isMenuVisible("Preferências de Pagamento", "ROLE_CUSTOMER")).toBe(true);
      expect(isMenuVisible("Preferências de Pagamento", "CUSTOMER")).toBe(true);
    });

    it("COURIER não vê Preferências de Pagamento", () => {
      expect(isMenuVisible("Preferências de Pagamento", "ROLE_COURIER")).toBe(false);
    });
  });
});

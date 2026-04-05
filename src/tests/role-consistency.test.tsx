import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import RegisterForm from "../components/Auth/RegisterForm";

// Mock do módulo api
vi.mock("../services/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock do useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

/**
 * Testes de consistencia de roles no RegisterForm.
 *
 * Garante que os roles disponíveis para seleção no frontend
 * correspondem aos roles validos no backend (User.Role enum).
 * Previne erros como o MANAGER → ORGANIZER.
 */
describe("Role Consistency - RegisterForm", () => {
  // Roles validos no backend
  const BACKEND_VALID_ROLES = [
    "USER",
    "ORGANIZER",
    "ADMIN",
    "CLIENT",
    "COURIER",
    "CUSTOMER",
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("o select de role contem ORGANIZER como opcao", () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const roleSelect = screen.getByRole("combobox");
    const options = Array.from(
      roleSelect.querySelectorAll("option")
    ) as HTMLOptionElement[];
    const optionValues = options.map((o) => o.value).filter((v) => v !== "");

    expect(optionValues).toContain("ORGANIZER");
  });

  it("o select de role NAO contem MANAGER", () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const roleSelect = screen.getByRole("combobox");
    const options = Array.from(
      roleSelect.querySelectorAll("option")
    ) as HTMLOptionElement[];
    const optionValues = options.map((o) => o.value);

    expect(optionValues).not.toContain("MANAGER");
  });

  it("todos os roles do select sao validos no backend", () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const roleSelect = screen.getByRole("combobox");
    const options = Array.from(
      roleSelect.querySelectorAll("option")
    ) as HTMLOptionElement[];
    const optionValues = options
      .map((o) => o.value)
      .filter((v) => v !== "");

    for (const role of optionValues) {
      expect(BACKEND_VALID_ROLES).toContain(role);
    }
  });
});

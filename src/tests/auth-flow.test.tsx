import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import RegisterForm from "../components/Auth/RegisterForm";
import { api } from "../services/api";

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
 * Testes unitários de auth — rodam no build (deploy).
 * Fluxos visuais completos (login, logout) estão nos testes E2E (Playwright).
 */
describe("Auth - Register Form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("formulário de registro renderiza com campos obrigatórios", () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText("Nome e sobrenome")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // role select
    expect(screen.getByRole("button", { name: /cadastrar/i })).toBeInTheDocument();
  });

  it("validação: nome obrigatório exibe mensagem de erro", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    // Preenche apenas email para disparar validação do nome
    await user.type(screen.getByPlaceholderText("admin@test.com"), "test@example.com");

    await user.click(screen.getByRole("button", { name: /cadastrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
    });
  });

  it("select de role contém ORGANIZER e não MANAGER", () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")) as HTMLOptionElement[];
    const values = options.map((o) => o.value).filter((v) => v !== "");

    expect(values).toContain("ORGANIZER");
    expect(values).not.toContain("MANAGER");
  });

  it("registro envia payload correto para o backend (mock)", async () => {
    const user = userEvent.setup();

    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: "Cadastro realizado!" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    await user.type(screen.getByPlaceholderText("Nome e sobrenome"), "João Teste");
    await user.type(screen.getByPlaceholderText("000.000.000-00"), "039.056.943-79");
    await user.type(screen.getByPlaceholderText("admin@test.com"), "joao@test.com");
    await user.selectOptions(screen.getByRole("combobox"), "ORGANIZER");

    // Senha: preenche todos os campos de password
    const passwordFields = screen.getAllByPlaceholderText("••••••");
    await user.type(passwordFields[0], "Teste@123");
    if (passwordFields.length > 1) {
      await user.type(passwordFields[1], "Teste@123");
    }

    await user.click(screen.getByRole("button", { name: /cadastrar/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/auth/register",
        expect.objectContaining({
          name: "João Teste",
          username: "joao@test.com",
          role: "ORGANIZER",
        })
      );
    });
  });
});

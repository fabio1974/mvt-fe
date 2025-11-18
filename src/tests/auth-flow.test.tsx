import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import RegisterForm from "../components/Auth/RegisterForm";
import LoginForm from "../components/Auth/LoginForm";
import { api } from "../services/api";

// Mock do módulo api
vi.mock("../services/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock do useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Auth Flow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("Register and Login Flow", () => {
    it("should register a new organizer user and then login successfully", async () => {
      const user = userEvent.setup();

      // ===== FASE 1: REGISTRO =====
      const { unmount: unmountRegister } = render(
        <BrowserRouter>
          <RegisterForm />
        </BrowserRouter>
      );

      // Mock da resposta de registro bem-sucedido
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { message: "Usuário registrado com sucesso!" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      // Preencher formulário de registro
      const nameInput = screen.getByPlaceholderText(
        /digite seu nome completo/i
      );
      const emailInput = screen.getByPlaceholderText(/digite seu e-mail/i);
      const passwordInput = screen.getByPlaceholderText(/digite sua senha/i);
      const roleSelect = screen.getByRole("combobox");

      await user.type(nameInput, "João Organizador");
      await user.type(emailInput, "joao.org@example.com");
      await user.type(passwordInput, "senha123");
      await user.selectOptions(roleSelect, "ORGANIZER");

      // Submeter formulário
      const registerButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(registerButton);

      // Verificar que a API foi chamada corretamente
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/auth/register", {
          name: "João Organizador",
          username: "joao.org@example.com",
          password: "senha123",
          role: "ORGANIZER",
        });
      });

      // Verificar mensagem de sucesso
      await waitFor(() => {
        expect(
          screen.getByText(/usuário registrado com sucesso/i)
        ).toBeInTheDocument();
      });

      unmountRegister();

      // ===== FASE 2: LOGIN =====
      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      // Criar um JWT fake com payload contendo role e organizationId
      // Formato JWT: header.payload.signature
      const fakeJWTPayload = {
        sub: "joao.org@example.com",
        authorities: ["ROLE_ORGANIZER"],
        organizationId: 42,
        exp: Math.floor(Date.now() / 1000) + 3600, // Expira em 1 hora
      };

      // Encode do payload em base64
      const base64Payload = btoa(JSON.stringify(fakeJWTPayload));
      const fakeToken = `fake-header.${base64Payload}.fake-signature`;

      // Mock da resposta de login bem-sucedido
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          token: fakeToken,
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      // Preencher formulário de login
      const loginEmailInput = screen.getByPlaceholderText(/digite seu e-mail/i);
      const loginPasswordInput =
        screen.getByPlaceholderText(/digite sua senha/i);

      await user.type(loginEmailInput, "joao.org@example.com");
      await user.type(loginPasswordInput, "senha123");

      // Submeter formulário
      const loginButton = screen.getByRole("button", { name: /entrar/i });
      await user.click(loginButton);

      // Verificar que a API foi chamada corretamente
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/auth/login", {
          username: "joao.org@example.com",
          password: "senha123",
        });
      });

      // Verificar que o token foi salvo no localStorage
      await waitFor(() => {
        expect(localStorage.getItem("authToken")).toBe(fakeToken);
      });

      // Verificar mensagem de sucesso
      await waitFor(() => {
        expect(
          screen.getByText(/login realizado com sucesso/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when registering with existing email", async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <RegisterForm />
        </BrowserRouter>
      );

      // Mock de erro 409 (conflito - email já existe)
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: "E-mail já cadastrado no sistema" },
        },
      });

      // Preencher formulário
      await user.type(
        screen.getByPlaceholderText(/digite seu nome completo/i),
        "Teste User"
      );
      await user.type(
        screen.getByPlaceholderText(/digite seu e-mail/i),
        "existing@example.com"
      );
      await user.type(
        screen.getByPlaceholderText(/digite sua senha/i),
        "senha123"
      );

      // Submeter
      const registerButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(registerButton);

      // Verificar mensagem de erro
      await waitFor(() => {
        expect(
          screen.getByText(/erro ao registrar usuário/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when login with invalid credentials", async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      // Mock de erro 401 (credenciais inválidas)
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: "Credenciais inválidas" },
        },
      });

      // Preencher formulário
      await user.type(
        screen.getByPlaceholderText(/digite seu e-mail/i),
        "wrong@example.com"
      );
      await user.type(
        screen.getByPlaceholderText(/digite sua senha/i),
        "wrongpassword"
      );

      // Submeter
      const loginButton = screen.getByRole("button", { name: /entrar/i });
      await user.click(loginButton);

      // Verificar mensagem de erro
      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
      });

      // Verificar que nada foi salvo no localStorage
      expect(localStorage.getItem("authToken")).toBeNull();
    });
  });

  describe("Form Validation", () => {
    it("should validate required fields in register form", async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <RegisterForm />
        </BrowserRouter>
      );

      // Preencher apenas o email (deixando nome e senha vazios)
      const emailInput = screen.getByPlaceholderText(/digite seu e-mail/i);
      await user.type(emailInput, "test@example.com");

      // Tentar submeter
      const registerButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(registerButton);

      // Verificar mensagens de validação dos campos obrigatórios
      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
      });
    });

    it("should validate password minimum length", async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <RegisterForm />
        </BrowserRouter>
      );

      // Preencher com senha muito curta
      const passwordInput = screen.getByPlaceholderText(/digite sua senha/i);
      await user.type(passwordInput, "123");

      // Tentar submeter
      const registerButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(registerButton);

      // Verificar mensagem de validação
      await waitFor(() => {
        expect(
          screen.getByText(/senha deve ter no mínimo 6 caracteres/i)
        ).toBeInTheDocument();
      });
    });
  });
});

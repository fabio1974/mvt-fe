import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { api } from "../services/api";
import { splitEmails, resultLabel } from "../components/Manager/organizerInvites";
import CreatePasswordPage from "../components/Auth/CreatePasswordPage";
import { USER_TYPE_OPTIONS, sanitizePublicRole } from "../config/userTypes";
import { mustChangePassword } from "../utils/auth";

vi.mock("../services/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

/** JWT fake (só o payload importa: o front decodifica sem verificar). */
function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "HS256" })}.${b64(payload)}.sig`;
}

describe("Convite de gerente — cadastro público sem ORGANIZER", () => {
  it("opções de cadastro público não oferecem Gerente", () => {
    expect(USER_TYPE_OPTIONS.map((o) => o.value)).not.toContain("ORGANIZER");
  });

  it("?role=ORGANIZER (link antigo) é ignorado; papéis públicos passam", () => {
    expect(sanitizePublicRole("ORGANIZER")).toBeUndefined();
    expect(sanitizePublicRole("organizer")).toBeUndefined();
    expect(sanitizePublicRole("ADMIN")).toBeUndefined();
    expect(sanitizePublicRole("courier")).toBe("COURIER");
    expect(sanitizePublicRole(null)).toBeUndefined();
  });
});

describe("Convite de gerente — tela do admin (helpers)", () => {
  it("separa e-mails por vírgula, ponto e vírgula, espaço e linha", () => {
    expect(splitEmails("a@x.com, b@y.com\nc@z.com; d@w.com  ")).toEqual(["a@x.com", "b@y.com", "c@z.com", "d@w.com"]);
    expect(splitEmails("   ")).toEqual([]);
  });

  it("rótulo do resultado: conta nova / reenviado / outro papel / e-mail não enviado", () => {
    expect(resultLabel({ email: "a", contaNova: true, enviado: true, erro: null }).text).toBe("Conta nova — e-mail enviado");
    expect(resultLabel({ email: "a", contaNova: false, enviado: true, erro: null }).text).toBe("Reenviado — e-mail enviado");
    expect(resultLabel({ email: "a", contaNova: false, enviado: false, erro: "Este e-mail já tem uma conta de outro tipo." }).text)
      .toBe("Este e-mail já tem uma conta de outro tipo.");
    expect(resultLabel({ email: "a", contaNova: true, enviado: false, erro: "Não foi possível enviar o e-mail agora." }).text)
      .toContain("Conta nova — e-mail não enviado");
  });
});

describe("Primeiro acesso — troca obrigatória da senha temporária", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("mustChangePassword lê o claim do JWT", () => {
    expect(mustChangePassword()).toBe(false);
    localStorage.setItem("authToken", fakeJwt({ sub: "g@x.com", mustChangePassword: true }));
    expect(mustChangePassword()).toBe(true);
    localStorage.setItem("authToken", fakeJwt({ sub: "g@x.com", mustChangePassword: false }));
    expect(mustChangePassword()).toBe(false);
  });

  it("Criar sua senha: envia senha temporária + nova e grava o token novo", async () => {
    localStorage.setItem("authToken", fakeJwt({ sub: "g@x.com", mustChangePassword: true }));
    vi.mocked(api.get).mockResolvedValue({ data: { mustChangePassword: true } } as never);
    const newToken = fakeJwt({ sub: "g@x.com", mustChangePassword: false });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { token: newToken, user: { mustChangePassword: false } } } as never);
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreatePasswordPage />
      </BrowserRouter>
    );

    expect(screen.getByText("CRIAR SUA SENHA")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Senha temporária"), "Temp1234abcd");
    await user.type(screen.getByPlaceholderText("Nova senha"), "MinhaSenha1");
    await user.type(screen.getByPlaceholderText("Repita a nova senha"), "MinhaSenha1");
    await user.click(screen.getByRole("button", { name: /criar senha/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/change-password", {
        currentPassword: "Temp1234abcd",
        newPassword: "MinhaSenha1",
      });
    });
    await waitFor(() => expect(localStorage.getItem("authToken")).toBe(newToken));
    expect(mustChangePassword()).toBe(false);
  });

  it("Criar sua senha: senhas diferentes não enviam", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { mustChangePassword: true } } as never);
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <CreatePasswordPage />
      </BrowserRouter>
    );
    await user.type(screen.getByPlaceholderText("Senha temporária"), "Temp1234abcd");
    await user.type(screen.getByPlaceholderText("Nova senha"), "MinhaSenha1");
    await user.type(screen.getByPlaceholderText("Repita a nova senha"), "Outra12345");
    await user.click(screen.getByRole("button", { name: /criar senha/i }));
    expect(await screen.findByText("As senhas não coincidem")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("Criar sua senha: mostra a mensagem do backend (ex.: SAME_PASSWORD)", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { mustChangePassword: true } } as never);
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { error: "SAME_PASSWORD", message: "A nova senha precisa ser diferente da atual." } },
    });
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <CreatePasswordPage />
      </BrowserRouter>
    );
    await user.type(screen.getByPlaceholderText("Senha temporária"), "Temp1234abcd");
    await user.type(screen.getByPlaceholderText("Nova senha"), "Temp1234abcd");
    await user.type(screen.getByPlaceholderText("Repita a nova senha"), "Temp1234abcd");
    await user.click(screen.getByRole("button", { name: /criar senha/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("A nova senha precisa ser diferente da atual.");
  });
});

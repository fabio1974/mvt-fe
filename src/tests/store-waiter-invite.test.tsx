import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { api } from "../services/api";
import { INVITE_KINDS, resultLabel } from "../components/Manager/organizerInvites";
import AccountInvitesPage from "../components/Manager/AccountInvitesPage";
import { USER_TYPE_OPTIONS, INVITE_ONLY_NOTICE, sanitizePublicRole } from "../config/userTypes";

vi.mock("../services/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "HS256" })}.${b64(payload)}.sig`;
}

describe("Cadastro público: só Cliente e Motorista / Entregador", () => {
  it("opções do cadastro não oferecem loja, garçom nem gerente", () => {
    expect(USER_TYPE_OPTIONS.map((o) => o.value)).toEqual(["CUSTOMER", "COURIER"]);
  });

  it("COURIER aparece como 'Motorista / Entregador' com a descrição nova", () => {
    const courier = USER_TYPE_OPTIONS.find((o) => o.value === "COURIER");
    expect(courier?.label).toBe("Motorista / Entregador");
    expect(courier?.description).toBe("Faço entregas ou levo passageiros, de moto ou de carro");
  });

  it("?role=CLIENT / WAITER (links antigos) são ignorados", () => {
    expect(sanitizePublicRole("CLIENT")).toBeUndefined();
    expect(sanitizePublicRole("waiter")).toBeUndefined();
    expect(sanitizePublicRole("customer")).toBe("CUSTOMER");
  });

  it("aviso de convite", () => {
    expect(INVITE_ONLY_NOTICE).toBe("Gerente, loja ou garçom? Essas contas entram por convite.");
  });
});

describe("Convite de estabelecimento / motorista / garçom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("endpoints por tipo", () => {
    expect(INVITE_KINDS.store.endpoint).toBe("/api/account-invites/stores");
    expect(INVITE_KINDS.courier.endpoint).toBe("/api/account-invites/couriers");
    expect(INVITE_KINDS.waiter.endpoint).toBe("/api/account-invites/waiters");
    expect(INVITE_KINDS.organizer.endpoint).toBe("/api/admin/organizer-invites");
  });

  it("rótulo: conta existente vira convite de vínculo", () => {
    expect(
      resultLabel({ email: "a", contaNova: false, enviado: false, erro: null, vinculo: "CONVITE_PENDENTE" }).text
    ).toContain("convite de vínculo");
  });

  it("gerente convida loja: POST sem organizationId (o grupo é o dele)", async () => {
    localStorage.setItem("authToken", fakeJwt({ sub: "g@x.com", authorities: ["ROLE_ORGANIZER"] }));
    vi.mocked(api.get).mockResolvedValue({ data: [] } as never);
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { convites: [{ email: "loja@x.com", contaNova: true, enviado: true, erro: null, vinculo: "VINCULADO" }], invalidos: [] },
    } as never);
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AccountInvitesPage kind="store" />
      </BrowserRouter>
    );
    expect(screen.queryByLabelText("Grupo")).toBeNull();
    await user.type(screen.getByLabelText(/E-mails/), "loja@x.com");
    await user.click(screen.getByRole("button", { name: /Enviar convite/ }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/api/account-invites/stores", { emails: ["loja@x.com"] })
    );
    expect(await screen.findByText(/Conta nova — e-mail enviado/)).toBeTruthy();
  });

  it("admin convida motorista: exige o grupo e manda organizationId", async () => {
    localStorage.setItem("authToken", fakeJwt({ sub: "admin@x.com", authorities: ["ROLE_ADMIN"] }));
    vi.mocked(api.get).mockImplementation(((url: string) =>
      Promise.resolve({ data: url === "/api/organizations" ? { content: [{ id: 7, name: "Grupo Sete" }] } : [] })) as never);
    vi.mocked(api.post).mockResolvedValueOnce({ data: { convites: [], invalidos: [] } } as never);
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AccountInvitesPage kind="courier" />
      </BrowserRouter>
    );
    await user.type(screen.getByLabelText(/E-mails/), "m@x.com");
    await user.click(screen.getByRole("button", { name: /Enviar convite/ }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Escolha o grupo.");
    expect(api.post).not.toHaveBeenCalled();
    await screen.findByRole("option", { name: "Grupo Sete" });
    await user.selectOptions(screen.getByLabelText("Grupo"), "7");
    await user.click(screen.getByRole("button", { name: /Enviar convite/ }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/api/account-invites/couriers", { emails: ["m@x.com"], organizationId: 7 })
    );
  });

  it("admin convida garçom: exige o estabelecimento", async () => {
    localStorage.setItem("authToken", fakeJwt({ sub: "admin@x.com", authorities: ["ROLE_ADMIN"] }));
    vi.mocked(api.get).mockResolvedValue({ data: [] } as never);
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AccountInvitesPage kind="waiter" />
      </BrowserRouter>
    );
    await user.type(screen.getByLabelText(/E-mails/), "w@x.com");
    await user.click(screen.getByRole("button", { name: /Enviar convite/ }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Escolha o estabelecimento.");
    expect(api.post).not.toHaveBeenCalled();
  });
});

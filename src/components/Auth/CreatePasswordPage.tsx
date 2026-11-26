import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../services/api";
import { FormField, FormButton, FormPasswordInput } from "../Common/FormComponents";
import { persistAuthSession, type AuthUser } from "../../utils/auth";
import "./LoginRegisterPage.css";

interface CreatePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Mínimo de caracteres da senha (mesmo do cadastro; o BE valida igual). */
const MIN_LENGTH = 6;

function errorMessage(err: unknown): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data) {
    if (/current password is incorrect/i.test(data)) return "A senha temporária está incorreta.";
    return data;
  }
  if (data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string") {
    return (data as { message: string }).message;
  }
  return "Não foi possível criar a senha. Tente de novo.";
}

function logout() {
  localStorage.clear();
  window.location.href = "/login";
}

/**
 * "Criar sua senha" — primeiro acesso do gerente convidado pelo admin. Enquanto a senha for
 * a temporária do e-mail, o App só renderiza esta tela (guard central) e o BE bloqueia as
 * demais rotas com 403 PASSWORD_CHANGE_REQUIRED.
 */
export default function CreatePasswordPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePasswordFormData>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const newPassword = watch("newPassword");

  // Confere no BE (fonte da verdade): se a senha já foi trocada (ex.: pelo app), o token
  // daqui ficou com o claim antigo — pede para entrar de novo.
  useEffect(() => {
    api
      .get<{ mustChangePassword?: boolean }>("/auth/me")
      .then((r) => {
        if (r.data && r.data.mustChangePassword === false) setAlreadyDone(true);
      })
      .catch(() => {
        /* 401 cai no overlay de sessão expirada */
      });
  }, []);

  const onSubmit = async (data: CreatePasswordFormData) => {
    setError("");
    setSuccess("");
    try {
      const res = await api.post<{ token?: string; user?: AuthUser }>("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (res.data?.token) persistAuthSession(res.data.token, res.data.user);
      setSuccess("Senha criada! Entrando...");
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="login-register-layout" style={{ gridTemplateColumns: "1fr", minHeight: "100vh" }}>
      <div className="auth-panel" style={{ background: "#f9f9f9", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <div className="auth-tabs">
          <div className="auth-tab active" style={{ cursor: "default", flex: 1 }}>
            CRIAR SUA SENHA
          </div>
        </div>

        {alreadyDone ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
            <p>Sua senha já foi criada. Entre de novo com a senha nova.</p>
            <FormButton type="button" variant="primary" onClick={logout}>
              Entrar de novo
            </FormButton>
          </div>
        ) : (
          <form
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
              Bem-vindo(a) ao Zapi10! Para continuar, troque a senha temporária que você recebeu por e-mail
              por uma senha sua.
            </p>

            <FormField label="Senha temporária (do e-mail)" required error={errors.currentPassword?.message}>
              <FormPasswordInput
                placeholder="Senha temporária"
                autoComplete="current-password"
                {...register("currentPassword", { required: "Informe a senha temporária" })}
              />
            </FormField>

            <FormField label="Nova senha" required error={errors.newPassword?.message}>
              <FormPasswordInput
                placeholder="Nova senha"
                autoComplete="new-password"
                {...register("newPassword", {
                  required: "Informe a nova senha",
                  minLength: { value: MIN_LENGTH, message: `A senha deve ter no mínimo ${MIN_LENGTH} caracteres` },
                })}
              />
            </FormField>

            <FormField label="Confirmar nova senha" required error={errors.confirmPassword?.message}>
              <FormPasswordInput
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                {...register("confirmPassword", {
                  required: "Confirme a nova senha",
                  validate: (v) => v === newPassword || "As senhas não coincidem",
                })}
              />
            </FormField>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <FormButton type="button" variant="secondary" onClick={logout} style={{ flex: 1 }}>
                Sair
              </FormButton>
              <FormButton type="submit" variant="primary" disabled={isSubmitting} style={{ flex: 2 }}>
                {isSubmitting ? "Salvando..." : "Criar senha"}
              </FormButton>
            </div>

            {error && (
              <div role="alert" style={{ color: "#ef4444", textAlign: "center" }}>
                {error}
              </div>
            )}
            {success && <div style={{ color: "#16a34a", textAlign: "center" }}>{success}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

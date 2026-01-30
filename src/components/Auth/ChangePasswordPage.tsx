import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useState } from "react";
import { FormField, FormButton, FormPasswordInput } from "../Common/FormComponents";
import "./LoginRegisterPage.css";

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ChangePasswordFormData>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const newPassword = watch("newPassword");

  const onSubmit = async (data: ChangePasswordFormData) => {
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setSuccess("Senha alterada com sucesso!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "Erro ao alterar senha. Verifique a senha atual.";
      setError(message);
    }
  };

  return (
    <div className="login-register-layout" style={{ gridTemplateColumns: "1fr" }}>
      <div className="auth-panel" style={{ background: "#f9f9f9" }}>
        <div className="auth-tabs">
          <div className="auth-tab active" style={{ cursor: "default", flex: 1 }}>
            ALTERAR SENHA
          </div>
        </div>

        <form
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
          onSubmit={handleSubmit(onSubmit)}
        >
          <FormField label="Senha Atual" required error={errors.currentPassword?.message}>
            <FormPasswordInput
              placeholder="Digite sua senha atual"
              {...register("currentPassword", {
                required: "Senha atual é obrigatória",
              })}
            />
          </FormField>

          <FormField label="Nova Senha" required error={errors.newPassword?.message}>
            <FormPasswordInput
              placeholder="Digite a nova senha"
              {...register("newPassword", {
                required: "Nova senha é obrigatória",
                minLength: {
                  value: 6,
                  message: "Senha deve ter no mínimo 6 caracteres",
                },
              })}
            />
          </FormField>

          <FormField label="Confirmar Nova Senha" required error={errors.confirmPassword?.message}>
            <FormPasswordInput
              placeholder="Confirme a nova senha"
              {...register("confirmPassword", {
                required: "Confirmação de senha é obrigatória",
                validate: (value) =>
                  value === newPassword || "As senhas não coincidem",
              })}
            />
          </FormField>

          <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
            <FormButton
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              style={{
                flex: 1,
                padding: "14px 0",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              Cancelar
            </FormButton>
            <FormButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              style={{
                flex: 2,
                background: "linear-gradient(90deg, #5b4cfa, #4c9aff)",
                color: "#fff",
                padding: "14px 0",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "1rem",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(91, 76, 250, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              {isSubmitting ? "Salvando..." : "Salvar Nova Senha"}
            </FormButton>
          </div>

          {error && (
            <div
              style={{
                color: "#ef4444",
                textAlign: "center",
                fontSize: "0.9rem",
                padding: 12,
                background: "#fef2f2",
                borderRadius: 8,
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                color: "#10b981",
                textAlign: "center",
                fontSize: "0.9rem",
                padding: 12,
                background: "#f0fdf4",
                borderRadius: 8,
                border: "1px solid #bbf7d0",
              }}
            >
              {success}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

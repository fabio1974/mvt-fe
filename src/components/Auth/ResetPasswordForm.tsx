import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useState } from "react";
import { FormField, FormInput, FormButton } from "../Common/FormComponents";

interface ResetPasswordFormData {
  username: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const newPassword = watch("newPassword");

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/reset-password", {
        username: data.username,
        newPassword: data.newPassword,
      });

      setSuccess("Senha alterada com sucesso! Redirecionando para o login...");

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      // Extrair mensagens de erro do backend
      let errorMessage = "";

      if (err && typeof err === "object" && "response" in err) {
        const response = (
          err as {
            response?: {
              data?: {
                fieldErrors?: Record<string, string>;
                message?: string;
                error?: string;
              };
            };
          }
        ).response;

        if (response?.data) {
          const { fieldErrors, message, error } = response.data;

          // Prioridade 1: fieldErrors - erros específicos de cada campo
          if (fieldErrors && Object.keys(fieldErrors).length > 0) {
            errorMessage = Object.entries(fieldErrors)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join("; ");
          }
          // Prioridade 2: message - mensagem geral
          else if (message) {
            errorMessage = message;
          }
          // Prioridade 3: error
          else if (error) {
            errorMessage = error;
          }
        }
      }
      // Prioridade 4: mensagem genérica do erro
      else if (err && typeof err === "object" && "message" in err) {
        errorMessage = (err as { message: string }).message;
      }

      // Fallback
      if (!errorMessage) {
        errorMessage =
          "Erro ao alterar senha. Verifique se o email existe e tente novamente.";
      }

      setError(errorMessage);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: 12,
          fontSize: "0.9rem",
        }}
      >
        Digite seu e-mail e defina uma nova senha para sua conta.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <FormField label="E-mail" required error={errors.username?.message}>
          <FormInput
            type="email"
            placeholder="Digite seu e-mail"
            {...register("username", {
              required: "E-mail é obrigatório",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "E-mail inválido",
              },
            })}
          />
        </FormField>

        <FormField
          label="Nova Senha"
          required
          error={errors.newPassword?.message}
        >
          <FormInput
            type="password"
            placeholder="Digite sua nova senha"
            {...register("newPassword", {
              required: "Nova senha é obrigatória",
              minLength: {
                value: 6,
                message: "A senha deve ter pelo menos 6 caracteres",
              },
            })}
          />
        </FormField>

        <FormField
          label="Confirmar Nova Senha"
          required
          error={errors.confirmPassword?.message}
        >
          <FormInput
            type="password"
            placeholder="Confirme sua nova senha"
            {...register("confirmPassword", {
              required: "Confirmação de senha é obrigatória",
              validate: (value) =>
                value === newPassword || "As senhas não coincidem",
            })}
          />
        </FormField>

        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 24 }}
        >
          <FormButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            style={{
              width: "100%",
              background: "linear-gradient(90deg, #0099ff, #006dc7)",
              color: "#fff",
              padding: "14px 0",
              borderRadius: "14px",
              fontWeight: 600,
              fontSize: "1rem",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 8px 22px -6px rgba(0,153,255,0.5)",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 26px -6px rgba(0,153,255,0.55)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 22px -6px rgba(0,153,255,0.5)";
            }}
          >
            {isSubmitting ? "Alterando senha..." : "Alterar Senha"}
          </FormButton>
        </div>
      </form>

      {error && (
        <div
          style={{ color: "#e74c3c", textAlign: "center", fontSize: "0.9rem" }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{ color: "#0099ff", textAlign: "center", fontSize: "0.9rem" }}
        >
          {success}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            color: "#0099ff",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
}

import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useState } from "react";
import { FormField, FormInput, FormButton } from "../Common/FormComponents";

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setSuccess("");
    try {
      const response = await api.post<{ token: string }>("/auth/login", {
        username: data.username,
        password: data.password,
      });
      if (response.data && response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        setSuccess("Login realizado com sucesso!");
        setTimeout(() => {
          navigate("/");
          window.location.reload();
        }, 1000);
      } else {
        setError("Token não recebido. Verifique a resposta da API.");
      }
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
        errorMessage = "Erro ao fazer login.";
      }

      setError(errorMessage);
    }
  };

  return (
    <form
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
      onSubmit={handleSubmit(onSubmit)}
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

      <FormField label="Senha" required error={errors.password?.message}>
        <FormInput
          type="password"
          placeholder="Digite sua senha"
          {...register("password", {
            required: "Senha é obrigatória",
            minLength: {
              value: 6,
              message: "Senha deve ter no mínimo 6 caracteres",
            },
          })}
        />
      </FormField>

      <div style={{ marginTop: 8 }}>
        <FormButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          style={{
            width: "100%",
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
          {isSubmitting ? "Enviando..." : "Entrar"}
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

      <div style={{ textAlign: "center", marginTop: 12, fontSize: "0.9rem", color: "#666" }}>
        Esqueceu sua senha?{" "}
        <a
          href="/recuperar-senha"
          style={{
            color: "#5b4cfa",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Clique aqui
        </a>
      </div>
    </form>
  );
}

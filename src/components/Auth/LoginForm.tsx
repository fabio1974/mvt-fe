import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useState } from "react";
import { FormField, FormInput, FormButton, FormPasswordInput } from "../Common/FormComponents";

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
  const [isNotActivatedError, setIsNotActivatedError] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setSuccess("");
    setIsNotActivatedError(false);
    try {
      const response = await api.post<{
        token: string;
        user?: {
          userId?: string;
          username?: string;
          name?: string;
          role?: string;
          organizationId?: string;
          organizationName?: string;
          latitude?: number;
          longitude?: number;
          address?: string;
        };
      }>("/auth/login", {
        username: data.username,
        password: data.password,
      });
      if (response.data && response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        
        // Salva informações adicionais do usuário
        if (response.data.user) {
          if (response.data.user.userId) {
            localStorage.setItem("userId", response.data.user.userId);
          }
          if (response.data.user.name) {
            localStorage.setItem("userName", response.data.user.name);
          }
          if (response.data.user.username) {
            localStorage.setItem("userEmail", response.data.user.username);
          }
          if (response.data.user.role) {
            localStorage.setItem("userRole", response.data.user.role);
          }
          if (response.data.user.organizationId) {
            localStorage.setItem("organizationId", response.data.user.organizationId);
          }
          // 🗺️ Salva coordenadas do endereço do usuário (latitude/longitude)
          if (response.data.user.latitude !== undefined) {
            localStorage.setItem("latitude", String(response.data.user.latitude));
          }
          if (response.data.user.longitude !== undefined) {
            localStorage.setItem("longitude", String(response.data.user.longitude));
          }
          // 📍 Salva endereço completo do usuário
          if (response.data.user.address) {
            localStorage.setItem("userAddress", response.data.user.address);
          }
        }
        
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
              data?: string | {
                fieldErrors?: Record<string, string>;
                message?: string;
                error?: string;
              };
            };
          }
        ).response;

        if (response?.data) {
          // Se data é uma string (texto plano)
          if (typeof response.data === 'string') {
            const dataLower = response.data.toLowerCase();
            if (dataLower.includes("invalid username or password")) {
              errorMessage = "Usuário ou senha incorretos";
            } else if (dataLower.includes("not confirmed") || dataLower.includes("email not verified") || dataLower.includes("account not activated") || dataLower.includes("confirme seu email") || dataLower.includes("confirm your email")) {
              errorMessage = "Sua conta ainda não foi ativada. Por favor, verifique seu email e clique no link de confirmação.";
              setIsNotActivatedError(true);
            } else {
              errorMessage = response.data;
            }
          }
          // Se data é um objeto
          else {
            const { fieldErrors, message, error } = response.data;

            // Prioridade 1: fieldErrors - erros específicos de cada campo
            if (fieldErrors && Object.keys(fieldErrors).length > 0) {
              errorMessage = Object.entries(fieldErrors)
                .map(([field, msg]) => `${field}: ${msg}`)
                .join("; ");
            }
            // Prioridade 2: message - mensagem geral
            else if (message) {
              const msgLower = message.toLowerCase();
              // Traduz mensagens específicas do backend
              if (msgLower.includes("invalid username or password")) {
                errorMessage = "Usuário ou senha incorretos";
              } else if (msgLower.includes("not confirmed") || msgLower.includes("email not verified") || msgLower.includes("account not activated") || msgLower.includes("not activated") || msgLower.includes("confirme seu email") || msgLower.includes("confirm your email")) {
                errorMessage = "Sua conta ainda não foi ativada. Por favor, verifique seu email e clique no link de confirmação.";
                setIsNotActivatedError(true);
              } else {
                errorMessage = message;
              }
            }
            // Prioridade 3: error
            else if (error) {
              const errLower = error.toLowerCase();
              // Traduz mensagens específicas do backend
              if (errLower.includes("invalid username or password")) {
                errorMessage = "Usuário ou senha incorretos";
              } else if (errLower.includes("not confirmed") || errLower.includes("email not verified") || errLower.includes("account not activated") || errLower.includes("not activated") || errLower.includes("confirme seu email") || errLower.includes("confirm your email") || errLower.includes("email_not_confirmed")) {
                errorMessage = "Sua conta ainda não foi ativada. Por favor, verifique seu email e clique no link de confirmação.";
                setIsNotActivatedError(true);
              } else {
                errorMessage = error;
              }
            }
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
      <FormField label="Email ou CPF" required error={errors.username?.message}>
        <FormInput
          type="text"
          placeholder="Digite seu email ou CPF"
          {...register("username", {
            required: "Email ou CPF é obrigatório",
            validate: (value) => {
              // Remove espaços em branco
              const cleanValue = value.trim();
              
              // Verifica se é email
              const isEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(cleanValue);
              
              // Verifica se é CPF (11 dígitos, com ou sem formatação)
              const cpfDigits = cleanValue.replace(/\D/g, '');
              const isCPF = cpfDigits.length === 11 && /^\d{11}$/.test(cpfDigits);
              
              if (!isEmail && !isCPF) {
                return "Email ou CPF inválido";
              }
              
              return true;
            },
          })}
        />
      </FormField>

      <FormField label="Senha" required error={errors.password?.message}>
        <FormPasswordInput
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
          {isNotActivatedError && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={() => navigate("/reenviar-confirmacao")}
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 20px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                }}
              >
                Reenviar Email de Confirmação
              </button>
            </div>
          )}
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

      <div
        style={{
          textAlign: "center",
          marginTop: 12,
          fontSize: "0.9rem",
          color: "#666",
        }}
      >
        Esqueceu sua senha?{" "}
        <a
          href="/esqueci-senha"
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

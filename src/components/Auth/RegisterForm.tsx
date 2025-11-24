import { useForm } from "react-hook-form";
import { api } from "../../services/api";
import { useState } from "react";
import {
  FormField,
  FormInput,
  FormSelect,
  FormButton,
} from "../Common/FormComponents";

interface RegisterFormData {
  name: string;
  username: string;
  cpf: string;
  password: string;
  confirmPassword: string;
  role: string;
}

interface RegisterFormProps {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      role: "COURIER",
    },
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const password = watch("password");

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError("");
    setSuccess("");
    try {
      // Remover formatação do CPF antes de enviar
      const cpfNumbers = data.cpf.replace(/\D/g, "");

      await api.post("/auth/register", {
        name: data.name,
        username: data.username,
        cpf: cpfNumbers,
        password: data.password,
        role: data.role || "COURIER",
      });
      setSuccess("Usuário registrado com sucesso! Redirecionando...");

      // Redirecionar para aba de login após 2 segundos
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
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
        errorMessage = "Erro ao registrar usuário.";
      }

      setError(errorMessage);
      console.error(err);
    }
  };

  const roleOptions = [
    { value: "COURIER", label: "Motoboy" },
    { value: "ORGANIZER", label: "Gerente" },
  ];

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
      {/* Primeira linha - 2 colunas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Nome Completo" required error={errors.name?.message}>
          <FormInput
            type="text"
            placeholder="Digite seu nome completo"
            {...register("name", {
              required: "Nome é obrigatório",
              minLength: {
                value: 3,
                message: "Nome deve ter no mínimo 3 caracteres",
              },
            })}
          />
        </FormField>

        <FormField label="CPF" required error={errors.cpf?.message}>
          <FormInput
            type="text"
            placeholder="000.000.000-00"
            maxLength={14}
            {...register("cpf", {
              required: "CPF é obrigatório",
              pattern: {
                value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                message: "CPF inválido",
              },
              onChange: (e) => {
                e.target.value = formatCPF(e.target.value);
              },
            })}
          />
        </FormField>
      </div>

      {/* Segunda linha - E-mail em coluna única */}
      <FormField label="E-mail" required error={errors.username?.message}>
        <FormInput
          type="email"
          placeholder="admin@test.com"
          {...register("username", {
            required: "E-mail é obrigatório",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "E-mail inválido",
            },
          })}
        />
      </FormField>

      {/* Terceira linha - 2 colunas para senhas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Senha" required error={errors.password?.message}>
          <FormInput
            type="password"
            placeholder="••••••"
            {...register("password", {
              required: "Senha é obrigatória",
              minLength: {
                value: 6,
                message: "Senha deve ter no mínimo 6 caracteres",
              },
            })}
          />
        </FormField>

        <FormField
          label="Confirmar Senha"
          required
          error={errors.confirmPassword?.message}
        >
          <FormInput
            type="password"
            placeholder="••••••"
            {...register("confirmPassword", {
              required: "Confirmação de senha é obrigatória",
              validate: (value) =>
                value === password || "As senhas não coincidem",
            })}
          />
        </FormField>
      </div>

      {/* Quarta linha - Tipo de usuário */}
      <FormField label="Tipo de Usuário" error={errors.role?.message}>
        <FormSelect
          options={roleOptions}
          placeholder="Selecione o tipo de usuário"
          {...register("role")}
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
          {isSubmitting ? "Enviando..." : "Cadastrar"}
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
  );
}

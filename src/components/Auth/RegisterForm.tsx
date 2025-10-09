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
      role: "USER",
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
        role: data.role || "USER",
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
    { value: "USER", label: "Atleta" },
    { value: "ORGANIZER", label: "Organizador" },
  ];

  return (
    <form
      style={{
        maxWidth: 800,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
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

      {/* Terceira linha - 2 colunas para senhas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

        <FormField
          label="Confirmar Senha"
          required
          error={errors.confirmPassword?.message}
        >
          <FormInput
            type="password"
            placeholder="Confirme sua senha"
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

      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
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
          {isSubmitting ? "Enviando..." : "Cadastrar"}
        </FormButton>
      </div>

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
    </form>
  );
}

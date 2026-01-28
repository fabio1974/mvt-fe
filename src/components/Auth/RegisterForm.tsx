import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useState, useEffect } from "react";
import {
  FormField,
  FormInput,
  FormSelect,
  FormButton,
  FormPasswordInput,
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
  preselectedRole?: string;
  lockRole?: boolean;
  onChangeRole?: () => void;
}

export default function RegisterForm({ onSuccess, preselectedRole }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      role: preselectedRole || "COURIER",
    },
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEmailAlreadyRegistered, setIsEmailAlreadyRegistered] = useState(false);
  const navigate = useNavigate();

  // Atualiza o role quando preselectedRole muda
  useEffect(() => {
    if (preselectedRole) {
      setValue("role", preselectedRole);
    }
  }, [preselectedRole, setValue]);

  const password = watch("password");
  const currentRole = watch("role");

  // Determina se é estabelecimento (precisa aceitar CPF ou CNPJ)
  // Usa o role atual do formulário, ou o preselectedRole se existir
  const effectiveRole = currentRole || preselectedRole || "COURIER";
  const isEstabelecimento = effectiveRole === "CLIENT";

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

  // Função para formatar CPF ou CNPJ (detecta automaticamente pelo tamanho)
  const formatCPFOrCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    
    if (numbers.length <= 11) {
      // Formato CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // Formato CNPJ: 00.000.000/0000-00
      return numbers
        .substring(0, 14)
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
  };

  // Validação para CPF ou CNPJ
  const validateCPFOrCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    
    if (numbers.length === 11) {
      // Valida formato CPF
      return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value) || "CPF inválido";
    } else if (numbers.length === 14) {
      // Valida formato CNPJ
      return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value) || "CNPJ inválido";
    }
    
    return "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido";
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError("");
    setSuccess("");
    setIsEmailAlreadyRegistered(false);
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
      setSuccess("Cadastro realizado com sucesso! Enviamos um email de confirmação para " + data.username + ". Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.");

      // Redirecionar para aba de login após 5 segundos (tempo para ler a mensagem)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 5000);
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

      // Detectar se é erro de email já cadastrado
      const errorLower = errorMessage.toLowerCase();
      if (errorLower.includes("já está cadastrado") || errorLower.includes("already registered") || errorLower.includes("already exists") || errorLower.includes("já existe")) {
        setIsEmailAlreadyRegistered(true);
      }

      setError(errorMessage);
      console.error(err);
    }
  };

  const roleOptions = [
    { value: "CUSTOMER", label: "Cliente" },
    { value: "CLIENT", label: "Estabelecimento" },
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
        <FormField label="Nome" required error={errors.name?.message}>
          <FormInput
            type="text"
            placeholder="Nome e sobrenome"
            {...register("name", {
              required: "Nome é obrigatório",
              minLength: {
                value: 3,
                message: "Nome deve ter no mínimo 3 caracteres",
              },
              validate: {
                hasTwoWords: (value) => {
                  const words = value.trim().split(/\s+/).filter(word => word.length > 0);
                  return words.length >= 2 || "Informe nome e sobrenome";
                }
              }
            })}
          />
        </FormField>

        <FormField label={isEstabelecimento ? "CPF ou CNPJ" : "CPF"} required error={errors.cpf?.message}>
          <FormInput
            type="text"
            placeholder="000.000.000-00"
            maxLength={isEstabelecimento ? 18 : 14}
            {...register("cpf", {
              required: isEstabelecimento ? "CPF ou CNPJ é obrigatório" : "CPF é obrigatório",
              validate: isEstabelecimento ? validateCPFOrCNPJ : undefined,
              pattern: isEstabelecimento ? undefined : {
                value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                message: "CPF inválido",
              },
              onChange: (e) => {
                e.target.value = isEstabelecimento 
                  ? formatCPFOrCNPJ(e.target.value)
                  : formatCPF(e.target.value);
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
          <FormPasswordInput
            placeholder="••••••"
            {...register("password", {
              required: "Senha é obrigatória",
              minLength: {
                value: 6,
                message: "Senha deve ter no mínimo 6 caracteres",
              },
              validate: {
                hasLetter: (value) => 
                  /[a-zA-Z]/.test(value) || "Senha deve conter pelo menos uma letra",
                hasNumber: (value) => 
                  /[0-9]/.test(value) || "Senha deve conter pelo menos um número",
                hasSpecialChar: (value) => 
                  /[@#$%!&*]/.test(value) || "Senha deve conter um caractere especial (@#$%!&*)",
              }
            })}
          />
        </FormField>

        <FormField
          label="Confirmar Senha"
          required
          error={errors.confirmPassword?.message}
        >
          <FormPasswordInput
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
          {isEmailAlreadyRegistered && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 8 }}>
                Se você ainda não confirmou seu email:
              </p>
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
    </form>
  );
}

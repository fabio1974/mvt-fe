import { useForm } from "react-hook-form";
import { api } from "../../services/api";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
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
  preselectedRole?: string;
  lockRole?: boolean;
  onChangeRole?: () => void;
}

export default function RegisterForm({ onSuccess, preselectedRole, lockRole = false, onChangeRole }: RegisterFormProps) {
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<RegisterFormData | null>(null);

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

  // Handler intermediário que mostra o modal de confirmação
  const handleFormSubmit = (data: RegisterFormData) => {
    setPendingFormData(data);
    setShowConfirmModal(true);
  };

  // Handler para confirmar e enviar o cadastro
  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    setShowConfirmModal(false);
    await onSubmit(pendingFormData);
  };

  // Handler para trocar o perfil
  const handleChangeRole = () => {
    setShowConfirmModal(false);
    setPendingFormData(null);
    if (onChangeRole) {
      onChangeRole();
    }
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

  // Retorna o label do role selecionado
  const getRoleLabel = (roleValue: string) => {
    const option = roleOptions.find(opt => opt.value === roleValue);
    return option?.label || roleValue;
  };

  // Retorna o emoji do role selecionado
  const getRoleIcon = (roleValue: string) => {
    const icons: Record<string, string> = {
      CUSTOMER: "👤",
      CLIENT: "🏪",
      COURIER: "🏍️",
      ORGANIZER: "👥",
    };
    return icons[roleValue] || "👤";
  };

  // Modal styles
  const modalStyles: { [key: string]: React.CSSProperties } = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem",
    },
    modal: {
      backgroundColor: "#ffffff",
      borderRadius: "1rem",
      maxWidth: "420px",
      width: "100%",
      overflow: "hidden",
      position: "relative",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    },
    header: {
      padding: "1.5rem",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: "1.25rem",
      fontWeight: 600,
      color: "#111827",
      margin: 0,
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "0.5rem",
      borderRadius: "0.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background-color 0.2s",
    },
    body: {
      padding: "1.5rem",
      textAlign: "center",
    },
    profileCard: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: "#f0f9ff",
      border: "2px solid #3b82f6",
      borderRadius: "0.75rem",
      marginBottom: "1.5rem",
    },
    profileIcon: {
      fontSize: "2.5rem",
      width: "60px",
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ffffff",
      borderRadius: "0.75rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    profileLabel: {
      fontSize: "1.125rem",
      fontWeight: 600,
      color: "#111827",
      textAlign: "left",
    },
    question: {
      fontSize: "1rem",
      color: "#374151",
      marginBottom: "1.5rem",
    },
    buttonGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    confirmButton: {
      width: "100%",
      padding: "0.875rem",
      backgroundColor: "#22c55e",
      color: "#ffffff",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    changeButton: {
      width: "100%",
      padding: "0.875rem",
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "1px solid #d1d5db",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: 500,
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
  };

  return (
    <>
    <form
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
      onSubmit={handleSubmit(handleFormSubmit)}
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

    {/* Modal de Confirmação de Perfil */}
    {showConfirmModal && pendingFormData && (
      <div style={modalStyles.overlay} onClick={() => setShowConfirmModal(false)}>
        <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={modalStyles.header}>
            <h2 style={modalStyles.title}>Confirmar Cadastro</h2>
            <button
              style={modalStyles.closeButton}
              onClick={() => setShowConfirmModal(false)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <X size={20} color="#6b7280" />
            </button>
          </div>

          <div style={modalStyles.body}>
            <p style={modalStyles.question}>
              Você está se cadastrando como:
            </p>
            
            <div style={modalStyles.profileCard}>
              <div style={modalStyles.profileIcon}>
                {getRoleIcon(pendingFormData.role || "COURIER")}
              </div>
              <div style={modalStyles.profileLabel}>
                {getRoleLabel(pendingFormData.role || "COURIER")}
              </div>
            </div>

            <p style={{ ...modalStyles.question, marginBottom: "1rem" }}>
              Deseja confirmar ou prefere trocar o perfil?
            </p>

            <div style={modalStyles.buttonGroup}>
              <button
                style={modalStyles.confirmButton}
                onClick={handleConfirmSubmit}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#22c55e")}
              >
                ✓ Confirmar e Cadastrar
              </button>
              {onChangeRole && (
                <button
                  style={modalStyles.changeButton}
                  onClick={handleChangeRole}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                >
                  Trocar Perfil
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

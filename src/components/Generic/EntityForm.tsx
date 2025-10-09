import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import type {
  FormMetadata,
  FormFieldMetadata,
  FormSectionMetadata,
} from "../../types/metadata";
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormActions,
  FormButton,
  FormDatePicker,
} from "../Common/FormComponents";
import { ArrayField } from "./ArrayField";
import { FiSave, FiX, FiAlertCircle } from "react-icons/fi";

interface EntityFormProps {
  /** Metadata do formulário */
  metadata: FormMetadata;
  /** ID da entidade (para edição) */
  entityId?: string | number;
  /** Callback após sucesso */
  onSuccess?: (data: unknown) => void;
  /** Callback ao cancelar */
  onCancel?: () => void;
  /** Valores iniciais do formulário */
  initialValues?: Record<string, unknown>;
  /** Modo somente leitura (visualização) */
  readonly?: boolean;
}

/**
 * Componente genérico de formulário baseado em metadata
 *
 * Uso:
 * <EntityForm
 *   metadata={eventFormMetadata}
 *   entityId={id}
 *   onSuccess={(event) => navigate(`/eventos/${event.id}`)}
 *   onCancel={() => navigate('/eventos')}
 * />
 */
const EntityForm: React.FC<EntityFormProps> = ({
  metadata,
  entityId,
  onSuccess,
  onCancel,
  initialValues = {},
  readonly = false,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    // Inicializa formData apenas na primeira renderização
    const defaultValues: Record<string, unknown> = {};

    metadata.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          defaultValues[field.name] = field.defaultValue;
        } else if (field.type === "array") {
          defaultValues[field.name] = [];
        }
      });
    });

    return { ...defaultValues, ...initialValues };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // REMOVIDO: useEffect que resetava formData toda vez

  // Carrega dados da entidade se estiver editando
  useEffect(() => {
    const loadEntity = async () => {
      if (!entityId) return;

      try {
        setLoadingData(true);
        const response = await api.get(`${metadata.endpoint}/${entityId}`);
        const data = response.data as Record<string, unknown>;
        setFormData((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Erro ao carregar entidade:", err);
        showToast("Erro ao carregar dados", "error");
      } finally {
        setLoadingData(false);
      }
    };

    loadEntity();
  }, [entityId, metadata.endpoint]);

  // Atualiza valor de um campo
  const handleChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => {
      const newData = { ...prev, [fieldName]: value };
      return newData;
    });

    // Limpa erro do campo ao editar
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Valida um campo
  const validateField = (
    field: FormFieldMetadata,
    value: unknown
  ): string | null => {
    // Campo obrigatório
    if (field.required && (!value || value === "")) {
      return `${field.label} é obrigatório`;
    }

    // Validações customizadas
    if (field.validation && value) {
      const { min, max, minLength, maxLength, pattern, message } =
        field.validation;

      if (min !== undefined && Number(value) < min) {
        return message || `${field.label} deve ser maior ou igual a ${min}`;
      }

      if (max !== undefined && Number(value) > max) {
        return message || `${field.label} deve ser menor ou igual a ${max}`;
      }

      if (minLength !== undefined && String(value).length < minLength) {
        return (
          message || `${field.label} deve ter no mínimo ${minLength} caracteres`
        );
      }

      if (maxLength !== undefined && String(value).length > maxLength) {
        return (
          message || `${field.label} deve ter no máximo ${maxLength} caracteres`
        );
      }

      if (pattern && !new RegExp(pattern).test(String(value))) {
        return message || `${field.label} não está no formato correto`;
      }
    }

    return null;
  };

  // Valida todo o formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    metadata.sections.forEach((section) => {
      section.fields.forEach((field) => {
        const error = validateField(field, formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submete o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Por favor, corrija os erros no formulário", "error");
      return;
    }

    try {
      setLoading(true);

      const method = entityId ? "put" : "post";
      const url = entityId
        ? `${metadata.endpoint}/${entityId}`
        : metadata.endpoint;

      const response = await api[method](url, formData);

      showToast(
        entityId ? "Atualizado com sucesso!" : "Criado com sucesso!",
        "success"
      );

      if (onSuccess) {
        onSuccess(response.data);
      } else if (metadata.successRedirect) {
        navigate(metadata.successRedirect);
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);

      const error = err as {
        response?: {
          data?: { errors?: Record<string, unknown>; message?: string };
        };
      };

      // Trata erros de validação do backend
      if (error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          backendErrors[key] = String(value);
        });
        setErrors(backendErrors);
      }

      showToast(error.response?.data?.message || "Erro ao salvar", "error");
    } finally {
      setLoading(false);
    }
  };

  // Renderiza um campo baseado no tipo
  const renderField = (field: FormFieldMetadata) => {
    // Para campos array, garantir que o valor padrão seja array vazio
    const defaultValue = field.type === "array" ? [] : "";
    const value = formData[field.name] ?? defaultValue;

    const error = errors[field.name];
    const stringValue = String(value || "");

    // Verifica condição showIf
    if (field.showIf) {
      try {
        const shouldShow = new Function("data", `return ${field.showIf}`)(
          formData
        );
        if (!shouldShow) return null;
      } catch (e) {
        console.warn(`Erro ao avaliar showIf: ${field.showIf}`, e);
      }
    }

    switch (field.type) {
      case "text":
      case "email":
      case "password":
        return (
          <FormField
            key={field.name}
            label={field.label}
            required={field.required}
            error={error}
          >
            <FormInput
              type={field.type}
              placeholder={field.placeholder}
              value={stringValue}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={field.disabled || loading || readonly}
              required={field.required}
            />
          </FormField>
        );

      case "number":
        return (
          <FormField
            key={field.name}
            label={field.label}
            required={field.required}
            error={error}
          >
            <FormInput
              type="number"
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              value={stringValue}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={field.disabled || loading || readonly}
              required={field.required}
            />
          </FormField>
        );

      case "textarea":
        return (
          <FormField
            key={field.name}
            label={field.label}
            required={field.required}
            error={error}
          >
            <FormTextarea
              placeholder={field.placeholder}
              value={stringValue}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={field.disabled || loading || readonly}
              required={field.required}
            />
          </FormField>
        );

      case "select":
        return (
          <FormField
            key={field.name}
            label={field.label}
            required={field.required}
            error={error}
          >
            <FormSelect
              value={stringValue}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={field.disabled || loading || readonly}
              required={field.required}
            >
              <option value="">Selecione...</option>
              {field.options
                ?.slice()
                .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </FormSelect>
          </FormField>
        );

      case "date":
        return (
          <FormField
            key={field.name}
            label={field.label}
            required={field.required}
            error={error}
          >
            <FormDatePicker
              selected={value ? new Date(String(value)) : null}
              onChange={(date) =>
                handleChange(field.name, date?.toISOString() || "")
              }
            />
          </FormField>
        );

      case "boolean":
        return (
          <FormField key={field.name} label={field.label} error={error}>
            <label
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                disabled={field.disabled || loading}
              />
              {field.placeholder || field.label}
            </label>
          </FormField>
        );

      case "array":
        if (!field.arrayConfig) {
          console.warn(
            `Campo ${field.name} é do tipo 'array' mas falta arrayConfig`
          );
          return null;
        }

        // ArrayField ocupa largura completa - não usa FormField/FormRow
        return (
          <div
            key={field.name}
            style={{ gridColumn: "1 / -1", marginTop: "16px" }}
          >
            <ArrayField
              config={field.arrayConfig}
              value={Array.isArray(value) ? value : []}
              onChange={(val) => handleChange(field.name, val)}
              disabled={field.disabled || loading}
              error={error}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Renderiza uma seção
  const renderSection = (section: FormSectionMetadata) => {
    const columns = section.columns || 2;

    return (
      <FormContainer key={section.id} title={section.title} icon={section.icon}>
        <FormRow columns={columns}>{section.fields.map(renderField)}</FormRow>
      </FormContainer>
    );
  };

  if (loadingData) {
    return (
      <FormContainer title={metadata.title}>
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          Carregando dados...
        </div>
      </FormContainer>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {metadata.description && (
        <div
          style={{
            marginBottom: "16px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          {metadata.description}
        </div>
      )}

      {/* Renderiza todas as seções */}
      {metadata.sections.map(renderSection)}

      {/* Mensagem de erro geral */}
      {Object.keys(errors).length > 0 && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "6px",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiAlertCircle />
          <span>
            Por favor, corrija os erros no formulário antes de continuar.
          </span>
        </div>
      )}

      {/* Botões de ação */}
      <FormActions>
        {!readonly && (
          <FormButton
            type="submit"
            variant="primary"
            icon={<FiSave />}
            disabled={loading}
          >
            {loading ? "Salvando..." : metadata.submitLabel || "Salvar"}
          </FormButton>
        )}

        <FormButton
          type="button"
          variant="secondary"
          icon={<FiX />}
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              navigate(-1);
            }
          }}
          disabled={loading}
        >
          {readonly ? "Voltar" : metadata.cancelLabel || "Cancelar"}
        </FormButton>
      </FormActions>
    </form>
  );
};

export default EntityForm;

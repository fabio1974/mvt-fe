import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import { useOrganization } from "../../hooks/useOrganization";
import type {
  FormMetadata,
  FormFieldMetadata,
  FormSectionMetadata,
} from "../../types/metadata";
import {
  FormContainer,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormActions,
  FormButton,
  FormDatePicker,
} from "../Common/FormComponents";
import { ArrayField } from "./ArrayField";
import { CityTypeahead } from "../Common/CityTypeahead";
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
  /** Modo do formulário (create, edit, view) */
  mode?: "create" | "edit" | "view";
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
  mode,
}) => {
  const navigate = useNavigate();
  const { organizationId } = useOrganization();

  // Determina o modo automaticamente se não foi passado
  const formMode = mode || (entityId ? (readonly ? "view" : "edit") : "create");

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    // Inicializa formData apenas na primeira renderização
    const defaultValues: Record<string, unknown> = {};

    // Usa originalFields se disponível (inclui campos não visíveis), senão usa sections
    const allFields = metadata.originalFields || 
      metadata.sections.flatMap(section => section.fields);

    console.log('🔍 [EntityForm Init] Debug:', {
      entityId,
      organizationId,
      hasOriginalFields: !!metadata.originalFields,
      originalFieldsCount: metadata.originalFields?.length,
      allFieldsCount: allFields.length,
      allFieldNames: allFields.map(f => f.name)
    });

    allFields.forEach((field) => {
      // Auto-preenche organizationId se não estiver editando
      if (!entityId && organizationId) {
        // Detecta campos relacionados com Organization
        if (field.name === "organizationId" || field.name === "organization") {
          console.log(
            `🏢 Auto-preenchendo organizationId com valor: ${organizationId}`
          );
          // Sempre salva como 'organizationId' (será usado no submit)
          defaultValues["organizationId"] = organizationId;
        }
      }

      if (field.defaultValue !== undefined) {
        defaultValues[field.name] = field.defaultValue;
      } else if (field.type === "array") {
        defaultValues[field.name] = [];
      }
    });

    console.log('✅ [EntityForm Init] defaultValues:', defaultValues);

    return { ...defaultValues, ...initialValues };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Estado para armazenar os estados das cidades selecionadas (para exibição readonly)
  const [cityStates, setCityStates] = useState<Record<string, string>>({});

  // REMOVIDO: useEffect que resetava formData toda vez

  // Limpa erros quando o formulário é montado ou quando muda de entidade
  useEffect(() => {
    setErrors({});
  }, [entityId, metadata.endpoint]);

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

      // Validações numéricas (min/max) - para campos number
      const isNumericField = field.type === "number";

      if (isNumericField && min !== undefined && Number(value) < min) {
        return message || `${field.label} deve ser maior ou igual a ${min}`;
      }

      if (isNumericField && max !== undefined && Number(value) > max) {
        return message || `${field.label} deve ser menor ou igual a ${max}`;
      }

      // Validações de comprimento (minLength/maxLength) - para campos de texto
      const isTextField =
        field.type === "text" ||
        field.type === "textarea" ||
        field.type === "email" ||
        field.type === "password";

      if (
        isTextField &&
        minLength !== undefined &&
        String(value).length < minLength
      ) {
        return (
          message || `${field.label} deve ter no mínimo ${minLength} caracteres`
        );
      }

      if (
        isTextField &&
        maxLength !== undefined &&
        String(value).length > maxLength
      ) {
        return (
          message || `${field.label} deve ter no máximo ${maxLength} caracteres`
        );
      }

      // Validação de padrão (pattern) - apenas para campos de texto
      if (isTextField && pattern && !new RegExp(pattern).test(String(value))) {
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

      // Prepara o payload para envio
      const finalData = { ...formData };

      // Obtém todos os campos (incluindo não visíveis)
      const allFields = metadata.originalFields || 
        metadata.sections.flatMap(section => section.fields);

      console.log('🔍 [EntityForm Submit] Processando payload:', {
        hasOriginalFields: !!metadata.originalFields,
        allFieldsCount: allFields.length,
        formDataKeys: Object.keys(formData)
      });

      // Injeta organizationId se necessário
      if (!entityId && organizationId) {
        const hasOrganizationField = allFields.some(
          field => field.name === "organizationId" || field.name === "organization"
        );

        if (hasOrganizationField && !finalData.organizationId && !finalData.organization) {
          console.log(`🏢 Injetando organizationId: ${organizationId}`);
          finalData.organizationId = organizationId;
        }
        
        // Se tiver 'organization', renomeia para 'organizationId'
        if (finalData.organization && !finalData.organizationId) {
          console.log(`🔄 Renomeando 'organization' para 'organizationId'`);
          finalData.organizationId = finalData.organization;
          delete finalData.organization;
        }
      }

      console.log('📤 [EntityForm Submit] Payload final:', finalData);

      const method = entityId ? "put" : "post";
      const url = entityId
        ? `${metadata.endpoint}/${entityId}`
        : metadata.endpoint;

      const response = await api[method](url, finalData);

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
    // Oculta campos marcados como não visíveis
    if (field.visible === false) {
      return null;
    }

    // Oculta campos de organização quando auto-preenchidos (modo criar)
    if (
      !entityId &&
      organizationId &&
      (field.name === "organizationId" || field.name === "organization")
    ) {
      console.log(
        `🔒 Ocultando campo ${field.name} (auto-preenchido com organizationId: ${organizationId})`
      );
      return null;
    }

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

    let fieldContent: React.ReactNode;

    switch (field.type) {
      case "text":
      case "email":
      case "password":
        fieldContent = (
          <FormField
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
        break;

      case "number":
        fieldContent = (
          <FormField
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
        break;

      case "textarea":
        fieldContent = (
          <FormField
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
        break;

      case "select":
        fieldContent = (
          <FormField
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
        break;

      case "date": {
        // Detecta automaticamente se deve mostrar hora/minuto
        // Baseado no formato recebido do backend (ex: "dd/MM/yyyy HH:mm" = com hora)
        const shouldShowTime =
          field.format?.includes("HH") || field.format?.includes("mm") || false;
        const dateFormat =
          field.format || (shouldShowTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");

        fieldContent = (
          <FormField
            label={field.label}
            required={field.required}
            error={error}
          >
            <FormDatePicker
              selected={value ? new Date(String(value)) : null}
              onChange={(date) =>
                handleChange(field.name, date?.toISOString() || "")
              }
              showTimeSelect={shouldShowTime}
              dateFormat={dateFormat}
              placeholder={field.placeholder}
            />
          </FormField>
        );
        break;
      }

      case "boolean":
        fieldContent = (
          <div
            style={{ display: "flex", alignItems: "center", minHeight: "40px" }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                disabled={field.disabled || loading || readonly}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor:
                    field.disabled || loading || readonly
                      ? "not-allowed"
                      : "pointer",
                }}
              />
              <span style={{ fontSize: "14px", color: "#374151" }}>
                {field.label}
              </span>
            </label>
          </div>
        );
        break;

      case "city":
        fieldContent = (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 100px",
              gap: "1rem",
              alignItems: "end",
            }}
          >
            <FormField
              label={field.label}
              required={field.required}
              error={error}
            >
              <CityTypeahead
                value={stringValue}
                onCitySelect={(city) => {
                  // CityTypeahead retorna um objeto City, então pega apenas o nome
                  handleChange(field.name, city.name);
                  // Armazena o estado da cidade para exibição
                  setCityStates((prev) => ({
                    ...prev,
                    [field.name]: city.stateCode || city.state || "",
                  }));
                }}
                placeholder={field.placeholder || "Digite o nome da cidade"}
              />
            </FormField>

            <FormField label="Estado" required={false}>
              <FormInput
                type="text"
                value={cityStates[field.name] || ""}
                readOnly
                disabled
                placeholder="--"
                style={{
                  backgroundColor: "#f3f4f6",
                  cursor: "not-allowed",
                  textAlign: "center",
                }}
              />
            </FormField>
          </div>
        );
        break;

      case "entity":
        // Campo de entidade relacionada (ex: city, organization, etc)
        // Por enquanto, usa CityTypeahead como fallback
        // TODO: Implementar EntitySelect/EntityTypeahead genérico
        if (field.name === "city" || field.name === "cityId") {
          fieldContent = (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 100px",
                gap: "1rem",
                alignItems: "end",
              }}
            >
              <FormField
                label={field.label}
                required={field.required}
                error={error}
              >
                <CityTypeahead
                  value={stringValue}
                  onCitySelect={(city) => {
                    handleChange(field.name, city.name);
                    // Armazena o estado da cidade para exibição
                    setCityStates((prev) => ({
                      ...prev,
                      [field.name]: city.stateCode || city.state || "",
                    }));
                  }}
                  placeholder={field.placeholder || "Digite o nome da cidade"}
                />
              </FormField>

              <FormField label="Estado" required={false}>
                <FormInput
                  type="text"
                  value={cityStates[field.name] || ""}
                  readOnly
                  disabled
                  placeholder="--"
                  style={{
                    backgroundColor: "#f3f4f6",
                    cursor: "not-allowed",
                    textAlign: "center",
                  }}
                />
              </FormField>
            </div>
          );
        } else {
          // Para outras entidades, renderiza como texto por enquanto
          console.warn(
            `Campo entity ${field.name} não tem componente específico. Renderizando como text.`
          );
          fieldContent = (
            <FormField
              label={field.label}
              required={field.required}
              error={error}
            >
              <FormInput
                type="text"
                placeholder={field.placeholder}
                value={stringValue}
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={field.disabled || loading || readonly}
                required={field.required}
              />
            </FormField>
          );
        }
        break;

      case "array":
        if (!field.arrayConfig) {
          console.warn(
            `Campo ${field.name} é do tipo 'array' mas falta arrayConfig`
          );
          return null;
        }

        // ArrayField ocupa largura completa - não envolve no grid
        return (
          <div
            key={field.name}
            style={{ gridColumn: "1 / -1", marginTop: "16px" }}
          >
            <ArrayField
              config={{
                ...field.arrayConfig,
                label: field.arrayConfig?.label || field.label,
              }}
              value={Array.isArray(value) ? value : []}
              onChange={(val) => handleChange(field.name, val)}
              disabled={field.disabled || loading}
              error={error}
            />
          </div>
        );

      default:
        fieldContent = null;
        break;
    }

    // Retorna o conteúdo do campo diretamente (wrapper é feito no renderSection)
    return fieldContent;
  };

  // Renderiza uma seção
  const renderSection = (section: FormSectionMetadata, index: number) => {
    // Customiza o título da primeira seção baseado no modo
    let sectionTitle = section.title;
    if (index === 0 && section.id === "basic-info") {
      const actionLabel = {
        create: "Criar",
        edit: "Editar",
        view: "Visualizar",
      }[formMode];

      // Substitui "Formulário de X" por "Criar/Editar/Visualizar X"
      // E converte plural para singular (Eventos → Evento)
      sectionTitle = section.title
        .replace(/^Formulário de\s+/, `${actionLabel} `)
        .replace(/s$/, ""); // Remove 's' final para singular
    }

    // Separa campos por tipo para organização
    const regularFields = section.fields.filter(
      (f) => f.type !== "array" && f.type !== "textarea"
    );
    const textareaFields = section.fields.filter((f) => f.type === "textarea");
    const arrayFields = section.fields.filter((f) => f.type === "array");

    return (
      <FormContainer key={section.id} title={sectionTitle} icon={section.icon}>
        {/* Grid responsivo moderno - campos normais */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom:
              textareaFields.length > 0 || arrayFields.length > 0
                ? "16px"
                : "0",
          }}
        >
          {regularFields.map((field) => (
            <div key={field.name}>{renderField(field)}</div>
          ))}
        </div>

        {/* Campos textarea aparecem depois, com largura dupla */}
        {textareaFields.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
              marginBottom: arrayFields.length > 0 ? "16px" : "0",
            }}
          >
            {textareaFields.map((field) => (
              <div key={field.name} className="form-field-wide">
                {renderField(field)}
              </div>
            ))}
          </div>
        )}

        {/* Campos array aparecem por último, ocupando largura completa */}
        {arrayFields.map((field) => (
          <div key={field.name} style={{ marginTop: "16px" }}>
            {renderField(field)}
          </div>
        ))}
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
      {/* Renderiza todas as seções */}
      {metadata.sections.map((section, index) => renderSection(section, index))}

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

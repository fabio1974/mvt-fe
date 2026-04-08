import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import { useOrganization } from "../../hooks/useOrganization";
import { isAdmin } from "../../utils/auth";
import { executeComputedField } from "../../utils/computedFields";
import { translateLabel } from "../../utils/labelTranslations";
import type {
  FormMetadata,
  FormFieldMetadata,
  FormSectionMetadata,
} from "../../types/metadata";
import EntitySelect from "../Common/EntitySelect";
import EntityTypeahead from "../Common/EntityTypeahead";
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
import { MaskedInput } from "../Common/MaskedInput";
import { DynamicDocumentInput } from "../Common/DynamicDocumentInput";
import { getAutoMask, unmaskFormData, isValidCPF, isValidCNPJ } from "../../utils/masks";
import { ArrayField } from "./ArrayField";
import { CityTypeahead } from "../Common/CityTypeahead";
import { AddressFieldWithMap } from "../Common/AddressFieldWithMap";
import { FiSave, FiX, FiAlertCircle } from "react-icons/fi";
import "../../highlighted-computed-field.css";

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
  /** Esconde o botão cancelar/voltar */
  hideCancelButton?: boolean;
  /** Esconde campos de array (relacionamentos 1:N) */
  hideArrayFields?: boolean;
  /** Lista de nomes de campos que devem ficar readonly */
  readonlyFields?: string[];
  /** Lista de nomes de campos que devem ficar escondidos (hidden) */
  hiddenFields?: string[];
  /** Dados adicionais para incluir no payload de submissão (sobrescreve valores do formulário) */
  additionalData?: Record<string, unknown>;
  /** Renderiza conteúdo customizado antes dos botões de ação */
  renderBeforeButtons?: () => React.ReactNode;
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
  hideCancelButton = false,
  hideArrayFields = false,
  readonlyFields = [],
  hiddenFields = [],
  additionalData = {},
  renderBeforeButtons,
}) => {
  const navigate = useNavigate();
  const { organizationId } = useOrganization();

  // Determina o modo automaticamente se não foi passado
  const formMode = mode || (entityId ? (readonly ? "view" : "edit") : "create");

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    // Inicializa formData apenas na primeira renderização
    const defaultValues: Record<string, unknown> = {};

    // Usa originalFields se disponível (inclui campos não visíveis), senão usa sections
    const allFields =
      metadata.originalFields ||
      metadata.sections.flatMap((section) => section.fields);

    allFields.forEach((field) => {
      // Auto-preenche organizationId se não estiver editando
      if (!entityId && organizationId) {
        // Detecta campos relacionados com Organization
        if (field.name === "organizationId" || field.name === "organization") {
          // Sempre salva como 'organizationId' (será usado no submit)
          defaultValues["organizationId"] = organizationId;
        }
      }

      if (field.defaultValue !== undefined) {
        defaultValues[field.name] = field.defaultValue;
      } else if (field.type === "array") {
        defaultValues[field.name] = [];
      } else if (field.type === "boolean") {
        // ✅ Campos boolean sem defaultValue recebem false
        // Se o campo tem defaultValue, já foi aplicado acima
        defaultValues[field.name] = false;
      }
    });

    // Aplica initialValues por cima dos defaultValues
    // Se initialValues[field] é undefined, mantém o defaultValue
    const result = { ...defaultValues };
    Object.keys(initialValues).forEach(key => {
      if (initialValues[key] !== undefined) {
        result[key] = initialValues[key];
      }
    });
    return result;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [initialValuesApplied, setInitialValuesApplied] = useState(false);

  // Estado para armazenar os estados das cidades selecionadas (para exibição readonly)
  const [cityStates, setCityStates] = useState<Record<string, string>>({});

  // REMOVIDO: useEffect que resetava formData toda vez

  // 🔄 Atualiza formData quando initialValues mudarem (ex: valores assíncronos de defaultValues)
  // ⚠️ Usa flag para evitar loops infinitos
  useEffect(() => {
    if (!entityId && !initialValuesApplied && Object.keys(initialValues).length > 0) {
      const valuesToApply = {...initialValues};
      // 🚚 Para delivery: NÃO copia fromAddress para toAddress
      // O campo de destino deve ficar em branco, mas o mapa abre centralizado na origem
      
      // Atualiza apenas os campos que vieram em initialValues, preservando os existentes
      setFormData((prev) => ({
        ...prev,
        ...valuesToApply,
      }));
      
      setInitialValuesApplied(true);
    }
  }, [initialValues, entityId, initialValuesApplied, metadata.entityName]);

  // Limpa erros quando o formulário é montado ou quando muda de entidade
  useEffect(() => {
    setErrors({});
    setInitialValuesApplied(false); // Reset flag quando muda de entidade
  }, [entityId, metadata.endpoint]);

  // Carrega dados da entidade se estiver editando
  useEffect(() => {
    const loadEntity = async () => {
      if (!entityId) return;

      try {
        setLoadingData(true);
        const response = await api.get(`${metadata.endpoint}/${entityId}`);
        const data = response.data as Record<string, unknown>;

        // ✅ CORREÇÃO: Se backend retornar cityId mas não city, busca o nome da cidade
        if (data.cityId && !data.city) {
          try {
            const cityResponse = await api.get(`/api/cities/${data.cityId}`);
            const cityData = cityResponse.data as {
              name: string;
              stateCode?: string;
              state?: string;
            };
            data.city = cityData.name;

            // Armazena o estado para exibição
            setCityStates((prev) => ({
              ...prev,
              city: cityData.stateCode || cityData.state || "",
            }));
          } catch (cityErr) {
            console.error("Erro ao carregar cidade:", cityErr);
          }
        }

        // ✅ Se backend retornar city como objeto (ex: {id, name}), extrai o ID
        if (typeof data.city === "object" && data.city !== null) {
          const cityObj = data.city as {
            id: number;
            name: string;
            stateCode?: string;
            state?: string;
          };
          data.cityId = cityObj.id;
          data.city = cityObj.name;

          setCityStates((prev) => ({
            ...prev,
            city: cityObj.stateCode || cityObj.state || "",
          }));
        }

        // ✅ Se backend retornar organization como objeto, extrai o ID
        if (
          typeof data.organization === "object" &&
          data.organization !== null
        ) {
          const orgObj = data.organization as { id: number; name?: string };
          data.organizationId = orgObj.id;
        }

        // ✅ CORREÇÃO GENÉRICA: Converte campos que são objetos com {id} para formato adequado
        // Mas PRESERVA objetos completos para campos do tipo entity com renderAs="typeahead"
        
        // Obter todos os campos do metadata
        const allFieldsInMetadata =
          metadata.originalFields ||
          metadata.sections.flatMap((section) => section.fields);
        
        Object.keys(data).forEach((key) => {
          const value = data[key];
          if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            "id" in value
          ) {
            // Verifica se é um campo entity no metadata
            const field = allFieldsInMetadata.find((f: any) => f.name === key);
            const isEntityField = field && field.type === "entity";

            const obj = value as { id: number | string; name?: string };

            if (isEntityField) {
              // Para campos entity, SEMPRE MANTÉM o objeto completo {id, name}
              // Backend espera esse formato para relacionamentos
              data[key] = obj; // Mantém objeto
            } else {
              // Para outros campos, converte para ID (valor primitivo)
              data[key] = String(obj.id);
            }

            // Salva o ID em um campo separado se não existir
            const idFieldName = key.endsWith("Id") ? key : `${key}Id`;
            if (!data[idFieldName]) {
              data[idFieldName] = obj.id;
            }
          }
        });

        setFormData((prev) => ({ ...prev, ...data }));
      } catch (err: any) {
        console.error("Erro ao carregar entidade:", err);
        
        // Se for 404, significa que não existe registro ainda - não mostra erro
        const is404 = err?.response?.status === 404;
        const errorMessage = err?.response?.data?.message || err?.message || "";
        
        if (is404) {
          // Não mostra toast de erro - deixa o formulário vazio para criação
        } else {
          // Outros erros mostram toast
          showToast(errorMessage || "Erro ao carregar dados", "error");
        }
      } finally {
        setLoadingData(false);
      }
    };

    loadEntity();
  }, [entityId, metadata.endpoint]);

  // 🧮 Recalcula campos computados quando suas dependências mudam
  useEffect(() => {
    // Coleta todos os campos computados de todas as seções
    const computedFields = metadata.sections
      .flatMap((section) => section.fields)
      .filter((field) => field.computed && field.computedDependencies);

    if (computedFields.length === 0) return;

    // Para cada campo computado, verifica se alguma dependência mudou
    computedFields.forEach((field) => {
      if (!field.computed || !field.computedDependencies) return;

      const result = executeComputedField(field.computed, formData);

      // Só atualiza se o valor calculado for diferente do atual
      if (result !== null && result !== formData[field.name]) {
        setFormData((prev) => ({
          ...prev,
          [field.name]: result,
        }));
      }
    });
  }, [
    // ⚠️ REMOVER FORMDATA: não observar mudanças em formData para evitar loops
    // Este effect é apenas para inicializar campos computados
    metadata.sections,
  ]);

  // 🚚 NOVO: Calcula distância do Google Maps para deliveries quando coordenadas mudam
  useEffect(() => {
    // Só para deliveries
    if (metadata.entityName !== "delivery") return;

    // Extrai as coordenadas de origem e destino
    const fromLat = Number(formData.fromLatitude);
    const fromLng = Number(formData.fromLongitude);
    const toLat = Number(formData.toLatitude);
    const toLng = Number(formData.toLongitude);

    // Só prossegue se tiver TODAS as coordenadas com valores válidos
    if (
      isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng) ||
      fromLat === 0 || fromLng === 0 || toLat === 0 || toLng === 0
    ) {
      return;
    }

    // Função para carregar Google Maps API se necessário
    const loadGoogleMapsAndCalculateDistance = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.warn("⚠️ Google Maps API Key não configurada");
          return;
        }

        // Verifica se já existe um script do Google Maps carregado
        let isGoogleMapsLoaded = typeof google !== "undefined" && google.maps;

        // Se não estiver carregado, carrega
        if (!isGoogleMapsLoaded) {
          // Verifica se o script já foi adicionado ao DOM
          const existingScript = document.querySelector(
            `script[src*="maps.googleapis.com"]`
          );

          if (existingScript) {
            // Script já foi adicionado, aguarda o carregamento
            await new Promise<void>((resolve) => {
              const checkGoogleMaps = setInterval(() => {
                if (typeof google !== "undefined" && google.maps) {
                  clearInterval(checkGoogleMaps);
                  resolve();
                }
              }, 100);

              // Timeout após 5 segundos
              setTimeout(() => {
                clearInterval(checkGoogleMaps);
                resolve();
              }, 5000);
            });
          } else {
            // Adiciona o script
            await new Promise<void>((resolve) => {
              const script = document.createElement("script");
              script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=routes`;
              script.async = true;
              script.onload = () => {
                // Aguarda um pouco para garantir que google.maps está disponível
                setTimeout(() => resolve(), 300);
              };
              script.onerror = () => {
                console.error("❌ Erro ao carregar Google Maps API");
                resolve(); // continua mesmo com erro
              };
              document.head.appendChild(script);
            });
          }
        }

        // Agora que google.maps está disponível, cria a DirectionsService
        if (typeof google !== "undefined" && google.maps) {
          const directionsService = new google.maps.DirectionsService();

          directionsService.route(
            {
              origin: { lat: fromLat, lng: fromLng },
              destination: { lat: toLat, lng: toLng },
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (
                status === google.maps.DirectionsStatus.OK &&
                result?.routes[0]?.legs[0]
              ) {
                const distanceValue = result.routes[0].legs[0].distance?.value; // em metros
                if (distanceValue) {
                  const distanceKm = distanceValue / 1000;

                  // Atualiza distanceKm no formData
                  setFormData((prev) => ({
                    ...prev,
                    distanceKm: parseFloat(distanceKm.toFixed(2)),
                  }));

                  console.log(
                    "✅ Distância calculada via Google Maps:",
                    distanceKm.toFixed(2),
                    "km"
                  );
                }
              } else if (status !== google.maps.DirectionsStatus.OK) {
                console.warn(
                  "⚠️ Directions API retornou status:",
                  status,
                  "- Isso pode ser esperado se a rota não existe"
                );
              }
            }
          );
        } else {
          console.warn(
            "⚠️ Google Maps não ficou disponível após tentar carregar"
          );
        }
      } catch (error) {
        console.error("❌ Erro ao calcular distância:", error);
      }
    };

    // Aguarda um pouco para evitar muitas requisições simultâneas
    const timeoutId = setTimeout(loadGoogleMapsAndCalculateDistance, 500);

    return () => clearTimeout(timeoutId);
  }, [
    formData.fromLatitude,
    formData.fromLongitude,
    formData.toLatitude,
    formData.toLongitude,
    metadata.entityName,
  ]);

  const isDocumentField = (fieldName: string): boolean => {
    const name = fieldName.toLowerCase();
    return name.includes("document");
  };

  const sanitizeDocumentValue = (value: unknown): string => {
    const digitsOnly = String(value ?? "").replace(/\D/g, "");
    // Permite CPF (11) ou CNPJ (14) — corta acima de 14
    return digitsOnly.substring(0, 14);
  };

  const isBankAccountAgencyField = (fieldName: string): boolean => {
    if (metadata.entityName !== "bankAccount") return false;
    const name = fieldName.toLowerCase();
    const isAgency =
      name === "agencia" ||
      name === "agency" ||
      name.includes("agencia") ||
      name.includes("agency");
    const isDigit =
      name.includes("digit") || name.includes("digito") || name.includes("verificador");
    return isAgency && !isDigit;
  };

  const isBankAccountDigitField = (fieldName: string): boolean => {
    if (metadata.entityName !== "bankAccount") return false;
    const name = fieldName.toLowerCase();
    return name.includes("digit") || name.includes("digito") || name.includes("verificador");
  };

  // Atualiza valor de um campo
  const handleChange = (fieldName: string, value: unknown) => {
    if (fieldName === "addresses" && Array.isArray(value)) {
      console.log('📍 [EntityForm] handleChange addresses:', JSON.stringify(value, null, 2));
    }

    let normalizedValue =
      isDocumentField(fieldName) && typeof value === "string"
        ? sanitizeDocumentValue(value)
        : value;

    if (typeof normalizedValue === "string" && metadata.entityName === "bankAccount") {
      if (isBankAccountAgencyField(fieldName)) {
        normalizedValue = normalizedValue.slice(0, 4);
      } else if (isBankAccountDigitField(fieldName)) {
        normalizedValue = normalizedValue.slice(0, 1);
      }
    }

    setFormData((prev) => {
      const newData = { ...prev, [fieldName]: normalizedValue };
      if (fieldName === "addresses") {
        console.log('📍 [EntityForm] setFormData addresses - prev:', prev.addresses);
        console.log('📍 [EntityForm] setFormData addresses - new:', newData.addresses);
      }

      // 🏦 Auto-preenche bankName quando bankCode muda (para entidade bankAccount)
      if (metadata.entityName === "bankAccount" && fieldName === "bankCode") {
        // Busca o campo bankCode no metadata para pegar as options
        const bankCodeField = metadata.sections
          .flatMap((s) => s.fields)
          .find((f) => f.name === "bankCode");

        if (bankCodeField?.options) {
          const selectedBank = bankCodeField.options.find(
            (opt) => opt.value === value
          );
          if (selectedBank) {
            // Extrai apenas o nome do banco, removendo o código e " - " do início
            // Exemplo: "033 - Banco Santander" → "Banco Santander"
            const bankNameOnly = selectedBank.label.replace(/^\d+\s*-\s*/, "");
            newData.bankName = bankNameOnly;
          }
        }
      }

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

  // Conta apenas dígitos em uma string (ignora caracteres de máscara)
  const countDigits = (value: string): number => {
    return (value || "").replace(/\D/g, "").length;
  };

  // Detecta se um campo tem máscara aplicada
  const hasPhoneMask = (fieldName: string): boolean => {
    const keywords = ["ddd", "telefone", "celular", "phone"];
    return keywords.some((keyword) =>
      fieldName.toLowerCase().includes(keyword)
    );
  };

  // Valida um campo
  const validateField = (
    field: FormFieldMetadata,
    value: unknown
  ): string | null => {
    // ✅ Campos boolean nunca são obrigatórios (false é um valor válido)
    if (field.type === "boolean") {
      return null;
    }

    // Campo obrigatório (funciona para todos os tipos, incluindo date)
    if (field.required && (!value || value === "" || value === null || value === undefined)) {
      return `${field.label} é obrigatório`;
    }

    // Validação específica para Documento (CPF/CNPJ)
    if (isDocumentField(field.name) && value) {
      const digits = sanitizeDocumentValue(value);

      if (digits.length !== 11 && digits.length !== 14) {
        return "CPF/CNPJ deve ter 11 ou 14 dígitos";
      }

      if (digits.length === 11 && !isValidCPF(digits)) {
        return "CPF inválido";
      }

      if (digits.length === 14 && !isValidCNPJ(digits)) {
        return "CNPJ inválido";
      }
    }

    // Validação específica para conta bancária: agência e dígito verificador
    if (metadata.entityName === "bankAccount" && value !== undefined && value !== null) {
      const stringValue = String(value);

      if (isBankAccountAgencyField(field.name) && stringValue.length > 4) {
        return `${field.label} deve ter no máximo 4 caracteres`;
      }

      if (isBankAccountDigitField(field.name) && stringValue.length > 1) {
        return `${field.label} deve ter no máximo 1 caractere`;
      }
    }

    // Validações customizadas
    if (field.validation && value) {
      const { min, max, minLength, maxLength, pattern, message } =
        field.validation;

      // Validações numéricas (min/max) - para campos number
      const isNumericField = field.type === "number";

      if (isNumericField && min !== undefined && min !== null && Number(value) < min) {
        return message || `${field.label} deve ser maior ou igual a ${min}`;
      }

      if (isNumericField && max !== undefined && max !== null && Number(value) > max) {
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
        maxLength !== undefined
      ) {
        // ⚠️ Campos de documento (CPF/CNPJ) têm validação específica — pular validação genérica de maxLength
        if (isDocumentField(field.name)) {
          // Skip: validação específica já foi feita acima
        } else {
          // Para campos com máscara (DDD, telefone, CEP), contar apenas dígitos
          const hasFieldMask = hasPhoneMask(field.name) || 
                              field.name.toLowerCase().includes("cep") ||
                              field.name.toLowerCase().includes("zipcode");
          
          const valueLength = hasFieldMask
            ? countDigits(String(value))
            : String(value).length;

          if (valueLength > maxLength) {
            return (
              message || `${field.label} deve ter no máximo ${maxLength} caracteres`
            );
          }
        }
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
          console.error(`❌ Validação falhou para campo "${field.name}":`, {
            error,
            value: formData[field.name],
            field: {
              name: field.name,
              type: field.type,
              required: field.required,
              validation: field.validation
            }
          });
          newErrors[field.name] = error;
        }
      });
    });

    if (Object.keys(newErrors).length > 0) {
      console.error(`❌ Total de ${Object.keys(newErrors).length} erro(s) de validação:`, newErrors);
    } else {
    }

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

    // ⚠️ Validação específica para Delivery: não permitir distância zero ou muito pequena
    if (metadata.endpoint === '/api/deliveries') {
      // Busca dinamicamente o campo de distância (pode ser "distance", "distanceKm", etc)
      const allFields = metadata.sections.flatMap((section) => section.fields);
      const distanceField = allFields.find(
        (field) => 
          field.name === "distance" || 
          field.name === "distancia" || 
          field.name === "distanceKm" ||
          field.name === "distanceInKm"
      );
      
      const distanceFieldName = distanceField?.name || "distance";
      const distance = formData[distanceFieldName];
      const distanceNumber = Number(distance);
      
      // ✅ Valida se a distância é zero ou muito pequena (< 100 metros / 0.1 km)
      // Isso captura casos onde origem e destino são praticamente o mesmo local
      if (distance !== undefined && distance !== null && !isNaN(distanceNumber) && distanceNumber < 0.1) {
        showToast("Não é possível criar uma corrida com origem e destino no mesmo local. Por favor, selecione um endereço de destino diferente.", "error");
        setErrors({
          ...errors,
          [distanceFieldName]: "A distância mínima deve ser de pelo menos 100 metros"
        });
        return;
      }
    }

    try {
      setLoading(true);

      // Prepara o payload para envio
      // Inclui additionalData que sobrescreve valores do formulário
      const finalData = { ...formData, ...additionalData };

      // Obtém todos os campos (incluindo não visíveis)
      const allFields =
        metadata.originalFields ||
        metadata.sections.flatMap((section) => section.fields);

      // ✅ Converte campos de relacionamento para formato {id: number}
      // Backend espera: { organization: { id: 6 }, city: { id: 964 } }

      // Injeta organization se necessário (apenas para não-ADMIN)
      // ⚠️ ADMIN escolhe manualmente a organização no formulário
      if (!entityId && organizationId && !isAdmin()) {
        const hasOrganizationField = allFields.some(
          (field) =>
            field.name === "organizationId" || field.name === "organization"
        );

        if (hasOrganizationField) {
          // ✅ Envia como objeto com ID (spec do backend)
          finalData.organization = { id: organizationId };
          // Remove organizationId se existir (enviamos organization)
          delete finalData.organizationId;
        }
      }

      // ✅ Converte organizationId para organization: {id}
      if (finalData.organizationId && !finalData.organization) {
        finalData.organization = { id: finalData.organizationId };
        delete finalData.organizationId;
      }

      // ✅ Converte cityId para city: {id}
      if (finalData.cityId && typeof finalData.cityId !== "object") {
        finalData.city = { id: parseInt(String(finalData.cityId)) };
        delete finalData.cityId;
      }

      // ✅ Converte campos de relacionamento em arrays (owner, courier, client, etc)
      // Para arrays como employmentContracts e clientContracts
      Object.keys(finalData).forEach((key) => {
        if (Array.isArray(finalData[key])) {
          finalData[key] = finalData[key].map((item: any) => {
            if (!item || typeof item !== "object") return item;
            
            const transformed = { ...item };
            
            // Lista de campos que devem ser convertidos para {id: value}
            const relationshipFields = ["owner", "courier", "client", "user", "organization", "city"];
            
            relationshipFields.forEach((field) => {
              // Se o campo existe e é uma string/número (UUID ou ID), converte para objeto
              if (transformed[field] && typeof transformed[field] !== "object") {
                transformed[field] = { id: transformed[field] };
              }
            });
            
            // Converte datas vazias para null
            Object.keys(transformed).forEach((itemKey) => {
              if (transformed[itemKey] === "") {
                transformed[itemKey] = null;
              }
            });
            
            return transformed;
          });
        }
      });

      // ✅ Converte owner na raiz (se existir e for string/número)
      if (finalData.owner && typeof finalData.owner !== "object") {
        finalData.owner = { id: finalData.owner };
      }

      // ✅ Remove máscaras de CPF, CNPJ, telefone, CEP antes de enviar ao backend
      const unmaskedData = unmaskFormData(finalData);

      // ✅ Converte campos number/currency de string para número (input HTML retorna string)
      allFields.forEach((field) => {
        if ((field.type === "number" || field.type === "currency") && unmaskedData[field.name] !== undefined && unmaskedData[field.name] !== null && unmaskedData[field.name] !== "") {
          unmaskedData[field.name] = Number(unmaskedData[field.name]);
        }
      });

      // 🚫 Remove campos que não pertencem à entidade atual (whitelist pelos metadados)
      // Isto evita enviar campos como "address", "city", "country" quando não existem no metadata da entidade
      const allowedFieldNames = new Set(
        (metadata.originalFields || metadata.sections.flatMap((s) => s.fields)).map((f) => f.name)
      );

      Object.keys(unmaskedData).forEach((key) => {
        // Mantém sempre "id" e campos de relacionamento conhecidos (arrays de contratos/endereços)
        const keepAlways = 
          key === "id" || 
          key === "addresses" || 
          key === "clientContracts" || 
          key === "employmentContracts";
        
        if (!keepAlways && !allowedFieldNames.has(key)) {
          delete unmaskedData[key];
        }
      });

      // 🚫 Remove campos "transferred" (campos de outras entidades que não devem ser enviados)
      allFields.forEach((field) => {
        if (field.transferred) {
          delete unmaskedData[field.name];
        }
      });

      // Determina método HTTP e URL baseado em entityId ou mode
      const isEdit = entityId || mode === "edit";
      const method = isEdit ? "put" : "post";
      const url = entityId
        ? `${metadata.endpoint}/${entityId}`
        : metadata.endpoint;

      const response = await api[method](url, unmaskedData);

      showToast(
        isEdit ? "Atualizado com sucesso!" : "Criado com sucesso!",
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

  // 📱 Detecta automaticamente campos de telefone pelo nome (helper reutilizável)
  const isPhoneFieldHelper = (fieldName: string): boolean => {
    const lowerName = fieldName.toLowerCase();
    const phoneKeywords = [
      "phone", "telefone", "fone", "tel",
      "celular", "cellphone", "cellular",
      "móvel", "movel", "mobile",
      "whatsapp", "whats", "zap"
    ];
    return phoneKeywords.some(keyword => lowerName.includes(keyword));
  };

  // Renderiza um campo baseado no tipo
  const renderField = (field: FormFieldMetadata) => {
    // Oculta campos marcados como não visíveis
    // ⚠️ EXCEÇÃO: Mostra campos de coordenadas (latitude/longitude) se tiverem valor no formData
    const isCoordinateField = field.name.toLowerCase().includes('latitude') || 
                              field.name.toLowerCase().includes('longitude');
    const hasValue = formData[field.name] !== undefined && formData[field.name] !== null && formData[field.name] !== '';
    
    if (field.visible === false && !(isCoordinateField && hasValue)) {
      return null;
    }

    // 🗺️ Detecta automaticamente campos de endereço pelo nome
    const isAddressField = (fieldName: string): boolean => {
      const lowerName = fieldName.toLowerCase();
      return (
        lowerName.includes('address') ||
        lowerName.includes('endereco') ||
        lowerName.includes('endereço')
      );
    };

    // 🗺️ Extrai o prefixo do campo de endereço (ex: "fromAddress" → "from")
    const getAddressPrefix = (fieldName: string): string => {
      const lowerName = fieldName.toLowerCase();
      if (lowerName.includes('address')) {
        return fieldName.replace(/address/i, '');
      }
      if (lowerName.includes('endereco') || lowerName.includes('endereço')) {
        return fieldName.replace(/endere[çc]o/i, '');
      }
      return '';
    };

    // 🗺️ Atualiza latitude e longitude quando endereço é selecionado no mapa
    const handleAddressCoordinatesChange = (fieldName: string, latitude: number, longitude: number) => {
      const prefix = getAddressPrefix(fieldName);
      
      // Tenta diferentes nomenclaturas para os campos de coordenadas
      const latitudeFields = [
        `${prefix}Latitude`,
        `${prefix}latitude`,
        `${prefix}Lat`,
        `${prefix}lat`,
      ];
      
      const longitudeFields = [
        `${prefix}Longitude`,
        `${prefix}longitude`,
        `${prefix}Lng`,
        `${prefix}lng`,
        `${prefix}Long`,
        `${prefix}long`,
      ];

      // Atualiza latitude
      for (const latField of latitudeFields) {
        if (Object.prototype.hasOwnProperty.call(formData, latField) || metadata.sections.some(s => s.fields.some(f => f.name === latField))) {
          handleChange(latField, latitude);
          break;
        }
      }

      // Atualiza longitude
      for (const lngField of longitudeFields) {
        if (Object.prototype.hasOwnProperty.call(formData, lngField) || metadata.sections.some(s => s.fields.some(f => f.name === lngField))) {
          handleChange(lngField, longitude);
          break;
        }
      }
    };

    // 🗺️ Callback para quando o endereço é selecionado no mapa
    // Recebe o nome do campo (ex: "fromAddress", "toAddress") e todos os dados do endereço
    const createAddressDataChangeHandler = (fieldName: string) => {
      return async (addressData: { 
        address: string; 
        latitude: number; 
        longitude: number; 
        city: string; 
        state: string; 
        zipCode: string;
        street?: string;
        number?: string;
        neighborhood?: string;
      }) => {
        console.log(`📍 [EntityForm] handleAddressDataChange para ${fieldName}:`, addressData);
        
        // 1. Atualiza o campo de endereço principal
        handleChange(fieldName, addressData.address);
        
        // 2. Atualiza latitude e longitude
        handleAddressCoordinatesChange(fieldName, addressData.latitude, addressData.longitude);
        
        // 3. Verifica se existe um campo "city" ou similar no formulário (para ArrayFields)
        const cityFields = ['city', 'cityId', 'cidade'];
        
        for (const cityField of cityFields) {
          const fieldExists = metadata.sections.some(s => s.fields.some(f => f.name === cityField));
          
          if (fieldExists && addressData.city) {
            try {
              // Busca a cidade no banco de dados pelo nome
              const response = await api.get<{ content: Array<{ id: string | number; name: string }> }>('/cities', {
                params: {
                  search: addressData.city,
                  state: addressData.state,
                  limit: 1
                }
              });
              
              if (response.data && response.data.content && response.data.content.length > 0) {
                const cityFromDB = response.data.content[0];
                handleChange(cityField, cityFromDB.id);
              } else {
                console.warn(`⚠️ Cidade "${addressData.city} - ${addressData.state}" não encontrada no banco de dados`);
              }
            } catch (error) {
              console.error('❌ Erro ao buscar cidade no banco:', error);
            }
            break;
          }
        }
      };
    };

    // Oculta campos de organização quando auto-preenchidos (modo criar)
    // ⚠️ EXCEÇÃO: ADMIN sempre vê o campo organization para poder escolher a organização
    if (
      !entityId &&
      organizationId &&
      !isAdmin() && // ✅ ADMIN sempre vê o campo
      (field.name === "organizationId" || field.name === "organization")
    ) {
      return null;
    }

    // Para campos array, garantir que o valor padrão seja array vazio
    const defaultValue = field.type === "array" ? [] : "";
    let value = formData[field.name] ?? defaultValue;
    
    // Se o valor é um objeto (ex: {id: "...", label: "..."}), extrai o id
    // Isso acontece quando passamos defaultValues com objetos para EntityTypeahead
    if (value && typeof value === "object" && "id" in value) {
      value = (value as { id: string | number }).id;
    }

    const error = errors[field.name];
    const stringValue = String(value ?? "");

    // 🔒 Verifica se o campo deve ser readonly (por configuração prop ou regra de negócio)
    // Campo "profile" é readonly para todos exceto admin
    const isProfileField = field.name === 'profile' || field.name === 'perfil';
    const isProfileReadonlyForNonAdmin = isProfileField && !isAdmin();
    
    const isFieldReadonly = readonlyFields.includes(field.name) || 
                            field.name === 'role' || // Campo "role" sempre readonly
                            isProfileReadonlyForNonAdmin; // Campo "profile" readonly para não-admins
    
    // 🙈 Verifica se o campo deve ficar escondido (hidden)
    // 🏦 bankName sempre hidden em bankAccount (auto-preenchido pelo bankCode)
    const isFieldHidden = hiddenFields.includes(field.name) ||
                          (metadata.entityName === "bankAccount" && field.name === "bankName");
    
    // Se o campo está hidden, não renderiza mas mantém o valor no formData
    if (isFieldHidden) {
      return null;
    }

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

    // 🧮 Campos computados são sempre readonly
    if (field.computed) {
      return (
        <FormField label={translateLabel(field.label)} required={field.required} error={error}>
          <FormInput
            type="text"
            placeholder=""
            value={stringValue}
            onChange={() => {}} // No-op, field is computed
            disabled={true}
            required={field.required}
            className="bg-gray-100 cursor-not-allowed highlighted-computed-field"
          />
        </FormField>
      );
    }

    switch (field.type) {
      case "text":
      case "email":
      case "password": {
        // 🗺️ Se é campo de endereço, renderiza com Google Maps
        if (field.type === "text" && isAddressField(field.name)) {
          const { lat: initialLat, lng: initialLng } = getInitialCoordinates(field.name);
          
          fieldContent = (
            <FormField
              label={translateLabel(field.label)}
              required={field.required}
              error={error}
            >
              <AddressFieldWithMap
                value={stringValue}
                onChange={(value) => handleChange(field.name, value)}
                placeholder={readonly || field.readonly || isFieldReadonly ? "" : field.placeholder}
                disabled={field.disabled || field.readonly || isFieldReadonly || loading || readonly}
                required={field.required}
                label={translateLabel(field.label)}
                fieldName={field.name}
                onCoordinatesChange={(lat, lng) => handleAddressCoordinatesChange(field.name, lat, lng)}
                onAddressDataChange={createAddressDataChangeHandler(field.name)}
                initialLatitude={initialLat}
                initialLongitude={initialLng}
              />
            </FormField>
          );
          break;
        }

        // �📱 Detecta automaticamente se precisa de máscara (CPF, telefone, etc)
        const autoMask = field.type === "text" ? getAutoMask(field.name) : null;

        fieldContent = (
          <FormField
            label={translateLabel(field.label)}
            required={field.required}
            error={error}
          >
            {autoMask === "cpf-cnpj-dynamic" ? (
              <DynamicDocumentInput
                value={stringValue}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={readonly || field.readonly || isFieldReadonly ? "" : field.placeholder}
                disabled={
                  field.disabled || field.readonly || isFieldReadonly || loading || readonly
                }
                required={field.required}
                readOnly={readonly || field.readonly}
              />
            ) : autoMask ? (
              <MaskedInput
                mask={autoMask}
                value={stringValue}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={readonly || field.readonly || isFieldReadonly ? "" : field.placeholder}
                disabled={
                  field.disabled || field.readonly || isFieldReadonly || loading || readonly
                }
                required={field.required}
                readOnly={readonly || field.readonly}
              />
            ) : (
              <FormInput
                type={field.type}
                placeholder={readonly || field.readonly || isFieldReadonly ? "" : field.placeholder}
                value={stringValue}
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={
                  field.disabled || field.readonly || isFieldReadonly || loading || readonly
                }
                required={field.required}
              />
            )}
          </FormField>
        );
        break;
      }

      case "currency":
      case "number":
        fieldContent = (
          <FormField
            label={translateLabel(field.label)}
            required={field.required}
            error={error}
          >
            <FormInput
              type="text"
              inputMode="decimal"
              placeholder={readonly || field.readonly || isFieldReadonly ? "" : field.placeholder}
              value={stringValue}
              onChange={(e) => {
                // Normaliza vírgula → ponto e remove caracteres inválidos
                const raw = e.target.value.replace(/,/g, ".");
                // Mantém apenas dígitos, ponto e sinal negativo; preserva só o primeiro ponto
                const match = raw.match(/^(-?\d*\.?\d*)/);
                const cleaned = match ? match[1] : "";
                handleChange(field.name, cleaned);
              }}
              disabled={field.disabled || field.readonly || isFieldReadonly || loading || readonly}
              required={field.required}
            />
          </FormField>
        );
        break;

      case "address":
        {
          const { lat: initialLat, lng: initialLng } = getInitialCoordinates(field.name);
          
          fieldContent = (
            <FormField
              label={translateLabel(field.label)}
              required={field.required}
              error={error}
            >
              <AddressFieldWithMap
                value={stringValue}
                onChange={(value) => handleChange(field.name, value)}
                placeholder={readonly ? "" : field.placeholder}
                disabled={field.disabled || field.readonly || isFieldReadonly || loading || readonly}
                required={field.required}
                label={translateLabel(field.label)}
                fieldName={field.name}
                onCoordinatesChange={(lat, lng) => handleAddressCoordinatesChange(field.name, lat, lng)}
                onAddressDataChange={createAddressDataChangeHandler(field.name)}
                initialLatitude={initialLat}
                initialLongitude={initialLng}
              />
            </FormField>
          );
        }
        break;

      case "textarea":
        // 🗺️ Se é campo de endereço, renderiza com Google Maps
        if (isAddressField(field.name)) {
          const { lat: initialLat, lng: initialLng } = getInitialCoordinates(field.name);
          
          fieldContent = (
            <FormField
              label={translateLabel(field.label)}
              required={field.required}
              error={error}
            >
              <AddressFieldWithMap
                value={stringValue}
                onChange={(value) => handleChange(field.name, value)}
                placeholder={readonly || field.readonly || isFieldReadonly ? "" : field.placeholder}
                disabled={field.disabled || field.readonly || isFieldReadonly || loading || readonly}
                required={field.required}
                fieldName={field.name}
                onCoordinatesChange={(lat, lng) => handleAddressCoordinatesChange(field.name, lat, lng)}
                onAddressDataChange={createAddressDataChangeHandler(field.name)}
                initialLatitude={initialLat}
                initialLongitude={initialLng}
              />
            </FormField>
          );
          break;
        }

        fieldContent = (
          <FormField
            label={translateLabel(field.label)}
            required={field.required}
            error={error}
          >
            <FormTextarea
              placeholder={readonly || field.readonly || isFieldReadonly ? "" : field.placeholder}
              value={stringValue}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={field.disabled || field.readonly || isFieldReadonly || loading || readonly}
              required={field.required}
            />
          </FormField>
        );
        break;

      case "select": {
        const isSelectDisabled =
          field.disabled || field.readonly || loading || readonly;

        fieldContent = (
          <FormField
            label={translateLabel(field.label)}
            required={field.required}
            error={error}
          >
            <FormSelect
              value={stringValue}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isSelectDisabled}
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
      }

      case "date": {
        // 🎂 Detecta se é campo de data de nascimento
        const isBirthDate =
          field.name === "dateOfBirth" ||
          field.name === "birthDate" ||
          field.name === "dataNascimento" ||
          field.label?.toLowerCase().includes("nascimento") ||
          field.label?.toLowerCase().includes("birth");

        // 🕐 Detecta automaticamente se deve mostrar hora/minuto
        // Métodos de detecção (em ordem de prioridade):
        // 1. Campo 'dataType' no metadata (datetime vs date) - usado pelo backend
        // 2. Campo 'javaType' no metadata (LocalDateTime vs LocalDate)
        // 3. Formato especificado (field.format) contém HH ou mm
        // 4. Nome do campo contém 'time', 'datetime', 'hora', 'At' (ex: createdAt, scheduledPickupAt)
        // 5. Padrão: apenas data (LocalDate)
        
        const dataType = (field as any).dataType?.toLowerCase() || "";
        const hasTimeInDataType = dataType === "datetime" || dataType === "timestamp";
        const javaType = (field as any).javaType || "";
        const hasTimeInJavaType = javaType.includes("LocalDateTime") || javaType.includes("Timestamp") || javaType.includes("ZonedDateTime");
        const hasTimeInFormat = field.format?.includes("HH") || field.format?.includes("mm") || field.format?.includes("hh");
        const hasTimeInName = field.name.toLowerCase().includes("time") || 
                             field.name.toLowerCase().includes("datetime") || 
                             field.name.toLowerCase().includes("hora") ||
                             field.name.endsWith("At"); // Detecta padrão createdAt, updatedAt, scheduledPickupAt, etc
        
        const shouldShowTime = hasTimeInDataType || hasTimeInJavaType || hasTimeInFormat || hasTimeInName;
        
        const dateFormat = field.format || (shouldShowTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");

        // Parse da data do backend: para datas puras (sem hora), ignora timezone
        let selectedDate: Date | null = null;
        if (value) {
          const valueStr = String(value);
          if (shouldShowTime) {
            // Com hora: usa parser padrão (considera timezone)
            selectedDate = new Date(valueStr);
          } else {
            // Sem hora: parseia como data local (ignora timezone)
            // Espera formato YYYY-MM-DD
            const match = valueStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
              const [, year, month, day] = match;
              selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              selectedDate = new Date(valueStr);
            }
          }
        }

        fieldContent = (
          <FormField
            label={translateLabel(field.label)}
            required={field.required}
            error={error}
          >
            <FormDatePicker
              selected={selectedDate}
              onChange={(date) => {
                if (!date) {
                  handleChange(field.name, null);
                } else if (shouldShowTime) {
                  // Para campos com hora: envia ISO string completo
                  handleChange(field.name, date.toISOString());
                } else {
                  // Para campos de data pura: envia apenas YYYY-MM-DD (evita problemas de timezone)
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  handleChange(field.name, `${year}-${month}-${day}`);
                }
              }}
              showTimeSelect={shouldShowTime}
              dateFormat={dateFormat}
              placeholder={readonly || field.readonly || isFieldReadonly ? "" : field.placeholder}
              disabled={field.disabled || field.readonly || isFieldReadonly || loading || readonly}
              readOnly={readonly || field.readonly}
              // ✅ Para datas de nascimento: ativa seletores e limita até hoje
              showYearDropdown={isBirthDate}
              showMonthDropdown={isBirthDate}
              scrollableYearDropdown={isBirthDate}
              yearDropdownItemNumber={isBirthDate ? 120 : 10}
              maxDate={isBirthDate ? new Date() : undefined}
            />
          </FormField>
        );
        break;
      }

      case "boolean":
        fieldContent = (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              minHeight: "40px",
              paddingTop: "18px", // Alinha verticalmente com os outros campos que têm label acima
            }}
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
                disabled={
                  field.disabled || field.readonly || loading || readonly
                }
                style={{
                  width: "18px",
                  height: "18px",
                  cursor:
                    field.disabled || field.readonly || loading || readonly
                      ? "not-allowed"
                      : "pointer",
                }}
              />
              <span style={{ fontSize: "14px", color: "#374151" }}>
                {translateLabel(field.label)}
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
              label={translateLabel(field.label)}
              required={field.required}
              error={error}
            >
              <CityTypeahead
                value={stringValue}
                onCitySelect={(city) => {
                  // ✅ CORREÇÃO: Salva o ID da cidade ao invés do nome
                  // O backend espera cityId (Long), não city (String)
                  const cityIdField = field.name.endsWith("Id")
                    ? field.name
                    : `${field.name}Id`;
                  handleChange(cityIdField, String(city.id));

                  // Armazena o nome da cidade para exibição (caso precise exibir depois)
                  handleChange(field.name, city.name);

                  // Armazena o estado da cidade para exibição
                  setCityStates((prev) => ({
                    ...prev,
                    [field.name]: city.stateCode || city.state || "",
                  }));
                }}
                placeholder={readonly || field.readonly || isFieldReadonly ? "" : (field.placeholder || "Digite o nome da cidade")}
                disabled={
                  field.disabled || field.readonly || isFieldReadonly || loading || readonly
                }
                readOnly={readonly || field.readonly}
              />
            </FormField>

            <FormField label="Estado" required={false}>
              <FormInput
                type="text"
                value={cityStates[field.name] || ""}
                readOnly
                disabled
                placeholder=""
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
        {
          // Campo de entidade relacionada (ex: city, organization, user, etc)

          // ✅ FALLBACK: Se não tiver entityConfig mas tiver relationship, cria automaticamente
          let entityConfig = field.entityConfig;
          if (!entityConfig && field.relationship) {
            entityConfig = {
              entityName: field.relationship.targetEntity,
              endpoint: field.relationship.targetEndpoint,
              labelField: "name", // Padrão: campo "name"
              valueField: "id", // Padrão: campo "id"
              renderAs: "typeahead" as const, // Padrão: typeahead para melhor UX
            };
          }

          if (!entityConfig) {
            console.warn(
              `Campo ${field.name} é do tipo 'entity' mas falta entityConfig e relationship`
            );
            return null;
          }

          // Detecta se é um filtro de cidade (city, cityId, ou entityName === 'city')
          const isCityField =
            field.name === "city" ||
            field.name === "cityId" ||
            entityConfig.entityName === "city";

          if (isCityField) {
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
                  label={translateLabel(field.label)}
                  required={field.required}
                  error={error}
                >
                  <CityTypeahead
                    value={stringValue}
                    onCitySelect={(city) => {
                      // ✅ CORREÇÃO: Salva o ID da cidade ao invés do nome
                      // O backend espera cityId (Long), não city (String)
                      handleChange("cityId", String(city.id));

                      // Armazena o nome da cidade para exibição
                      handleChange("city", city.name);

                      // Armazena o estado da cidade para exibição
                      setCityStates((prev) => ({
                        ...prev,
                        [field.name]: city.stateCode || city.state || "",
                      }));
                    }}
                    placeholder={readonly || field.readonly || isFieldReadonly ? "" : (field.placeholder || "Digite o nome da cidade")}
                    disabled={
                      field.disabled || field.readonly || isFieldReadonly || loading || readonly
                    }
                    readOnly={readonly || field.readonly}
                  />
                </FormField>

                <FormField label="Estado" required={false}>
                  <FormInput
                    type="text"
                    value={cityStates[field.name] || ""}
                    readOnly
                    disabled
                    placeholder=""
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
            // ✅ IMPLEMENTAÇÃO GENÉRICA: Decide qual componente renderizar baseado em renderAs
            const renderAs = entityConfig.renderAs || "select";
            const EntityComponent =
              renderAs === "typeahead" || renderAs === "autocomplete"
                ? EntityTypeahead
                : EntitySelect;

            fieldContent = (
              <FormField
                label={translateLabel(field.label)}
                required={field.required}
                error={error}
              >
                <EntityComponent
                  config={entityConfig}
                  value={stringValue}
                  onChange={(value) => handleChange(field.name, value)}
                  disabled={field.disabled || field.readonly || isFieldReadonly || loading || readonly}
                />
              </FormField>
            );
          }
        }
        break;

      case "array": {
        // ArrayFields são renderizados como containers separados
        // Não renderiza aqui para evitar duplicação
        return null;
      }

      default:
        fieldContent = null;
        break;
    }

    // Retorna o conteúdo do campo diretamente (wrapper é feito no renderSection)
    return fieldContent;
  };

  // 🔍 Função auxiliar para verificar se um campo deve ser renderizado (não está hidden e passa no showIf)
  const shouldRenderField = (field: FormFieldMetadata): boolean => {
    // Verifica se está em hiddenFields
    if (hiddenFields.includes(field.name)) {
      return false;
    }

    // Verifica condição showIf
    if (field.showIf) {
      try {
        const shouldShow = new Function("data", `return ${field.showIf}`)(
          formData
        );
        return shouldShow;
      } catch (e) {
        console.warn(`Erro ao avaliar showIf: ${field.showIf}`, e);
        return false;
      }
    }

    return true;
  };

  // 📍 Função auxiliar para obter coordenadas iniciais baseadas no nome do campo de endereço
  const getInitialCoordinates = (fieldName: string): { lat?: number; lng?: number } => {
    const fieldBaseName = fieldName.replace(/Address$/i, '').replace(/Endereco$/i, '').replace(/Endereço$/i, '');
    const latFieldName = `${fieldBaseName}Latitude`;
    const lngFieldName = `${fieldBaseName}Longitude`;
    
    // Se o campo tem coordenadas próprias, usa elas
    if (formData[latFieldName] !== undefined && formData[lngFieldName] !== undefined) {
      return {
        lat: Number(formData[latFieldName]),
        lng: Number(formData[lngFieldName])
      };
    }
    
    // 🚚 Para campo de destino (toAddress): se não tem coordenadas próprias,
    // usa as coordenadas de origem para centralizar o mapa
    if (fieldName === 'toAddress' || fieldName.toLowerCase() === 'toaddress') {
      if (formData.fromLatitude !== undefined && formData.fromLongitude !== undefined) {
        return {
          lat: Number(formData.fromLatitude),
          lng: Number(formData.fromLongitude)
        };
      }
    }
    
    return { lat: undefined, lng: undefined };
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
    const arrayFields = hideArrayFields
      ? []
      : section.fields.filter((f) => f.type === "array" && !hiddenFields.includes(f.name)); // Filtra também por hiddenFields

    // 📱 Agrupa campos relacionados para renderização em grid (DDD+Phone, Agencia+Digito, etc)
    const processFieldsForRendering = (fields: FormFieldMetadata[]) => {
      const processed: Array<
        FormFieldMetadata | 
        { type: 'ddd-phone-group', dddField: FormFieldMetadata, phoneField: FormFieldMetadata } |
        { type: 'account-digit-group', mainField: FormFieldMetadata, digitField: FormFieldMetadata, groupType: 'agencia' | 'conta' }
      > = [];
      const skipIndices = new Set<number>();

      fields.forEach((field, index) => {
        if (skipIndices.has(index)) return;

        const fieldNameLower = field.name.toLowerCase();

        // Detecta se é campo DDD
        const isDDD = fieldNameLower === 'ddd' || fieldNameLower.endsWith('ddd');

        if (isDDD && index < fields.length - 1) {
          // Procura o próximo campo phone
          const nextField = fields[index + 1];
          const isNextPhone = isPhoneFieldHelper(nextField.name);

          if (isNextPhone) {
            // Agrupa DDD + Phone
            processed.push({
              type: 'ddd-phone-group',
              dddField: field,
              phoneField: nextField
            });
            skipIndices.add(index + 1); // Pula o campo phone na próxima iteração
            return;
          }
        }

        // Detecta se é campo Agencia (sem o digito)
        const isAgencia = fieldNameLower === 'agencia' || 
                          (fieldNameLower.includes('agencia') && !fieldNameLower.includes('digit'));

        if (isAgencia && index < fields.length - 1) {
          const nextField = fields[index + 1];
          const nextFieldNameLower = nextField.name.toLowerCase();
          const isDigitoAgencia = nextFieldNameLower.includes('digit') && nextFieldNameLower.includes('agencia');

          if (isDigitoAgencia) {
            // Agrupa Agencia + DigitoAgencia
            processed.push({
              type: 'account-digit-group',
              mainField: field,
              digitField: nextField,
              groupType: 'agencia'
            });
            skipIndices.add(index + 1);
            return;
          }
        }

        // Detecta se é campo Numero da Conta (sem o digito)
        const isNumeroConta = (fieldNameLower.includes('numero') && fieldNameLower.includes('conta')) ||
                              fieldNameLower === 'numerodaconta';

        if (isNumeroConta && index < fields.length - 1) {
          const nextField = fields[index + 1];
          const nextFieldNameLower = nextField.name.toLowerCase();
          const isDigitoConta = nextFieldNameLower.includes('digit') && nextFieldNameLower.includes('conta');

          if (isDigitoConta) {
            // Agrupa NumeroDaConta + DigitoDaConta
            processed.push({
              type: 'account-digit-group',
              mainField: field,
              digitField: nextField,
              groupType: 'conta'
            });
            skipIndices.add(index + 1);
            return;
          }
        }

        // Campo normal
        processed.push(field);
      });

      return processed;
    };

    // 🚫 Se hideArrayFields está ativo e a seção só tem array fields, não renderiza
    const onlyHasArrayFields =
      regularFields.length === 0 && textareaFields.length === 0;
    if (hideArrayFields && onlyHasArrayFields) {
      return null; // Não renderiza seção de relacionamentos
    }

    // No modo readonly, se a seção só tem array fields e todos estão vazios, não renderiza a seção
    if (readonly || formMode === "view") {
      const onlyHasArrays =
        regularFields.length === 0 && textareaFields.length === 0;
      if (onlyHasArrays) {
        const allArraysEmpty = arrayFields.every((field) => {
          const value = formData[field.name];
          return !Array.isArray(value) || value.length === 0;
        });
        if (allArraysEmpty) {
          return null; // Não renderiza seção vazia no modo view
        }
      }
    }

    // ✅ Se a seção só tem array fields, não renderiza FormContainer aqui
    // Os ArrayFields serão renderizados como containers separados
    if (onlyHasArrayFields) {
      return null;
    }

    return (
      <FormContainer key={section.id} title={sectionTitle} icon={section.icon}>
        {/* Grid responsivo moderno - campos normais */}
        {regularFields.length > 0 && (
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
            {processFieldsForRendering(regularFields).filter((item) => {
              if ('type' in item && item.type === 'ddd-phone-group') {
                // Grupos sempre visíveis se pelo menos um campo deve ser renderizado
                return shouldRenderField(item.dddField) || shouldRenderField(item.phoneField);
              }
              if ('type' in item && item.type === 'account-digit-group') {
                return shouldRenderField(item.mainField) || shouldRenderField(item.digitField);
              }
              return shouldRenderField(item as FormFieldMetadata);
            }).map((item, index) => {
              // Renderiza grupo DDD + Phone
              if ('type' in item && item.type === 'ddd-phone-group') {
                const { dddField, phoneField } = item;
                const dddValue = String(formData[dddField.name] ?? "");
                const phoneValue = String(formData[phoneField.name] ?? "");
                const dddError = errors[dddField.name];
                const phoneError = errors[phoneField.name];

                return (
                  <div
                    key={`ddd-phone-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr",
                      gap: "0.75rem",
                      alignItems: "end",
                    }}
                  >
                    <FormField
                      label={dddField.label}
                      required={dddField.required}
                      error={dddError}
                    >
                      <MaskedInput
                        mask="(99)"
                        value={dddValue}
                        onChange={(e) => handleChange(dddField.name, e.target.value)}
                        placeholder={readonly || dddField.readonly ? "" : (dddField.placeholder || "(__)")}
                        disabled={dddField.disabled || dddField.readonly || loading || readonly}
                        required={dddField.required}
                        readOnly={readonly || dddField.readonly}
                      />
                    </FormField>

                    <FormField
                      label={phoneField.label}
                      required={phoneField.required}
                      error={phoneError}
                    >
                      <MaskedInput
                        mask="99999-9999"
                        value={phoneValue}
                        onChange={(e) => handleChange(phoneField.name, e.target.value)}
                        placeholder={readonly || phoneField.readonly ? "" : (phoneField.placeholder || "99999-9999")}
                        disabled={phoneField.disabled || phoneField.readonly || loading || readonly}
                        required={phoneField.required}
                        readOnly={readonly || phoneField.readonly}
                      />
                    </FormField>
                  </div>
                );
              }

              // Renderiza grupo Agencia+Digito ou Conta+Digito
              if ('type' in item && item.type === 'account-digit-group') {
                const { mainField, digitField, groupType } = item;
                const mainValue = String(formData[mainField.name] ?? "");
                const digitValue = String(formData[digitField.name] ?? "");
                const mainError = errors[mainField.name];
                const digitError = errors[digitField.name];

                return (
                  <div
                    key={`${groupType}-digit-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 60px",
                      gap: "0.75rem",
                      alignItems: "end",
                    }}
                  >
                    <FormField
                      label={mainField.label}
                      required={mainField.required}
                      error={mainError}
                    >
                      <FormInput
                        type="text"
                        value={mainValue}
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          const value =
                            groupType === "agencia" ? rawValue.slice(0, 4) : rawValue;
                          handleChange(mainField.name, value);
                        }}
                        placeholder={readonly || mainField.readonly ? "" : mainField.placeholder}
                        disabled={mainField.disabled || mainField.readonly || loading || readonly}
                        required={mainField.required}
                        readOnly={readonly || mainField.readonly}
                        maxLength={groupType === "agencia" ? 4 : undefined}
                      />
                    </FormField>

                    <FormField
                      label={digitField.label}
                      required={digitField.required}
                      error={digitError}
                    >
                      <FormInput
                        type="text"
                        value={digitValue}
                        onChange={(e) => {
                          // Limita a 1 caractere
                          const value = e.target.value.slice(0, 1);
                          handleChange(digitField.name, value);
                        }}
                        placeholder={readonly || digitField.readonly ? "" : digitField.placeholder}
                        disabled={digitField.disabled || digitField.readonly || loading || readonly}
                        required={digitField.required}
                        readOnly={readonly || digitField.readonly}
                        maxLength={1}
                        style={{ textAlign: 'center' }}
                      />
                    </FormField>
                  </div>
                );
              }

              // Renderiza campo normal
              const field = item as FormFieldMetadata;
              return <div key={field.name}>{renderField(field)}</div>;
            })}
          </div>
        )}

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
            {textareaFields.filter(shouldRenderField).map((field) => (
              <div key={field.name} className="form-field-wide">
                {renderField(field)}
              </div>
            ))}
          </div>
        )}

        {/* Campos array aparecem por último, ocupando largura completa */}
        {/* Removido daqui - ArrayFields agora são renderizados como containers separados */}
      </FormContainer>
    );
  };

  // Renderiza ArrayFields como containers separados
  const renderArrayFieldContainers = (section: FormSectionMetadata) => {
    const arrayFields = hideArrayFields
      ? []
      : section.fields.filter((f) => f.type === "array" && !hiddenFields.includes(f.name)); // Filtra também por hiddenFields

    return arrayFields.map((field) => {
      const value = (formData[field.name] as unknown[]) ?? [];

      // Só renderiza se tiver dados ou não estiver no modo view
      if (readonly || formMode === "view") {
        if (!Array.isArray(value) || value.length === 0) {
          return null; // Não renderiza container vazio no modo view
        }
      }

      // Verifica se o campo tem arrayConfig
      if (!field.arrayConfig) {
        console.warn(
          `Campo ${field.name} é do tipo 'array' mas falta arrayConfig`
        );
        return null;
      }

      // ✅ CORREÇÃO GENÉRICA: Remove campo de relacionamento com o pai
      // Ex: Em Event.categories, remove o campo "event" dos items
      // O campo pai será injetado automaticamente no save
      const filteredFields =
        field.arrayConfig.fields?.filter((f) => {
          // Remove campos que referenciam a entidade pai
          // Detecta por nome (ex: "event", "eventId") ou por tipo entity com mesmo nome
          const parentEntityName = metadata.entityName; // ex: "event"
          const isParentReference =
            f.name === parentEntityName ||
            f.name === `${parentEntityName}Id` ||
            (f.type === "entity" &&
              f.relationship?.targetEntity === parentEntityName);

          if (isParentReference) {
          }

          return !isParentReference;
        }) || [];

      const error = errors[field.name];

      return (
        <FormContainer
          key={`array-${field.name}`}
          title={translateLabel(field.arrayConfig?.label || field.label)}
        >
          <ArrayField
            config={{
              ...field.arrayConfig,
              label: field.arrayConfig?.label || field.label,
              fields: filteredFields, // ✅ Usa campos filtrados
              labelField: field.relationship?.labelField, // ✅ Passa o campo a ser usado como label
            }}
            value={Array.isArray(value) ? value : []}
            onChange={(val) => handleChange(field.name, val)}
            disabled={
              field.disabled || loading || readonly || formMode === "view"
            } // ✅ Respeita modo view/readonly
            error={error}
          />
        </FormContainer>
      );
    });
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

      {/* Renderiza ArrayFields como containers separados */}
      {metadata.sections.map((section) => renderArrayFieldContainers(section))}

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

      {/* Conteúdo customizado antes dos botões */}
      {renderBeforeButtons && renderBeforeButtons()}

      {/* Botões de ação - Não renderiza no modo view (readonly) */}
      {!readonly && formMode !== "view" && (
        <div style={{ marginBottom: "0px" }}>
          <FormActions>
            <FormButton
              type="submit"
              variant="primary"
              icon={<FiSave />}
              disabled={loading}
            >
              {loading ? "Salvando..." : metadata.submitLabel || "Salvar"}
            </FormButton>

            {!hideCancelButton && (
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
                {metadata.cancelLabel || "Cancelar"}
              </FormButton>
            )}
          </FormActions>
        </div>
      )}
    </form>
  );
};

export default EntityForm;

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FiPlus,
  FiTrash2,
  FiMenu,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import type { ArrayFieldConfig, FormFieldMetadata } from "../../types/metadata";
import { api } from "../../services/api";
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormDatePicker,
} from "../Common/FormComponents";
import { MaskedInput } from "../Common/MaskedInput";
import { getAutoMask } from "../../utils/masks";
import EntitySelect from "../Common/EntitySelect";
import EntityTypeahead from "../Common/EntityTypeahead";
import { CityTypeahead } from "../Common/CityTypeahead";
import { AddressFieldWithMap } from "../Common/AddressFieldWithMap";
import type { AddressData } from "../Common/AddressMapPicker";
import { executeComputedField } from "../../utils/computedFields";
import { translateLabel } from "../../utils/labelTranslations";
import "./ArrayField.css";

interface ArrayFieldProps {
  config: ArrayFieldConfig;
  value: unknown[];
  onChange: (value: unknown[]) => void;
  disabled?: boolean;
  error?: string;
}

export const ArrayField: React.FC<ArrayFieldProps> = ({
  config,
  value = [],
  onChange,
  disabled = false,
}) => {
  const { fields = [], minItems = 0, maxItems = 100 } = config;

  // � useRef para manter referência atualizada do value
  // Isso resolve o problema de stale closure em callbacks assíncronos
  const valueRef = useRef(value);
  
  // 🔄 Sincroniza a ref sempre que value mudar
  useEffect(() => {
    valueRef.current = value;
    console.log('📍 [ArrayField] value prop atualizado:', value);
  }, [value]);

  // 🔄 Converte plural em singular (Categorias → Categoria)
  const pluralToSingular = (plural: string): string => {
    // Remove 's' final para a maioria dos plurais portugueses
    if (plural.endsWith("s")) {
      return plural.slice(0, -1);
    }
    return plural;
  };

  // 🏷️ Gera labels inteligentes baseados no field.label do backend
  const generateSmartLabels = () => {
    // Backend manda field.label = "Categorias" (plural) ou "Client Contracts"
    const rawLabel = config.label || "Items";
    
    // Aplica tradução customizada se existir
    const pluralLabel = translateLabel(rawLabel);

    // Converte para singular: "Categorias" → "Categoria"
    const singularName = pluralToSingular(pluralLabel);

    // 🎯 SEMPRE gera os labels do singular, ignorando qualquer valor do backend
    // Backend não envia addLabel/itemLabel, então geramos aqui
    const itemLabel = `${singularName} {index}`;
    const addLabel = `Adicionar ${singularName}`;

    return { itemLabel, addLabel, pluralLabel };
  };

  const { itemLabel, addLabel } = generateSmartLabels();

  // 🚫 Remove placeholder se campo for readonly
  const getPlaceholder = (field: FormFieldMetadata): string | undefined => {
    if (field.readonly || disabled) {
      return undefined; // Não mostra placeholder em campos readonly
    }
    return field.placeholder;
  };

  // Cada item controla seu próprio estado de collapse
  const [collapsedItems, setCollapsedItems] = useState<Record<number, boolean>>(
    {}
  );

  // 🧮 Recalcula campos computados para cada item do array
  useEffect(() => {
    const computedFields = fields.filter(
      (f) => f.computed && f.computedDependencies
    );

    if (computedFields.length === 0 || !Array.isArray(value)) return;

    let hasChanges = false;
    const newValue = value.map((item) => {
      if (!item || typeof item !== "object") return item;

      const itemData = item as Record<string, unknown>;
      const updatedItem = { ...itemData };

      computedFields.forEach((field) => {
        if (!field.computed || !field.computedDependencies) return;

        const result = executeComputedField(field.computed, updatedItem);

        // Só atualiza se o valor calculado for diferente do atual
        if (result !== null && result !== updatedItem[field.name]) {
          updatedItem[field.name] = result;
          hasChanges = true;
        }
      });

      return updatedItem;
    });

    if (hasChanges) {
      onChange(newValue);
    }
  }, [fields, onChange]); // ✅ REMOVIDO: value da dependência para evitar loops infinitos

  // ✅ CORREÇÃO CRÍTICA: handleFieldChange usa valueRef.current
  // para garantir que sempre pegue o valor mais recente (resolve stale closure)
  const handleFieldChange = useCallback((
    itemIndex: number,
    fieldName: string,
    fieldValue: unknown
  ) => {
    // ✅ USA valueRef.current para pegar o valor mais recente
    const currentValue = valueRef.current;
    const newArray = [...currentValue];
    const currentItem = (newArray[itemIndex] as Record<string, unknown>) || {};

    // Atualiza o campo específico
    newArray[itemIndex] = {
      ...currentItem,
      [fieldName]: fieldValue,
    };

    // ✅ Atualiza a ref ANTES de chamar onChange
    valueRef.current = newArray;
    onChange(newArray);
  }, [onChange]);

  // 📍 Atualiza múltiplos campos de uma vez (ex: latitude e longitude juntos)
  // ⚠️ USA valueRef.current para sempre pegar o valor mais recente (resolve stale closure)
  const handleMultipleFieldsChange = useCallback((
    itemIndex: number,
    updates: Record<string, unknown>
  ) => {
    console.log('📍 [ArrayField] handleMultipleFieldsChange chamado:', { itemIndex, updates });
    // ✅ USA valueRef.current para pegar o valor mais recente (não o valor do closure)
    const currentValue = valueRef.current;
    console.log('📍 [ArrayField] value atual (antes):', JSON.stringify(currentValue, null, 2));
    const newArray = [...currentValue];
    const currentItem = (newArray[itemIndex] as Record<string, unknown>) || {};

    newArray[itemIndex] = {
      ...currentItem,
      ...updates,
    };

    console.log('📍 [ArrayField] Novo item após update:', newArray[itemIndex]);
    console.log('📍 [ArrayField] newArray completo:', JSON.stringify(newArray, null, 2));
    console.log('📍 [ArrayField] Chamando onChange...');
    
    // ✅ Atualiza a ref ANTES de chamar onChange para que o próximo update use o valor correto
    valueRef.current = newArray;
    onChange(newArray);
    console.log('📍 [ArrayField] onChange chamado com sucesso');
  }, [onChange]);

  // Adiciona um novo item
  const addItem = () => {
    if (value.length >= maxItems) return;

    const newItem: Record<string, unknown> = {};

    // Inicializa campos com valores padrão
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        newItem[field.name] = field.defaultValue;
      } else if (field.type === "boolean") {
        newItem[field.name] = false;
      } else if (field.type === "array") {
        newItem[field.name] = [];
      } else {
        newItem[field.name] = "";
      }
    });
    onChange([...value, newItem]);
  };

  // Remove um item
  const removeItem = (index: number) => {
    const newArray = value.filter((_, i) => i !== index);
    onChange(newArray);

    // Remove estado de collapse do item removido
    setCollapsedItems((prev) => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  // Toggle collapse de um item
  const toggleCollapse = (index: number) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Renderiza um campo dentro de um item do array
  const renderItemField = (
    field: FormFieldMetadata,
    itemValue: Record<string, unknown>,
    itemIndex: number
  ) => {
    // Oculta campos marcados como não visíveis
    if (field.visible === false) {
      return null;
    }

    const fieldValue = itemValue[field.name];

    // 🏙️ Detecta se é campo de cidade (por tipo ou por nome)
    const isCityField = field.type === "city" || field.name === "city" || field.name === "cidade";

    // ✅ CORREÇÃO: Para campos entity, extrai o ID se o valor for um objeto
    // 🏙️ Para campos city, extrai o NOME para exibição no typeahead
    let stringValue: string;
    if (fieldValue && typeof fieldValue === "object") {
      const entityObj = fieldValue as Record<string, unknown>;
      if (isCityField) {
        // Para cidade, exibe apenas o nome (estado já aparece em campo separado)
        stringValue = String(entityObj.name || "");
      } else {
        // Para outros entities, extrai o ID
        stringValue = String(entityObj.id || "");
      }
    } else {
      stringValue = String(fieldValue || "");
    }

    // 🧮 Campos computados são sempre readonly
    if (field.computed) {
      return (
        <FormField label={field.label} required={field.required}>
          <FormInput
            type="text"
            placeholder={field.placeholder}
            value={stringValue}
            onChange={() => {}} // No-op, field is computed
            disabled={true}
            required={field.required}
            className="bg-gray-100 cursor-not-allowed highlighted-computed-field"
          />
        </FormField>
      );
    }

    // 📍 Detecta se é campo de rua/logradouro que deve ter o botão do mapa
    const isStreetField = 
      field.name === 'street' || 
      field.name === 'logradouro' ||
      field.name === 'rua';

    switch (field.type) {
      case "text":
      case "email":
      case "password": {
        // 📱 Detecta automaticamente se precisa de máscara (CPF, telefone, etc)
        const autoMask = field.type === "text" ? getAutoMask(field.name) : null;

        // 📍 Se é campo de rua, adiciona botão do mapa
        if (isStreetField && !disabled) {
          const latValue = itemValue.latitude as number || 0;
          const lngValue = itemValue.longitude as number || 0;
          const numberValue = String(itemValue.number || itemValue.numero || "");
          const neighborhoodValue = String(itemValue.neighborhood || itemValue.bairro || "");
          const cityValue = typeof itemValue.city === 'object' && itemValue.city 
            ? String((itemValue.city as Record<string, unknown>).name || "")
            : String(itemValue.city || itemValue.cidade || "");
          const stateValue = typeof itemValue.city === 'object' && itemValue.city
            ? String((itemValue.city as Record<string, unknown>).stateCode || (itemValue.city as Record<string, unknown>).state || "")
            : String(itemValue.state || itemValue.uf || "");
          const zipCodeValue = String(itemValue.zipCode || itemValue.cep || itemValue.postalCode || "");

          return (
            <FormField label={field.label} required={field.required}>
              <AddressFieldWithMap
                value={stringValue}
                onChange={(newValue) => {
                  handleFieldChange(itemIndex, field.name, newValue);
                }}
                placeholder={getPlaceholder(field)}
                disabled={field.disabled || disabled}
                required={field.required}
                label={field.label}
                initialLatitude={latValue}
                initialLongitude={lngValue}
                initialNumber={numberValue}
                initialNeighborhood={neighborhoodValue}
                initialCity={cityValue}
                initialState={stateValue}
                initialZipCode={zipCodeValue}
                onAddressDataChange={(addressData: AddressData) => {
                  console.log('📍 [ArrayField] Street field - onAddressDataChange:', addressData);
                  
                  const updates: Record<string, unknown> = {
                    // Coordenadas
                    latitude: addressData.latitude,
                    longitude: addressData.longitude,
                  };

                  // Preenche o campo de rua atual (usa street ou address como fallback)
                  const streetValue = addressData.street || addressData.address;
                  if (streetValue) {
                    updates[field.name] = streetValue;
                  }

                  // Preenche número
                  if (addressData.number && fields.some(f => f.name === 'number' || f.name === 'numero')) {
                    if (fields.some(f => f.name === 'number')) updates.number = addressData.number;
                    if (fields.some(f => f.name === 'numero')) updates.numero = addressData.number;
                  }

                  // Preenche bairro
                  if (addressData.neighborhood && fields.some(f => f.name === 'neighborhood' || f.name === 'bairro')) {
                    if (fields.some(f => f.name === 'neighborhood')) updates.neighborhood = addressData.neighborhood;
                    if (fields.some(f => f.name === 'bairro')) updates.bairro = addressData.neighborhood;
                  }

                  // Preenche estado/UF
                  if (addressData.state && fields.some(f => f.name === 'state' || f.name === 'uf')) {
                    if (fields.some(f => f.name === 'state')) updates.state = addressData.state;
                    if (fields.some(f => f.name === 'uf')) updates.uf = addressData.state;
                  }

                  // Preenche CEP
                  if (addressData.zipCode && fields.some(f => f.name === 'zipCode' || f.name === 'cep' || f.name === 'postalCode')) {
                    if (fields.some(f => f.name === 'zipCode')) updates.zipCode = addressData.zipCode;
                    if (fields.some(f => f.name === 'cep')) updates.cep = addressData.zipCode;
                    if (fields.some(f => f.name === 'postalCode')) updates.postalCode = addressData.zipCode;
                  }

                  // 🔄 PRIMEIRO: Atualiza os campos básicos imediatamente
                  console.log('📍 [ArrayField] Street field - Atualizando campos básicos:', updates);
                  handleMultipleFieldsChange(itemIndex, updates);

                  // 🏙️ DEPOIS: Busca cidade automaticamente pelo nome e estado (assíncrono)
                  const searchAndSetCity = async () => {
                    const hasCityField = fields.some(f => f.name === 'city');
                    const cityField = fields.find(f => f.name === 'city');
                    
                    console.log('🏙️ [ArrayField] cityField:', cityField?.name, 'type:', cityField?.type);
                    
                    // Se campo city é um relacionamento (entity ou city type), buscar pelo ID
                    const isCityRelation = cityField?.type === 'entity' || cityField?.type === 'city';
                    
                    if (hasCityField && isCityRelation && addressData.city) {
                      try {
                        console.log('🔍 [ArrayField] Buscando cidade:', addressData.city);
                        const response = await api.get(`/api/cities/search?q=${encodeURIComponent(addressData.city)}`);
                        const cities = Array.isArray(response.data) ? response.data : [];
                        
                        console.log('🔍 [ArrayField] Cidades encontradas:', cities.length);
                        
                        // Encontra a cidade que corresponde ao nome e estado
                        let matchedCity = cities.find((c: { name: string; state?: string; stateCode?: string }) => 
                          c.name.toLowerCase() === addressData.city?.toLowerCase() &&
                          (addressData.state ? (c.stateCode === addressData.state || c.state === addressData.state) : true)
                        );
                        
                        // Se não encontrou match exato, pega a primeira
                        if (!matchedCity && cities.length > 0) {
                          matchedCity = cities[0];
                        }
                        
                        if (matchedCity) {
                          console.log('✅ [ArrayField] Cidade encontrada, atualizando:', matchedCity);
                          // Atualiza só o campo city (os outros já foram atualizados)
                          handleMultipleFieldsChange(itemIndex, { city: matchedCity });
                        } else {
                          console.log('⚠️ [ArrayField] Cidade não encontrada para:', addressData.city);
                        }
                      } catch (error) {
                        console.error('❌ [ArrayField] Erro ao buscar cidade:', error);
                      }
                    } else if (hasCityField && addressData.city) {
                      // Campo city não é entity/city type, preenche só com o nome
                      handleMultipleFieldsChange(itemIndex, { city: addressData.city });
                    }
                  };
                  
                  searchAndSetCity();
                }}
              />
            </FormField>
          );
        }

        return (
          <FormField label={field.label} required={field.required}>
            {autoMask ? (
              <MaskedInput
                mask={autoMask}
                value={stringValue}
                onChange={(e) =>
                  handleFieldChange(itemIndex, field.name, e.target.value)
                }
                placeholder={getPlaceholder(field)}
                disabled={field.disabled || disabled}
                required={field.required}
              />
            ) : (
              <FormInput
                type={field.type}
                placeholder={getPlaceholder(field)}
                value={stringValue}
                onChange={(e) =>
                  handleFieldChange(itemIndex, field.name, e.target.value)
                }
                disabled={field.disabled || disabled}
                required={field.required}
              />
            )}
          </FormField>
        );
      }

      case "number": {
        // 📍 Detecta campos de coordenadas (latitude/longitude) - devem ser readonly
        const isCoordinateField = 
          field.name === "latitude" || 
          field.name === "longitude" ||
          field.name === "lat" ||
          field.name === "lng" ||
          field.name.toLowerCase().includes("latitude") ||
          field.name.toLowerCase().includes("longitude");

        const isReadonly = field.readonly || isCoordinateField;

        return (
          <FormField label={field.label} required={field.required}>
            <FormInput
              type="number"
              placeholder={isReadonly ? "" : getPlaceholder(field)}
              min={field.validation?.min}
              max={field.validation?.max}
              step={isCoordinateField ? "0.000001" : undefined}
              value={stringValue}
              onChange={(e) =>
                !isReadonly && handleFieldChange(
                  itemIndex,
                  field.name,
                  field.type === "number"
                    ? Number(e.target.value)
                    : e.target.value
                )
              }
              disabled={field.disabled || disabled}
              readOnly={isReadonly}
              required={field.required}
              style={isReadonly ? { 
                backgroundColor: "#f3f4f6", 
                cursor: "not-allowed",
                color: "#6b7280"
              } : undefined}
            />
          </FormField>
        );
      }

      case "textarea":
        return (
          <FormField label={field.label} required={field.required}>
            <FormTextarea
              placeholder={getPlaceholder(field)}
              value={stringValue}
              onChange={(e) =>
                handleFieldChange(itemIndex, field.name, e.target.value)
              }
              disabled={field.disabled || disabled}
              required={field.required}
            />
          </FormField>
        );

      case "select":
        return (
          <FormField label={field.label} required={field.required}>
            <FormSelect
              value={stringValue}
              onChange={(e) =>
                handleFieldChange(itemIndex, field.name, e.target.value)
              }
              disabled={field.disabled || disabled}
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

      case "date": {
        // 🎂 Detecta se é campo de data de nascimento
        const isBirthDate =
          field.name === "dateOfBirth" ||
          field.name === "birthDate" ||
          field.name === "dataNascimento" ||
          field.label?.toLowerCase().includes("nascimento") ||
          field.label?.toLowerCase().includes("birth");

        // Detecta automaticamente se deve mostrar hora/minuto
        const shouldShowTime =
          field.format?.includes("HH") || field.format?.includes("mm") || false;
        const dateFormat =
          field.format || (shouldShowTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");

        return (
          <FormField label={field.label} required={field.required}>
              <FormDatePicker
                selected={fieldValue ? new Date(String(fieldValue)) : null}
                onChange={(date) =>
                  handleFieldChange(
                    itemIndex,
                    field.name,
                    date?.toISOString() || ""
                  )
                }
                showTimeSelect={shouldShowTime}
                dateFormat={dateFormat}
                placeholder={getPlaceholder(field)}
                disabled={field.disabled || disabled}
                // ✅ Para datas de nascimento: ativa seletores e limita até hoje
                showYearDropdown={isBirthDate}
                showMonthDropdown={isBirthDate}
                scrollableYearDropdown={isBirthDate}
                yearDropdownItemNumber={isBirthDate ? 120 : 10}
                maxDate={isBirthDate ? new Date() : undefined}
              />
          </FormField>
        );
      }

      case "boolean":
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              minHeight: "40px",
              paddingTop: "18px",
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
                checked={!!fieldValue}
                onChange={(e) =>
                  handleFieldChange(itemIndex, field.name, e.target.checked)
                }
                disabled={field.disabled || disabled}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor:
                    field.disabled || disabled ? "not-allowed" : "pointer",
                }}
              />
              <span style={{ fontSize: "14px", color: "#374151" }}>
                {field.label}
              </span>
            </label>
          </div>
        );

      case "city": {
        // 🏙️ Extrai o estado do objeto cidade se disponível
        const cityObj = fieldValue && typeof fieldValue === "object" 
          ? fieldValue as Record<string, unknown>
          : null;
        const stateValue = cityObj?.stateCode || cityObj?.state || itemValue.state || itemValue.uf || "";
        
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 100px",
              gap: "1rem",
              alignItems: "end",
            }}
          >
            <FormField label={field.label} required={field.required}>
              <CityTypeahead
                value={stringValue}
                onCitySelect={(city) => {
                  // Salva o ID da cidade
                  const cityIdField = field.name.endsWith("Id")
                    ? field.name
                    : `${field.name}Id`;
                  handleFieldChange(itemIndex, cityIdField, String(city.id));
                  // Salva o nome da cidade para exibição
                  handleFieldChange(itemIndex, field.name, city.name);
                }}
                placeholder={getPlaceholder(field) || "Digite o nome da cidade"}
                disabled={field.disabled || disabled}
              />
            </FormField>

            <FormField label="Estado" required={false}>
              <FormInput
                type="text"
                value={String(stateValue)}
                readOnly
                disabled
                placeholder={getPlaceholder(field) || "--"}
                style={{
                  backgroundColor: "#f3f4f6",
                  cursor: "not-allowed",
                  textAlign: "center",
                }}
              />
            </FormField>
          </div>
        );
      }

      case "entity": {
        // 🏙️ Se é campo de cidade (por nome), renderiza como CityTypeahead
        if (isCityField) {
          const cityObj = fieldValue && typeof fieldValue === "object" 
            ? fieldValue as Record<string, unknown>
            : null;
          const stateValue = cityObj?.stateCode || cityObj?.state || itemValue.state || itemValue.uf || "";
          
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 100px",
                gap: "1rem",
                alignItems: "end",
              }}
            >
              <FormField label={field.label} required={field.required}>
                <CityTypeahead
                  value={stringValue}
                  onCitySelect={(city) => {
                    // Salva o objeto cidade completo para manter nome e estado
                    handleFieldChange(itemIndex, field.name, city);
                  }}
                  placeholder={getPlaceholder(field) || "Digite o nome da cidade"}
                  disabled={field.disabled || disabled}
                />
              </FormField>

              <FormField label="Estado" required={false}>
                <FormInput
                  type="text"
                  value={String(stateValue)}
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
        }

        // ✅ FALLBACK: Se não tiver entityConfig mas tiver relationship, cria automaticamente
        let entityConfig = field.entityConfig;
        if (!entityConfig && field.relationship) {
          entityConfig = {
            entityName: field.relationship.targetEntity,
            endpoint: field.relationship.targetEndpoint,
            labelField: field.relationship.labelField || "name",
            valueField: "id",
            renderAs: "typeahead" as const,
          };
        }

        if (!entityConfig) {
          console.warn(
            `[ArrayField] Campo ${field.name} é do tipo 'entity' mas falta entityConfig e relationship`
          );
          return (
            <FormField label={field.label} required={field.required}>
              <FormInput
                type="text"
                value="Campo entity sem configuração"
                disabled
                style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
              />
            </FormField>
          );
        }

        // Componente genérico de entidade (já tratamos cidade no início do case)
        const renderAs = entityConfig.renderAs || "select";
        const EntityComponent =
          renderAs === "typeahead" || renderAs === "autocomplete"
            ? EntityTypeahead
            : EntitySelect;

        return (
          <FormField label={field.label} required={field.required}>
            <EntityComponent
                config={entityConfig}
                value={stringValue}
                onChange={(newValue) =>
                  handleFieldChange(itemIndex, field.name, newValue)
                  }
                  disabled={field.disabled || disabled}
                />
            </FormField>
          );
      }

      case "address": {
        // Campo de endereço com Google Maps picker
        // Busca latitude e longitude do item atual
        const latValue = itemValue.latitude as number || itemValue.lat as number || 0;
        const lngValue = itemValue.longitude as number || itemValue.lng as number || 0;

        return (
          <FormField label={field.label} required={field.required}>
            <AddressFieldWithMap
              value={stringValue}
              onChange={(newValue) => {
                // Apenas atualiza o campo de texto quando digitado manualmente
                // (não quando selecionado no mapa - isso é feito via onAddressDataChange)
                handleFieldChange(itemIndex, field.name, newValue);
              }}
              placeholder={getPlaceholder(field)}
              disabled={field.disabled || disabled}
              required={field.required}
              label={field.label}
              initialLatitude={latValue}
              initialLongitude={lngValue}
              onAddressDataChange={(addressData: AddressData) => {
                // 📍 Preenche TODOS os campos extraídos do Google Maps de uma só vez
                console.log('📍 [ArrayField] onAddressDataChange recebido:', addressData);
                console.log('📍 [ArrayField] fields disponíveis:', fields.map(f => f.name));
                
                const updates: Record<string, unknown> = {
                  // Atualiza o próprio campo de endereço
                  [field.name]: addressData.address,
                  // Coordenadas
                  latitude: addressData.latitude,
                  longitude: addressData.longitude,
                };

                // Preenche campos de rua/logradouro se existirem
                if (addressData.street) {
                  if (fields.some(f => f.name === 'street')) {
                    updates.street = addressData.street;
                  }
                  if (fields.some(f => f.name === 'logradouro')) {
                    updates.logradouro = addressData.street;
                  }
                }

                // Preenche número
                if (addressData.number) {
                  if (fields.some(f => f.name === 'number')) {
                    updates.number = addressData.number;
                  }
                  if (fields.some(f => f.name === 'numero')) {
                    updates.numero = addressData.number;
                  }
                }

                // Preenche bairro
                if (addressData.neighborhood) {
                  if (fields.some(f => f.name === 'neighborhood')) {
                    updates.neighborhood = addressData.neighborhood;
                  }
                  if (fields.some(f => f.name === 'bairro')) {
                    updates.bairro = addressData.neighborhood;
                  }
                }

                // Preenche cidade (nome)
                if (addressData.city) {
                  if (fields.some(f => f.name === 'cityName')) {
                    updates.cityName = addressData.city;
                  }
                  if (fields.some(f => f.name === 'city')) {
                    updates.city = addressData.city;
                  }
                }

                // Preenche estado/UF
                if (addressData.state) {
                  if (fields.some(f => f.name === 'state')) {
                    updates.state = addressData.state;
                  }
                  if (fields.some(f => f.name === 'uf')) {
                    updates.uf = addressData.state;
                  }
                }

                // Preenche CEP
                if (addressData.zipCode) {
                  if (fields.some(f => f.name === 'zipCode')) {
                    updates.zipCode = addressData.zipCode;
                  }
                  if (fields.some(f => f.name === 'cep')) {
                    updates.cep = addressData.zipCode;
                  }
                  if (fields.some(f => f.name === 'postalCode')) {
                    updates.postalCode = addressData.zipCode;
                  }
                }

                console.log('📍 [ArrayField] Atualizando campos:', updates);
                handleMultipleFieldsChange(itemIndex, updates);
              }}
            />
          </FormField>
        );
      }

      default:
        return (
          <FormField label={field.label} required={field.required}>
            <FormInput
              type="text"
              placeholder={field.placeholder}
              value={stringValue}
              onChange={(e) =>
                handleFieldChange(itemIndex, field.name, e.target.value)
              }
              disabled={field.disabled || disabled}
              required={field.required}
            />
          </FormField>
        );
    }
  };

  // Gera label inteligente para cada item
  const getItemLabel = (index: number, item: Record<string, unknown>) => {
    const baseLabel = itemLabel.replace("{index}", String(index + 1));

    // Se tiver labelField definido, tenta usar o valor do campo
    if (config.labelField && item[config.labelField]) {
      const labelValue = String(item[config.labelField]);
      return `${baseLabel}: ${labelValue}`;
    }

    // Se não, usa apenas o label base
    return baseLabel;
  };

  // Se não há campos configurados, renderiza mensagem
  if (!fields || fields.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        <p>Nenhum campo configurado para este array.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Removido: Header do ArrayField - apenas mostra os itens e botão adicionar inline */}
      
      {!disabled && value.length < maxItems && (
        <div style={{ marginBottom: "12px" }}>
          <button
            type="button"
            onClick={addItem}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#2563eb")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#3b82f6")
            }
          >
            <FiPlus size={14} />
            {addLabel}
          </button>
        </div>
      )}

      {/* Lista de itens */}
      {value.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            backgroundColor: "#f9fafb",
            border: "2px dashed #d1d5db",
            borderRadius: "8px",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <p style={{ margin: "0", fontSize: "14px" }}>
            Nenhum item adicionado ainda.
          </p>
          {!disabled && (
            <p style={{ margin: "8px 0 0 0", fontSize: "12px" }}>
              Clique em "{addLabel}" para adicionar o primeiro item.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {value.map((item, index) => {
            const itemData = (item as Record<string, unknown>) || {};
            const isCollapsed = collapsedItems[index] || false;
            // 🔄 Key estável baseada no ID ou índice (NÃO no conteúdo, para não perder foco)
            const itemKey = itemData.id ? `item-${itemData.id}` : `item-new-${index}`;

            return (
              <div
                key={itemKey}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                }}
              >
                {/* Header do item */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "#f9fafb",
                    borderBottom: isCollapsed ? "none" : "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                    }}
                  >
                    {/* Drag handle */}
                    <FiMenu
                      size={14}
                      style={{ color: "#9ca3af", cursor: "grab" }}
                    />

                    {/* Label do item */}
                    <h4
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        flex: 1,
                      }}
                    >
                      {getItemLabel(index, itemData)}
                    </h4>
                  </div>

                  {/* Botões de ação */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {/* Collapse/Expand */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(index)}
                      style={{
                        padding: "4px",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title={isCollapsed ? "Expandir" : "Recolher"}
                    >
                      {isCollapsed ? (
                        <FiChevronDown size={16} />
                      ) : (
                        <FiChevronUp size={16} />
                      )}
                    </button>

                    {/* Remover item */}
                    {!disabled && value.length > minItems && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        style={{
                          padding: "4px",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Remover item"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Conteúdo do item */}
                {!isCollapsed && (
                  <div style={{ padding: "16px" }}>
                    <div className="array-field-grid">
                      {fields.map((field) => {
                        console.log(`🔍 [ArrayField] Renderizando campo ${field.name}:`, itemData[field.name]);
                        return (
                          <div key={field.name}>
                            {renderItemField(field, itemData, index)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Informações de limite */}
      {(minItems > 0 || maxItems < 100) && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            color: "#6b7280",
            textAlign: "right",
          }}
        >
          {maxItems === 1 
            ? (value.length === 1 ? "✓ Cadastrado" : "Nenhum cadastrado") 
            : `${value.length} / ${maxItems} itens`}
          {minItems > 0 && maxItems > 1 && ` (mínimo: ${minItems})`}
        </div>
      )}
    </div>
  );
};

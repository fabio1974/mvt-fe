import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiTrash2,
  FiMenu,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import type { ArrayFieldConfig, FormFieldMetadata } from "../../types/metadata";
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

    console.log("🏷️ ArrayField Smart Labels:", {
      "config.label (plural)": config.label,
      singularName: singularName,
      addLabel: addLabel,
      itemLabel: itemLabel,
      pluralLabel: pluralLabel,
    });

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

    console.log(
      "🧮 [ArrayField] Computed fields detectados:",
      computedFields.map((f) => ({
        name: f.name,
        computed: f.computed,
        dependencies: f.computedDependencies,
      }))
    );

    let hasChanges = false;
    const newValue = value.map((item, index) => {
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
          console.log(
            `🧮 [ArrayField] Item ${index}: Campo ${field.name} atualizado para:`,
            result
          );
        }
      });

      return updatedItem;
    });

    if (hasChanges) {
      onChange(newValue);
    }
  }, [value, fields, onChange]);

  // ✅ CORREÇÃO CRÍTICA: handleFieldChange usa o array principal `value`
  // ao invés da variável incorreta `value` do parâmetro
  const handleFieldChange = (
    itemIndex: number,
    fieldName: string,
    fieldValue: unknown
  ) => {
    console.log(
      `🔧 [ArrayField] handleFieldChange: item ${itemIndex}, field ${fieldName}, value:`,
      fieldValue
    );

    // ✅ USA O ARRAY PRINCIPAL: `value` (prop do componente)
    // NÃO usa `value` do parâmetro (que é o valor do campo individual)
    const newArray = [...value];
    const currentItem = (newArray[itemIndex] as Record<string, unknown>) || {};

    // Atualiza o campo específico
    newArray[itemIndex] = {
      ...currentItem,
      [fieldName]: fieldValue,
    };

    console.log(
      `🔧 [ArrayField] Array atualizado:`,
      newArray.map((item, idx) => `Item ${idx}: ${JSON.stringify(item)}`)
    );

    onChange(newArray);
  };

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

    console.log("➕ [ArrayField] Adicionando item:", newItem);
    onChange([...value, newItem]);
  };

  // Remove um item
  const removeItem = (index: number) => {
    const newArray = value.filter((_, i) => i !== index);
    console.log(`🗑️ [ArrayField] Removendo item ${index}`);
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

    // ✅ CORREÇÃO: Para campos entity, extrai o ID se o valor for um objeto
    let stringValue: string;
    if (
      field.type === "entity" &&
      fieldValue &&
      typeof fieldValue === "object"
    ) {
      // Se é um objeto, extrai o ID
      const entityObj = fieldValue as Record<string, unknown>;
      stringValue = String(entityObj.id || "");

      console.log(
        `🔧 [ArrayField] Campo entity "${field.name}" - Objeto detectado:`,
        {
          objeto: fieldValue,
          idExtraido: stringValue,
        }
      );
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

    switch (field.type) {
      case "text":
      case "email":
      case "password": {
        // 📱 Detecta automaticamente se precisa de máscara (CPF, telefone, etc)
        const autoMask = field.type === "text" ? getAutoMask(field.name) : null;

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

      case "number":
        return (
          <FormField label={field.label} required={field.required}>
            <FormInput
              type="number"
              placeholder={getPlaceholder(field)}
              min={field.validation?.min}
              max={field.validation?.max}
              value={stringValue}
              onChange={(e) =>
                handleFieldChange(
                  itemIndex,
                  field.name,
                  field.type === "number"
                    ? Number(e.target.value)
                    : e.target.value
                )
              }
              disabled={field.disabled || disabled}
              required={field.required}
            />
          </FormField>
        );

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

      case "city":
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
                value="" // Estado seria carregado do backend
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

      case "entity": {
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

          console.log(
            `🔧 [ArrayField] Fallback entityConfig criado para campo ${field.name}:`,
            entityConfig
          );
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

        // Detecta se é um campo de cidade
        const isCityField =
          field.name === "city" ||
          field.name === "cityId" ||
          entityConfig.entityName === "city";

        if (isCityField) {
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
                    handleFieldChange(itemIndex, "cityId", String(city.id));
                    handleFieldChange(itemIndex, "city", city.name);
                  }}
                  placeholder={getPlaceholder(field) || "Digite o nome da cidade"}
                  disabled={field.disabled || disabled}
                />
              </FormField>

              <FormField label="Estado" required={false}>
                <FormInput
                  type="text"
                  value=""
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
          // Componente genérico de entidade
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

            return (
              <div
                key={index}
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
                      {fields.map((field) => (
                        <div key={field.name}>
                          {renderItemField(field, itemData, index)}
                        </div>
                      ))}
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
          {value.length} / {maxItems} itens
          {minItems > 0 && ` (mínimo: ${minItems})`}
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiMenu,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import type { ArrayFieldConfig } from "../../types/metadata";
import { FormInput, FormSelect } from "../Common/FormComponents";
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
  const {
    itemType,
    addLabel = "Adicionar",
    itemLabel = "Item {index}",
    fields = [],
    minItems = 0,
    maxItems = 100,
  } = config;

  // Cada item controla seu próprio estado de collapse
  const [collapsedItems, setCollapsedItems] = useState<Record<number, boolean>>(
    {}
  );

  const createEmptyItem = (): Record<string, unknown> => {
    if (itemType === "object") {
      return fields.reduce((acc, field) => {
        acc[field.name] = field.defaultValue || "";
        return acc;
      }, {} as Record<string, unknown>);
    }
    return {};
  };

  const handleStartAdd = () => {
    if (value.length >= maxItems) {
      return;
    }

    // Cria novo item vazio
    const newItem = createEmptyItem();

    // Adiciona ao array
    const newValue = [...value, newItem];
    onChange(newValue);

    // Abre o novo item automaticamente
    setTimeout(() => {
      setCollapsedItems((prev) => ({ ...prev, [newValue.length - 1]: false }));
    }, 0);
  };

  const handleRemove = (index: number) => {
    if (value.length === 0) return;

    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);

    // Limpa o estado de collapse do item removido e ajusta os índices
    setCollapsedItems((prev) => {
      const newCollapsed: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const idx = Number(key);
        if (idx < index) {
          newCollapsed[idx] = prev[idx];
        } else if (idx > index) {
          newCollapsed[idx - 1] = prev[idx];
        }
      });
      return newCollapsed;
    });
  };

  const handleFieldChange = (
    index: number,
    fieldName: string,
    fieldValue: unknown
  ) => {
    const newValue = [...value];
    const item = { ...(newValue[index] as Record<string, unknown>) };
    item[fieldName] = fieldValue;
    newValue[index] = item;
    onChange(newValue);
  };

  const toggleCollapse = (index: number) => {
    setCollapsedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Renderiza um card de item (colapsado ou expandido)
  const renderItemCard = (item: unknown, index: number) => {
    const itemObj = item as Record<string, unknown>;
    const label = itemLabel.replace("{index}", String(index + 1));
    const isItemCollapsed = collapsedItems[index] !== false; // Por padrão, colapsado

    // Pega os 3 primeiros campos para mostrar no resumo
    const summaryFields = fields.slice(0, 3);

    return (
      <div
        key={index}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          marginBottom: "12px",
          backgroundColor: "#fff",
          boxShadow: isItemCollapsed
            ? "none"
            : "0 4px 6px rgba(59, 130, 246, 0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: !isItemCollapsed ? "1px solid #e5e7eb" : "none",
            backgroundColor: "#fff",
            borderRadius: isItemCollapsed ? "8px" : "8px 8px 0 0",
            cursor: "pointer",
          }}
          onClick={() => toggleCollapse(index)}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            <FiMenu size={14} color="#9ca3af" />
            <strong style={{ color: "#374151", fontSize: "14px" }}>
              {label}
            </strong>
          </div>

          {/* Summary quando colapsado */}
          {isItemCollapsed && (
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginRight: "12px",
                flex: 1,
              }}
            >
              {summaryFields.map((field, idx) => {
                const val = itemObj[field.name];
                if (!val) return null;
                return (
                  <span key={field.name}>
                    {field.label}: <strong>{String(val)}</strong>
                    {idx < summaryFields.length - 1 && val && " • "}
                  </span>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Botão remover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(index);
              }}
              disabled={disabled || value.length === 0}
              style={{
                padding: "6px 12px",
                backgroundColor: value.length === 0 ? "#fef2f2" : "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "6px",
                color: "#dc2626",
                cursor: value.length === 0 ? "not-allowed" : "pointer",
                opacity: value.length === 0 ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "13px",
              }}
              title="Remover"
            >
              <FiTrash2 size={14} />
              Remover
            </button>

            {/* Ícone de expandir/recolher */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#6b7280",
              }}
            >
              {isItemCollapsed ? (
                <FiChevronDown size={20} />
              ) : (
                <FiChevronUp size={20} />
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo expandido */}
        {!isItemCollapsed && (
          <div style={{ padding: "20px" }}>
            <div
              data-component="array-field-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px 12px",
                marginBottom: "16px",
              }}
            >
              {fields.map((field) => (
                <div
                  key={field.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    minWidth: 0,
                  }}
                >
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    {field.label}
                    {field.required && (
                      <span style={{ color: "#dc2626" }}> *</span>
                    )}
                  </label>
                  {field.type === "select" ? (
                    <FormSelect
                      value={String(itemObj[field.name] || "")}
                      onChange={(e) =>
                        handleFieldChange(index, field.name, e.target.value)
                      }
                      disabled={disabled}
                      required={field.required}
                    >
                      <option value="">Selecione...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </FormSelect>
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={String(itemObj[field.name] || "")}
                      onChange={(e) =>
                        handleFieldChange(index, field.name, e.target.value)
                      }
                      placeholder={field.placeholder}
                      disabled={disabled}
                      required={field.required}
                      style={{
                        padding: "10px 14px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        minHeight: "80px",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                  ) : (
                    <FormInput
                      type={field.type === "number" ? "number" : field.type}
                      value={String(itemObj[field.name] || "")}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          field.name,
                          field.type === "number"
                            ? Number(e.target.value)
                            : e.target.value
                        )
                      }
                      placeholder={field.placeholder}
                      disabled={disabled}
                      required={field.required}
                      min={field.validation?.min}
                      max={field.validation?.max}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header com título e botão adicionar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          padding: "12px 16px",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#334155",
              fontWeight: 600,
            }}
          >
            {config.itemLabel?.replace(" {index}", "s") || "Itens"}
          </h4>
          <p
            style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}
          >
            {value.length}{" "}
            {value.length === 1 ? "item adicionado" : "itens adicionados"}
            {minItems > 0 && ` (mínimo: ${minItems})`}
          </p>
        </div>

        {/* Botão adicionar no header - sempre visível */}
        <button
          type="button"
          onClick={handleStartAdd}
          disabled={disabled || value.length >= maxItems}
          style={{
            padding: "10px 20px",
            backgroundColor: value.length >= maxItems ? "#e2e8f0" : "#3b82f6",
            border: "none",
            borderRadius: "6px",
            color: "#fff",
            cursor: value.length >= maxItems ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 500,
            opacity: value.length >= maxItems ? 0.5 : 1,
          }}
          title={
            value.length >= maxItems
              ? `Máximo de ${maxItems} itens atingido`
              : addLabel
          }
        >
          <FiPlus size={16} />
          {addLabel}
        </button>
      </div>

      {/* Lista de itens */}
      {value.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          {value.map((item, index) => renderItemCard(item, index))}
        </div>
      )}

      {/* Mensagem de lista vazia */}
      {value.length === 0 && (
        <div
          style={{
            padding: "24px",
            backgroundColor: "#f9fafb",
            border: "2px dashed #d1d5db",
            borderRadius: "8px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "14px",
            marginBottom: "12px",
          }}
        >
          <p
            style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: 500 }}
          >
            Nenhum item adicionado
          </p>
          <p style={{ margin: 0, fontSize: "13px" }}>
            Clique em "{addLabel}" para adicionar o primeiro item
          </p>
        </div>
      )}

      {/* Validações */}
      {minItems > 0 && value.length < minItems && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#dc2626",
          }}
        >
          ⚠️ Mínimo de {minItems}{" "}
          {minItems === 1 ? "item obrigatório" : "itens obrigatórios"}
        </div>
      )}

      {maxItems && value.length >= maxItems && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#1e40af",
          }}
        >
          ℹ️ Máximo de {maxItems}{" "}
          {maxItems === 1 ? "item atingido" : "itens atingido"}
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import type { FilterMetadata } from "../../types/metadata";
import EntitySelect from "../Common/EntitySelect";
import EntityTypeahead from "../Common/EntityTypeahead";
import { CityTypeahead } from "../Common/CityTypeahead";
import MultiSelectDropdown from "../Common/MultiSelectDropdown";
import {
  FormContainer,
  FormField,
  FormInput,
  FormSelect,
  FormActions,
  FormButton,
  FormDatePicker,
} from "../Common/FormComponents";

interface EntityFiltersProps {
  filters: FilterMetadata[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onClear: () => void;
  /** Mapa de campo → valores de opções a excluir (ex: { status: ["WAITING_PAYMENT"] }) */
  excludeOptions?: Record<string, string[]>;
  /** Filtros select que devem usar multi-seleção com checkboxes (ex: ["status"]) */
  multiSelectFilters?: string[];
}

const EntityFilters: React.FC<EntityFiltersProps> = ({
  filters,
  values,
  onChange,
  onClear,
  excludeOptions = {},
  multiSelectFilters = [],
}) => {
  // Estado para armazenar os estados das cidades selecionadas (para exibição readonly)
  const [cityStates, setCityStates] = useState<Record<string, string>>({});

  const renderFilter = (filter: FilterMetadata) => {
    // Oculta filtros marcados como não visíveis
    if (filter.visible === false) {
      return null;
    }

    switch (filter.type.toLowerCase()) {
      case "text":
        return (
          <FormField key={filter.name} label={filter.label}>
            <FormInput
              type="text"
              placeholder={
                filter.placeholder ||
                `Buscar por ${filter.label.toLowerCase()}...`
              }
              value={values[filter.name] || ""}
              onChange={(e) => onChange(filter.name, e.target.value)}
            />
          </FormField>
        );

      case "select": {
        // Multi-select com dropdown de checkboxes
        if (multiSelectFilters.includes(filter.name)) {
          const selected = (values[filter.name] || "").split(",").filter(Boolean);
          const availableOptions = filter.options
            ?.slice()
            .filter((option) => !(excludeOptions[filter.name]?.includes(option.value)))
            .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")) || [];

          return (
            <FormField key={filter.name} label={filter.label}>
              <MultiSelectDropdown
                options={availableOptions}
                selectedValues={selected}
                onChange={(newSelected) => onChange(filter.name, newSelected.join(","))}
              />
            </FormField>
          );
        }

        // Single select (dropdown padrão)
        return (
          <FormField key={filter.name} label={filter.label}>
            <FormSelect
              value={values[filter.name] || ""}
              onChange={(e) => onChange(filter.name, e.target.value)}
            >
              <option value="">Todos</option>
              {filter.options
                ?.slice()
                .filter((option) => !(excludeOptions[filter.name]?.includes(option.value)))
                .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </FormSelect>
          </FormField>
        );
      }

      case "number":
        return (
          <FormField key={filter.name} label={filter.label}>
            <FormInput
              type="number"
              placeholder={filter.placeholder || filter.label}
              value={values[filter.name] || ""}
              onChange={(e) => onChange(filter.name, e.target.value)}
            />
          </FormField>
        );

      case "date": {
        const dateValue = values[filter.name]
          ? new Date(values[filter.name])
          : null;
        return (
          <FormField key={filter.name} label={filter.label}>
            <FormDatePicker
              selected={dateValue}
              onChange={(date) => {
                if (date) {
                  const formatted = date.toISOString().split("T")[0];
                  onChange(filter.name, formatted);
                } else {
                  onChange(filter.name, "");
                }
              }}
              placeholder={filter.placeholder || undefined}
              showTimeSelect={false}
              dateFormat="dd/MM/yyyy"
            />
          </FormField>
        );
      }

      case "datetime": {
        const datetimeValue = values[filter.name]
          ? new Date(values[filter.name])
          : null;
        return (
          <FormField key={filter.name} label={filter.label}>
            <FormDatePicker
              selected={datetimeValue}
              onChange={(date) => {
                if (date) {
                  const formatted = date.toISOString();
                  onChange(filter.name, formatted);
                } else {
                  onChange(filter.name, "");
                }
              }}
              placeholder={filter.placeholder || undefined}
              showTimeSelect={true}
              dateFormat="dd/MM/yyyy HH:mm"
            />
          </FormField>
        );
      }

      case "daterange": {
        // Filtro de range: persistido como dois valores compostos
        // `<filter.name>From` e `<filter.name>To`. Os dois caem no
        // URLSearchParams do EntityTable e batem com a convenção do BE.
        const fromKey = `${filter.name}From`;
        const toKey = `${filter.name}To`;
        const fromValue = values[fromKey] ? new Date(values[fromKey]) : null;
        const toValue = values[toKey] ? new Date(values[toKey]) : null;
        return (
          <FormField key={filter.name} label={filter.label}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <FormDatePicker
                selected={fromValue}
                onChange={(date) => {
                  onChange(fromKey, date ? date.toISOString().split("T")[0] : "");
                }}
                placeholder="Início"
                showTimeSelect={false}
                dateFormat="dd/MM/yyyy"
              />
              <span style={{ color: "var(--text-secondary, #64748b)" }}>até</span>
              <FormDatePicker
                selected={toValue}
                onChange={(date) => {
                  onChange(toKey, date ? date.toISOString().split("T")[0] : "");
                }}
                placeholder="Fim"
                showTimeSelect={false}
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </FormField>
        );
      }

      case "boolean":
        return (
          <FormField key={filter.name} label={filter.label}>
            <FormSelect
              value={values[filter.name] || ""}
              onChange={(e) => onChange(filter.name, e.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </FormSelect>
          </FormField>
        );

      case "entity": {
        // Filtro de entidade relacionada
        if (!filter.entityConfig) {
          console.warn(
            `Filter ${filter.name} is type 'entity' but missing entityConfig`
          );
          return null;
        }

        // Detecta se é um filtro de cidade (city, cityId, ou entityName === 'city')
        const isCityFilter =
          filter.name === "city" ||
          filter.name === "cityId" ||
          filter.entityConfig.entityName === "city";

        if (isCityFilter) {
          return (
            <React.Fragment key={filter.name}>
              <FormField label={filter.label}>
                <CityTypeahead
                  value={values[filter.name] || ""}
                  onCitySelect={(city) => {
                    // Envia ID quando o campo espera ID (cityId, fromCityId, etc.)
                    // Envia nome quando o campo espera o nome da cidade
                    const isIdField = filter.name.toLowerCase().includes("id");
                    const value = isIdField ? String(city.id) : city.name;
                    onChange(filter.name, value);
                    setCityStates((prev) => ({
                      ...prev,
                      [filter.name]: city.stateCode || city.state || "",
                    }));
                  }}
                  placeholder={filter.placeholder || "Digite o nome da cidade"}
                />
              </FormField>

              <FormField label="Estado">
                <FormInput
                  type="text"
                  value={cityStates[filter.name] || ""}
                  readOnly
                  disabled
                  placeholder="--"
                  style={{
                    backgroundColor: "#f3f4f6",
                    cursor: "not-allowed",
                  }}
                />
              </FormField>
            </React.Fragment>
          );
        }

        // Decide qual componente renderizar baseado em renderAs
        const renderAs = filter.entityConfig.renderAs || "select";
        const EntityComponent =
          renderAs === "typeahead" || renderAs === "autocomplete"
            ? EntityTypeahead
            : EntitySelect;

        return (
          <FormField key={filter.name} label={filter.label}>
            <EntityComponent
              config={filter.entityConfig}
              value={values[filter.name] || ""}
              onChange={(value) => onChange(filter.name, value)}
            />
          </FormField>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="form-condensed">
      <FormContainer title="Filtros" icon={<FiSearch />} collapsible storageKey="filtersCollapsed">
        <div className="form-filters-grid">{filters.map(renderFilter)}</div>

        <FormActions>
          <FormButton
            type="button"
            variant="secondary"
            onClick={onClear}
            icon={<FiRefreshCw />}
          >
            Limpar Filtros
          </FormButton>
        </FormActions>
      </FormContainer>
    </div>
  );
};

export default EntityFilters;

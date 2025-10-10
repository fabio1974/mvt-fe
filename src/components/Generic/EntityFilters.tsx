import React, { useState } from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import type { FilterMetadata } from "../../types/metadata";
import EntitySelect from "../Common/EntitySelect";
import EntityTypeahead from "../Common/EntityTypeahead";
import { CityTypeahead } from "../Common/CityTypeahead";
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
}

const EntityFilters: React.FC<EntityFiltersProps> = ({
  filters,
  values,
  onChange,
  onClear,
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

      case "select":
        return (
          <FormField key={filter.name} label={filter.label}>
            <FormSelect
              value={values[filter.name] || ""}
              onChange={(e) => onChange(filter.name, e.target.value)}
            >
              <option value="">Todos</option>
              {filter.options
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
                    onChange(filter.name, city.name);
                    // Armazena o estado da cidade para exibição
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
    <FormContainer title="Filtros" icon={<FiSearch />}>
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
  );
};

export default EntityFilters;

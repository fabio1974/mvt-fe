import React from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import type { FilterMetadata } from "../../types/metadata";
import EntitySelect from "../Common/EntitySelect";
import EntityTypeahead from "../Common/EntityTypeahead";
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormActions,
  FormButton,
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
  const renderFilter = (filter: FilterMetadata) => {
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

      case "date":
        return (
          <FormField key={filter.name} label={filter.label}>
            <FormInput
              type="date"
              value={values[filter.name] || ""}
              onChange={(e) => onChange(filter.name, e.target.value)}
            />
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

  // Agrupa filtros em linhas (máximo 4 por linha)
  const renderFiltersInRows = () => {
    const rows: FilterMetadata[][] = [];
    const filtersPerRow = 4;

    for (let i = 0; i < filters.length; i += filtersPerRow) {
      rows.push(filters.slice(i, i + filtersPerRow));
    }

    return rows.map((row, rowIndex) => (
      <FormRow key={rowIndex} columns={row.length}>
        {row.map(renderFilter)}
      </FormRow>
    ));
  };

  return (
    <FormContainer
      title="Filtros"
      icon={<FiSearch />}
      collapsible={true}
      defaultCollapsed={false}
    >
      {renderFiltersInRows()}

      <FormActions align="left">
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

import React from "react";
import { useForm } from "react-hook-form";
import { FiSearch, FiFilter, FiRefreshCw, FiX } from "react-icons/fi";
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormActions,
  FormButton,
} from "../Common/FormComponents";

export interface Filters {
  search: string;
  status: string;
  sport: string;
  state: string;
  organizationName: string;
}

interface EventFiltersProps {
  onFilterChange: (field: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  initialValues?: Partial<Filters>;
}

const EventFilters: React.FC<EventFiltersProps> = ({
  onFilterChange,
  onClearFilters,
  onRefresh,
  initialValues = {},
}) => {
  const { register } = useForm<Filters>({
    defaultValues: {
      search: "",
      status: "",
      sport: "",
      state: "",
      organizationName: "",
      ...initialValues,
    },
  });

  const statusOptions = [
    { value: "active", label: "Ativo" },
    { value: "cancelled", label: "Cancelado" },
    { value: "finished", label: "Finalizado" },
  ];

  const sportOptions = [
    { value: "futebol", label: "Futebol" },
    { value: "basquete", label: "Basquete" },
    { value: "volei", label: "Vôlei" },
    { value: "tenis", label: "Tênis" },
    { value: "natacao", label: "Natação" },
    { value: "corrida", label: "Corrida" },
    { value: "ciclismo", label: "Ciclismo" },
  ];

  const stateOptions = [
    { value: "SP", label: "São Paulo" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "MG", label: "Minas Gerais" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "PR", label: "Paraná" },
    { value: "SC", label: "Santa Catarina" },
    { value: "BA", label: "Bahia" },
    { value: "GO", label: "Goiás" },
    { value: "PE", label: "Pernambuco" },
    { value: "CE", label: "Ceará" },
  ];

  return (
    <FormContainer title="Filtros" icon={<FiFilter />}>
      <FormRow columns={6}>
        <FormField label="Buscar">
          <FormInput
            type="text"
            placeholder="Nome do evento..."
            icon={<FiSearch />}
            {...register("search", {
              onChange: (e) => onFilterChange("search", e.target.value),
            })}
          />
        </FormField>

        <FormField label="Status">
          <FormSelect
            options={statusOptions}
            placeholder="Todos os status"
            {...register("status", {
              onChange: (e) => onFilterChange("status", e.target.value),
            })}
          />
        </FormField>

        <FormField label="Esporte">
          <FormSelect
            options={sportOptions}
            placeholder="Todos os esportes"
            {...register("sport", {
              onChange: (e) => onFilterChange("sport", e.target.value),
            })}
          />
        </FormField>

        <FormField label="Estado">
          <FormSelect
            options={stateOptions}
            placeholder="Todos os estados"
            {...register("state", {
              onChange: (e) => onFilterChange("state", e.target.value),
            })}
          />
        </FormField>

        <FormField label="Organização">
          <FormInput
            type="text"
            placeholder="Nome da organização..."
            {...register("organizationName", {
              onChange: (e) =>
                onFilterChange("organizationName", e.target.value),
            })}
          />
        </FormField>
      </FormRow>

      <FormActions align="left">
        <FormButton
          type="button"
          variant="secondary"
          icon={<FiX />}
          onClick={onClearFilters}
        >
          Limpar Filtros
        </FormButton>
        <FormButton
          type="button"
          variant="primary"
          icon={<FiRefreshCw />}
          onClick={onRefresh}
        >
          Atualizar
        </FormButton>
      </FormActions>
    </FormContainer>
  );
};

export default EventFilters;

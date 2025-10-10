import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import type { EntityFilterConfig } from "../../types/metadata";
import "./EntityComponents.css";

interface EntitySelectProps {
  config: EntityFilterConfig;
  value: string;
  onChange: (value: string) => void;
}

interface EntityOption {
  id: number | string;
  [key: string]: unknown;
}

/**
 * Componente de Select que carrega opções de uma entidade relacionada
 * Usa classes do FormComponents para manter consistência visual
 *
 * Uso:
 * <EntitySelect
 *   config={{
 *     entityName: "event",
 *     endpoint: "/events",
 *     labelField: "name",
 *     valueField: "id"
 *   }}
 *   value={selectedValue}
 *   onChange={handleChange}
 * />
 */
const EntitySelect: React.FC<EntitySelectProps> = ({
  config,
  value,
  onChange,
}) => {
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega opções da entidade
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      setError(null);

      try {
        let endpoint = config.endpoint;

        // Garante que o endpoint começa com /
        if (!endpoint.startsWith("/")) {
          endpoint = `/${endpoint}`;
        }

        // Busca com tamanho grande para pegar todas as opções
        // Em produção, pode adicionar paginação ou lazy loading
        const params = new URLSearchParams({
          page: "0",
          size: "1000",
          sort: `${config.labelField},asc`,
        });

        console.log(
          `🔍 EntitySelect: Carregando opções de ${config.entityName} - ${endpoint}?${params}`
        );

        const response = await api.get(`${endpoint}?${params}`);

        // Suporta tanto array direto quanto estrutura paginada
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data as { content?: EntityOption[] }).content || [];

        setOptions(data);
        console.log(
          `✅ EntitySelect: ${data.length} opções carregadas para ${config.entityName}`
        );
      } catch (err) {
        console.error(
          `❌ EntitySelect: Erro ao carregar ${config.entityName}:`,
          err
        );
        setError("Erro ao carregar opções");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [config.endpoint, config.labelField, config.entityName]);

  return (
    <>
      {/* Select principal - usa classes do FormComponents */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="form-select"
      >
        <option value="">
          {loading ? "Carregando..." : `Todos (${options.length})`}
        </option>

        {error ? (
          <option disabled>{error}</option>
        ) : (
          options.map((option) => (
            <option
              key={option[config.valueField] as string}
              value={option[config.valueField] as string}
            >
              {String(option[config.labelField] || "Sem nome")}
            </option>
          ))
        )}
      </select>

      {/* Informações de debug (apenas em dev) */}
      {import.meta.env.DEV && error && (
        <div className="entity-error-text">⚠️ {error}</div>
      )}
    </>
  );
};

export default EntitySelect;

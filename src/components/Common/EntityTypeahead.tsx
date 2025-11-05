import React, { useState, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { api } from "../../services/api";
import type { EntityFilterConfig } from "../../types/metadata";
import "./EntityComponents.css";

interface EntityTypeaheadProps {
  config: EntityFilterConfig;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface EntityOption {
  id: number | string;
  [key: string]: unknown;
}

/**
 * Componente Typeahead para entidades com muitos registros
 * Usa classes do FormComponents para manter consistência visual
 *
 * Carrega opções sob demanda baseado na busca do usuário
 * Ideal para entidades com 50+ registros (ex: Users, Organizations)
 */
const EntityTypeahead: React.FC<EntityTypeaheadProps> = ({
  config,
  value,
  onChange,
  disabled = false,
}) => {
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualiza posição do dropdown quando mostra ou quando scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (showDropdown && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4, // 4px de margem
          left: rect.left,
          width: rect.width,
        });
      }
    };

    if (showDropdown) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showDropdown]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carrega opções quando usuário digita
  useEffect(() => {
    const fetchOptions = async () => {
      if (searchTerm.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);

      try {
        let endpoint = config.endpoint;

        // Garante que o endpoint começa com /
        if (!endpoint.startsWith("/")) {
          endpoint = `/${endpoint}`;
        }

        // Busca com filtro de texto
        const params = new URLSearchParams({
          page: "0",
          size: "20",
          search: searchTerm, // Assume que o backend suporta parâmetro "search"
          sort: `${config.labelField},asc`,
        });

        const response = await api.get(`${endpoint}?${params}`);

        const data = Array.isArray(response.data)
          ? response.data
          : (response.data as { content?: EntityOption[] }).content || [];

        setOptions(data);
      } catch (err) {
        console.error(
          `❌ EntityTypeahead: Erro ao carregar ${config.entityName}:`,
          err
        );
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchOptions, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, config.endpoint, config.labelField, config.entityName]);

  // Carrega label do item selecionado
  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      setSearchTerm("");
      return;
    }

    const fetchSelectedItem = async () => {
      try {
        let endpoint = config.endpoint;
        // Garante que o endpoint começa com /
        if (!endpoint.startsWith("/")) {
          endpoint = `/${endpoint}`;
        }

        const response = await api.get(`${endpoint}/${value}`);
        const item = response.data as EntityOption;
        const label = String(item[config.labelField] || "");
        setSelectedLabel(label);
      } catch (err) {
        console.error("Erro ao carregar item selecionado:", err);
      }
    };

    fetchSelectedItem();
  }, [value, config.endpoint, config.labelField]);

  const handleSelect = (option: EntityOption) => {
    const newValue = String(option[config.valueField]);
    const newLabel = String(option[config.labelField]);

    onChange(newValue);
    setSelectedLabel(newLabel);
    setSearchTerm(newLabel);
    setShowDropdown(false);
  };

  const handleClear = () => {
    if (disabled) return; // Não permite limpar se disabled
    onChange("");
    setSelectedLabel("");
    setSearchTerm("");
    setOptions([]);
  };

  return (
    <div className="entity-typeahead-wrapper" ref={wrapperRef}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={config.searchPlaceholder || "Digite para buscar..."}
          value={selectedLabel || searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) {
              handleClear();
            }
          }}
          onFocus={() => !disabled && setShowDropdown(true)}
          className="form-input"
          disabled={disabled}
          readOnly={disabled}
        />

        {/* Botão de limpar */}
        {(value || searchTerm) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="entity-clear-button"
            title="Limpar seleção"
          >
            <FiX />
          </button>
        )}

        {/* Dropdown de opções */}
        {!disabled &&
          showDropdown &&
          searchTerm.length >= 2 &&
          dropdownPosition && (
            <div
              className="entity-typeahead-dropdown"
              style={{
                position: "fixed",
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              }}
            >
              {loading ? (
                <div className="entity-typeahead-message">Carregando...</div>
              ) : options.length === 0 ? (
                <div className="entity-typeahead-message">
                  Nenhum resultado encontrado
                </div>
              ) : (
                options.map((option) => (
                  <div
                    key={option[config.valueField] as string}
                    onClick={() => handleSelect(option)}
                    className="entity-typeahead-item"
                  >
                    {String(option[config.labelField] || "Sem nome")}
                  </div>
                ))
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default EntityTypeahead;

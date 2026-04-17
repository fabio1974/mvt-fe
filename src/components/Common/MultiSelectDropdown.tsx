import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  /** Opções disponíveis */
  options: MultiSelectOption[];
  /** Valores selecionados (array de value) */
  selectedValues: string[];
  /** Callback ao alterar seleção — recebe array de values selecionados */
  onChange: (selected: string[]) => void;
  /** Placeholder quando nenhum item selecionado */
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Todos",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelected = selectedValues.length === options.length;
  const noneSelected = selectedValues.length === 0;

  const toggleOption = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : options.map((o) => o.value));
  };

  const summary = noneSelected
    ? placeholder
    : allSelected
    ? "Todos selecionados"
    : selectedValues.length === 1
    ? options.find((o) => o.value === selectedValues[0])?.label || selectedValues[0]
    : `${selectedValues.length} selecionados`;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="multi-select-trigger"
      >
        <span>{summary}</span>
        <FiChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, minWidth: "100%", zIndex: 50,
          marginTop: "4px", border: "1px solid #d1d5db", borderRadius: "6px",
          backgroundColor: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          maxHeight: "240px", overflowY: "auto",
        }}>
          <label style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", cursor: "pointer", fontSize: "13px",
            fontWeight: 600, color: "#4b5563", whiteSpace: "nowrap",
            borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb",
          }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              style={{ margin: 0, cursor: "pointer" }}
            />
            {allSelected ? "Desmarcar todos" : "Selecionar todos"}
          </label>
          {options.map((option) => {
            const isChecked = selectedValues.includes(option.value);
            return (
              <label
                key={option.value}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "6px 12px", cursor: "pointer", fontSize: "13px", whiteSpace: "nowrap",
                  backgroundColor: isChecked ? "#eff6ff" : "transparent",
                  color: isChecked ? "#1d4ed8" : "#374151",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isChecked ? "#dbeafe" : "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isChecked ? "#eff6ff" : "transparent")}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleOption(option.value)}
                  style={{ margin: 0, cursor: "pointer" }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;

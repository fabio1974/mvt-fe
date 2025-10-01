import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../services/api";
import "./FormComponents.css";

interface City {
  id: number;
  name: string;
  state: string;
  stateCode: string;
  ibgeCode?: string;
}

interface CityTypeaheadProps {
  value?: string;
  onCitySelect: (city: City) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const CityTypeahead: React.FC<CityTypeaheadProps> = ({
  value = "",
  onCitySelect,
  placeholder = "Digite o nome da cidade...",
  required = false,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [cities, setCities] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Debounced search
  const searchCities = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setCities([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(
        `/cities/search?q=${encodeURIComponent(searchTerm)}`
      );
      console.log("Dados da API de cidades:", response.data);
      setCities(Array.isArray(response.data) ? response.data : []);
      setIsOpen(true);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
      setCities([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce search by 300ms
    timeoutRef.current = setTimeout(() => {
      searchCities(newValue);
    }, 300);
  };

  const handleCitySelect = (city: City) => {
    const displayValue = city.stateCode
      ? `${city.name} - ${city.stateCode}`
      : city.name;
    setInputValue(displayValue);
    setIsOpen(false);
    setCities([]);
    onCitySelect(city);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || cities.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < cities.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : cities.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleCitySelect(cities[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      inputRef.current &&
      !inputRef.current.contains(e.target as Node) &&
      listRef.current &&
      !listRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleClickOutside]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className={`city-typeahead ${className}`}>
      <input
        ref={inputRef}
        type="text"
        className="form-input"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />

      {isOpen && (
        <ul ref={listRef} className="city-typeahead-list">
          {loading && (
            <li className="city-typeahead-item loading">Buscando cidades...</li>
          )}

          {!loading && cities.length === 0 && inputValue.length >= 2 && (
            <li className="city-typeahead-item no-results">
              Nenhuma cidade encontrada
            </li>
          )}

          {!loading &&
            cities.map((city, index) => (
              <li
                key={city.id}
                className={`city-typeahead-item ${
                  index === highlightedIndex ? "highlighted" : ""
                }`}
                onClick={() => handleCitySelect(city)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="city-name">{city.name}</span>
                {city.stateCode && (
                  <span className="city-state"> - {city.stateCode}</span>
                )}
                {city.state && (
                  <span className="city-state-full"> ({city.state})</span>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

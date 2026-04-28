import React, { useRef, useEffect } from "react";
import IMask from "imask";

interface DynamicDocumentInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  readOnly?: boolean;
}

/**
 * Input com máscara de CPF (000.000.000-00).
 *
 * CNPJ não é mais suportado: o cadastro de Pessoa Jurídica falha no
 * Pagar.me sem KYC corporativo completo (campos que não capturamos).
 * Mantemos o nome "DynamicDocumentInput" pra preservar compatibilidade
 * com a metadata `autoMask: "cpf-cnpj-dynamic"` exposta pelo backend.
 */
export const DynamicDocumentInput: React.FC<DynamicDocumentInputProps> = ({
  value,
  onChange,
  placeholder = "CPF",
  disabled = false,
  required = false,
  className = "",
  readOnly = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const maskRef = useRef<any>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    if (maskRef.current) {
      maskRef.current.value = value;
      return;
    }

    maskRef.current = IMask(inputRef.current, {
      mask: "000.000.000-00",
      lazy: false,
    });

    maskRef.current.on("accept", () => {
      const event = {
        target: { value: maskRef.current.value },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    });

    maskRef.current.value = value;
  }, [value, onChange]);

  useEffect(() => {
    return () => {
      if (maskRef.current) {
        maskRef.current.destroy();
        maskRef.current = null;
      }
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      disabled={disabled || readOnly}
      required={required}
      className={`form-input ${className}`}
      readOnly={readOnly}
    />
  );
};

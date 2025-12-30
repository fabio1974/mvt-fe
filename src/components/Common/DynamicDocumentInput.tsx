import React, { useRef, useEffect, useState } from "react";
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
 * Input com máscara dinâmica para CPF/CNPJ
 * - CPF: 11 dígitos → 999.999.999-99
 * - CNPJ: 14 dígitos → 99.999.999/9999-99
 * Detecta automaticamente baseado na quantidade de dígitos
 */
export const DynamicDocumentInput: React.FC<DynamicDocumentInputProps> = ({
  value,
  onChange,
  placeholder = "CPF ou CNPJ",
  disabled = false,
  required = false,
  className = "",
  readOnly = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const maskRef = useRef<any>(null);
  const [currentMask, setCurrentMask] = useState<string>("999.999.999-99");

  useEffect(() => {
    if (!inputRef.current) return;

    // Conta apenas dígitos para decidir a máscara
    const digitsOnly = (value || "").replace(/\D/g, "");
    const newMask = digitsOnly.length > 11 ? "99.999.999/9999-99" : "999.999.999-99";

    if (newMask !== currentMask) {
      setCurrentMask(newMask);
    }

    // Cria ou atualiza o IMask
    if (maskRef.current) {
      maskRef.current.updateOptions({
        mask: newMask.replace(/9/g, "0"),
      });
      maskRef.current.value = value;
    } else {
      maskRef.current = IMask(inputRef.current, {
        mask: newMask.replace(/9/g, "0"),
        lazy: false,
      });
      
      // ✅ Usa on("accept") para capturar mudanças do IMask
      maskRef.current.on("accept", () => {
        const event = {
          target: {
            value: maskRef.current.value,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      });
      
      maskRef.current.value = value;
    }
  }, [value, currentMask, onChange]);

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

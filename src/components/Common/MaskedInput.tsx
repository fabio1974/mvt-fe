import React, { useRef, useEffect } from "react";
import IMask from "imask";

interface MaskedInputProps {
  mask: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  readOnly?: boolean;
}

export const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = "",
  readOnly = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maskRef = useRef<any>(null);

  const getIMaskPattern = (maskPattern: string): string => {
    return maskPattern.replace(/9/g, "0");
  };

  useEffect(() => {
    if (!inputRef.current) return;

    // Usa a máscara que foi passada como prop
    // Não faz mais detecção automática aqui
    const maskPattern = mask;

    if (maskRef.current) {
      maskRef.current.updateOptions({
        mask: getIMaskPattern(maskPattern),
      });
      maskRef.current.value = value;
    } else {
      maskRef.current = IMask(inputRef.current, {
        mask: getIMaskPattern(maskPattern),
        lazy: false,
      });

      maskRef.current.on("accept", () => {
        if (inputRef.current && maskRef.current) {
          const event = {
            target: {
              value: maskRef.current.value,
              name: inputRef.current.name,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(event);
        }
      });

      maskRef.current.value = value;
    }
  }, [mask, value, onChange]);

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
    />
  );
};

import React, { useState, forwardRef } from "react";
import { FiEye, FiEyeOff, FiChevronDown, FiChevronRight } from "react-icons/fi";
import "./FormComponents.css";

interface FormContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Permite colapsar/expandir o conteúdo clicando no header */
  collapsible?: boolean;
  /** Chave para persistir o estado collapsed no localStorage (ex: "filters_foodOrder") */
  storageKey?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  title,
  icon,
  children,
  className = "",
  collapsible = false,
  storageKey,
}) => {
  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible || !storageKey) return false;
    return localStorage.getItem(storageKey) === "true";
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (storageKey) localStorage.setItem(storageKey, String(next));
  };

  return (
    <div className={`form-container ${className}`}>
      {title && (
        <div
          className={`form-header ${collapsible ? "form-header-collapsible" : ""} ${collapsed ? "form-header-collapsed" : ""}`}
          onClick={collapsible ? toggleCollapsed : undefined}
        >
          <div className="form-title">
            {icon && <span className="form-icon">{icon}</span>}
            {title}
            {collapsible && (
              <span className="form-collapse-icon">
                {collapsed ? <FiChevronRight /> : <FiChevronDown />}
              </span>
            )}
          </div>
        </div>
      )}
      {!collapsed && <div className="form-content">{children}</div>}
    </div>
  );
};

interface FormRowProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  className?: string;
}

export const FormRow: React.FC<FormRowProps> = ({
  children,
  columns = 3,
  className = "",
}) => {
  return (
    <div className={`form-row form-row-${columns} ${className}`}>
      {children}
    </div>
  );
};

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  required = false,
  error,
  className = "",
}) => {
  return (
    <div
      className={`form-field ${className} ${error ? "form-field-error" : ""}`}
    >
      <label className="form-label">
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      {children}
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
  icon,
  className = "",
  ...props
}) => {
  if (icon) {
    return (
      <div className="form-input-with-icon">
        <span className="form-input-icon-wrapper">{icon}</span>
        <input
          className={`form-input form-input-icon ${className}`}
          {...props}
        />
      </div>
    );
  }

  return <input className={`form-input ${className}`} {...props} />;
};

interface FormPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  icon?: React.ReactNode;
}

export const FormPasswordInput = forwardRef<HTMLInputElement, FormPasswordInputProps>(
  ({ icon, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="form-input-password-wrapper">
        {icon && <span className="form-input-icon-wrapper">{icon}</span>}
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={`form-input ${icon ? "form-input-icon" : ""} form-input-password ${className}`}
          {...props}
        />
        <button
          type="button"
          className="form-password-toggle"
          onClick={togglePasswordVisibility}
          tabIndex={-1}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
    );
  }
);

FormPasswordInput.displayName = "FormPasswordInput";

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  children?: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  options,
  placeholder = "Selecione...",
  className = "",
  children,
  ...props
}) => {
  return (
    <select className={`form-select ${className}`} {...props}>
      {children ? (
        children
      ) : (
        <>
          <option value="">{placeholder}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </>
      )}
    </select>
  );
};

type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const FormTextarea: React.FC<FormTextareaProps> = ({
  className = "",
  ...props
}) => {
  return <textarea className={`form-textarea ${className}`} {...props} />;
};

interface FormActionsProps {
  children: React.ReactNode;
  error?: string | null;
  success?: string | null;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  error,
  success,
  className = "",
}) => {
  return (
    <div className={`form-actions ${className}`}>

      {/* Linha dos botões - alinhados à esquerda */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 12,
        }}
      >
        {children}
      </div>

      {/* Linha das mensagens - centralizadas */}
      {(error || success) && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          {error && (
            <div
              style={{
                padding: 12,
                backgroundColor: "#ffe6e6",
                color: "#d32f2f",
                borderRadius: 8,
                border: "1px solid #ffcdd2",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: 12,
                backgroundColor: "#e8f5e8",
                color: "#2e7d32",
                borderRadius: 8,
                border: "1px solid #c8e6c9",
              }}
            >
              {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface FormButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  icon?: React.ReactNode;
}

export const FormButton: React.FC<FormButtonProps> = ({
  variant = "primary",
  icon,
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`form-button form-button-${variant} ${className}`}
      {...props}
    >
      {icon && <span className="form-button-icon">{icon}</span>}
      {children}
    </button>
  );
};

// Re-export date components
export {
  FormDatePicker,
  FormDateRangePicker,
  FormBirthDatePicker,
} from "./DateComponents";
export { CityTypeahead } from "./CityTypeahead";

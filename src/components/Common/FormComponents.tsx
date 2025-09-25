import React from "react";
import "./FormComponents.css";

interface FormContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  title,
  icon,
  children,
  className = "",
}) => {
  return (
    <div className={`form-container ${className}`}>
      <div className="form-header">
        <h3>
          {icon && <span className="form-icon">{icon}</span>}
          {title}
        </h3>
      </div>
      <div className="form-content">{children}</div>
    </div>
  );
};

interface FormRowProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
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

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  options,
  placeholder = "Selecione...",
  className = "",
  ...props
}) => {
  return (
    <select className={`form-select ${className}`} {...props}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  className = "",
  ...props
}) => {
  return <textarea className={`form-textarea ${className}`} {...props} />;
};

interface FormActionsProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = "right",
  className = "",
}) => {
  return (
    <div className={`form-actions form-actions-${align} ${className}`}>
      {children}
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

import React from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale";
import "./DateComponents.css";

// Registrar o locale português
registerLocale("pt-BR", ptBR);

interface FormDatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  showTimeSelect?: boolean;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  required?: boolean;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;
  yearDropdownItemNumber?: number;
  scrollableYearDropdown?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  selected,
  onChange,
  placeholder = "Selecione uma data",
  showTimeSelect = true,
  dateFormat = "dd/MM/yyyy HH:mm",
  minDate,
  maxDate,
  className = "",
  required = false,
  showYearDropdown = false,
  showMonthDropdown = false,
  yearDropdownItemNumber = 100,
  scrollableYearDropdown = false,
  disabled = false,
  readOnly = false,
}) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect={showTimeSelect}
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat={dateFormat}
      placeholderText={placeholder}
      locale="pt-BR"
      minDate={minDate}
      maxDate={maxDate}
      showYearDropdown={showYearDropdown}
      showMonthDropdown={showMonthDropdown}
      yearDropdownItemNumber={yearDropdownItemNumber}
      scrollableYearDropdown={scrollableYearDropdown}
      className={`form-datepicker ${className}`}
      required={required}
      autoComplete="off"
      disabled={disabled || readOnly}
      readOnly={readOnly}
    />
  );
};

// Componente específico para data de nascimento
interface FormBirthDatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const FormBirthDatePicker: React.FC<FormBirthDatePickerProps> = ({
  selected,
  onChange,
  placeholder = "Selecione sua data de nascimento",
  className = "",
  required = false,
}) => {
  // Data mínima: 120 anos atrás
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);

  // Data máxima: hoje
  const maxDate = new Date();

  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect={false}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      locale="pt-BR"
      minDate={minDate}
      maxDate={maxDate}
      showYearDropdown={true}
      showMonthDropdown={true}
      yearDropdownItemNumber={120}
      scrollableYearDropdown={true}
      className={`form-datepicker ${className}`}
      required={required}
      autoComplete="off"
      dropdownMode="select"
    />
  );
};

interface FormDateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  showTimeSelect?: boolean;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  required?: boolean;
}

export const FormDateRangePicker: React.FC<FormDateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startPlaceholder = "Data inicial",
  endPlaceholder = "Data final",
  showTimeSelect = true,
  dateFormat = "dd/MM/yyyy HH:mm",
  minDate,
  maxDate,
  className = "",
  required = false,
}) => {
  return (
    <div className={`form-date-range ${className}`}>
      <div className="date-range-field">
        <DatePicker
          selected={startDate}
          onChange={onStartDateChange}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          showTimeSelect={showTimeSelect}
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat={dateFormat}
          placeholderText={startPlaceholder}
          locale="pt-BR"
          minDate={minDate}
          maxDate={endDate || maxDate}
          className="form-datepicker"
          required={required}
          autoComplete="off"
        />
      </div>
      <span className="date-range-separator">até</span>
      <div className="date-range-field">
        <DatePicker
          selected={endDate}
          onChange={onEndDateChange}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          showTimeSelect={showTimeSelect}
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat={dateFormat}
          placeholderText={endPlaceholder}
          locale="pt-BR"
          minDate={startDate || minDate}
          maxDate={maxDate}
          className="form-datepicker"
          required={required}
          autoComplete="off"
        />
      </div>
    </div>
  );
};

import React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./phone-input.css";
import { DEFAULT_COUNTRY, CountryCode } from "./phone-config";

interface PhoneInputProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  defaultCountry?: CountryCode;
}

export const PhoneInputField: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "Enter phone number",
  className = "",
  error,
  disabled = false,
  defaultCountry = DEFAULT_COUNTRY,
}) => {
  return (
    <div className="relative">
      <PhoneInput
        international
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`PhoneInput ${error ? "error" : ""} ${className}`}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};

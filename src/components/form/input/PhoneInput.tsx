import React, { useState, useEffect } from 'react';
import { PhoneNumberValidator, PhoneValidationResult } from '../../../utils/phoneValidation';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, validation: PhoneValidationResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  showValidationMessage?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = "Enter phone number",
  className = "",
  disabled = false,
  required = false,
  label,
  error,
  showValidationMessage = true
}) => {
  const [validation, setValidation] = useState<PhoneValidationResult>({
    isValid: false,
    normalized: null,
    error: null,
    country: null,
    type: null
  });
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // Validate phone number whenever value changes
  useEffect(() => {
    if (value) {
      const validationResult = PhoneNumberValidator.validateAndNormalize(value);
      setValidation(validationResult);
      onValidationChange?.(validationResult.isValid, validationResult);
    } else {
      const emptyValidation = {
        isValid: false,
        normalized: null,
        error: null,
        country: null,
        type: null
      };
      setValidation(emptyValidation);
      onValidationChange?.(false, emptyValidation);
    }
  }, [value, onValidationChange]);

  // Update display value when value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    onChange(inputValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the display value on blur if valid
    if (validation.isValid && validation.normalized) {
      const formatted = PhoneNumberValidator.formatForDisplay(validation.normalized);
      setDisplayValue(formatted);
      onChange(validation.normalized); // Keep normalized value in parent
    }
  };

  const getValidationColor = () => {
    if (!value) return 'border-gray-300';
    if (validation.isValid) return 'border-green-500';
    return 'border-red-500';
  };

  const getValidationIcon = () => {
    if (!value) return null;
    if (validation.isValid) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  const getProviderBadge = () => {
    if (!validation.isValid || !validation.provider) return null;
    
    const providerColors = {
      'Airtel': 'bg-red-100 text-red-800 border-red-200',
      'Tigo': 'bg-blue-100 text-blue-800 border-blue-200',
      'Vodacom': 'bg-red-100 text-red-800 border-red-200',
      'Halotel': 'bg-orange-100 text-orange-800 border-orange-200',
      'TTCL': 'bg-purple-100 text-purple-800 border-purple-200',
      'Unknown': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${providerColors[validation.provider as keyof typeof providerColors] || providerColors.Unknown}`}>
        {validation.provider}
      </span>
    );
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            ${getValidationColor()}
            ${error ? 'border-red-500' : ''}
            ${validation.isValid ? 'pr-10' : 'pr-10'}
          `}
        />
        
        {/* Validation Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getValidationIcon()}
        </div>
      </div>

      {/* Validation Messages */}
      {showValidationMessage && (
        <div className="mt-1">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          
          {!error && value && (
            <div className="flex items-center justify-between">
              <p className={`text-sm ${validation.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {validation.isValid ? PhoneNumberValidator.getValidationMessage(value) : validation.error}
              </p>
              {getProviderBadge()}
            </div>
          )}
          
          {/* Help text */}
          {!value && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter a valid phone number (e.g., 0712345678 for Tanzania or +1234567890 for international)
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PhoneInput; 
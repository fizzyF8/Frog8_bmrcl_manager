import { COLORS } from '@/constants/theme';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

// Required field validation
export const validateRequired = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

// Phone number validation
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Location validation (latitude and longitude)
export const validateLocation = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
};

// Date validation
export const validateDate = (date: string | Date): boolean => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

// Time validation (HH:mm format)
export const validateTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Number range validation
export const validateNumberRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// Form validation helper
export const validateForm = (values: Record<string, any>, rules: Record<string, (value: any) => boolean>): ValidationResult => {
  const errors: ValidationError[] = [];

  Object.entries(rules).forEach(([field, validator]) => {
    const value = values[field];
    if (!validator(value)) {
      errors.push({
        field,
        message: `Invalid ${field}`,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// API response validation
export const validateApiResponse = (response: any): boolean => {
  return response && typeof response === 'object' && 'status' in response;
};

// Error message formatting
export const formatValidationError = (error: ValidationError): string => {
  return `${error.field}: ${error.message}`;
};

// Get validation error color
export const getValidationErrorColor = (hasError: boolean): string => {
  return hasError ? COLORS.error.light : COLORS.neutral[500];
}; 
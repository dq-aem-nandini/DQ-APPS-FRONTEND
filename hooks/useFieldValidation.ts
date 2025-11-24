// hooks/useFieldValidation.ts
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';

/**
 * Backend field names from GlobaValidationUniqueFieldConstants enum
 */
type UniqueField =
  | 'COMPANY_NAME'
  | 'CONTACT_NUMBER'
  | 'EMAIL'
  | 'GST'
  | 'PAN_NUMBER'
  | 'TAN_NUMBER'
  | 'AADHAR_NUMBER'
  | 'ACCOUNT_NUMBER'
  | 'ACCOUNT_HOLDER_NAME'
  | 'PF_UAN_NUMBER'
  | 'ESI_NUMBER'
  | 'SSN_NUMBER'
  | 'SERIAL_NUMBER';

interface ValidationResult {
  isChecking: boolean;
  isUnique: boolean | null; // null = not checked, true = unique, false = exists
  error?: string;
}

type UseFieldValidationOptions<T extends FieldValues> = {
  field: UniqueField;
  value: string;
  setError: UseFormSetError<T>;
  clearErrors: (name?: FieldPath<T>) => void;
  fieldName: FieldPath<T>;
  debounceMs?: number;
  minLength?: number; // skip API if too short
};

/**
 * Reusable hook for debounced + backend uniqueness validation
 * Returns isChecking state and automatically sets form errors
 */
export function useFieldValidation<T extends FieldValues>({
  field,
  value,
  setError,
  clearErrors,
  fieldName,
  debounceMs = 600,
  minLength = 3,
}: UseFieldValidationOptions<T>): ValidationResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  const [debouncedValue] = useDebounce(value.trim(), debounceMs);
  const prevValueRef = useRef<string>('');

  useEffect(() => {
    // Skip if empty or too short
    if (!debouncedValue || debouncedValue.length < minLength) {
      if (isUnique !== null) {
        setIsUnique(null);
        clearErrors(fieldName);
      }
      return;
    }

    // Avoid re-checking same value
    if (debouncedValue === prevValueRef.current) return;
    prevValueRef.current = debouncedValue;

    let mounted = true;
    setIsChecking(true);
    setIsUnique(null);

    const checkUniqueness = async () => {
      try {
        const res = await fetch(
          `/api/validation/create?field=${field}&value=${encodeURIComponent(debouncedValue)}`
        );

        if (!mounted) return;

        if (!res.ok) throw new Error('Validation failed');

        const exists: boolean = await res.json();

        if (exists) {
          setIsUnique(false);
          setError(fieldName, {
            type: 'manual',
            message: getFriendlyMessage(field),
          });
        } else {
          setIsUnique(true);
          clearErrors(fieldName);
        }
      } catch (err) {
        console.warn(`[useFieldValidation] ${field} check failed:`, err);
        setIsUnique(null);
        // Don't block form on network error
      } finally {
        if (mounted) setIsChecking(false);
      }
    };

    checkUniqueness();

    return () => {
      mounted = false;
    };
  }, [debouncedValue, field, fieldName, setError, clearErrors, minLength]);

  return { isChecking, isUnique, error: isUnique === false ? getFriendlyMessage(field) : undefined };
}

// Human-readable error messages
function getFriendlyMessage(field: UniqueField): string {
  const messages: Record<UniqueField, string> = {
    COMPANY_NAME: 'Company name already exists',
    CONTACT_NUMBER: 'Contact number already in use',
    EMAIL: 'Email already registered',
    GST: 'GST number already exists',
    PAN_NUMBER: 'PAN already exists',
    TAN_NUMBER: 'TAN already exists',
    AADHAR_NUMBER: 'Aadhaar already exists',
    ACCOUNT_NUMBER: 'Bank account already exists',
    ACCOUNT_HOLDER_NAME: 'Account holder name already exists',
    PF_UAN_NUMBER: 'PF UAN already exists',
    ESI_NUMBER: 'ESI number already exists',
    SSN_NUMBER: 'SSN already exists',
    SERIAL_NUMBER: 'Serial number already exists',
  };
  return messages[field] || 'This value is already taken';
}
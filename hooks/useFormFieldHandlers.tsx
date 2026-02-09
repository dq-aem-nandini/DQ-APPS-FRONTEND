import { UniqueField } from "@/lib/api/validationService";

export function useFormFieldHandlers<TForm>(
  handleChange: (e: any) => void,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  checkUniqueness: (
    field: UniqueField,
    value: string,
    errorKey: string,
    fieldColumn: string,
    excludeId?: string | null
  ) => void,
  getFormData: () => TForm | null,
  validateField: (name: string, value: any, formData?: any) => string   // ← NEW PARAMETER
) {
  // Remove this line completely:
  // const { validateField } = useClientFieldValidation();

  const handleValidatedChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    handleChange(e);

    const error = validateField(
      name,
      value,
      getFormData() ?? undefined
    );

    setErrors(prev => {
      const next = { ...prev };
      error ? (next[name] = error) : delete next[name];
      return next;
    });
  };

  const handleUniqueBlur =
    (
      field: UniqueField,
      fieldColumn: string,
      errorKey: string,
      excludeId?: string | null,
      minLen = 3
    ) =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value.trim();
      if (!val || val.length < minLen) return;

      const formatError = validateField(errorKey, val, getFormData() ?? undefined); // ← use the passed one
      if (formatError) return;

      checkUniqueness(field, val, errorKey, fieldColumn, excludeId);
    };

  const fieldError = (errors: Record<string, string>, name: string) =>
    errors[name] ? (
      <p className="text-red-600 text-xs mt-1">{errors[name]}</p>
    ) : null;

  return {
    handleValidatedChange,
    handleUniqueBlur,
    fieldError,
  };
}
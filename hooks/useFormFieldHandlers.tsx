import { UniqueField } from "@/lib/api/validationService";

export function useFormFieldHandlers<TForm>(
  handleChange: (
    e: any,
    index?: number,
    section?: "addresses" | "clientPocs" | "clientTaxDetails"
  ) => void,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  checkUniqueness: (
    field: UniqueField,
    value: string,
    errorKey: string,
    fieldColumn: string,
    excludeId?: string | null
  ) => void,
  getFormData: () => TForm | null,
  validateField: (name: string, value: any, formData?: any) => string
) {
  const formatValue = (name: string, value: string) => {
    if (!name) return value;

    if (name === "email" || name.endsWith(".email")) {
      return value.toLowerCase().trim();
    }

    if (name === "gst" || name === "panNumber" || name === "tanNumber") {
      return value.toUpperCase().trim();
    }

    if (name.endsWith("pincode") || name.endsWith("contactNumber")) {
      return value.replace(/\D/g, "");
    }

    return value;
  };

  const handleValidatedChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement |HTMLSelectElement>,
    index?: number,
    section?: "addresses" | "clientPocs" | "clientTaxDetails"
  ) => {
    const { name } = e.target;

    const formattedValue = formatValue(name, e.target.value);
    e.target.value = formattedValue;

    // ✅ pass nested params
    handleChange(e, index, section);
    const currentForm = getFormData() ?? {};
    let updatedForm: any = JSON.parse(JSON.stringify(currentForm));
    
    if (name.includes(".")) {
      const keys = name.split(".");
      let temp = updatedForm;
    
      for (let i = 0; i < keys.length - 1; i++) {
        const key = isNaN(Number(keys[i])) ? keys[i] : Number(keys[i]);
        temp = temp[key];
      }
    
      const lastKey = keys[keys.length - 1];
      temp[lastKey] = formattedValue;
    } else {
      updatedForm[name] = formattedValue;
    }
    const error = validateField(name, formattedValue, updatedForm);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
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
      const formattedValue = formatValue(errorKey, e.target.value);

      if (!formattedValue || formattedValue.length < minLen) return;

      const error = validateField(
        errorKey,
        formattedValue,
        getFormData() ?? undefined
      );

      if (error) return;

      checkUniqueness(field, formattedValue, errorKey, fieldColumn, excludeId);
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

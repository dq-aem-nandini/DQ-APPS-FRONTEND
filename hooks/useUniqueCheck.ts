import { useState } from "react";
import { validationService, UniqueField } from "@/lib/api/validationService";

export function useUniquenessCheck(
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  const [checking, setChecking] = useState<Set<string>>(new Set());

  const checkUniqueness = async (
    field: UniqueField,
    value: string,
    errorKey: string,
    fieldColumn: string,
    excludeId?: string | null
  ) => {
    const val = value.trim();
    if (!val || val.length < 3 || checking.has(errorKey)) return;

    setChecking((s) => new Set(s).add(errorKey));

    try {
      const isEdit = !!excludeId && excludeId.trim().length > 10;

      const { exists } = await validationService.validateField({
        field,
        value: val,
        fieldColumn,
        mode: isEdit ? "edit" : "create",
        excludeId: isEdit ? excludeId : undefined,
      });

      setErrors((prev) => {
        const next = { ...prev };
        exists
          ? (next[errorKey] = "Already exists in the system")
          : delete next[errorKey];
        return next;
      });
    } finally {
      setChecking((s) => {
        const n = new Set(s);
        n.delete(errorKey);
        return n;
      });
    }
  };

  return { checkUniqueness, checking };
}

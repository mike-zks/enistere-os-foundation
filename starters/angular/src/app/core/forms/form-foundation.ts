export type FormErrors<T extends object> = Partial<Record<keyof T, string>>;
export type FieldValidator<T> = (value: T) => string | null;
export type FormValidators<T extends object> = {
  readonly [K in keyof T]?: FieldValidator<T[K]>;
};

export function validateForm<T extends object>(
  values: T,
  validators: FormValidators<T>,
): FormErrors<T> {
  const errors: FormErrors<T> = {};
  for (const key of Object.keys(validators) as (keyof T)[]) {
    const message = validators[key]?.(values[key]);
    if (message) errors[key] = message;
  }
  return errors;
}

export function required(label: string): FieldValidator<unknown> {
  return (value) => {
    if (typeof value === 'string') return value.trim() ? null : `${label} est requis`;
    return value === null || value === undefined ? `${label} est requis` : null;
  };
}

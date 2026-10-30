export interface DropdownOption<T extends string | number = string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: unknown;
  disabled?: boolean;
}

/**
 * Filter dropdown options based on search query.
 * Case-insensitive match on label and value.
 */
export function filterDropdownOptions<T extends string | number>(
  options: (DropdownOption<T> | { value: T; label: string })[],
  query: string,
): (DropdownOption<T> | { value: T; label: string })[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return options;

  return options.filter((opt) => {
    const labelMatch = opt.label.toLowerCase().includes(trimmed);
    const valueMatch = String(opt.value).toLowerCase().includes(trimmed);
    return labelMatch || valueMatch;
  });
}

/**
 * Resolves the display label for the currently active value.
 */
export function getOptionLabel<T extends string | number>(
  options: (DropdownOption<T> | { value: T; label: string })[],
  value: T,
  placeholder = "Pilih opsi...",
): string {
  const matched = options.find((opt) => opt.value === value);
  return matched ? matched.label : placeholder;
}

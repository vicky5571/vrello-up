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

export interface DropdownPlacementArgs {
  rect?: { top: number; bottom: number; left: number; right: number } | null;
  direction?: "up" | "down" | "auto";
  align?: "left" | "right" | "auto";
  viewportHeight?: number;
  viewportWidth?: number;
  menuHeight?: number;
  menuWidth?: number;
}

export interface DropdownPlacementResult {
  direction: "up" | "down";
  align: "left" | "right";
  directionClass: string;
  alignClass: string;
}

/**
 * Computes responsive dropdown popover direction and horizontal alignment
 * based on element coordinates and viewport boundaries.
 */
export function computeDropdownPlacement({
  rect,
  direction = "auto",
  align = "auto",
  viewportHeight = 800,
  viewportWidth = 1280,
  menuHeight = 240,
  menuWidth = 220,
}: DropdownPlacementArgs = {}): DropdownPlacementResult {
  let resolvedDirection: "up" | "down" = "down";
  if (direction === "up") {
    resolvedDirection = "up";
  } else if (direction === "down") {
    resolvedDirection = "down";
  } else if (rect && viewportHeight) {
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      resolvedDirection = "up";
    }
  }

  let resolvedAlign: "left" | "right" = "left";
  if (align === "left") {
    resolvedAlign = "left";
  } else if (align === "right") {
    resolvedAlign = "right";
  } else if (rect && viewportWidth) {
    const spaceRight = viewportWidth - rect.left;
    if (spaceRight < menuWidth && rect.right > menuWidth) {
      resolvedAlign = "right";
    }
  }

  const directionClass =
    resolvedDirection === "up" ? "bottom-full mb-1" : "top-full mt-1";
  const alignClass =
    resolvedAlign === "right" ? "right-0 left-auto" : "left-0";

  return {
    direction: resolvedDirection,
    align: resolvedAlign,
    directionClass,
    alignClass,
  };
}

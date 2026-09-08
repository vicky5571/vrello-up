"use client";

import { useEffect, useRef, type RefObject } from "react";

interface UseDropdownOptions {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
  closeOnEscape?: boolean;
}

/**
 * Clean native-aligned dropdown / menu dismiss hook.
 * Replaces manual document.addEventListener("mousedown", handleClickOutside)
 * boilerplate across the codebase with:
 * 1. Automatic light dismiss (clicking outside the container and optional trigger).
 * 2. Automatic Escape key dismiss with focus restoration to trigger.
 * 3. Minimal listeners (only active while isOpen is true).
 */
export function useDropdown<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  triggerRef,
  closeOnEscape = true,
}: UseDropdownOptions): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      // Ignore clicks inside dropdown container
      if (containerRef.current?.contains(target)) return;

      // Ignore clicks on the trigger button (trigger handles its own toggle)
      if (triggerRef?.current?.contains(target)) return;

      onCloseRef.current();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        triggerRef?.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    if (closeOnEscape) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      if (closeOnEscape) {
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [isOpen, closeOnEscape, triggerRef]);

  return containerRef;
}

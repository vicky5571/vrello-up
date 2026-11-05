"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropdown } from "@/components/ui/useDropdown";
import {
  type DropdownOption,
  filterDropdownOptions,
  getOptionLabel,
  computeDropdownPlacement,
} from "./customDropdownHelpers";

export type { DropdownOption };
export { filterDropdownOptions, getOptionLabel, computeDropdownPlacement };

export interface CustomDropdownProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: (DropdownOption<T> | { value: T; label: string })[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
  id?: string;
  icon?: React.ComponentType<{ className?: string }>;
  minSearchOptions?: number;
  direction?: "up" | "down" | "auto";
  align?: "left" | "right" | "auto";
}

/**
 * Modern, accessible, searchable custom select dropdown.
 * Replaces unstyled native <select> elements across the platform with:
 * - Search filtering inside dropdown popover (auto-activates when options >= minSearchOptions or searchable=true)
 * - Click-outside and Escape key dismissal via useDropdown
 * - Dark mode / light mode theme alignment with solid high-contrast cards
 * - Active item checkmark indicator and keyboard arrow navigation
 * - Responsive viewport collision detection (auto flips up or right-aligns)
 * - Elevated z-index stacking when open to prevent clipping by sibling or stage elements
 */
export function CustomDropdown<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  searchable,
  searchPlaceholder = "Cari opsi...",
  disabled = false,
  className = "",
  menuClassName = "",
  size = "sm",
  ariaLabel,
  id,
  icon: TriggerIcon,
  minSearchOptions = 6,
  direction = "auto",
  align = "auto",
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [placement, setPlacement] = useState<{
    direction: "up" | "down";
    align: "left" | "right";
  }>({
    direction: direction === "up" ? "up" : "down",
    align: align === "right" ? "right" : "left",
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const generatedId = useId();
  const dropdownId = id || generatedId;

  const containerRef = useDropdown<HTMLDivElement>({
    isOpen,
    onClose: () => {
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
    },
    triggerRef,
    closeOnEscape: true,
  });

  const shouldShowSearch =
    searchable !== undefined ? searchable : options.length >= minSearchOptions;

  const filteredOptions = useMemo(
    () => filterDropdownOptions(options, searchQuery),
    [options, searchQuery],
  );

  // Focus search input and compute responsive placement when dropdown opens
  useEffect(() => {
    if (isOpen) {
      if (triggerRef.current && typeof window !== "undefined") {
        const rect = triggerRef.current.getBoundingClientRect();
        const res = computeDropdownPlacement({
          rect: {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
          },
          direction,
          align,
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
        });
        setPlacement({ direction: res.direction, align: res.align });
      }

      if (shouldShowSearch) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 30);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, shouldShowSearch, direction, align]);

  const activeOption = options.find((opt) => opt.value === value);
  const displayLabel = activeOption ? activeOption.label : placeholder;

  const handleSelect = (optionValue: T, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        highlightedIndex >= 0 &&
        highlightedIndex < filteredOptions.length
      ) {
        const item = filteredOptions[highlightedIndex];
        const isOptDisabled = "disabled" in item && Boolean(item.disabled);
        handleSelect(item.value, isOptDisabled);
      }
    }
  };

  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-1.5 text-xs min-h-[30px]"
      : "px-3 py-2 text-sm min-h-[36px]";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-block text-left",
        isOpen ? "z-50" : "z-auto",
        className,
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={dropdownId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || displayLabel}
        className={`w-full flex items-center justify-between gap-1.5 rounded-lg border font-medium text-left transition-all duration-150 cursor-pointer select-none ${sizeClasses} ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
            : isOpen
              ? "bg-white dark:bg-slate-800 border-indigo-500/80 ring-2 ring-indigo-500/20 text-slate-900 dark:text-slate-100 shadow-xs"
              : "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
      >
        <span className="flex items-center gap-1.5 truncate flex-1 min-w-0">
          {TriggerIcon && (
            <TriggerIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          {activeOption && "icon" in activeOption && Boolean(activeOption.icon) && (
            <span className="w-3.5 h-3.5 text-slate-400 shrink-0 inline-flex items-center">
              {React.createElement(activeOption.icon as React.ComponentType<{ className?: string }>, {
                className: "w-3.5 h-3.5",
              })}
            </span>
          )}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-500" : ""
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={dropdownId}
          className={cn(
            "absolute z-50 min-w-full sm:min-w-[190px] w-max max-w-[280px] rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900 shadow-2xl py-1 text-xs animate-in fade-in-0 duration-100",
            placement.direction === "up" ? "bottom-full mb-1" : "top-full mt-1",
            placement.align === "right" ? "right-0 left-auto" : "left-0",
            placement.direction === "up"
              ? placement.align === "right"
                ? "origin-bottom-right"
                : "origin-bottom-left"
              : placement.align === "right"
                ? "origin-top-right"
                : "origin-top-left",
            menuClassName,
          )}
        >
          {/* Sticky Search Header */}
          {shouldShowSearch && (
            <div className="p-1.5 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-xl">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-7 pr-6 py-1 text-xs rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                Tidak ada opsi ditemukan
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                const isDisabled = "disabled" in opt && Boolean(opt.disabled);
                const ItemIcon = "icon" in opt ? (opt.icon as React.ComponentType<{ className?: string }>) : undefined;
                const badge = "badge" in opt ? opt.badge : undefined;

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    onClick={() => handleSelect(opt.value, isDisabled)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isDisabled
                        ? "opacity-40 cursor-not-allowed text-slate-400"
                        : isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                          : isHighlighted
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate min-w-0">
                      {ItemIcon && (
                        <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </span>

                    <span className="flex items-center gap-1.5 shrink-0">
                      {badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

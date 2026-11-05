"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Plus,
  Minus,
  Calendar,
  MapPin,
  User,
  Phone,
  FileText,
} from "lucide-react";
import { useSession } from "next-auth/react";
import type { BorrowRecord, InventoryItem } from "@/types";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { EQUIPMENT_CATEGORIES } from "./inventoryConstants";

interface BorrowRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEventId?: string;
  onSaved: (record: BorrowRecord) => void;
}

interface SelectedItem {
  inventoryItemId: string;
  quantity: number;
  conditionOut: "GOOD" | "MINOR_DAMAGE";
  notes?: string;
}

export function BorrowRequestModal({
  isOpen,
  onClose,
  defaultEventId,
  onSaved,
}: BorrowRequestModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [purpose, setPurpose] = useState("");

  const [eventId, setEventId] = useState<string>(defaultEventId || "");
  const [eventLocation, setEventLocation] = useState("");
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnDueDate, setReturnDueDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  );

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store data
  const events = useMarcomDataStore((s) => s.events);
  const fetchEvents = useMarcomDataStore((s) => s.fetchEvents);
  const inventoryItems = useMarcomDataStore((s) => s.inventoryItems);
  const fetchInventory = useMarcomDataStore((s) => s.fetchInventory);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      fetchInventory();
      setStep(1);
      setError(null);
      if (defaultEventId) {
        setEventId(defaultEventId);
      }
      if (session?.user?.name && !borrowerName) {
        setBorrowerName(session.user.name);
      }
    }
  }, [isOpen, defaultEventId, fetchEvents, fetchInventory, session?.user?.name]);

  // When event is selected, auto-fill location if empty
  const handleEventChange = (selectedId: string) => {
    setEventId(selectedId);
    if (selectedId) {
      const ev = events.find((e) => e.id === selectedId);
      if (ev?.location) {
        setEventLocation(ev.location);
      }
    }
  };

  if (!isOpen) return null;

  const handleSelectItem = (item: InventoryItem, qty: number) => {
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((p) => p.inventoryItemId !== item.id));
    } else {
      const existing = selectedItems.find((p) => p.inventoryItemId === item.id);
      if (existing) {
        setSelectedItems((prev) =>
          prev.map((p) =>
            p.inventoryItemId === item.id
              ? { ...p, quantity: Math.min(qty, item.availableUnits) }
              : p
          )
        );
      } else {
        setSelectedItems((prev) => [
          ...prev,
          {
            inventoryItemId: item.id,
            quantity: Math.min(qty, item.availableUnits),
            conditionOut: "GOOD",
          },
        ]);
      }
    }
  };

  const filteredCatalog = inventoryItems.filter((i) => {
    if (selectedCategory !== "ALL" && i.category !== selectedCategory) {
      return false;
    }
    if (!itemSearch) return true;
    const q = itemSearch.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  });

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!borrowerName.trim()) {
        setError("Borrower Name is required");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!borrowDate || !returnDueDate) {
        setError("Borrow Date and Return Due Date are required");
        return;
      }
      if (new Date(returnDueDate) < new Date(borrowDate)) {
        setError("Return Due Date cannot be earlier than Borrow Date");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (selectedItems.length === 0) {
        setError("Please select at least 1 equipment item to borrow");
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        borrowerName: borrowerName.trim(),
        borrowerPhone: borrowerPhone.trim(),
        borrowerDivision: "",
        eventId: eventId || null,
        eventLocation: eventLocation.trim(),
        borrowDate,
        returnDueDate,
        purpose: purpose.trim(),
        items: selectedItems,
      };

      const res = await fetch("/api/marcom/inventory/borrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit borrow request");
      }

      onSaved(data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Step {step} of 4
              </span>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                New Equipment Borrow Request
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {step === 1 && "Enter borrower identity and contact details."}
              {step === 2 && "Specify execution schedule and target event location."}
              {step === 3 && "Select equipment and units needed from available stock."}
              {step === 4 && "Review your request summary before submission."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
          {error && (
            <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* STEP 1: Requester Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Borrower Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="e.g. Andi Pratama"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone / WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    placeholder="e.g. 08123456789"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Borrow Purpose
                </label>
                <textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Weekend school roadshow activation booth..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Event & Schedule */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-slate-300">
                    Link to Field Event (Optional)
                  </label>
                  {eventId && (
                    <button
                      type="button"
                      onClick={() => handleEventChange("")}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Clear link
                    </button>
                  )}
                </div>
                <CustomDropdown<string>
                  value={eventId}
                  onChange={(chosenId) => handleEventChange(chosenId)}
                  options={[
                    { value: "", label: "— Standalone / Not linked to Field Event —" },
                    ...events.map((ev) => ({
                      value: ev.id,
                      label: `${ev.name} (${ev.branchName || "HQ"}${ev.startDate ? ` · ${ev.startDate.slice(5)}` : ""})`,
                    })),
                  ]}
                  size="md"
                  searchable={true}
                  searchPlaceholder="Search field event or branch..."
                  direction="auto"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event / Deployment Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="e.g. Trans Studio Mall Bandung"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Borrow Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Return Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={borrowDate}
                    value={returnDueDate}
                    onChange={(e) => setReturnDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {borrowDate && returnDueDate && (
                <div className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded inline-flex items-center gap-1.5 border border-blue-200/60 dark:border-blue-800/40">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Duration:{" "}
                    <strong>
                      {Math.max(
                        1,
                        Math.round(
                          (new Date(returnDueDate).getTime() - new Date(borrowDate).getTime()) /
                            86400000
                        )
                      )}{" "}
                      days
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Select Items */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search catalog by name, code, category..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Horizontal Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === "ALL"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Categories
                </button>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto">
                {filteredCatalog.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No equipment found matching criteria.
                  </div>
                ) : (
                  filteredCatalog.map((item) => {
                    const isAvailable = item.availableUnits > 0;
                    const selected = selectedItems.find((p) => p.inventoryItemId === item.id);
                    const currentQty = selected?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                          !isAvailable
                            ? "opacity-50 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              {item.code}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{item.category}</span>
                            <span>·</span>
                            <span
                              className={
                                isAvailable
                                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                  : "text-rose-500 font-medium"
                              }
                            >
                              {isAvailable
                                ? `${item.availableUnits} available (${item.totalUnits} total)`
                                : "Not Available"}
                            </span>
                          </div>
                        </div>

                        {/* Steppers + input */}
                        <div className="flex items-center gap-2">
                          {isAvailable ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSelectItem(item, Math.max(0, currentQty - 1))}
                                disabled={currentQty === 0}
                                className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={item.availableUnits}
                                value={currentQty === 0 ? "" : currentQty}
                                onChange={(e) =>
                                  handleSelectItem(item, parseInt(e.target.value, 10) || 0)
                                }
                                placeholder="0"
                                className="w-12 px-1 py-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectItem(item, Math.min(item.availableUnits, currentQty + 1))
                                }
                                disabled={currentQty >= item.availableUnits}
                                className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2 py-1 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedItems.length > 0 && (
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-lg">
                  <div className="font-semibold text-blue-900 dark:text-blue-200 mb-1 flex items-center justify-between">
                    <span>Selected Items ({selectedItems.length}):</span>
                    <span className="text-[11px] font-normal text-blue-700 dark:text-blue-300">
                      {selectedItems.reduce((acc, curr) => acc + curr.quantity, 0)} total units
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItems.map((si) => {
                      const it = inventoryItems.find((i) => i.id === si.inventoryItemId);
                      return (
                        <span
                          key={si.inventoryItemId}
                          className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-[11px] flex items-center gap-1"
                        >
                          {it?.name || "Item"} ×{si.quantity}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedItems((p) =>
                                p.filter((x) => x.inventoryItemId !== si.inventoryItemId)
                              )
                            }
                            className="hover:text-rose-500 ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left Column: Requester & Schedule */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Logistics & Requester</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Borrower:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {borrowerName}
                      </span>
                    </div>

                    {borrowerPhone && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">Contact Phone:</span>
                        <span className="text-slate-800 dark:text-slate-200">{borrowerPhone}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-500 block text-[11px]">Schedule:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {borrowDate} to {returnDueDate}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                          {Math.max(
                            1,
                            Math.round(
                              (new Date(returnDueDate).getTime() - new Date(borrowDate).getTime()) /
                                86400000
                            )
                          )}{" "}
                          days
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Location:</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {eventLocation || "—"}
                      </span>
                    </div>

                    {eventId && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">Linked Field Event:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {events.find((e) => e.id === eventId)?.name || eventId}
                        </span>
                      </div>
                    )}

                    {purpose && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">Purpose:</span>
                        <span className="text-slate-600 dark:text-slate-300 italic">{purpose}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Requested Items */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex flex-col justify-between border border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>Equipment Items ({selectedItems.length})</span>
                    </h4>

                    <div className="space-y-1.5 mt-3 max-h-48 overflow-y-auto pr-1">
                      {selectedItems.map((si) => {
                        const it = inventoryItems.find((i) => i.id === si.inventoryItemId);
                        return (
                          <div
                            key={si.inventoryItemId}
                            className="flex items-center justify-between text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 mr-2">
                              <span className="font-mono text-[10px] text-slate-400">{it?.code}</span>
                              <span className="font-medium truncate">{it?.name}</span>
                            </div>
                            <span className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              × {si.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-[11px] text-slate-500">
                    <span>Total Units:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedItems.reduce((acc, curr) => acc + curr.quantity, 0)} units across{" "}
                      {selectedItems.length} models
                    </strong>
                  </div>
                </div>
              </div>

              <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                ⚠️ This request will be submitted with <strong>PENDING</strong> status. Available units
                in storage will remain unchanged until approved and marked as picked up.
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Submit Request
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

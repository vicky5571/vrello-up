"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { InventoryItem, EquipmentStatus } from "@/types";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUS_CONFIG } from "./inventoryConstants";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface InventoryItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSaved: (item: InventoryItem) => void;
}

export function InventoryItemFormModal({
  isOpen,
  onClose,
  item,
  onSaved,
}: InventoryItemFormModalProps) {
  const isEditing = Boolean(item);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<string>(EQUIPMENT_CATEGORIES[0]);
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [totalUnits, setTotalUnits] = useState(1);
  const [storageLocation, setStorageLocation] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("AVAILABLE");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setCode(item.code || "");
      setCategory(item.category || EQUIPMENT_CATEGORIES[0]);
      setBrand(item.brand || "");
      setDescription(item.description || "");
      setTotalUnits(item.totalUnits || 1);
      setStorageLocation(item.storageLocation || "");
      setStatus(item.status || "AVAILABLE");
      setNotes(item.notes || "");
    } else {
      setName("");
      setCode("");
      setCategory(EQUIPMENT_CATEGORIES[0]);
      setBrand("");
      setDescription("");
      setTotalUnits(1);
      setStorageLocation("");
      setStatus("AVAILABLE");
      setNotes("");
    }
    setError(null);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !category) {
      setError("Name, Code, and Category are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        brand: brand.trim(),
        description: description.trim(),
        totalUnits: Math.max(1, Number(totalUnits)),
        storageLocation: storageLocation.trim(),
        notes: notes.trim(),
      };

      if (isEditing) {
        payload.status = status;
      }

      const url = isEditing ? `/api/marcom/inventory/${item!.id}` : "/api/marcom/inventory";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save equipment item");
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
              {isEditing ? "Edit Equipment Item" : "Add Equipment Item"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditing
                ? "Update master catalog details and capacity."
                : "Register a new equipment asset into inventory."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Folding Tent 3x3"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Item Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. TND-001"
                className="w-full px-3 py-2 font-mono uppercase bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <CustomDropdown<string>
                value={category}
                onChange={(val) => setCategory(val)}
                options={EQUIPMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                size="md"
                direction="auto"
                searchable={false}
                className="w-full"
                menuClassName="w-full min-w-full max-h-60"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Eiger, JBL, etc."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Units <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalUnits}
                onChange={(e) => setTotalUnits(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Storage Location
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Warehouse A - Rack 2"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isEditing && (
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Equipment Status
              </label>
              <CustomDropdown<EquipmentStatus>
                value={status}
                onChange={(val) => setStatus(val)}
                options={(Object.keys(EQUIPMENT_STATUS_CONFIG) as EquipmentStatus[]).map((st) => ({
                  value: st,
                  label: EQUIPMENT_STATUS_CONFIG[st].label,
                }))}
                size="md"
                direction="auto"
                searchable={false}
                className="w-full"
                menuClassName="w-full min-w-full max-h-60"
              />
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Physical specs, dimensions, bundle contents..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes / Maintenance History
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special handling instructions, past repairs..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

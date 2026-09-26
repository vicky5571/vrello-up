"use client";

import React, { useMemo, useState } from "react";
import { ClipboardList, X } from "lucide-react";
import { MouDocumentViewerModal } from "@/components/views/MousView/MouDocumentViewerModal";
import type { MarcomPlacement, Brand } from "@/types";
import { findOutletCoordinates } from "@/lib/marcom/outletInherit";
import {
  findAvailableMousForOutlet,
  validatePlacementMouRequirement,
  type MouSummaryInfo,
} from "@/lib/marcom/placementMouBridge";
import { evaluateGeofenceStatus } from "@/lib/marcom/locationUtils";
import type { OutletSelectionPayload, OutletSearchResult } from "./OutletSearchCombobox";
import {
  canAdvanceFromStep,
  applySmartDefaultsOnOutletSelect,
  getStepCompletionStatus,
  type WizardStepId,
} from "./wizard/placementWizardHelpers";
import { WizardStepperHeader } from "./wizard/WizardStepperHeader";
import { WizardFooter } from "./wizard/WizardFooter";
import { Step1Outlet } from "./wizard/Step1Outlet";
import { Step2MaterialTheme } from "./wizard/Step2MaterialTheme";
import { Step3PhotoNotes } from "./wizard/Step3PhotoNotes";
import { Step4LocationVerification } from "./wizard/Step4LocationVerification";

export interface PlacementFormModalProps {
  placement: Partial<MarcomPlacement> | null;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void> | void;
  setPlacement: React.Dispatch<
    React.SetStateAction<Partial<MarcomPlacement> | null>
  >;
  isSaving: boolean;
  outletsList: {
    id: string;
    name: string;
    code?: string;
    brand?: string;
    address?: string;
    picName?: string;
    branchId?: string;
    latitude?: number | null;
    longitude?: number | null;
  }[];
  materialsList: { id: string; name: string; type?: string; requiresMou?: boolean }[];
  mousList: MouSummaryInfo[];
  placements: MarcomPlacement[];
}

export function PlacementFormModal(props: PlacementFormModalProps) {
  if (!props.placement) return null;
  return <PlacementFormModalContent {...props} placement={props.placement} />;
}

function PlacementFormModalContent({
  placement,
  onClose,
  onSave,
  setPlacement,
  isSaving,
  outletsList,
  materialsList,
  mousList,
  placements,
}: PlacementFormModalProps & { placement: Partial<MarcomPlacement> }) {
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [viewingDocMou, setViewingDocMou] = useState<MouSummaryInfo | null>(null);

  const selOutlet = outletsList.find((o) => o.id === placement.outletId);
  const inheritedCoords = placement.outletId
    ? findOutletCoordinates(placement.outletId, placements)
    : null;

  const outletLat =
    (placement.outlet as { latitude?: number | null } | undefined)?.latitude ??
    selOutlet?.latitude ??
    inheritedCoords?.latitude ??
    null;
  const outletLng =
    (placement.outlet as { longitude?: number | null } | undefined)?.longitude ??
    selOutlet?.longitude ??
    inheritedCoords?.longitude ??
    null;

  const outletCoordinates = useMemo(
    () => ({
      latitude: outletLat,
      longitude: outletLng,
    }),
    [outletLat, outletLng]
  );

  const selectedOutletObj = useMemo((): OutletSearchResult | undefined => {
    if (selOutlet) {
      return {
        id: selOutlet.id,
        name: selOutlet.name,
        code: selOutlet.code || "",
        brand: selOutlet.brand,
        address: selOutlet.address,
        latitude: selOutlet.latitude,
        longitude: selOutlet.longitude,
      };
    }
    if (placement.outlet) {
      const pOutlet = placement.outlet as {
        id: string;
        name: string;
        code?: string;
        brand?: string;
        address?: string;
        latitude?: number | null;
        longitude?: number | null;
      };
      return {
        id: pOutlet.id,
        name: pOutlet.name,
        code: pOutlet.code || "",
        brand: pOutlet.brand,
        address: pOutlet.address,
        latitude: pOutlet.latitude,
        longitude: pOutlet.longitude,
      };
    }
    return undefined;
  }, [selOutlet, placement.outlet]);

  const selectedMat = materialsList.find((m) => m.id === placement.materialId);
  const selectedMou = mousList.find((m) => m.id === placement.mouId);
  const outletMous = findAvailableMousForOutlet(
    mousList,
    selOutlet || placement.outletId
  );
  const mouValidation = validatePlacementMouRequirement({
    materialName: selectedMat?.name,
    materialType: selectedMat?.type,
    requiresMou: selectedMat?.requiresMou,
    cost: placement.cost,
    selectedMou,
    outletMousCount: outletMous.length,
  });

  const completionStatus = getStepCompletionStatus(placement);
  const canAdvance = canAdvanceFromStep(currentStep, placement);
  const canSubmitDirectly = canAdvanceFromStep(4, placement);

  const handleSelectOutlet = (outlet: OutletSelectionPayload) => {
    if (outlet) {
      const updated = applySmartDefaultsOnOutletSelect(outlet, placement);
      const outLat = outlet.latitude ?? null;
      const outLng = outlet.longitude ?? null;
      const currentSalesLat = placement.latitude ?? null;
      const currentSalesLng = placement.longitude ?? null;

      const geo = evaluateGeofenceStatus(
        outLat != null && outLng != null ? { latitude: outLat, longitude: outLng } : null,
        currentSalesLat != null && currentSalesLng != null
          ? { latitude: currentSalesLat, longitude: currentSalesLng }
          : null
      );

      const matchingMous = findAvailableMousForOutlet(mousList, outlet);
      const defaultMou =
        matchingMous.find((m) => m.status === "APPROVED") || matchingMous[0];

      setPlacement((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
              mouId: defaultMou?.id || prev.mouId || null,
              isLocationValid: geo.isValid,
              locationDeviation: geo.deviationMeters,
            }
          : prev
      );

      // Fast auto-advance to step 2 upon selecting store (if on step 1)
      if (currentStep === 1) {
        setCurrentStep(2);
      }
    } else {
      setPlacement((prev) =>
        prev
          ? {
              ...prev,
              outletId: "",
              mouId: null,
              isLocationValid: true,
              locationDeviation: null,
              outlet: undefined,
            }
          : prev
      );
    }
  };

  const handleSetBrand = (brand: Brand) => {
    setPlacement((prev) => (prev ? { ...prev, brand } : prev));
  };

  const handleNextStep = () => {
    if (currentStep < 4 && canAdvance) {
      setCurrentStep((prev) => (prev + 1) as WizardStepId);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStepId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-lime-600" />
            <span>
              {placement.id ? "Edit Eksekusi Placement POSM" : "Eksekusi Baru POSM Lapangan"}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <WizardStepperHeader
          currentStep={currentStep}
          onSelectStep={setCurrentStep}
          completionStatus={completionStatus}
        />

        {/* Active Step Content Form */}
        <form onSubmit={onSave} className="space-y-4">
          {currentStep === 1 && (
            <Step1Outlet
              placement={placement}
              selectedOutletObj={selectedOutletObj}
              onSelectOutlet={handleSelectOutlet}
              onSetBrand={handleSetBrand}
              workspaceId={placement.workspaceId || "ws-main"}
            />
          )}

          {currentStep === 2 && (
            <Step2MaterialTheme
              placement={placement}
              setPlacement={setPlacement}
              materialsList={materialsList}
              mousList={mousList}
              outletMous={outletMous}
              selectedMat={selectedMat}
              selectedMou={selectedMou}
              mouValidation={mouValidation}
              onViewDocMou={(mou) => setViewingDocMou(mou)}
            />
          )}

          {currentStep === 3 && (
            <Step3PhotoNotes
              placement={placement}
              setPlacement={setPlacement}
              disabled={isSaving}
            />
          )}

          {currentStep === 4 && (
            <Step4LocationVerification
              placement={placement}
              setPlacement={setPlacement}
              outletCoordinates={outletCoordinates}
              materialName={selectedMat?.name}
              outletName={selOutlet?.name || placement.outlet?.name}
            />
          )}

          {/* Footer Controls */}
          <WizardFooter
            currentStep={currentStep}
            onPrevStep={handlePrevStep}
            onNextStep={handleNextStep}
            canAdvance={canAdvance}
            onClose={onClose}
            isSaving={isSaving}
            isEditMode={Boolean(placement.id)}
            canSubmitDirectly={canSubmitDirectly}
          />
        </form>
      </div>

      {/* MOU Document Lightbox Modal */}
      <MouDocumentViewerModal
        isOpen={Boolean(viewingDocMou)}
        onClose={() => setViewingDocMou(null)}
        docPath={viewingDocMou?.docPath}
        partnerName={viewingDocMou?.partnerName}
        mouType={viewingDocMou?.mouType}
        outletName={selOutlet?.name || placement.outlet?.name}
      />
    </div>
  );
}

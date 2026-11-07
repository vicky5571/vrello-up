export type BorrowWizardStepId = 1 | 2 | 3 | 4;

export interface BorrowWizardStepInfo {
  step: BorrowWizardStepId;
  label: string;
  shortLabel: string;
  description: string;
}

export const BORROW_WIZARD_STEPS: BorrowWizardStepInfo[] = [
  {
    step: 1,
    label: "Peminjam",
    shortLabel: "Peminjam",
    description: "Identitas peminjam & nomor kontak",
  },
  {
    step: 2,
    label: "Jadwal & Event",
    shortLabel: "Jadwal",
    description: "Durasi pinjam & tautan acara",
  },
  {
    step: 3,
    label: "Pilih Alat",
    shortLabel: "Alat",
    description: "Katalog peralatan & jumlah unit",
  },
  {
    step: 4,
    label: "Review & Submit",
    shortLabel: "Review",
    description: "Ringkasan permohonan & konfirmasi",
  },
];

export interface BorrowFormData {
  borrowerName: string;
  borrowerPhone: string;
  borrowDate: string;
  returnDueDate: string;
  selectedItems: { inventoryItemId: string; quantity: number }[];
}

export function canAdvanceFromBorrowStep(
  step: BorrowWizardStepId,
  data: Partial<BorrowFormData>
): boolean {
  switch (step) {
    case 1:
      return Boolean(data.borrowerName && data.borrowerName.trim().length > 0);
    case 2:
      return Boolean(
        data.borrowDate &&
          data.returnDueDate &&
          new Date(data.returnDueDate) >= new Date(data.borrowDate)
      );
    case 3:
      return Boolean(
        data.selectedItems &&
          data.selectedItems.length > 0 &&
          data.selectedItems.some((i) => i.quantity > 0)
      );
    case 4:
      return (
        canAdvanceFromBorrowStep(1, data) &&
        canAdvanceFromBorrowStep(2, data) &&
        canAdvanceFromBorrowStep(3, data)
      );
    default:
      return false;
  }
}

export function getBorrowStepCompletionStatus(
  data: Partial<BorrowFormData>
): Record<BorrowWizardStepId, boolean> {
  const step1 = canAdvanceFromBorrowStep(1, data);
  const step2 = step1 && canAdvanceFromBorrowStep(2, data);
  const step3 = step2 && canAdvanceFromBorrowStep(3, data);

  return {
    1: step1,
    2: step2,
    3: step3,
    4: false,
  };
}

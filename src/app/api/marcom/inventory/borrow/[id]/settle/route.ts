import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveInventoryAuth } from "@/lib/server/inventoryAuth";
import { hasPermission } from "@/lib/marcom/guards";
import type { SettlementAction } from "@/types";

export type { SettlementAction };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { role, userName, isAuthenticated } = await resolveInventoryAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.borrowRecord.findUnique({
    where: { id },
    include: {
      items: {
        include: { inventoryItem: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    action: requestedAction,
    settlementType,
    settledAmount,
    settlementNotes,
    settlementProofUrls,
    rejectionReason,
  } = body ?? {};

  const action: SettlementAction =
    requestedAction ||
    (hasPermission(role, "PROCESS_RETURN") ? "DIRECT_RESOLVE" : "DIRECT_RESOLVE");

  if (!["SUBMIT", "CONFIRM", "REJECT", "DIRECT_RESOLVE"].includes(action)) {
    return NextResponse.json({ error: "Aksi pelunasan tidak valid." }, { status: 400 });
  }

  // --- 1. ACTION: SUBMIT (Staff Asynchronous Self-Service Submission) ---
  if (action === "SUBMIT") {
    const isBorrower = userName.trim().toLowerCase() === existing.borrowerName.trim().toLowerCase();
    const hasReturnPerm = hasPermission(role, "PROCESS_RETURN");

    if (!isBorrower && !hasReturnPerm) {
      return NextResponse.json(
        { error: "Hanya peminjam yang bersangkutan atau petugas berwenang yang dapat mengajukan bukti pelunasan." },
        { status: 403 }
      );
    }

    if (existing.compensationStatus !== "PENDING_SETTLEMENT") {
      return NextResponse.json(
        { error: "Peminjaman ini tidak dalam status menunggu pelunasan (PENDING_SETTLEMENT)." },
        { status: 400 }
      );
    }

    if (settlementType === "ITEM_REPLACEMENT") {
      return NextResponse.json(
        { error: "Penggantian unit fisik wajib diserahkan dan diverifikasi langsung oleh petugas gudang" },
        { status: 403 }
      );
    }

    if (settlementType !== "CASH_TRANSFER") {
      return NextResponse.json(
        { error: "Metode pelunasan pengajuan staff wajib CASH_TRANSFER." },
        { status: 400 }
      );
    }

    if (typeof settlementNotes !== "string" || !settlementNotes.trim()) {
      return NextResponse.json(
        { error: "Catatan pelunasan ganti rugi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanProofUrls = Array.isArray(settlementProofUrls)
      ? settlementProofUrls
          .filter((p: unknown) => typeof p === "string" && (p as string).trim() !== "")
          .map((p: string) => (p as string).trim())
      : [];

    if (cleanProofUrls.length === 0) {
      return NextResponse.json(
        { error: "Bukti transfer wajib diunggah minimal 1 berkas." },
        { status: 422 }
      );
    }

    const settledAmountNum =
      typeof settledAmount === "number" && !Number.isNaN(settledAmount)
        ? Math.max(0, settledAmount)
        : (existing.compensationAmount || 0);

    try {
      const updated = await prisma.borrowRecord.update({
        where: { id },
        data: {
          compensationStatus: "PENDING_VERIFICATION",
          settlementType: "CASH_TRANSFER",
          settledAmount: settledAmountNum,
          settlementNotes: settlementNotes.trim(),
          settlementProofUrls: cleanProofUrls,
          settledBy: userName,
        },
        include: {
          event: { select: { id: true, name: true } },
          items: { include: { inventoryItem: true } },
        },
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error("[COMPENSATION SUBMIT ERROR]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal server error" },
        { status: 500 }
      );
    }
  }

  // --- 2. ACTION: CONFIRM (Warehouse / Admin Verification Approval) ---
  if (action === "CONFIRM") {
    if (!hasPermission(role, "PROCESS_RETURN")) {
      return NextResponse.json(
        { error: "Hanya tim gudang (Warehouse) dan Admin yang berwenang memverifikasi pelunasan." },
        { status: 403 }
      );
    }

    if (existing.compensationStatus !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        { error: "Peminjaman ini tidak dalam status menunggu verifikasi (PENDING_VERIFICATION)." },
        { status: 400 }
      );
    }

    try {
      const updated = await prisma.borrowRecord.update({
        where: { id },
        data: {
          compensationStatus: "RESOLVED",
          settledAt: new Date(),
          settledBy: userName,
        },
        include: {
          event: { select: { id: true, name: true } },
          items: { include: { inventoryItem: true } },
        },
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error("[COMPENSATION CONFIRM ERROR]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal server error" },
        { status: 500 }
      );
    }
  }

  // --- 3. ACTION: REJECT (Warehouse / Admin Verification Rejection) ---
  if (action === "REJECT") {
    if (!hasPermission(role, "PROCESS_RETURN")) {
      return NextResponse.json(
        { error: "Hanya tim gudang (Warehouse) dan Admin yang berwenang menolak bukti pelunasan." },
        { status: 403 }
      );
    }

    if (existing.compensationStatus !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        { error: "Peminjaman ini tidak dalam status menunggu verifikasi (PENDING_VERIFICATION)." },
        { status: 400 }
      );
    }

    if (typeof rejectionReason !== "string" || !rejectionReason.trim()) {
      return NextResponse.json(
        { error: "Alasan penolakan bukti pelunasan wajib diisi." },
        { status: 400 }
      );
    }

    const rejectionLog = `\n\n[DITOLAK ${userName} - ${new Date().toLocaleDateString("id-ID")}]: ${rejectionReason.trim()}`;
    const updatedNotes = ((existing.settlementNotes || "") + rejectionLog).trim();

    try {
      const updated = await prisma.borrowRecord.update({
        where: { id },
        data: {
          compensationStatus: "PENDING_SETTLEMENT",
          settlementNotes: updatedNotes,
        },
        include: {
          event: { select: { id: true, name: true } },
          items: { include: { inventoryItem: true } },
        },
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error("[COMPENSATION REJECT ERROR]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal server error" },
        { status: 500 }
      );
    }
  }

  // --- 4. ACTION: DIRECT_RESOLVE (Existing Fast-Path for Warehouse / Admin) ---
  if (!hasPermission(role, "PROCESS_RETURN")) {
    return NextResponse.json(
      { error: "Hanya tim gudang (Warehouse) dan Admin yang berwenang memproses pelunasan ganti rugi." },
      { status: 403 }
    );
  }

  if (existing.compensationStatus !== "PENDING_SETTLEMENT") {
    return NextResponse.json(
      { error: "Peminjaman ini tidak memiliki kewajiban ganti rugi yang pending." },
      { status: 400 }
    );
  }

  if (settlementType !== "CASH_TRANSFER" && settlementType !== "ITEM_REPLACEMENT") {
    return NextResponse.json(
      { error: "Metode pelunasan wajib CASH_TRANSFER atau ITEM_REPLACEMENT." },
      { status: 400 }
    );
  }

  if (typeof settlementNotes !== "string" || !settlementNotes.trim()) {
    return NextResponse.json(
      { error: "Catatan pelunasan ganti rugi wajib diisi." },
      { status: 400 }
    );
  }

  const cleanProofUrls = Array.isArray(settlementProofUrls)
    ? settlementProofUrls
        .filter((p: unknown) => typeof p === "string" && (p as string).trim() !== "")
        .map((p: string) => (p as string).trim())
    : [];

  if (cleanProofUrls.length === 0) {
    return NextResponse.json(
      { error: "Bukti pembayaran / serah terima barang wajib diunggah minimal 1 berkas." },
      { status: 422 }
    );
  }

  const settledAmountNum =
    typeof settledAmount === "number" && !Number.isNaN(settledAmount)
      ? Math.max(0, settledAmount)
      : (existing.compensationAmount || 0);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update BorrowRecord state
      const record = await tx.borrowRecord.update({
        where: { id },
        data: {
          compensationStatus: "RESOLVED",
          settlementType,
          settledAmount: settlementType === "CASH_TRANSFER" ? settledAmountNum : 0,
          settledAt: new Date(),
          settledBy: userName,
          settlementNotes: settlementNotes.trim(),
          settlementProofUrls: cleanProofUrls,
        },
        include: {
          event: { select: { id: true, name: true } },
          items: { include: { inventoryItem: true } },
        },
      });

      // 2. If ITEM_REPLACEMENT, atomically restore stock on master inventory
      if (settlementType === "ITEM_REPLACEMENT") {
        for (const bi of existing.items) {
          const afkirUnits = (bi.majorDamageUnits || 0) + (bi.lostUnits || 0);
          if (afkirUnits > 0 && bi.inventoryItemId) {
            await tx.inventoryItem.update({
              where: { id: bi.inventoryItemId },
              data: {
                totalUnits: { increment: afkirUnits },
                availableUnits: { increment: afkirUnits },
              },
            });
          }
        }
      }

      return record;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[COMPENSATION SETTLE ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

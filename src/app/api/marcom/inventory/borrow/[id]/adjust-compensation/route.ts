import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveInventoryAuth } from "@/lib/server/inventoryAuth";
import { hasPermission } from "@/lib/marcom/guards";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { role, userName, isAuthenticated } = await resolveInventoryAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(role, "PROCESS_RETURN")) {
    return NextResponse.json(
      { error: "Hanya tim gudang (Warehouse) dan Admin yang berwenang menyesuaikan nilai ganti rugi." },
      { status: 403 }
    );
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

  if (existing.compensationStatus !== "PENDING_SETTLEMENT") {
    return NextResponse.json(
      { error: "Penyesuaian ganti rugi hanya dapat dilakukan saat status PENDING_SETTLEMENT." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { newAmount, reason } = body ?? {};

  if (
    typeof newAmount !== "number" ||
    Number.isNaN(newAmount) ||
    !Number.isFinite(newAmount) ||
    newAmount < 0
  ) {
    return NextResponse.json(
      { error: "Nominal baru harus berupa angka positif atau nol (0)." },
      { status: 400 }
    );
  }

  if (typeof reason !== "string" || reason.trim().length < 5) {
    return NextResponse.json(
      { error: "Alasan penyesuaian wajib diisi (minimal 5 karakter)." },
      { status: 400 }
    );
  }

  if (newAmount === existing.compensationAmount) {
    return NextResponse.json(
      { error: "Nominal baru harus berbeda dari nominal saat ini." },
      { status: 400 }
    );
  }

  const auditLog = `\n\n[PENYESUAIAN Rp ${(existing.compensationAmount || 0).toLocaleString("id-ID")} -> Rp ${newAmount.toLocaleString("id-ID")} oleh ${userName} (${role}) - ${new Date().toLocaleDateString("id-ID")}]: ${reason.trim()}`;
  const updatedNotes = ((existing.compensationNotes || "") + auditLog).trim();

  try {
    const isWaiver = newAmount === 0;
    const updateData = isWaiver
      ? {
          compensationAmount: 0,
          compensationNotes: updatedNotes,
          compensationStatus: "RESOLVED" as const,
          settledAt: new Date(),
          settledBy: userName,
          settlementNotes: "Ganti rugi dibebaskan/dihapus: " + reason.trim(),
        }
      : {
          compensationAmount: newAmount,
          compensationNotes: updatedNotes,
        };

    const updated = await prisma.borrowRecord.update({
      where: { id },
      data: updateData,
      include: {
        event: { select: { id: true, name: true } },
        items: { include: { inventoryItem: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADJUST COMPENSATION ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

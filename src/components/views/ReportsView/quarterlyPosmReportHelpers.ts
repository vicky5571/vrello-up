import type { PosmQuarterlyMatrix, PosmBranchBreakdown } from "@/types";

/**
 * Formats a clean CSV string of the quarterly POSM report for export.
 */
export function formatQuarterlyPosmCsv(
  quarter: string,
  branchBreakdown: PosmBranchBreakdown[],
  matrix: PosmQuarterlyMatrix
): string {
  const lines: string[] = [];

  // Title
  lines.push(`LAPORAN REKAPITULASI POSM KUARTAL ${quarter}`);
  lines.push(`Wilayah Operasional: Regional Jawa Tengah`);
  lines.push(`Tanggal Dibuat: ${new Date().toLocaleDateString("id-ID")}`);
  lines.push("");

  // Section 1: Komparasi Performa Antar-Cabang
  lines.push("1. KOMPARASI PERFORMA CABANG");
  lines.push("Cabang,Realisasi Outlet,Target Kuota,% Capaian,Integritas GPS (<=100m),Tema Terbanyak");

  for (const b of branchBreakdown) {
    lines.push(
      `"${b.branchName}",${b.totalPlacements},${b.targetPlacements},${b.percentage}%,${b.gpsIntegrityRate}%,${b.topTheme}`
    );
  }
  lines.push("");

  // Section 2: Matriks 2D Tema Kampanye × Material
  lines.push("2. MATRIKS TEMA KAMPANYE × JENIS MATERIAL");
  const materialHeaders = matrix.materials.map((m) => `"${m.name} (Aktual/Target)"`).join(",");
  lines.push(`Tema Kampanye,${materialHeaders},Total Realisasi,Total Target,% Capaian`);

  for (const row of matrix.rows) {
    const cellsData = matrix.materials
      .map((m) => {
        const cell = row.cells[m.id];
        return `"${cell?.actual || 0} / ${cell?.target || 0}"`;
      })
      .join(",");

    lines.push(
      `"${row.theme}",${cellsData},${row.totalActual},${row.totalTarget},${row.totalPercentage}%`
    );
  }

  // Footer Grand Totals
  const colTotals = matrix.materials
    .map((m) => {
      const col = matrix.columnTotals[m.id];
      return `"${col?.actual || 0} / ${col?.target || 0}"`;
    })
    .join(",");

  lines.push(
    `"TOTAL REALISASI",${colTotals},${matrix.grandTotalActual},${matrix.grandTotalTarget},${matrix.grandTotalPercentage}%`
  );

  return lines.join("\n");
}

/**
 * Triggers a browser download of a CSV file.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

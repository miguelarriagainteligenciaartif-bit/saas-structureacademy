import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  addBrandedHeader,
  addBrandedFooter,
  addSectionTitle,
  getBrandedTableStyles,
  sanitizePdfText,
  sanitizeTableData,
  sanitizeHead,
  brandColors,
} from "./pdfBranding";
import type { FundingAccount, FundingPayout } from "@/components/funding/FundingAccountManager";
import type { CompanySummary } from "@/components/funding/CompanySummaryManager";

interface GenerateArgs {
  summaries: CompanySummary[];
  accounts: FundingAccount[];
  payouts: FundingPayout[];
  userEmail?: string | null;
}

const fmtUsd = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return d;
  }
};

export async function generateFundingReportPdf({
  summaries,
  accounts,
  payouts,
  userEmail,
}: GenerateArgs): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const generatedAt = new Date().toLocaleString("es-ES", {
    timeZone: "America/New_York",
    dateStyle: "long",
    timeStyle: "short",
  });

  await addBrandedHeader(
    doc,
    "Informe de Cuentas Fondeadas",
    userEmail ? `Trader: ${userEmail}` : "Resumen ejecutivo de evaluaciones, cuentas live y P&L",
    `Generado el ${generatedAt} (NY)`
  );

  // ============ KPIs ============
  const liveAccounts = accounts.filter(a => a.status === "live");
  const inProgress = accounts.filter(a => a.status === "in_progress").length;
  const detailedEvals = accounts.filter(a => a.account_type === "evaluation");
  const totalEvalsBought = summaries.reduce((s, x) => s + (x.total_evaluations || 0), 0);
  const totalEvalsPassed = summaries.reduce((s, x) => s + (x.total_passed || 0), 0);
  const totalEvaluations = totalEvalsBought + detailedEvals.length;
  const totalPassed =
    totalEvalsPassed +
    detailedEvals.filter(a => a.status === "passed" || a.status === "live").length;
  const fundingRatio = totalEvaluations > 0 ? (totalPassed / totalEvaluations) * 100 : 0;

  const totalSummaryCost = summaries.reduce((s, x) => s + Number(x.total_cost || 0), 0);
  const detailedCosts = accounts.reduce((s, a) => s + Number(a.cost ?? 0), 0);
  const totalCosts = totalSummaryCost + detailedCosts;
  const totalPayouts = payouts.reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const netProfit = totalPayouts - totalCosts;
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

  let y = 65;
  y = addSectionTitle(doc, "Indicadores clave", y);

  const kpiRows: [string, string][] = [
    ["Evaluaciones totales", `${totalEvaluations} (${totalPassed} aprobadas - ${inProgress} en progreso)`],
    ["Funding Ratio", `${fundingRatio.toFixed(1)} %`],
    ["Cuentas live activas", `${liveAccounts.length}`],
    ["Gastos totales (evaluaciones)", fmtUsd(totalCosts)],
    ["Ganancias totales (payouts)", fmtUsd(totalPayouts)],
    ["Beneficio neto", `${fmtUsd(netProfit)}  (ROI ${roi.toFixed(1)} %)`],
  ];

  autoTable(doc, {
    startY: y,
    head: [sanitizeHead(["KPI", "Valor"])],
    body: sanitizeTableData(kpiRows.map(([k, v]) => [k, v])),
    ...getBrandedTableStyles(),
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "right" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ============ Resumen por empresa ============
  if (summaries.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, "Resumen agregado por empresa de fondeo", y);

    const liveByCompany: Record<string, number> = {};
    liveAccounts.forEach(a => {
      liveByCompany[a.funding_company] = (liveByCompany[a.funding_company] || 0) + 1;
    });

    const summaryRows = summaries.map(s => {
      const cost = Number(s.total_cost || 0);
      const companyPayouts = payouts
        .filter(p => {
          const acc = accounts.find(a => a.id === p.funding_account_id);
          return acc?.funding_company === s.funding_company;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const net = companyPayouts - cost;
      const ratio = s.total_evaluations > 0 ? (s.total_passed / s.total_evaluations) * 100 : 0;
      return [
        s.funding_company,
        String(s.total_evaluations),
        `${s.total_passed} (${ratio.toFixed(0)}%)`,
        String(s.total_failed),
        String(liveByCompany[s.funding_company] || 0),
        fmtUsd(cost),
        fmtUsd(companyPayouts),
        fmtUsd(net),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [sanitizeHead(["Empresa", "Evals", "Aprobadas", "Falladas", "Live", "Coste", "Payouts", "Neto"])],
      body: sanitizeTableData(summaryRows),
      ...getBrandedTableStyles(),
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right", fontStyle: "bold" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ============ Cuentas live detalladas ============
  if (liveAccounts.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, "Cuentas live activas (detalle)", y);

    const liveRows = liveAccounts.map(a => {
      const accPayouts = payouts
        .filter(p => p.funding_account_id === a.id)
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      return [
        a.funding_company,
        a.account_label || "-",
        a.account_size ? fmtUsd(Number(a.account_size)) : "-",
        fmtDate(a.funded_date),
        fmtUsd(accPayouts),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [sanitizeHead(["Empresa", "Cuenta", "Tamano", "Fondeada", "Payouts"])],
      body: sanitizeTableData(liveRows),
      ...getBrandedTableStyles(),
      columnStyles: {
        2: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ============ Historial de payouts ============
  if (payouts.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, "Historial de payouts", y);

    const sorted = [...payouts].sort((a, b) =>
      (b.payout_date || "").localeCompare(a.payout_date || "")
    );

    const payoutRows = sorted.map(p => {
      const acc = accounts.find(a => a.id === p.funding_account_id);
      return [
        fmtDate(p.payout_date),
        acc?.funding_company || "-",
        acc?.account_label || "-",
        fmtUsd(Number(p.amount || 0)),
        p.notes || "",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [sanitizeHead(["Fecha", "Empresa", "Cuenta", "Importe", "Notas"])],
      body: sanitizeTableData(payoutRows),
      ...getBrandedTableStyles(),
      columnStyles: {
        3: { halign: "right", fontStyle: "bold" },
        4: { cellWidth: 60 },
      },
    });
  }

  addBrandedFooter(doc);

  const filename = `informe-cuentas-fondeadas-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
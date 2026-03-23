import jsPDF from "jspdf";
import { brandColors, addSectionTitle, sanitizePdfText } from "@/utils/pdfBranding";

/**
 * Renders AI analysis text into the PDF with proper formatting.
 * Parses markdown-style headers (##) and renders them as section titles.
 */
export const addAIAnalysisSection = (
  doc: jsPDF,
  analysisText: string,
  startY: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 14;
  const maxWidth = pageWidth - marginLeft - marginRight;
  const lineHeight = 5;
  const footerHeight = 22;

  let y = startY;

  // Main section header
  y = addSectionTitle(doc, "Analisis con Inteligencia Artificial", y);
  y += 2;

  // AI badge
  doc.setFillColor(...brandColors.quantumBlue);
  doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Analisis generado por IA - Quantum Trading Analyst", pageWidth / 2, y + 7, { align: "center" });
  y += 18;

  const lines = analysisText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 3;
      continue;
    }

    // Check for section headers (## Title)
    if (trimmed.startsWith("## ")) {
      y += 4;
      // Check page break
      if (y + 20 > pageHeight - footerHeight) {
        doc.addPage();
        y = 20;
      }
      const headerText = trimmed.replace("## ", "");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.quantumBlue);
      doc.text(sanitizePdfText(headerText), marginLeft, y);
      y += 7;
      continue;
    }

    // Bold line detection (starts with **)
    const isBold = trimmed.startsWith("**") && trimmed.endsWith("**");
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ");

    doc.setFontSize(8);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(40, 40, 40);

    const textToRender = isBold
      ? trimmed.replace(/\*\*/g, "")
      : isBullet
      ? trimmed
      : trimmed;

    const splitLines = doc.splitTextToSize(sanitizePdfText(textToRender), maxWidth);

    for (const splitLine of splitLines) {
      if (y + lineHeight > pageHeight - footerHeight) {
        doc.addPage();
        y = 20;
      }
      doc.text(splitLine, marginLeft, y);
      y += lineHeight;
    }
  }

  return y;
};

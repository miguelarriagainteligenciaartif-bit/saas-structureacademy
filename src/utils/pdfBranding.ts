import jsPDF from "jspdf";
import quantumLogo from "@/assets/quantum-logo.png";

/**
 * Sanitize text for jsPDF rendering.
 * jsPDF default fonts (Helvetica) don't support Unicode accents or special chars.
 * This strips accents and replaces special symbols with ASCII equivalents.
 */
export const sanitizePdfText = (text: string): string => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/✓/g, "[SI]")
    .replace(/✗/g, "[NO]")
    .replace(/Δ/g, "Dif")
    .replace(/·/g, "-")
    .replace(/×/g, "x")
    .replace(/−/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/•/g, "-");
};

// Quantum Era Brand Colors
export const brandColors = {
  quantumBlue: [30, 144, 255] as [number, number, number], // #1E90FF
  absoluteBlack: [0, 0, 0] as [number, number, number], // #000000
  graphiteGray: [27, 27, 31] as [number, number, number], // #1B1B1F
  success: [34, 197, 94] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  textLight: [248, 250, 252] as [number, number, number], // Light text for dark bg
  textMuted: [148, 163, 184] as [number, number, number], // Muted text
};

// Load logo as base64 for PDF embedding
export const loadLogoBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Could not get canvas context"));
      }
    };
    img.onerror = () => reject(new Error("Could not load logo"));
    img.src = quantumLogo;
  });
};

// Add branded header to PDF
export const addBrandedHeader = async (
  doc: jsPDF,
  title: string,
  subtitle?: string,
  periodText?: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Dark header background
  doc.setFillColor(...brandColors.graphiteGray);
  doc.rect(0, 0, pageWidth, 55, "F");
  
  // Accent line at bottom of header
  doc.setFillColor(...brandColors.quantumBlue);
  doc.rect(0, 55, pageWidth, 2, "F");
  
  // Try to add logo
  try {
    const logoBase64 = await loadLogoBase64();
    doc.addImage(logoBase64, "PNG", pageWidth / 2 - 12, 6, 24, 24);
  } catch (e) {
    // Continue without logo if loading fails
    console.warn("Could not load logo for PDF:", e);
  }
  
  // Title
  doc.setTextColor(...brandColors.textLight);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 38, { align: "center" });
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(...brandColors.quantumBlue);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageWidth / 2, 45, { align: "center" });
  }
  
  // Period text
  if (periodText) {
    doc.setFontSize(8);
    doc.setTextColor(...brandColors.textMuted);
    doc.text(periodText, pageWidth / 2, 52, { align: "center" });
  }
};

// Add branded footer to all pages
export const addBrandedFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer bar
    doc.setFillColor(...brandColors.graphiteGray);
    doc.rect(0, pageHeight - 18, pageWidth, 18, "F");
    
    // Accent line above footer
    doc.setFillColor(...brandColors.quantumBlue);
    doc.rect(0, pageHeight - 18, pageWidth, 0.5, "F");
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(...brandColors.textMuted);
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      14,
      pageHeight - 8
    );
    
    doc.setTextColor(...brandColors.quantumBlue);
    doc.text(
      "QUANTUM TRADING TRACKER",
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
    
    doc.setTextColor(...brandColors.textMuted);
    doc.text(
      "La senal en medio del ruido",
      pageWidth - 14,
      pageHeight - 8,
      { align: "right" }
    );
  }
};

// Get table styles for branded appearance
export const getBrandedTableStyles = () => ({
  headStyles: {
    fillColor: brandColors.quantumBlue,
    textColor: [255, 255, 255] as [number, number, number],
    fontSize: 9,
    fontStyle: "bold" as const,
  },
  bodyStyles: {
    fontSize: 8,
    textColor: [30, 30, 30] as [number, number, number],
  },
  alternateRowStyles: {
    fillColor: [245, 247, 250] as [number, number, number],
  },
  styles: {
    cellPadding: 3,
    lineColor: [200, 200, 200] as [number, number, number],
    lineWidth: 0.1,
  },
});

// Section title styling
export const addSectionTitle = (doc: jsPDF, title: string, yPos: number) => {
  doc.setFillColor(...brandColors.quantumBlue);
  doc.rect(14, yPos - 3, 3, 12, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, yPos + 5);
  return yPos + 12;
};

// Derives the entry pattern from a trade.
// Rule: if fvg_count === 1 → "FVG único" (priority); otherwise use entry_subtype (M1/M3)
// or continuation_subtype (Continuación) mapped to the equivalent pattern.
export const ENTRY_PATTERNS = ["Envolvente + Bloque", "Envolvente + FVG", "FVG único"] as const;
export type EntryPattern = typeof ENTRY_PATTERNS[number];

export function getEntryPattern(t: {
  entry_model: string | null;
  fvg_count: number | null;
  entry_subtype: string | null;
  continuation_subtype: string | null;
}): EntryPattern | null {
  if (t.entry_model === "M1" || t.entry_model === "M3") {
    // Direct FVG entry (1st FVG or retest of 2nd FVG) — no engulfing pattern
    if (t.entry_subtype === "FVG") return "FVG único";
    if (t.entry_subtype === "Envolvente + Bloque") return "Envolvente + Bloque";
    if (t.entry_subtype === "Envolvente + FVG") return "Envolvente + FVG";
    // Legacy: trades with no explicit subtype but a single FVG → assume direct FVG entry
    if (!t.entry_subtype && t.fvg_count === 1) return "FVG único";
  }
  if (t.entry_model === "Continuación") {
    if (t.continuation_subtype === "Bloque") return "Envolvente + Bloque";
    if (t.continuation_subtype === "FVG") return "Envolvente + FVG";
  }
  return null;
}

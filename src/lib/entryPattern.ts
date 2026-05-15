// Derives the entry pattern from a trade.
// Rule: the subtype (entry_subtype for M1/M3, continuation_subtype for Continuación)
// determines the pattern. A trade with fvg_count === 1 and no subtype falls back to "por FVG".
// This way, a 2-FVG trade entered as Envolvente+Bloque stays under "Envolvente + Bloque".
export const ENTRY_PATTERNS = ["Envolvente + Bloque", "Envolvente + FVG", "FVG"] as const;
export type EntryPattern = typeof ENTRY_PATTERNS[number];

export function getEntryPattern(t: {
  entry_model: string | null;
  fvg_count: number | null;
  entry_subtype: string | null;
  continuation_subtype: string | null;
}): EntryPattern | null {
  if (t.entry_model === "M1" || t.entry_model === "M3") {
    if (t.entry_subtype === "Envolvente + Bloque") return "Envolvente + Bloque";
    if (t.entry_subtype === "Envolvente + FVG") return "Envolvente + FVG";
    if (t.entry_subtype === "FVG") return "FVG";
  }
  if (t.entry_model === "Continuación") {
    if (t.continuation_subtype === "Bloque") return "Envolvente + Bloque";
    if (t.continuation_subtype === "FVG") return "FVG";
  }
  // Fallback: trades with a single FVG and no explicit subtype
  if (t.fvg_count === 1) return "FVG";
  return null;
}

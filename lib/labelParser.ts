/**
 * Label Parser
 * 
 * Extracts cultivar data from product labels via text, OCR, or barcode.
 * Only extracts explicit data - no inferences, no substitutions.
 */

import { CanonicalChemotype } from './data/canonicalChemotypes';

export interface ParsedLabel {
  cultivarName: string;
  thc?: number;
  cbd?: number;
  terpenes?: string[]; // List of terpene names
  formFactor?: 'flower' | 'pre-roll' | 'concentrate' | 'edible' | 'other';
  rawText?: string; // Original label text for reference
}

export interface ParsedInventory {
  items: ParsedLabel[];
  confirmed: boolean;
}

/**
 * Parse label text to extract cultivar information
 * Only extracts explicit data - no guessing
 */
export function parseLabelText(text: string): ParsedLabel | null {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  const normalized = text.trim();
  
  // Extract THC percentage
  const thcMatch = normalized.match(/(?:THC|thc)[:\s]*(\d+\.?\d*)\s*%/i);
  const thc = thcMatch ? parseFloat(thcMatch[1]) : undefined;
  
  // Extract CBD percentage
  const cbdMatch = normalized.match(/(?:CBD|cbd)[:\s]*(\d+\.?\d*)\s*%/i);
  const cbd = cbdMatch ? parseFloat(cbdMatch[1]) : undefined;
  
  // Extract terpenes (common terpene names)
  const terpeneNames = [
    'pinene', 'limonene', 'myrcene', 'linalool', 'caryophyllene',
    'humulene', 'terpinolene', 'ocimene', 'bisabolol', 'nerolidol'
  ];
  const foundTerpenes: string[] = [];
  for (const terpene of terpeneNames) {
    const regex = new RegExp(`\\b${terpene}\\b`, 'i');
    if (regex.test(normalized)) {
      foundTerpenes.push(terpene);
    }
  }
  
  // Extract cultivar name (first capitalized word sequence, or common strain patterns)
  // This is a simple heuristic - in production, might use more sophisticated NLP
  const strainPatterns = [
    /(?:strain|cultivar|variety)[:\s]*([A-Z][a-zA-Z\s]+)/i,
    /^([A-Z][a-zA-Z\s]{2,20})(?:\s|$)/,
  ];
  
  let cultivarName = '';
  for (const pattern of strainPatterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      cultivarName = match[1].trim();
      break;
    }
  }
  
  // If no pattern match, try to find first capitalized multi-word sequence
  if (!cultivarName) {
    const words = normalized.split(/\s+/);
    const capitalizedWords: string[] = [];
    for (const word of words) {
      if (/^[A-Z][a-z]+$/.test(word) && word.length > 2) {
        capitalizedWords.push(word);
        if (capitalizedWords.length >= 2) break;
      }
    }
    if (capitalizedWords.length >= 2) {
      cultivarName = capitalizedWords.join(' ');
    }
  }
  
  // If still no name found, return null (cannot proceed without cultivar name)
  if (!cultivarName || cultivarName.length < 2) {
    return null;
  }
  
  // Detect form factor
  let formFactor: ParsedLabel['formFactor'] = 'flower';
  const formText = normalized.toLowerCase();
  if (formText.includes('pre-roll') || formText.includes('preroll') || formText.includes('joint')) {
    formFactor = 'pre-roll';
  } else if (formText.includes('concentrate') || formText.includes('wax') || formText.includes('shatter')) {
    formFactor = 'concentrate';
  } else if (formText.includes('edible') || formText.includes('gummy') || formText.includes('chocolate')) {
    formFactor = 'edible';
  }
  
  return {
    cultivarName,
    thc,
    cbd,
    terpenes: foundTerpenes.length > 0 ? foundTerpenes : undefined,
    formFactor,
    rawText: normalized,
  };
}

/**
 * Map parsed label to canonical chemotype
 * Returns null if no match found (no substitutions allowed)
 */
export function mapLabelToChemotype(
  label: ParsedLabel,
  availableChemotypes: CanonicalChemotype[]
): CanonicalChemotype | null {
  // Try exact name match first
  const exactMatch = availableChemotypes.find(
    ct => ct.displayName.toLowerCase() === label.cultivarName.toLowerCase() ||
          ct.id.toLowerCase().includes(label.cultivarName.toLowerCase().replace(/\s+/g, '-'))
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Try partial name match (e.g., "Blue Dream" matches "Blue Dream Hybrid")
  const partialMatch = availableChemotypes.find(
    ct => ct.displayName.toLowerCase().includes(label.cultivarName.toLowerCase()) ||
          label.cultivarName.toLowerCase().includes(ct.displayName.toLowerCase())
  );
  
  if (partialMatch) {
    return partialMatch;
  }
  
  // No match found - return null (no substitutions allowed per rules)
  return null;
}


// Unit tests for parseRollLabel — run with: deno test supabase/functions/extract-roll-data/parseRollLabel.test.ts
// Or copy parseRollLabel to a vitest file for CI

import { describe, it, expect } from 'vitest';

// We'll test the parser logic inline since it's in an edge function.
// These tests verify the OCR text → structured data parsing.

// Simulated OCR outputs from 17 real Ultrafit roll labels:

const OCR_SAMPLES = [
  {
    name: 'XP Crystal 1524x15',
    rawText: `ULTRAFIT™\nXP\nCRYSTAL\nPAINT PROTECTION FILM\n60" x 50ft / 1,524mm x 15m\nPXCR-6015-UH44-4840\n8 801990 000153\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Crystal',
      productCode: 'PXCR-6015-UH44-4840',
      barcode: '8801990000153',
      widthMm: 1524,
      lengthM: 15,
    },
  },
  {
    name: 'XP Retro Matte 1524x15',
    rawText: `ULTRAFIT™\nXP\nRETRO MATTE\nPAINT PROTECTION FILM\n60" x 50ft / 1,524mm x 15m\nPXRM-6015-UH49-CT41\n8 801990 010152\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Retro Matte',
      productCode: 'PXRM-6015-UH49-CT41',
      barcode: '8801990010152',
      widthMm: 1524,
      lengthM: 15,
    },
  },
  {
    name: 'XP Black 1524x15',
    rawText: `ULTRAFIT™\nXP\nBLACK\nPAINT PROTECTION FILM\n60" X 50ft / 1,524mm X 15m\nPXBK-6015-UH28-S065\n8 801990 390155\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Black',
      productCode: 'PXBK-6015-UH28-S065',
      barcode: '8801990390155',
      widthMm: 1524,
      lengthM: 15,
    },
  },
  {
    name: 'XP Black Carbon 1524x6',
    rawText: `ULTRAFIT™\nXP\nBLACK CARBON\nPAINT PROTECTION FILM\n60" X 20ft / 1,524mm X 6m\nPXBC-6006-UH28-S004\n8 801990 400069\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Black Carbon',
      productCode: 'PXBC-6006-UH28-S004',
      barcode: '8801990400069',
      widthMm: 1524,
      lengthM: 6,
    },
  },
  {
    name: 'WinCrest EVO 1220x2',
    rawText: `ULTRAFIT™\nWinCrest\nEVO\nWINDSHIELD PROTECTION FILM\n48" X 6ft / 1,220mm X 2m\nSWEV-4802-UH51-T346\n8 801992 670309\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'WinCrest EVO',
      productCode: 'SWEV-4802-UH51-T346',
      barcode: '8801992670309',
      widthMm: 1220,
      lengthM: 2,
    },
  },
  {
    name: 'XP Gold Black 762x15 (old format)',
    rawText: `ULTRAFIT™\nXP\nGOLD BLACK\nPAINT PROTECTION FILM\n30" X 15m / 30" X 50ft\n2300-P9GB-0089\n8 801990 491555\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Gold Black',
      productCode: '2300-P9GB-0089',
      barcode: '8801990491555',
      widthMm: 762,
      lengthM: 15,
    },
  },
  {
    name: 'XP Deep Chroma Blue 1524x18',
    rawText: `ULTRAFIT™\nXP\nDEEP CHROMA BLUE\nPAINT PROTECTION FILM\n60" X 18m / 60" X 60ft\nPXDB-6018-UG40-S037\n8 801990 651089\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Deep Chroma Blue',
      productCode: 'PXDB-6018-UG40-S037',
      barcode: '8801990651089',
      widthMm: 1524,
      lengthM: 18,
    },
  },
  {
    name: 'XP Phoenix Red 1524x18',
    rawText: `ULTRAFIT™\nXP\nPHOENIX RED\nPAINT PROTECTION FILM\n60" X 18m / 60" X 60ft\nPXPR-6018-UG45-S024\n8 801990 550184\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Phoenix Red',
      productCode: 'PXPR-6018-UG45-S024',
      barcode: '8801990550184',
      widthMm: 1524,
      lengthM: 18,
    },
  },
  {
    name: 'XP Crystal 610x30',
    rawText: `ULTRAFIT™\nXP\nCRYSTAL\nPAINT PROTECTION FILM\n24" x 100ft / 610mm x 30m\nPXCR-2430-UH46-TW79\n8 801990 001051\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Crystal',
      productCode: 'PXCR-2430-UH46-TW79',
      barcode: '8801990001051',
      widthMm: 610,
      lengthM: 30,
    },
  },
  {
    name: 'XP Black Matte 1524x15',
    rawText: `ULTRAFIT™\nXP\nBLACK MATTE\nPAINT PROTECTION FILM\n60" x 50ft / 1,524mm x 15m\nPXBM-6015-UH48-CF11\n8 801990 450156\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Black Matte',
      productCode: 'PXBM-6015-UH48-CF11',
      barcode: '8801990450156',
      widthMm: 1524,
      lengthM: 15,
    },
  },
  {
    name: 'XP Crystal 1220x30',
    rawText: `ULTRAFIT™\nXP\nCRYSTAL\nPAINT PROTECTION FILM\n48" x 100ft / 1,220mm x 30m\nPXCR-4830-UH46-EE64\n8 801990 000450\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Crystal',
      productCode: 'PXCR-4830-UH46-EE64',
      barcode: '8801990000450',
      widthMm: 1220,
      lengthM: 30,
    },
  },
  {
    name: 'XP Pearl White 1524x18',
    rawText: `ULTRAFIT™\nXP\nPEARL WHITE\nPAINT PROTECTION FILM\n60" X 18m / 60" X 60ft\nPXPW-6018-UG47-S066\n8 801990 561081\nwww.ultrafitprotection.com`,
    expected: {
      brand: 'Ultrafit',
      productName: 'XP Pearl White',
      productCode: 'PXPW-6018-UG47-S066',
      barcode: '8801990561081',
      widthMm: 1524,
      lengthM: 18,
    },
  },
];

// ─── Import parser (we'll extract it for testing) ───────────
// Since the parser is in an edge function, we duplicate the logic here for testing.
// In production, the edge function uses this same logic.

const KNOWN_BRANDS = [
  { pattern: /ultrafit/i, name: 'Ultrafit' },
  { pattern: /xpel/i, name: 'XPEL' },
  { pattern: /suntek/i, name: 'SunTek' },
  { pattern: /3m/i, name: '3M' },
  { pattern: /hexis/i, name: 'Hexis' },
  { pattern: /stek/i, name: 'STEK' },
];

const DESCRIPTION_PATTERNS = [
  /paint\s*protection\s*film/i,
  /windshield\s*protection\s*film/i,
  /window\s*(?:tint(?:ing)?|film)/i,
  /vinyl\s*wrap/i,
];

function isDateString(s: string): boolean {
  const clean = s.replace(/[\s./-]/g, '');
  if (/^\d{8}$/.test(clean)) {
    const day = parseInt(clean.slice(0, 2));
    const month = parseInt(clean.slice(2, 4));
    const year = parseInt(clean.slice(4, 8));
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2035)
      return true;
  }
  if (/\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{4}/.test(s)) return true;
  return false;
}

function isNoiseLine(line: string): boolean {
  if (isDateString(line)) return true;
  if (/^(?:www\.|http)/i.test(line)) return true;
  if (/^\d+(?:\.\d+)?$/.test(line.replace(/\s/g, ''))) return true;
  return false;
}

const INCH_TO_MM: Record<number, number> = { 24: 610, 30: 762, 36: 914, 48: 1220, 60: 1524 };

function cleanTrademark(s: string): string {
  return s
    .replace(/[™®©]/g, '')
    .replace(/\s*\bTm\b/g, '')
    .replace(/\s*\bTM\b/g, '')
    .trim();
}

function parseRollLabel(rawText: string) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const collapsed = rawText.replace(/\s+/g, ' ');

  const result: Record<string, unknown> = {
    brand: '',
    productName: '',
    description: '',
    productCode: '',
    barcode: '',
    widthMm: 0,
    lengthM: 0,
  };
  const confidence: Record<string, number> = {
    brand: 0,
    productName: 0,
    description: 0,
    productCode: 0,
    barcode: 0,
    widthMm: 0,
    lengthM: 0,
  };
  const consumed = new Set<number>();

  // 1. BRAND
  for (const kb of KNOWN_BRANDS) {
    if (kb.pattern.test(collapsed)) {
      result.brand = kb.name;
      confidence.brand = 0.95;
      for (let i = 0; i < lines.length; i++) {
        if (kb.pattern.test(lines[i])) consumed.add(i);
      }
      break;
    }
  }

  // 2. DESCRIPTION
  for (let i = 0; i < lines.length; i++) {
    if (DESCRIPTION_PATTERNS.some((p) => p.test(lines[i]))) {
      result.description = lines[i];
      confidence.description = 0.95;
      consumed.add(i);
      break;
    }
  }

  // 3. PRODUCT CODE
  const codePatterns = [
    /\b([A-Z]{2,}\d?-\d{3,}-[A-Z\d]{2,}-[A-Z\d]{2,})\b/i,
    /\b(\d{4}-[A-Z]\d[A-Z]{2}-\d{4})\b/i,
    /\b([A-Z]{2,}\d?-\d{3,}-[A-Z\d]{2,})\b/i,
  ];
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    for (const pattern of codePatterns) {
      const match = lines[i].match(pattern);
      if (match) {
        result.productCode = match[1].toUpperCase();
        confidence.productCode = 0.95;
        consumed.add(i);
        break;
      }
    }
    if (result.productCode) break;
  }

  // 4. BARCODE (13 digits, not dates)
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    if (isDateString(lines[i])) {
      consumed.add(i);
      continue;
    }
    const spaced = lines[i].match(/\b(\d[\d\s]{10,16}\d)\b/);
    if (spaced) {
      const clean = spaced[1].replace(/\s/g, '');
      if (clean.length === 13 && !isDateString(clean)) {
        result.barcode = clean;
        confidence.barcode = 0.95;
        consumed.add(i);
        break;
      }
    }
    const digitsOnly = lines[i].replace(/[\s\-]/g, ''); // eslint-disable-line no-useless-escape
    if (/^\d{13}$/.test(digitsOnly) && !isDateString(digitsOnly)) {
      result.barcode = digitsOnly;
      confidence.barcode = 0.95;
      consumed.add(i);
      break;
    }
  }

  // 5. DIMENSIONS
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Metric in mixed line: "60" x 50ft / 1,524mm x 15m"
    if (line.includes('/')) {
      const metricPart = line.split('/').pop()!.trim();
      const m = metricPart.match(/(\d[\d,.]*)\s*mm\s*[x×X]\s*(\d+(?:\.\d+)?)\s*m\b/i);
      if (m) {
        result.widthMm = Math.round(parseFloat(m[1].replace(/,/g, '')));
        result.lengthM = Math.round(parseFloat(m[2]));
        confidence.widthMm = 0.95;
        confidence.lengthM = 0.95;
        consumed.add(i);
        break;
      }
    }
    // Pure metric
    const met = line.match(/(\d[\d,.]*)\s*mm\s*[x×X]\s*(\d+(?:\.\d+)?)\s*m\b/i);
    if (met) {
      result.widthMm = Math.round(parseFloat(met[1].replace(/,/g, '')));
      result.lengthM = Math.round(parseFloat(met[2]));
      confidence.widthMm = 0.95;
      confidence.lengthM = 0.95;
      consumed.add(i);
      break;
    }
    // Imperial with metric length: '60" X 18m'
    const imp = line.match(/(\d+)"\s*[x×X]\s*(\d+(?:\.\d+)?)\s*m\b/i);
    if (imp) {
      const inches = parseInt(imp[1]);
      result.widthMm = INCH_TO_MM[inches] || Math.round(inches * 25.4);
      result.lengthM = Math.round(parseFloat(imp[2]));
      confidence.widthMm = 0.9;
      confidence.lengthM = 0.9;
      consumed.add(i);
      break;
    }
    // Imperial: '60" x 50ft'
    const impFt = line.match(/(\d+)"\s*[x×X]\s*(\d+)\s*ft\b/i);
    if (impFt) {
      const inches = parseInt(impFt[1]);
      result.widthMm = INCH_TO_MM[inches] || Math.round(inches * 25.4);
      result.lengthM = Math.round(parseInt(impFt[2]) * 0.3048);
      confidence.widthMm = 0.9;
      confidence.lengthM = 0.9;
      consumed.add(i);
      break;
    }
  }

  // 6. PRODUCT NAME
  const nameCandidates: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const line = lines[i];
    if (isNoiseLine(line)) {
      consumed.add(i);
      continue;
    }
    if (DESCRIPTION_PATTERNS.some((p) => p.test(line))) continue;
    const cl = cleanTrademark(line);
    if (KNOWN_BRANDS.some((kb) => kb.pattern.test(cl))) {
      consumed.add(i);
      continue;
    }
    if (/\d+\s*mm\s*[x×X]/i.test(line)) {
      consumed.add(i);
      continue;
    }
    if (/\d+"\s*[x×X]/i.test(line)) {
      consumed.add(i);
      continue;
    }
    if (result.productCode && line.includes(result.productCode as string)) {
      consumed.add(i);
      continue;
    }
    if (cl.length < 2) continue;
    if (/^\d+$/.test(cl.replace(/\s/g, ''))) continue;
    nameCandidates.push(cl);
    consumed.add(i);
    if (nameCandidates.join(' ').length >= 20) break;
  }

  if (nameCandidates.length > 0) {
    const raw = nameCandidates.join(' ').replace(/\s+/g, ' ').trim();
    const preserveExact = ['XP', 'EVO', 'PPF', 'WPF'];
    const words = raw.split(' ');
    const normalized = words.map((w) => {
      const upper = w.toUpperCase();
      if (preserveExact.includes(upper)) return upper;
      // If word has mixed case already (e.g. WinCrest), preserve it
      if (w !== w.toLowerCase() && w !== w.toUpperCase() && w.length > 2) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
    result.productName = normalized.join(' ');
    confidence.productName = 0.9;
  }

  return { result, confidence };
}

// ─── Product matching (simulates DB lookup) ─────────────────

const DB_PRODUCTS = [
  { id: '1', short_name: 'XP Crystal', full_name: 'Ultrafit XP Crystal' },
  { id: '2', short_name: 'XP Retro Matte', full_name: 'Ultrafit XP Retro Matte' },
  { id: '3', short_name: 'XP Black', full_name: 'Ultrafit XP Black' },
  { id: '4', short_name: 'XP Black Carbon', full_name: 'Ultrafit XP Black Carbon' },
  { id: '5', short_name: 'XP Black Matte', full_name: 'Ultrafit XP Black Matte' },
  { id: '6', short_name: 'XP Black Forged', full_name: 'Ultrafit XP Black Forged' },
  { id: '7', short_name: 'XP Gold Black', full_name: 'Ultrafit XP Gold Black' },
  { id: '8', short_name: 'XP Graphite', full_name: 'Ultrafit XP Graphite' },
  { id: '9', short_name: 'XP Deep Chroma Blue', full_name: 'Ultrafit XP Deep Chroma Blue' },
  { id: '10', short_name: 'XP Phoenix Red', full_name: 'Ultrafit XP Phoenix Red' },
  { id: '11', short_name: 'XP Aurora Aqua', full_name: 'Ultrafit XP Aurora Aqua' },
  { id: '12', short_name: 'XP Aurora Forest', full_name: 'Ultrafit XP Aurora Forest' },
  {
    id: '13',
    short_name: 'XP Retro Metalic Silver',
    full_name: 'Ultrafit XP Retro Metalic Silver',
  },
  { id: '14', short_name: 'XP Pearl White', full_name: 'Ultrafit XP Pearl White' },
  { id: '15', short_name: 'WinCrest EVO', full_name: 'Ultrafit WinCrest EVO' },
];

function matchProduct(scannedName: string): { id: string; short_name: string } | null {
  const lower = scannedName.toLowerCase();

  for (const p of DB_PRODUCTS) {
    if (lower === p.short_name.toLowerCase() || lower === p.full_name.toLowerCase()) {
      return { id: p.id, short_name: p.short_name };
    }
  }

  let best: { id: string; short_name: string; score: number } | null = null;
  for (const p of DB_PRODUCTS) {
    const shortLower = p.short_name.toLowerCase();
    if (lower.includes(shortLower) || shortLower.includes(lower)) {
      const score =
        Math.min(lower.length, shortLower.length) / Math.max(lower.length, shortLower.length);
      if (!best || score > best.score) {
        best = { id: p.id, short_name: p.short_name, score };
      }
    }
    const scannedWords = lower.split(/\s+/).filter((w) => w.length > 1);
    const productWords = shortLower.split(/\s+/).filter((w) => w.length > 1);
    const overlap = scannedWords.filter((w) => productWords.includes(w)).length;
    if (overlap > 0) {
      const score = overlap / Math.max(scannedWords.length, productWords.length);
      if (!best || score > best.score) {
        best = { id: p.id, short_name: p.short_name, score };
      }
    }
  }

  return best && best.score >= 0.5 ? { id: best.id, short_name: best.short_name } : null;
}

// ─── Tests ──────────────────────────────────────────────────

describe('Roll label parser — brand detection', () => {
  for (const sample of OCR_SAMPLES) {
    it(`detects brand for ${sample.name}`, () => {
      const { result } = parseRollLabel(sample.rawText);
      expect(result.brand).toBe(sample.expected.brand);
    });
  }
});

describe('Roll label parser — product name', () => {
  for (const sample of OCR_SAMPLES) {
    it(`extracts product name for ${sample.name}`, () => {
      const { result } = parseRollLabel(sample.rawText);
      expect(result.productName).toBe(sample.expected.productName);
    });
  }

  it('strips ™ symbol from product name', () => {
    const { result } = parseRollLabel('ULTRAFIT™\nXP\nCRYSTAL\nPAINT PROTECTION FILM');
    expect(result.productName).not.toContain('™');
    expect(result.productName).not.toContain('Tm');
  });
});

describe('Roll label parser — product code (full)', () => {
  for (const sample of OCR_SAMPLES) {
    it(`extracts full product code for ${sample.name}`, () => {
      const { result } = parseRollLabel(sample.rawText);
      expect(result.productCode).toBe(sample.expected.productCode);
    });
  }
});

describe('Roll label parser — barcode (not date)', () => {
  for (const sample of OCR_SAMPLES) {
    it(`extracts barcode for ${sample.name}`, () => {
      const { result } = parseRollLabel(sample.rawText);
      expect(result.barcode).toBe(sample.expected.barcode);
    });
  }

  it('does not confuse date stamp with barcode', () => {
    const { result } = parseRollLabel('27. 02. 2026\n8 801990 000153');
    expect(result.barcode).toBe('8801990000153');
    expect(result.barcode).not.toBe('27022026');
  });
});

describe('Roll label parser — dimensions', () => {
  for (const sample of OCR_SAMPLES) {
    it(`extracts width_mm for ${sample.name}`, () => {
      const { result } = parseRollLabel(sample.rawText);
      expect(result.widthMm).toBe(sample.expected.widthMm);
    });

    it(`extracts length_m (whole meters) for ${sample.name}`, () => {
      const { result } = parseRollLabel(sample.rawText);
      expect(result.lengthM).toBe(sample.expected.lengthM);
      expect(Number.isInteger(result.lengthM)).toBe(true);
    });
  }

  it('converts inches to mm when no metric available', () => {
    const { result } = parseRollLabel('60" X 18m');
    expect(result.widthMm).toBe(1524);
    expect(result.lengthM).toBe(18);
  });
});

describe('Product matching — scanned name matches DB product', () => {
  for (const sample of OCR_SAMPLES) {
    it(`matches ${sample.expected.productName} to DB product`, () => {
      const { result } = parseRollLabel(sample.rawText);
      const match = matchProduct(result.productName as string);
      expect(match).not.toBeNull();
      expect(match!.short_name).toBe(sample.expected.productName);
    });
  }

  it('matches even with extra whitespace', () => {
    const match = matchProduct('XP  Crystal');
    expect(match).not.toBeNull();
    expect(match!.short_name).toBe('XP Crystal');
  });

  it('returns null for unknown product', () => {
    const match = matchProduct('XP Unknown Product');
    expect(match).toBeNull();
  });
});

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Google Vision OCR ──────────────────────────────────────

async function callGoogleVision(imageBase64: string, apiKey: string): Promise<string> {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: imageBase64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Vision API error:', errorText);
    throw new Error(`Google Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const resp = data.responses?.[0];

  if (resp?.error) {
    throw new Error(`Vision API error: ${resp.error.message}`);
  }

  const fullText = resp?.fullTextAnnotation?.text || '';
  if (!fullText) {
    throw new Error('No text detected in image');
  }

  return fullText;
}

// ─── Known brands (detected by name in OCR text) ───────────

const KNOWN_BRANDS = [
  { pattern: /ultrafit/i, name: 'Ultrafit' },
  { pattern: /xpel/i, name: 'XPEL' },
  { pattern: /suntek/i, name: 'SunTek' },
  { pattern: /3m/i, name: '3M' },
  { pattern: /hexis/i, name: 'Hexis' },
  { pattern: /stek/i, name: 'STEK' },
];

// ─── Description patterns (not product names) ──────────────

const DESCRIPTION_PATTERNS = [
  /paint\s*protection\s*film/i,
  /windshield\s*protection\s*film/i,
  /window\s*(?:tint(?:ing)?|film)/i,
  /vinyl\s*wrap/i,
  /ceramic\s*coating/i,
  /self[- ]?healing/i,
  /clear\s*bra/i,
];

// ─── Date patterns (to exclude from barcode detection) ──────

function isDateString(s: string): boolean {
  const clean = s.replace(/[\s\.\/\-]/g, '');
  // DD MM YYYY or DDMMYYYY — 8 digits that look like a date
  if (/^\d{8}$/.test(clean)) {
    const day = parseInt(clean.slice(0, 2));
    const month = parseInt(clean.slice(2, 4));
    const year = parseInt(clean.slice(4, 8));
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2035) {
      return true;
    }
  }
  // Also match "27. 02. 2026" or "3 03. 2026" style
  if (/\d{1,2}\s*[\.\/-]\s*\d{1,2}\s*[\.\/-]\s*\d{4}/.test(s)) return true;
  return false;
}

// ─── Noise line detection ───────────────────────────────────

function isNoiseLine(line: string): boolean {
  if (isDateString(line)) return true;
  if (/^(?:www\.|http)/i.test(line)) return true;
  if (/^\d+(?:\.\d+)?$/.test(line.replace(/\s/g, ''))) return true;
  return false;
}

// ─── Inch to mm conversion ──────────────────────────────────

const INCH_TO_MM: Record<number, number> = {
  24: 610,
  30: 762,
  36: 914,
  48: 1220,
  60: 1524,
};

// ─── Parser ─────────────────────────────────────────────────

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

  // ══════════════════════════════════════════════════════════
  // 1. BRAND — detect from known brands list
  // ══════════════════════════════════════════════════════════
  for (const kb of KNOWN_BRANDS) {
    if (kb.pattern.test(collapsed)) {
      result.brand = kb.name;
      confidence.brand = 0.95;
      // Mark lines containing the brand name as consumed
      for (let i = 0; i < lines.length; i++) {
        if (kb.pattern.test(lines[i])) {
          consumed.add(i);
        }
      }
      break;
    }
  }

  // ══════════════════════════════════════════════════════════
  // 2. DESCRIPTION — "Paint Protection Film" etc.
  // ══════════════════════════════════════════════════════════
  for (let i = 0; i < lines.length; i++) {
    if (DESCRIPTION_PATTERNS.some((p) => p.test(lines[i]))) {
      result.description = lines[i];
      confidence.description = 0.95;
      consumed.add(i);
      break;
    }
  }

  // ══════════════════════════════════════════════════════════
  // 3. PRODUCT CODE (full code like PXCR-6015-UH44-4840)
  // ══════════════════════════════════════════════════════════
  const codePatterns = [
    /\b([A-Z]{2,}\d?-\d{3,}-[A-Z\d]{2,}-[A-Z\d]{2,})\b/i, // PXCR-6015-UH44-4840
    /\b(\d{4}-[A-Z]\d[A-Z]{2}-\d{4})\b/i, // 2300-P9GB-0089
    /\b([A-Z]{2,}\d?-\d{3,}-[A-Z\d]{2,})\b/i, // shorter codes
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

  // ══════════════════════════════════════════════════════════
  // 4. BARCODE — 13 digit EAN, NOT dates
  // ══════════════════════════════════════════════════════════
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const line = lines[i];
    // Skip if it looks like a date
    if (isDateString(line)) {
      consumed.add(i);
      continue;
    }
    // Match "8 801990 000153" style (space-separated)
    const spaced = line.match(/\b(\d[\d\s]{10,16}\d)\b/);
    if (spaced) {
      const clean = spaced[1].replace(/\s/g, '');
      if (clean.length === 13 && !isDateString(clean)) {
        result.barcode = clean;
        confidence.barcode = 0.95;
        consumed.add(i);
        break;
      }
    }
    // Match pure digit string
    const digitsOnly = line.replace(/[\s\-]/g, '');
    if (/^\d{13}$/.test(digitsOnly) && !isDateString(digitsOnly)) {
      result.barcode = digitsOnly;
      confidence.barcode = 0.95;
      consumed.add(i);
      break;
    }
  }

  // Barcode fallback: search in collapsed text
  if (!result.barcode) {
    const allDigitRuns = collapsed.match(/\d[\d\s]{10,16}\d/g) || [];
    for (const run of allDigitRuns) {
      const clean = run.replace(/\s/g, '');
      if (clean.length === 13 && !isDateString(clean)) {
        result.barcode = clean;
        confidence.barcode = 0.8;
        break;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 5. DIMENSIONS — width (mm) × length (m)
  //    Prefer metric. Convert inches to mm.
  //    Length ALWAYS rounded to whole meters.
  // ══════════════════════════════════════════════════════════
  let dimFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try metric first: "1,524mm x 15m" or "1524mm x 15m"
    const metricMatch = line.match(/(\d[\d,\.]*)\s*mm\s*[x×X]\s*(\d+(?:\.\d+)?)\s*m\b/i);
    if (metricMatch) {
      result.widthMm = Math.round(parseFloat(metricMatch[1].replace(/,/g, '')));
      result.lengthM = Math.round(parseFloat(metricMatch[2]));
      confidence.widthMm = 0.95;
      confidence.lengthM = 0.95;
      consumed.add(i);
      dimFound = true;
      break;
    }

    // Try imperial: '60" x 50ft' or '60" X 15m'
    const imperialMatch = line.match(/(\d+)"\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(ft|m)\b/i);
    if (imperialMatch) {
      const inches = parseInt(imperialMatch[1]);
      result.widthMm = INCH_TO_MM[inches] || Math.round(inches * 25.4);
      const lengthVal = parseFloat(imperialMatch[2]);
      // If unit is feet, convert to meters
      if (imperialMatch[3].toLowerCase() === 'ft') {
        result.lengthM = Math.round(lengthVal * 0.3048);
      } else {
        result.lengthM = Math.round(lengthVal);
      }
      confidence.widthMm = 0.9;
      confidence.lengthM = 0.9;
      consumed.add(i);
      dimFound = true;
      break;
    }

    // Try mixed: "60" x 50ft / 1,524mm x 15m" — take metric part after "/"
    if (line.includes('/')) {
      const metricPart = line.split('/').pop()!.trim();
      const metricMatch2 = metricPart.match(/(\d[\d,\.]*)\s*mm\s*[x×X]\s*(\d+(?:\.\d+)?)\s*m\b/i);
      if (metricMatch2) {
        result.widthMm = Math.round(parseFloat(metricMatch2[1].replace(/,/g, '')));
        result.lengthM = Math.round(parseFloat(metricMatch2[2]));
        confidence.widthMm = 0.95;
        confidence.lengthM = 0.95;
        consumed.add(i);
        dimFound = true;
        break;
      }
    }
  }

  // Fallback: extract width and length separately
  if (!dimFound) {
    const wMatch = collapsed.match(/(\d[\d,]*)\s*mm/i);
    if (wMatch) {
      result.widthMm = Math.round(parseFloat(wMatch[1].replace(/,/g, '')));
      confidence.widthMm = 0.6;
    }
    const lMatch = collapsed.match(/[x×X]\s*(\d{1,3})\s*m\b/i);
    if (lMatch) {
      result.lengthM = Math.round(parseFloat(lMatch[1]));
      confidence.lengthM = 0.6;
    }
  }

  // Sanity: length must be reasonable (1-100m), width must be reasonable (100-2000mm)
  if ((result.lengthM as number) > 100 || (result.lengthM as number) < 1) result.lengthM = 0;
  if ((result.widthMm as number) > 2000 || (result.widthMm as number) < 100) result.widthMm = 0;

  // ══════════════════════════════════════════════════════════
  // 6. PRODUCT NAME — from remaining unconsumed lines
  //    For Ultrafit: combine lines like "XP" + "CRYSTAL" or
  //    "WinCrest" + "EVO" into full product name.
  //    Skip: brand lines, description, codes, dimensions, dates, URLs
  // ══════════════════════════════════════════════════════════
  const nameCandidates: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const line = lines[i];

    // Skip noise
    if (isNoiseLine(line)) {
      consumed.add(i);
      continue;
    }
    if (isDateString(line)) {
      consumed.add(i);
      continue;
    }
    if (DESCRIPTION_PATTERNS.some((p) => p.test(line))) continue;

    // Skip lines that contain the brand name (e.g. "ULTRAFIT™", "G ULTRAFIT™")
    const cleanLine = line
      .replace(/[™®©]/g, '')
      .replace(/\s*\bTm\b/g, '')
      .replace(/\s*\bTM\b/g, '')
      .trim();
    const containsBrand = KNOWN_BRANDS.some((kb) => kb.pattern.test(cleanLine));
    if (containsBrand) {
      consumed.add(i);
      continue;
    }

    // Skip dimension lines
    if (/\d+\s*mm\s*[x×X]/i.test(line)) {
      consumed.add(i);
      continue;
    }
    if (/\d+"\s*[x×X]/i.test(line)) {
      consumed.add(i);
      continue;
    }

    // Skip product code lines (already consumed but double-check)
    if (result.productCode && line.includes(result.productCode as string)) {
      consumed.add(i);
      continue;
    }

    // Skip very short single-char or number-only lines
    if (line.length < 2) continue;
    if (/^\d+$/.test(line.replace(/\s/g, ''))) continue;

    // This is likely a product name part
    nameCandidates.push(
      line
        .replace(/[™®©]/g, '')
        .replace(/\s*\bTm\b/g, '')
        .replace(/\s*\bTM\b/g, '')
        .trim(),
    );
    consumed.add(i);

    // Stop after collecting enough (product names are usually 1-3 lines)
    if (nameCandidates.join(' ').length >= 20) break;
  }

  if (nameCandidates.length > 0) {
    // Join parts: "XP" + "CRYSTAL" → "XP Crystal"
    // or "XP" + "RETRO MATTE" → "XP Retro Matte"
    // or "WinCrest" + "EVO" → "WinCrest EVO"
    const raw = nameCandidates.join(' ').replace(/\s+/g, ' ').trim();

    // Title case normalization (but preserve known casing)
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

// ─── Main handler ───────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!googleApiKey) {
      return jsonResponse({ error: 'GOOGLE_VISION_API_KEY not configured' }, 500);
    }

    const { imageBase64, instanceId } = await req.json();
    if (!imageBase64) {
      return jsonResponse({ error: 'imageBase64 is required' }, 400);
    }

    // Step 1: OCR via Google Vision
    const rawText = await callGoogleVision(imageBase64, googleApiKey);
    console.log('OCR raw text:', rawText);

    // Step 2: Parse extracted text into structured data
    const { result: extracted, confidence } = parseRollLabel(rawText);

    // Validate: need at least dimensions OR a name
    if (!extracted.widthMm && !extracted.lengthM && !extracted.brand && !extracted.productName) {
      return jsonResponse(
        {
          error: 'Nie udało się odczytać danych z etykiety',
          rawText,
          partial: extracted,
          confidence,
        },
        422,
      );
    }

    // Step 3: Match with existing products in database
    let matchedProductId: string | null = null;
    let matchedVariantId: string | null = null;
    let matchedProductName: string | null = null;

    if (instanceId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get all products for this instance
      const { data: products } = await supabase
        .from('sales_products')
        .select('id, full_name, short_name')
        .eq('instance_id', instanceId);

      if (products && products.length > 0) {
        const scannedName = ((extracted.productName as string) || '').toLowerCase();
        const scannedCode = ((extracted.productCode as string) || '').toUpperCase();

        // Match by product name (fuzzy — check if scanned name contains product short_name or vice versa)
        let bestMatch: { id: string; short_name: string; score: number } | null = null;

        for (const p of products) {
          const shortLower = p.short_name.toLowerCase();
          const fullLower = p.full_name.toLowerCase();

          // Exact match
          if (scannedName === shortLower || scannedName === fullLower) {
            bestMatch = { id: p.id, short_name: p.short_name, score: 1 };
            break;
          }

          // Scanned name contains product name or vice versa
          if (scannedName.includes(shortLower) || shortLower.includes(scannedName)) {
            const score =
              Math.min(scannedName.length, shortLower.length) /
              Math.max(scannedName.length, shortLower.length);
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = { id: p.id, short_name: p.short_name, score };
            }
          }

          // Match by words overlap
          const scannedWords = scannedName.split(/\s+/).filter((w) => w.length > 1);
          const productWords = shortLower.split(/\s+/).filter((w) => w.length > 1);
          const overlap = scannedWords.filter((w) => productWords.includes(w)).length;
          if (overlap > 0) {
            const score = overlap / Math.max(scannedWords.length, productWords.length);
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = { id: p.id, short_name: p.short_name, score };
            }
          }
        }

        if (bestMatch && bestMatch.score >= 0.5) {
          matchedProductId = bestMatch.id;
          matchedProductName = bestMatch.short_name;

          // Override scanned product name with matched DB name
          extracted.productName = bestMatch.short_name;
          confidence.productName = Math.max(confidence.productName, 0.95);

          // Try to match variant by dimensions
          const { data: variants } = await supabase
            .from('sales_product_variants')
            .select('id, name')
            .eq('product_id', bestMatch.id);

          if (variants && extracted.widthMm && extracted.lengthM) {
            const dimStr = `${extracted.widthMm}mm x ${extracted.lengthM}m`;
            for (const v of variants) {
              if (
                v.name.includes(`${extracted.widthMm}mm`) &&
                v.name.includes(`${extracted.lengthM}m`)
              ) {
                matchedVariantId = v.id;
                break;
              }
            }
          }
        }
      }
    }

    // Flag warnings
    const warnings: string[] = [];
    if (!matchedProductId && extracted.productName) {
      warnings.push('Nie znaleziono pasującego produktu w bazie — sprawdź nazwę');
    }
    if (matchedProductId && !matchedVariantId && extracted.widthMm && extracted.lengthM) {
      warnings.push('Produkt znaleziony, ale brak pasującego wariantu rozmiaru');
    }
    if (confidence.barcode > 0 && confidence.barcode < 0.8) {
      warnings.push('Kod kreskowy może być niepoprawny — sprawdź');
    }
    if (confidence.productCode > 0 && confidence.productCode < 0.8) {
      warnings.push('Kod produktu może być niepoprawny — sprawdź');
    }
    if (confidence.widthMm > 0 && confidence.widthMm < 0.8) {
      warnings.push('Szerokość mogła zostać źle odczytana — sprawdź');
    }
    if (confidence.lengthM > 0 && confidence.lengthM < 0.8) {
      warnings.push('Długość mogła zostać źle odczytana — sprawdź');
    }

    return jsonResponse(
      {
        ...extracted,
        matchedProductId,
        matchedVariantId,
        matchedProductName,
        confidence,
        warnings,
        rawText,
      },
      200,
    );
  } catch (err) {
    console.error('extract-roll-data error:', err);
    return jsonResponse({ error: err.message || 'Internal error' }, 500);
  }
});

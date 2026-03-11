import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Google Vision OCR ──────────────────────────────────────

async function callGoogleVision(
  imageBase64: string,
  apiKey: string,
): Promise<string> {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: imageBase64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Vision API error:", errorText);
    throw new Error(`Google Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const resp = data.responses?.[0];

  if (resp?.error) {
    throw new Error(`Vision API error: ${resp.error.message}`);
  }

  const fullText = resp?.fullTextAnnotation?.text || "";
  if (!fullText) {
    throw new Error("No text detected in image");
  }

  return fullText;
}

// ─── Helpers ────────────────────────────────────────────────

function inchesToMm(inches: number): number {
  return Math.round(inches * 25.4);
}

function feetToM(feet: number): number {
  return +(feet * 0.3048).toFixed(2);
}

// Lines that are descriptions (not product names)
const DESCRIPTION_PATTERNS = [
  /paint\s*protection\s*film/i,
  /protection\s*film/i,
  /window\s*(?:tint(?:ing)?|film)/i,
  /vinyl\s*wrap/i,
  /ceramic\s*coating/i,
  /self[- ]?healing/i,
  /clear\s*bra/i,
];

function isDescriptionLine(line: string): boolean {
  return DESCRIPTION_PATTERNS.some((p) => p.test(line));
}

// Lines that are clearly not product/brand names
function isNoiseLine(line: string): boolean {
  const s = line.replace(/\s/g, "");
  if (/^\d{8,}$/.test(s)) return true; // barcode
  if (/^[A-Z0-9]{2,}-[A-Z0-9]{2,}-/.test(line)) return true; // product code
  if (/\d+["″"]\s*[x×X]/i.test(line)) return true; // dimension
  if (/\d+\s*mm\s*[x×X]/i.test(line)) return true; // metric dimension
  if (/^\d+(?:\.\d+)?$/.test(s)) return true; // just a number
  if (/^(?:made\s*in|country|lot|batch|www\.|http)/i.test(line)) return true;
  return false;
}

// ─── Parser ─────────────────────────────────────────────────

function parseRollLabel(rawText: string) {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const collapsed = rawText.replace(/\s+/g, " ");

  const result: Record<string, unknown> = {
    brand: "",
    productName: "",
    description: "",
    productCode: "",
    barcode: "",
    widthMm: 0,
    lengthM: 0,
    deliveryDate: null,
  };

  const confidence: Record<string, number> = {
    brand: 0,
    productName: 0,
    description: 0,
    productCode: 0,
    barcode: 0,
    widthMm: 0,
    lengthM: 0,
    deliveryDate: 0,
  };

  // Track which lines we've "consumed" for each role
  const consumed = new Set<number>();

  // ══════════════════════════════════════════════════════════
  // 1. DESCRIPTION — extract first so we exclude from product name
  // ══════════════════════════════════════════════════════════
  for (let i = 0; i < lines.length; i++) {
    if (isDescriptionLine(lines[i])) {
      result.description = lines[i];
      confidence.description = 0.95;
      consumed.add(i);
      break;
    }
  }

  // ══════════════════════════════════════════════════════════
  // 2. BARCODE — long digit sequence (8-14 digits)
  // ══════════════════════════════════════════════════════════
  // Pass 1: line that is purely/mostly digits (allow spaces between digit groups)
  for (let i = 0; i < lines.length; i++) {
    const digitsOnly = lines[i].replace(/[\s\-\.]/g, "");
    if (/^\d{8,14}$/.test(digitsOnly)) {
      result.barcode = digitsOnly;
      confidence.barcode = 0.95;
      consumed.add(i);
      break;
    }
    // Also match "8 801990 000153" style (space-separated digit groups)
    const spaced = lines[i].match(/^(\d[\d\s]{8,16}\d)$/);
    if (spaced) {
      const clean = spaced[1].replace(/\s/g, "");
      if (clean.length >= 8 && clean.length <= 14) {
        result.barcode = clean;
        confidence.barcode = 0.9;
        consumed.add(i);
        break;
      }
    }
  }

  // Pass 2: digit runs in mixed content
  if (!result.barcode) {
    const runs = collapsed.match(/\d[\d\s]{7,15}\d/g) || [];
    for (const run of runs) {
      const clean = run.replace(/\s/g, "");
      if (clean.length >= 8 && clean.length <= 14) {
        result.barcode = clean;
        confidence.barcode = 0.8;
        break;
      }
    }
  }

  // Pass 3: embedded in any line
  if (!result.barcode) {
    for (const line of lines) {
      const match = line.replace(/\s/g, "").match(/(\d{8,14})/);
      if (match) {
        result.barcode = match[1];
        confidence.barcode = 0.7;
        break;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 3. PRODUCT CODE (SKU — alphanumeric with dashes)
  // ══════════════════════════════════════════════════════════
  const codePatterns = [
    /\b([A-Z]{2,}\d?-\d{3,}-[A-Z\d]{2,}-[A-Z\d]{2,})\b/i,
    /\b([A-Z]{2,}\d?-\d{3,}-[A-Z\d]{2,})\b/i,
    /\b([A-Z]{2,}\d{2,}[-/][A-Z\d]{3,})\b/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const clean = lines[i].replace(/[\s\-]/g, "");
    if (clean === result.barcode) continue; // skip barcode line

    for (const pattern of codePatterns) {
      const match = lines[i].match(pattern);
      if (match) {
        result.productCode = match[1].toUpperCase();
        confidence.productCode = 0.9;
        consumed.add(i);
        break;
      }
    }
    if (result.productCode) break;
  }

  // Broader fallback
  if (!result.productCode) {
    const fallback = /\b([A-Z\d]{3,}-[A-Z\d]{3,}(?:-[A-Z\d]+)*)\b/i;
    for (let i = 0; i < lines.length; i++) {
      if (consumed.has(i)) continue;
      const clean = lines[i].replace(/[\s\-]/g, "");
      if (clean === result.barcode) continue;
      const match = lines[i].match(fallback);
      if (match && match[1].length >= 8) {
        result.productCode = match[1].toUpperCase();
        confidence.productCode = 0.5;
        consumed.add(i);
        break;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 4. DIMENSIONS (width × length)
  // ══════════════════════════════════════════════════════════
  let dimFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Imperial: 60" × 50 ft
    const imp =
      line.match(/(\d+(?:\.\d+)?)\s*["″"]\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(?:['′']|ft|feet)/i) ||
      line.match(/(\d+(?:\.\d+)?)\s*(?:in(?:ch(?:es)?)?)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(?:ft|feet)/i) ||
      line.match(/(\d+(?:\.\d+)?)\s*["″"]\s*[x×X]\s*(\d+(?:\.\d+)?)\s*["″"'′']/i);

    if (imp) {
      const w = parseFloat(imp[1]);
      const l = parseFloat(imp[2]);
      result.widthMm = w < 100 ? inchesToMm(w) : w;
      result.lengthM = l > 30 ? feetToM(l) : l;
      confidence.widthMm = 0.95;
      confidence.lengthM = 0.95;
      consumed.add(i);
      dimFound = true;
      break;
    }

    // Metric: 1524mm × 15m / 1,524mm x 15m (comma as thousands separator)
    const met =
      line.match(/(\d[\d,]*(?:\.\d+)?)\s*mm\s*[x×X]\s*(\d+(?:\.\d+)?)\s*m\b/i) ||
      line.match(/(\d{3,5})\s*[x×X]\s*(\d{1,3}(?:\.\d+)?)\s*m\b/i);

    if (met) {
      result.widthMm = parseFloat(met[1].replace(/,/g, ""));
      result.lengthM = parseFloat(met[2].replace(/,/g, ""));
      confidence.widthMm = 0.95;
      confidence.lengthM = 0.95;
      consumed.add(i);
      dimFound = true;
      break;
    }
  }

  if (!dimFound) {
    // Standalone inch width
    const wInch = rawText.match(/\b(\d{2})\s*["″"]\b/);
    if (wInch) {
      result.widthMm = inchesToMm(parseFloat(wInch[1]));
      confidence.widthMm = 0.5;
    }
    const wMm = rawText.match(/\b(\d{3,4})\s*mm\b/i);
    if (wMm && !result.widthMm) {
      result.widthMm = parseFloat(wMm[1]);
      confidence.widthMm = 0.6;
    }

    const lFt = rawText.match(/\b(\d{2,3})\s*(?:ft|feet|['′'])\b/i);
    if (lFt) {
      result.lengthM = feetToM(parseFloat(lFt[1]));
      confidence.lengthM = 0.5;
    }
    const lM = rawText.match(/\b(\d{1,3}(?:\.\d+)?)\s*m\b/i);
    if (lM && !result.lengthM) {
      const val = parseFloat(lM[1]);
      if (val > 0 && val < 200) {
        result.lengthM = val;
        confidence.lengthM = 0.5;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 5. BRAND & PRODUCT NAME — from remaining unconsumed lines
  //    Strategy:
  //      - First meaningful line = brand
  //      - Then collect consecutive short text-only lines as product name
  //        (handles "XP" + "CRYSTAL" on separate lines → "XP CRYSTAL")
  //      - Stop collecting when we hit a description, code, dimension, etc.
  // ══════════════════════════════════════════════════════════
  const candidateLines: Array<{ text: string; idx: number }> = [];
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const line = lines[i];
    if (isNoiseLine(line)) continue;
    if (isDescriptionLine(line)) continue;
    if (line.length < 2 || line.length > 50) continue;
    candidateLines.push({ text: line, idx: i });
  }

  if (candidateLines.length >= 1) {
    // First candidate = brand
    result.brand = candidateLines[0].text;
    confidence.brand = 0.8;

    if (candidateLines.length >= 2) {
      // Collect product name from consecutive candidates after brand.
      // Join short lines that are likely parts of the same name
      // (e.g. "XP" + "CRYSTAL" → "XP CRYSTAL")
      // Stop at a line that contains a date pattern (digits with dots)
      const nameParts: string[] = [];
      for (let j = 1; j < candidateLines.length; j++) {
        const line = candidateLines[j].text;
        // Stop if this looks like a date (e.g. "27. 02. 2026")
        if (/\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/.test(line)) break;
        // Stop if this line is far from previous (skipped many consumed lines between)
        if (j > 1) {
          const gap = candidateLines[j].idx - candidateLines[j - 1].idx;
          if (gap > 3) break; // too far apart, probably different section
        }
        nameParts.push(line);
        // Stop once we have a reasonable product name (>= 3 chars combined)
        // but keep going if parts are very short (like "XP" alone)
        const combined = nameParts.join(" ");
        if (combined.length >= 6) break;
      }

      if (nameParts.length > 0) {
        result.productName = nameParts.join(" ");
        confidence.productName = 0.85;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 6. DELIVERY DATE
  // ══════════════════════════════════════════════════════════
  const datePats = [
    { re: /\b(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\b/, fmt: "dmy" },   // 27. 02. 2026 or 27.02.2026
    { re: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, fmt: "dmy" },          // 27/02/2026
    { re: /\b(\d{4})-(\d{2})-(\d{2})\b/, fmt: "ymd" },                // 2026-02-27
    { re: /\b(\d{2})-(\d{2})-(\d{4})\b/, fmt: "dmy" },                // 27-02-2026
  ];
  for (const line of lines) {
    for (const { re, fmt } of datePats) {
      const match = line.match(re);
      if (match) {
        let y: string, m: string, d: string;
        if (fmt === "ymd") {
          [, y, m, d] = match;
        } else {
          [, d, m, y] = match;
        }
        const year = parseInt(y);
        const month = parseInt(m);
        const day = parseInt(d);
        if (year >= 2020 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          result.deliveryDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          confidence.deliveryDate = 0.7;
          break;
        }
      }
    }
    if (result.deliveryDate) break;
  }

  return { result, confidence };
}

// ─── Main handler ───────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
    if (!googleApiKey) {
      return jsonResponse(
        { error: "GOOGLE_VISION_API_KEY not configured" },
        500,
      );
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return jsonResponse({ error: "imageBase64 is required" }, 400);
    }

    // Step 1: OCR via Google Vision
    const rawText = await callGoogleVision(imageBase64, googleApiKey);
    console.log("OCR raw text:", rawText);

    // Step 2: Parse extracted text into structured data
    const { result: extracted, confidence } = parseRollLabel(rawText);

    // Validate: need at least dimensions OR a name
    if (!extracted.widthMm && !extracted.lengthM && !extracted.brand && !extracted.productName) {
      return jsonResponse(
        {
          error: "Nie udało się odczytać danych z etykiety",
          rawText,
          partial: extracted,
          confidence,
        },
        422,
      );
    }

    // Flag warnings
    const warnings: string[] = [];
    if (confidence.barcode > 0 && confidence.barcode < 0.8) {
      warnings.push("Kod kreskowy może być niepoprawny — sprawdź");
    }
    if (confidence.productCode > 0 && confidence.productCode < 0.8) {
      warnings.push("Kod produktu może być niepoprawny — sprawdź");
    }
    if (confidence.brand > 0 && confidence.brand < 0.8) {
      warnings.push("Marka mogła zostać źle odczytana — sprawdź");
    }
    if (confidence.productName > 0 && confidence.productName < 0.8) {
      warnings.push("Nazwa produktu mogła zostać źle odczytana — sprawdź");
    }
    if (confidence.widthMm > 0 && confidence.widthMm < 0.8) {
      warnings.push("Szerokość mogła zostać źle odczytana — sprawdź");
    }
    if (confidence.lengthM > 0 && confidence.lengthM < 0.8) {
      warnings.push("Długość mogła zostać źle odczytana — sprawdź");
    }

    return jsonResponse(
      {
        ...extracted,
        confidence,
        warnings,
        rawText,
      },
      200,
    );
  } catch (err) {
    console.error("extract-roll-data error:", err);
    return jsonResponse(
      { error: err.message || "Internal error" },
      500,
    );
  }
});

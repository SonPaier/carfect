/**
 * Parse UltraFit shipment CSV → deduplicated sales_customers JSON
 *
 * Usage: npx tsx scripts/import-customers-from-csv.ts
 *
 * Output: scripts/customers-import.json  (ready for Supabase insert)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const CSV_PATH = resolve(
  process.env.CSV_PATH ||
    '/Users/tomasznastaly/Downloads/zlecenia_20260316_1414 - zlecenia_20260316_1414.csv',
);

// ── helpers ──────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  // strip everything except digits
  let digits = raw.replace(/\D/g, '');
  // remove leading 48 country code if present (and result is 9 digits)
  if (digits.startsWith('48') && digits.length === 11) {
    digits = digits.slice(2);
  }
  return digits; // pure 9-digit Polish number
}

function normalizeStreet(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/^ul\.?\s*/i, '')
    .replace(/^Ul\.?\s*/i, '')
    .trim();
}

function normalizeCity(raw: string): string {
  return raw.trim();
}

function normalizePostalCode(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return raw.trim();
}

// ── CSV parser (handles quoted fields with newlines) ─────────────────

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 1) rows.push(currentRow);
        currentRow = [];
        if (ch === '\r') i++; // skip \r\n
      } else {
        currentField += ch;
      }
    }
  }
  // last row
  if (currentField || currentRow.length) {
    currentRow.push(currentField);
    if (currentRow.length > 1) rows.push(currentRow);
  }

  return rows;
}

// ── main ─────────────────────────────────────────────────────────────

interface RawRow {
  date: string; // Data utworzenia
  recipientName: string;
  recipientAddress: string;
  recipientAddress2: string;
  recipientPostalCode: string;
  recipientCity: string;
  recipientContact: string;
  recipientEmail: string;
  recipientPhone: string;
}

interface CustomerRecord {
  name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  shipping_street: string | null;
  shipping_street_line2: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
}

const csvContent = readFileSync(CSV_PATH, 'utf-8');
const allRows = parseCSV(csvContent);
const header = allRows[0];
const dataRows = allRows.slice(1);

// Column indices
const COL = {
  date: header.indexOf('Data utworzenia'),
  name: header.indexOf('Odbiorca:Nazwa'),
  address: header.indexOf('Odbiorca:Adres'),
  address2: header.findIndex((h) => h.trim() === 'Odbiorca:Adres 2'),
  postalCode: header.indexOf('Odbiorca:Kod pocztowy'),
  city: header.indexOf('Odbiorca:Miasto'),
  contact: header.indexOf('Odbiorca:Osoba kontaktowa'),
  email: header.indexOf('Odbiorca:E-mail'),
  phone: header.indexOf('Odbiorca:Telefon'),
};

// Validate columns found
for (const [key, idx] of Object.entries(COL)) {
  if (idx === -1) {
    console.error(`Column not found: ${key}`);
    process.exit(1);
  }
}

// Parse rows
const parsed: RawRow[] = [];
let skippedRows = 0;

for (const row of dataRows) {
  const phone = (row[COL.phone] || '').trim();
  const name = (row[COL.name] || '').trim();

  if (!phone && !name) {
    skippedRows++;
    continue;
  }

  parsed.push({
    date: (row[COL.date] || '').trim(),
    recipientName: name,
    recipientAddress: (row[COL.address] || '').trim(),
    recipientAddress2: (row[COL.address2] || '').trim(),
    recipientPostalCode: (row[COL.postalCode] || '').trim(),
    recipientCity: (row[COL.city] || '').trim(),
    recipientContact: (row[COL.contact] || '').trim(),
    recipientEmail: (row[COL.email] || '').trim(),
    recipientPhone: phone,
  });
}

// Group by normalized phone → pick newest row
const byPhone = new Map<string, { row: RawRow; dateStr: string }>();

for (const row of parsed) {
  const normPhone = normalizePhone(row.recipientPhone);
  if (!normPhone || normPhone.length < 7) {
    // fallback: group by name if no valid phone
    continue;
  }

  const existing = byPhone.get(normPhone);
  if (!existing || row.date > existing.dateStr) {
    byPhone.set(normPhone, { row, dateStr: row.date });
  }
}

// Also handle rows without valid phone — group by name
const noPhoneRows = parsed.filter((r) => {
  const norm = normalizePhone(r.recipientPhone);
  return !norm || norm.length < 7;
});

const byName = new Map<string, { row: RawRow; dateStr: string }>();
for (const row of noPhoneRows) {
  const key = row.recipientName.toLowerCase().trim();
  if (!key) continue;
  const existing = byName.get(key);
  if (!existing || row.date > existing.dateStr) {
    byName.set(key, { row, dateStr: row.date });
  }
}

// Build final customer list
const customers: CustomerRecord[] = [];

for (const [phone, { row }] of byPhone) {
  const email = row.recipientEmail.replace(/^info@ultrafitpoland\.pl$/i, ''); // strip sender's own email
  customers.push({
    name: row.recipientName || row.recipientContact || 'Nieznany',
    contact_person: row.recipientContact || null,
    phone,
    email: email || null,
    shipping_street: normalizeStreet(row.recipientAddress) || null,
    shipping_street_line2: row.recipientAddress2 || null,
    shipping_postal_code: row.recipientPostalCode
      ? normalizePostalCode(row.recipientPostalCode)
      : null,
    shipping_city: row.recipientCity ? normalizeCity(row.recipientCity) : null,
  });
}

// Add no-phone customers (rare)
for (const [, { row }] of byName) {
  const email = row.recipientEmail.replace(/^info@ultrafitpoland\.pl$/i, '');
  customers.push({
    name: row.recipientName || 'Nieznany',
    contact_person: row.recipientContact || null,
    phone: row.recipientPhone || '',
    email: email || null,
    shipping_street: normalizeStreet(row.recipientAddress) || null,
    shipping_street_line2: row.recipientAddress2 || null,
    shipping_postal_code: row.recipientPostalCode
      ? normalizePostalCode(row.recipientPostalCode)
      : null,
    shipping_city: row.recipientCity ? normalizeCity(row.recipientCity) : null,
  });
}

// Sort by name
customers.sort((a, b) => a.name.localeCompare(b.name, 'pl'));

// Output
const outPath = resolve(__dirname, 'customers-import.json');
writeFileSync(outPath, JSON.stringify(customers, null, 2), 'utf-8');

console.log(`✅ Parsed ${parsed.length} rows from CSV`);
console.log(`⏭  Skipped ${skippedRows} empty rows`);
console.log(`👥 ${customers.length} unique customers (by phone)`);
console.log(`📄 Output: ${outPath}`);

// Also generate SQL for direct insert
const sqlLines = customers.map((c) => {
  const esc = (v: string | null) => (v ? `'${v.replace(/'/g, "''")}'` : 'NULL');
  return `  (gen_random_uuid(), '<INSTANCE_ID>', ${esc(c.name)}, ${esc(c.contact_person)}, ${esc(c.phone)}, ${esc(c.email)}, ${esc(c.shipping_street)}, ${esc(c.shipping_street_line2)}, ${esc(c.shipping_postal_code)}, ${esc(c.shipping_city)})`;
});

const sql = `-- Replace <INSTANCE_ID> with the actual UltraFit instance UUID
INSERT INTO sales_customers (id, instance_id, name, contact_person, phone, email, shipping_street, shipping_street_line2, shipping_postal_code, shipping_city)
VALUES
${sqlLines.join(',\n')}
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = EXCLUDED.name,
  contact_person = EXCLUDED.contact_person,
  email = EXCLUDED.email,
  shipping_street = EXCLUDED.shipping_street,
  shipping_street_line2 = EXCLUDED.shipping_street_line2,
  shipping_postal_code = EXCLUDED.shipping_postal_code,
  shipping_city = EXCLUDED.shipping_city,
  updated_at = now();
`;

const sqlPath = resolve(__dirname, 'customers-import.sql');
writeFileSync(sqlPath, sql, 'utf-8');
console.log(`📄 SQL: ${sqlPath}`);

/**
 * CEIDG / Hurtownia Danych biznes.gov.pl API v3
 * Docs: https://dane.biznes.gov.pl/
 *
 * Simple REST API — GET /api/ceidg/v3/firmy?nip={NIP}
 * Auth: Bearer JWT token in Authorization header
 */

const PROD_URL = 'https://dane.biznes.gov.pl/api/ceidg/v3';
const TEST_URL = 'https://test-dane.biznes.gov.pl/api/ceidg/v3';

export interface GusCompanyResult {
  name: string;
  nip: string;
  regon: string;
  street: string;
  buildingNumber: string;
  apartmentNumber: string;
  postalCode: string;
  city: string;
  province: string;
}

function getBaseUrl(): string {
  const env = Deno.env.get('CEIDG_ENV');
  if (env === 'test') return TEST_URL;
  return PROD_URL;
}

function getApiToken(): string {
  const token = Deno.env.get('CEIDG_API_TOKEN');
  if (!token) throw new Error('CEIDG_API_TOKEN not configured');
  return token;
}

interface CeidgFirma {
  id: string;
  nazwa: string;
  adresDzialalnosci: {
    ulica?: string;
    budynek?: string;
    lokal?: string;
    miasto?: string;
    kod?: string;
    wojewodztwo?: string;
    powiat?: string;
    gmina?: string;
  };
  wlasciciel: {
    imie?: string;
    nazwisko?: string;
    nip?: string;
    regon?: string;
  };
  status?: string;
  dataRozpoczecia?: string;
}

interface CeidgFirmaResponse {
  firma: CeidgFirma;
}

interface CeidgFirmyResponse {
  firmy: CeidgFirma[];
  count: number;
}

export async function lookupNip(nip: string): Promise<GusCompanyResult> {
  const cleanNip = nip.replace(/[^0-9]/g, '');
  if (cleanNip.length !== 10) {
    throw new Error('NIP musi mieć 10 cyfr');
  }

  const baseUrl = getBaseUrl();
  const token = getApiToken();

  const res = await fetch(`${baseUrl}/firma?nip=${cleanNip}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (res.status === 204) {
    throw new Error('Nie znaleziono firmy o podanym NIP');
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error('Błąd autoryzacji API CEIDG');
  }

  if (res.status === 429) {
    throw new Error('Zbyt wiele zapytań — spróbuj za chwilę');
  }

  if (!res.ok) {
    throw new Error(`Błąd API CEIDG: ${res.status}`);
  }

  const data = await res.json() as { firma: CeidgFirma[] };

  if (!data.firma || data.firma.length === 0) {
    throw new Error('Nie znaleziono firmy o podanym NIP');
  }

  const firma = data.firma[0];
  const addr = firma.adresDzialalnosci || {};

  return {
    name: firma.nazwa || '',
    nip: firma.wlasciciel?.nip || cleanNip,
    regon: firma.wlasciciel?.regon || '',
    street: addr.ulica ? `${addr.ulica} ${addr.budynek || ''}`.trim() : '',
    buildingNumber: addr.budynek || '',
    apartmentNumber: addr.lokal || '',
    postalCode: addr.kod || '',
    city: addr.miasto || '',
    province: addr.wojewodztwo || '',
  };
}

/**
 * GUS BIR1.1 API client (REGON)
 * Docs: https://api.stat.gov.pl/Home/RegonApi
 *
 * Flow: login (get session ID) → search by NIP → get full report → logout
 */

const PROD_URL = 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnpsv.svc';
const TEST_URL = 'https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnpsv.svc';
const TEST_KEY = 'abcde12345abcde12345';

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
  type: 'F' | 'P' | 'LP'; // F=osoba fizyczna, P=prawna, LP=lokalna prawna
}

function getBaseUrl(): string {
  const key = Deno.env.get('GUS_API_KEY');
  // If using test key or no key set, use test endpoint
  if (!key || key === TEST_KEY) return TEST_URL;
  return PROD_URL;
}

function getApiKey(): string {
  return Deno.env.get('GUS_API_KEY') || TEST_KEY;
}

function soapEnvelope(body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
               xmlns:ns="http://CIS/BIR/PUBL/2014/07">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:Action>http://CIS/BIR/PUBL/2014/07/IUslugaBIRzworki/${body.includes('Zaloguj') ? 'Zaloguj' : body.includes('DaneSzukajPodmioty') ? 'DaneSzukajPodmioty' : body.includes('DanePobierzPelnyRaport') ? 'DanePobierzPelnyRaport' : 'Wyloguj'}</wsa:Action>
    <wsa:To>${getBaseUrl()}</wsa:To>
  </soap:Header>
  <soap:Body>${body}</soap:Body>
</soap:Envelope>`;
}

async function soapRequest(body: string, sid?: string): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/soap+xml; charset=utf-8',
  };
  if (sid) {
    headers['sid'] = sid;
  }

  const res = await fetch(getBaseUrl(), {
    method: 'POST',
    headers,
    body: soapEnvelope(body),
  });

  if (!res.ok) {
    throw new Error(`GUS API HTTP ${res.status}`);
  }

  return await res.text();
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractCData(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

async function login(): Promise<string> {
  const body = `<ns:Zaloguj><ns:pKluczUzytkownika>${getApiKey()}</ns:pKluczUzytkownika></ns:Zaloguj>`;
  const xml = await soapRequest(body);
  const sid = extractTag(xml, 'ZalogujResult');
  if (!sid) throw new Error('GUS login failed');
  return sid;
}

async function logout(sid: string): Promise<void> {
  const body = `<ns:Wyloguj><ns:pIdentyfikatorSesji>${sid}</ns:pIdentyfikatorSesji></ns:Wyloguj>`;
  await soapRequest(body, sid);
}

async function searchByNip(sid: string, nip: string): Promise<{ regon: string; type: string; silosId: string }> {
  const body = `<ns:DaneSzukajPodmioty>
    <ns:pParametryWyszukiwania>
      <ns:Nip>${nip}</ns:Nip>
    </ns:pParametryWyszukiwania>
  </ns:DaneSzukajPodmioty>`;

  const xml = await soapRequest(body, sid);
  const data = extractCData(xml, 'DaneSzukajPodmiotyResult') || extractTag(xml, 'DaneSzukajPodmiotyResult');

  if (!data || data.includes('ErrorCode')) {
    throw new Error('Nie znaleziono podmiotu o podanym NIP');
  }

  const regon = extractTag(data, 'Regon');
  const type = extractTag(data, 'Typ');
  const silosId = extractTag(data, 'SilosID');

  if (!regon) throw new Error('Brak REGON w odpowiedzi');

  return { regon, type, silosId };
}

function getReportName(type: string, silosId: string): string {
  // F = osoba fizyczna (JDG), P = osoba prawna, LP = jednostka lokalna osoby prawnej
  if (type === 'F') {
    // silosId: 1=JDG, 2=rolnik, 3=inna
    return 'BIR11OsFizycznaDaneOgolne';
  }
  if (type === 'P') {
    return 'BIR11OsPrawna';
  }
  // LP
  return 'BIR11OsPrawna';
}

async function getFullReport(sid: string, regon: string, reportName: string): Promise<string> {
  const body = `<ns:DanePobierzPelnyRaport>
    <ns:pRegon>${regon}</ns:pRegon>
    <ns:pNazwaRaportu>${reportName}</ns:pNazwaRaportu>
  </ns:DanePobierzPelnyRaport>`;

  const xml = await soapRequest(body, sid);
  return extractCData(xml, 'DanePobierzPelnyRaportResult') || extractTag(xml, 'DanePobierzPelnyRaportResult');
}

function parseCompanyData(reportXml: string, type: string, nip: string): GusCompanyResult {
  if (type === 'F') {
    // Osoba fizyczna — JDG
    const name = extractTag(reportXml, 'fiz_nazwa') || extractTag(reportXml, 'fiz_nazwaPelna') || '';
    return {
      name: name || `${extractTag(reportXml, 'fiz_imie1')} ${extractTag(reportXml, 'fiz_nazwisko')}`.trim(),
      nip,
      regon: extractTag(reportXml, 'fiz_regon9'),
      street: `${extractTag(reportXml, 'fiz_adSiedzUlica_Nazwa')} ${extractTag(reportXml, 'fiz_adSiedzNumerNieruchomosci')}`.trim(),
      buildingNumber: extractTag(reportXml, 'fiz_adSiedzNumerNieruchomosci'),
      apartmentNumber: extractTag(reportXml, 'fiz_adSiedzNumerLokalu'),
      postalCode: extractTag(reportXml, 'fiz_adSiedzKodPocztowy'),
      city: extractTag(reportXml, 'fiz_adSiedzMiejscowosc_Nazwa'),
      province: extractTag(reportXml, 'fiz_adSiedzWojewodztwo_Nazwa'),
      type: 'F',
    };
  }

  // Osoba prawna (sp. z o.o., S.A., etc.)
  const name = extractTag(reportXml, 'praw_nazwa') || '';
  return {
    name,
    nip,
    regon: extractTag(reportXml, 'praw_regon9') || extractTag(reportXml, 'praw_regon14'),
    street: `${extractTag(reportXml, 'praw_adSiedzUlica_Nazwa')} ${extractTag(reportXml, 'praw_adSiedzNumerNieruchomosci')}`.trim(),
    buildingNumber: extractTag(reportXml, 'praw_adSiedzNumerNieruchomosci'),
    apartmentNumber: extractTag(reportXml, 'praw_adSiedzNumerLokalu'),
    postalCode: extractTag(reportXml, 'praw_adSiedzKodPocztowy'),
    city: extractTag(reportXml, 'praw_adSiedzMiejscowosc_Nazwa'),
    province: extractTag(reportXml, 'praw_adSiedzWojewodztwo_Nazwa'),
    type: 'P',
  };
}

export async function lookupNip(nip: string): Promise<GusCompanyResult> {
  const cleanNip = nip.replace(/[^0-9]/g, '');
  if (cleanNip.length !== 10) {
    throw new Error('NIP musi mieć 10 cyfr');
  }

  const sid = await login();
  try {
    const { regon, type, silosId } = await searchByNip(sid, cleanNip);
    const reportName = getReportName(type, silosId);
    const reportXml = await getFullReport(sid, regon, reportName);

    if (!reportXml) {
      throw new Error('Brak danych w raporcie GUS');
    }

    return parseCompanyData(reportXml, type, cleanNip);
  } finally {
    await logout(sid).catch(() => {});
  }
}

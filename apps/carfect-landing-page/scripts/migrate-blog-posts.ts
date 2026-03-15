/**
 * Migration script: Seeds Sanity with blog posts from MDX files.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<token> npx tsx scripts/migrate-blog-posts.ts
 */

import { createClient } from '@sanity/client';

const projectId = 'ticwtj5d';
const dataset = 'production';
const apiVersion = '2024-01-01';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN environment variable');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

let keyCounter = 0;
function key() {
  keyCounter++;
  return `blog${keyCounter.toString(36).padStart(6, '0')}`;
}

// Helper to create a Portable Text block
function block(text: string, style: string = 'normal', markDefs: any[] = [], children?: any[]): any {
  return {
    _key: key(),
    _type: 'block',
    style,
    markDefs,
    children: children || [{ _key: key(), _type: 'span', text, marks: [] }],
  };
}

function span(text: string, marks: string[] = []): any {
  return { _key: key(), _type: 'span', text, marks };
}

function linkMarkDef(href: string): { _key: string; _type: string; href: string } {
  const k = key();
  return { _key: k, _type: 'link', href };
}

// Helpers for styled blocks
function h2(text: string) { return block(text, 'h2'); }
function h3(text: string) { return block(text, 'h3'); }
function h4(text: string) { return block(text, 'h4'); }
function normal(text: string) { return block(text, 'normal'); }
function blockquote(text: string) { return block(text, 'blockquote'); }

function boldSpan(text: string): any {
  return { _key: key(), _type: 'span', text, marks: ['strong'] };
}

function boldBlock(text: string) {
  return {
    _key: key(),
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [boldSpan(text)],
  };
}

function mixedBlock(children: any[], markDefs: any[] = []) {
  return {
    _key: key(),
    _type: 'block',
    style: 'normal',
    markDefs,
    children,
  };
}

function bulletItem(text: string) {
  return {
    _key: key(),
    _type: 'block',
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    markDefs: [],
    children: [span(text)],
  };
}

function numberedItem(text: string) {
  return {
    _key: key(),
    _type: 'block',
    style: 'normal',
    listItem: 'number',
    level: 1,
    markDefs: [],
    children: [span(text)],
  };
}

async function main() {
  console.log('Starting blog migration...\n');

  // ── 1. Create categories ──
  console.log('Creating blog categories...');

  await client.createOrReplace({
    _id: 'blogCategory-sprzedaz',
    _type: 'blogCategory',
    title: 'Sprzedaż',
    slug: { _type: 'slug', current: 'sprzedaz' },
  });
  console.log('  Category: Sprzedaż');

  await client.createOrReplace({
    _id: 'blogCategory-formalnosci',
    _type: 'blogCategory',
    title: 'Formalności',
    slug: { _type: 'slug', current: 'formalnosci' },
  });
  console.log('  Category: Formalności');

  // ── 2. Blog Post 1: 3 strategie ──
  console.log('\nCreating blog post: 3 strategie...');

  const post1Body = [
    h2('3 sprawdzone strategie na wzrost przychodów w studio detailingu'),
    normal('W branży auto detailingu panuje dziś ogromne wyrównanie. Większość studiów oferuje zbliżony zakres usług, posiada nienaganne opinie w Google (średnia 4.8–5.0) i prowadzi marketing na podobnym poziomie. Skoro wszyscy są „dobrzy", dlaczego jedni mają kalendarz pękający w szwach, a inni walczą o każde zlecenie?'),
    boldBlock('Odpowiedź jest prosta: wygrywa nie cena, a proces sprzedaży.'),
    normal('Oto 3 konkretne kroki, które możesz wdrożyć w swoim biznesie od zaraz – bez inwestowania w płatne reklamy i bez ryzykownej wojny cenowej.'),

    h2('1. Profesjonalna, szybka oferta plus kontakt'),
    normal('Większość właścicieli studiów popełnia ten sam błąd: wysyłają wycenę i czekają na ruch klienta. W świecie, gdzie oferty konkurencji wyglądają niemal identycznie, to relacja i szybkość reakcji stają się kluczowym czynnikiem decyzyjnym. A najgorsze co możesz zrobić to podać cenę przez telefon i już więcej się nie kontaktować.'),

    h3('Dlaczego telefon po wysłaniu oferty drastycznie zwiększa konwersję?'),
    normal('Firmy, które aktywnie kontaktują się z klientem po przedstawieniu propozycji, notują znacznie wyższą skuteczność zamknięcia sprzedaży. Taka rozmowa pozwala na:'),
    bulletItem('Rozwianie wątpliwości: Klient często boi się zapytać o szczegóły, nie zna się na temacie i porównuje tylko ceny.'),
    bulletItem('Budowanie zaufania: Pokazujesz, że zależy Ci na aucie klienta, a nie tylko na jego portfelu.'),
    bulletItem('Zaproszenie do studia: Nic nie sprzedaje lepiej niż prezentacja procesu pracy „na żywo" i wypicie wspólnej kawy.'),

    blockquote('Prosty schemat rozmowy: "Dzień dobry, wysłałem wczoraj ofertę na powłokę ceramiczną do Audi Q8. Chciałem zapytać, czy udało się z nią zapoznać i czy mogę pomóc w doprecyzowaniu zakresu prac?"'),

    h3('Wykorzystaj przewagę technologiczną'),
    normal('Szybkość to Twój najsilniejszy atut. Dzięki narzędziom takim jak generator ofert Carfect, przygotowanie profesjonalnej, estetycznej oferty zajmuje zaledwie 3 minuty. Możesz to zrobić bezpośrednio przy aucie, korzystając z telefonu.'),
    boldBlock('System pozwala również:'),
    bulletItem('Śledzić, kiedy klient otworzył ofertę – dzień PO, to idealny moment na wykonanie telefonu'),
    bulletItem('Zaznaczyć jednym kliknięciem, do której oferty już wykonałeś telefon, lub czy klient nie odebrał'),
    bulletItem('Dodać nowe pozycje do oferty, bez ponownej wysyłki maila - Klient zobaczy je automatycznie pod linkiem, który już dostał'),

    h2('2. Maksymalizuj wartość koszyka (Upselling)'),
    normal('Najprostszym sposobem na zwiększenie marży jest zaproponowanie usług dodatkowych do głównego zlecenia. Pamiętaj: klient nie kupi tego, czego nie widzi w Twojej ofercie lub o czym mu nie powiesz.'),
    normal('Jako ekspert masz obowiązek doradzić klientowi najlepsze rozwiązanie. Wiele osób nie ma świadomości, że:'),
    numberedItem('Tapicerkę można skutecznie zaimpregnować przed zalaniem.'),
    numberedItem('Felgi wymagają dedykowanej ochrony ceramicznej.'),
    numberedItem('Front auta warto zabezpieczyć folią PPF, nawet przy nakładaniu powłoki na resztę karoserii.'),

    h3('Jak wdrożyć systemowy Upsell?'),
    normal('Zamiast polegać na pamięci pracowników, zautomatyzuj ten proces. W generatorze ofert warto ustawić stałe moduły z dodatkami. Statystyki pokazują, że jeśli 4 na 10 klientów dokupi usługę za 600 zł, Twój miesięczny przychód wzrośnie o kilka tysięcy złotych przy tym samym nakładzie pracy na pozyskanie leada.'),

    h2('3. Aktywacja bazy klientów – Twój „uśpiony" kapitał'),
    normal('Pozyskanie nowego klienta jest znacznie trudniejsze niż utrzymanie obecnego. Tymczasem największy potencjał zarobkowy drzemie w Twoim archiwum zleceń. Powracający klient już Ci ufa, zna Twoją jakość i nie negocjuje stawek tak twardo, jak nowa osoba.'),

    h3('Naturalne punkty styku w detailingu:'),
    bulletItem('Folia PPF – po 12 miesiącach: przegląd gwarancyjny i serwis folii'),
    bulletItem('Powłoka ceramiczna – co 7-8 miesięcy: odświeżenie powłoki'),

    h3('Automatyzacja przypomnień'),
    normal('Ręczne przeszukiwanie kalendarza w poszukiwaniu klientów sprzed roku jest czasochłonne. System Carfect pozwala na ustawienie automatycznych powiadomień SMS, które wyślą się same w określonym czasie po usłudze. To gwarancja stałego strumienia wysoko marżowych zleceń serwisowych.'),

    h2('Podsumowanie: Proces wygrywa z przypadkiem'),
    normal('Zwiększenie zysków w studiu detailingu nie wymaga zakupu droższego sprzętu ani drastycznych obniżek cen. Kluczem jest uporządkowany proces sprzedaży:'),
    bulletItem('Błyskawiczna oferta (najlepiej w ciągu 24h od zapytania).'),
    bulletItem('Dobrze opisane produkty i zakres oferty.'),
    bulletItem('Podkreślenie mocnych stron Twojego studia - dlaczego właśnie warto u Ciebie wykonać usługę.'),
    bulletItem('Aktywny kontakt telefoniczny dzień później.'),
    bulletItem('Systemowe proponowanie dodatków przy każdej wycenie.'),
    bulletItem('Automatyczne przypomnienia SMS do klientów, którzy już skorzystali z Twoich usług.'),
  ];

  await client.createOrReplace({
    _id: 'blogPost-3-strategie',
    _type: 'blogPost',
    title: 'Trzy sprawdzone strategie na wzrost przychodów w studio detailingu',
    slug: { _type: 'slug', current: '3-sposoby-zwiekszenie-przychodow-studia-detailingu' },
    excerpt: 'W branży auto detailingu panuje dziś ogromne wyrównanie. Dowiedz się, jak wygrać bez obniżania cen – dzięki profesjonalnemu procesowi sprzedaży.',
    author: 'Carfect Team',
    publishedAt: '2026-02-15T10:00:00Z',
    featured: false,
    category: { _type: 'reference', _ref: 'blogCategory-sprzedaz' },
    body: post1Body,
    seo: {
      metaTitle: 'Trzy sprawdzone strategie na wzrost przychodów w studio detailingu',
      metaDescription: 'W branży auto detailingu panuje dziś ogromne wyrównanie. Dowiedz się, jak wygrać bez obniżania cen – dzięki profesjonalnemu procesowi sprzedaży.',
    },
  });
  console.log('  Post 1 created: 3 strategie');

  // ── 3. Blog Post 2: BDO ──
  console.log('\nCreating blog post: BDO...');

  const post2Body = [
    h2('Formalności środowiskowe w studio detailingu. Kompletny przewodnik krok po kroku'),
    normal('Otwierasz studio detailingowe i ktoś rzucił Ci hasło „BDO" albo „separator"? Nie wiesz, od czego zacząć, ile to kosztuje i co Ci grozi? Ten artykuł przeprowadzi Cię przez cały proces — od znalezienia lokalu po pierwszą kontrolę WIOŚ.'),
    normal('Zebraliśmy dane z realnych kontroli, wyroków sądowych i doświadczeń właścicieli studiów. Bez lania wody.'),

    h2('Czy to w ogóle dotyczy mojego studia?'),
    normal('Zanim wejdziesz w szczegóły, odpowiedz sobie na trzy pytania:'),
    boldBlock('1. Czy myjesz samochody w studio? Jeśli tak — musisz wiedzieć co robić z brudną wodą.'),
    boldBlock('2. Czy używasz chemii (szampony, APC, powłoki, tar removery)? Jeśli tak — puste opakowania i zużyte fibry to odpady, które podlegają ewidencji.'),
    boldBlock('3. Czy generujesz JAKIEKOLWIEK odpady inne niż zwykłe śmieci biurowe? Brudne mikrofibry, rękawiczki, pady, odzież robocza? Jeśli tak — potrzebujesz BDO.'),
    normal('Jeśli na choćby jedno pytanie odpowiedziałeś „tak" — czytaj dalej.'),

    h2('Krok po kroku: Co robić i w jakiej kolejności'),

    h3('Krok 1: Sprawdź MPZP lokalizacji'),
    normal('Zanim podpiszesz umowę najmu — sprawdź Miejscowy Plan Zagospodarowania Przestrzennego w urzędzie gminy. MPZP decyduje, czy w danym miejscu w ogóle możesz prowadzić studio.'),
    normal('Na co zwrócić uwagę:'),
    bulletItem('Czy teren jest przeznaczony pod usługi (oznaczenie U) lub działalność produkcyjno-usługową.'),
    bulletItem('Czy plan nie ogranicza działalności do „nieuciążliwej" — bo detailing z chemią i wodą może zostać tak zakwalifikowany.'),
    bulletItem('Czy nie ma zapisów wykluczających działalność motoryzacyjną.'),
    normal('Detailing w lokalu po warsztacie, w strefie przemysłowej — zazwyczaj bezpieczna opcja. Detailing w garażu przy bloku mieszkalnym — ryzykowna.'),
    blockquote('UWAGA: Kary za prowadzenie działalności niezgodnej z MPZP zaczynają się od 50 000 PLN. Weryfikacja kosztuje 0 PLN i zajmuje 1 dzień.'),

    h3('Krok 2: Wybierz PKD i zarejestruj działalność'),
    normal('Najczęściej stosowane PKD to 45.20.Z (konserwacja i naprawa pojazdów samochodowych). Niektórzy stosują PKD związane z „myciem parowym" — to upraszcza formalności, ale niesie ryzyko jeśli faktyczny charakter pracy jest inny niż deklarowany.'),

    h3('Krok 3: Zdecyduj co robisz z brudną wodą'),
    normal('To kluczowa decyzja — determinuje prawie wszystkie pozostałe formalności. Masz 3 opcje: mata + mauzer (najtańsza), szambo, lub kanalizacja z separatorem (najdroższa).'),
    normal('Większość nowych studiów startuje z matą + mauzerem — najtańsze na start, bez przeróbek lokalu.'),

    h3('Krok 4: Zarejestruj się w BDO'),
    normal('BDO (Baza Danych o Odpadach) — rejestr, w którym musisz się znaleźć jeśli wytwarzasz odpady inne niż komunalne.'),
    normal('Dlaczego Cię to dotyczy? Bo wytwarzasz: brudne mikrofibry, rękawiczki, odzież roboczą, opakowania po chemii, brudną wodę z mycia, zużyte świetlówki, baterie.'),
    blockquote('Odpady niebezpieczne (z gwiazdką *) nie mają żadnego limitu — od 0 kg musisz je ewidencjonować.'),
    normal('Jak się zarejestrować?'),
    numberedItem('Online na rejestr-bdo.mos.gov.pl.'),
    numberedItem('Telefonicznie w Urzędzie Marszałkowskim — urzędnicy przeprowadzą Cię przez proces.'),
    numberedItem('Sprawdź ankietę BDO na bdo.mos.gov.pl/ankieta/'),
    normal('Koszt: 200 PLN/rok. Czas: rejestracja ~30 min, nadanie numeru — kilka dni do kilku tygodni.'),

    h3('Krok 5: Podpisz umowy i przygotuj halę'),
    boldBlock('Trzy umowy:'),
    numberedItem('Firma odbierająca odpady BDO — musi mieć zezwolenia na Twoje kody.'),
    numberedItem('Odpady komunalne — standardowa umowa jak w każdej firmie.'),
    numberedItem('Firma asenizacyjna / MPWiK (jeśli szambo) — każdy wywóz na fakturę.'),

    h3('Krok 6: Prowadź ewidencję'),
    normal('Jeśli wytwarzasz mniej niż 100 kg odpadów niebezpiecznych rocznie (większość studiów), możesz prowadzić uproszczoną ewidencję. Raz w roku (do 15 marca) składasz sprawozdanie roczne elektronicznie w BDO.'),

    h2('Ile to wszystko kosztuje?'),
    normal('Wariant minimum (mata + mauzer): około 2 000 – 3 500 PLN na start. Wariant z kanalizacją: około 15 000 – 35 000+ PLN.'),
    normal('Większość nowych studiów startuje z wariantem minimum. To wystarczy, żeby działać legalnie.'),

    h2('Twoje odpady — pełna tabela kodów'),
    normal('WIOŚ sprawdza wszystko, co staje się odpadem w trakcie pracy:'),
    bulletItem('15 02 02* — Tkaniny zanieczyszczone substancjami niebezpiecznymi (mikrofibry, pady, rękawiczki)'),
    bulletItem('16 10 02 — Uwodnione odpady ciekłe (brudna woda z mycia)'),
    bulletItem('15 01 10* — Opakowania z resztkami substancji niebezpiecznych (butelki po chemii)'),
    bulletItem('15 01 02 — Opakowania z tworzyw sztucznych (wypłukane bańki po szamponach)'),
    bulletItem('17 02 03 — Tworzywa sztuczne (ścinki folii PPF)'),
    bulletItem('16 02 14 — Zużyte urządzenia elektroniczne'),
    bulletItem('16 06 04 — Baterie alkaliczne'),
    blockquote('Kody z gwiazdką (*) = odpady niebezpieczne. Brak limitu zwolnienia z BDO — od 0 kg musisz ewidencjonować.'),

    h2('Kontrola WIOŚ — jak się przygotować'),
    h3('Co sprawdza inspektor?'),
    numberedItem('Przedstawia się — legitymacja, informacja czego dotyczy kontrola.'),
    numberedItem('Obchodzi halę i plac — zdjęcia wszystkiego. Pytania o usługi, częstotliwość mycia, używane środki.'),
    numberedItem('Sprawdza chemię — losowe produkty z półki, karty charakterystyki (sekcja 12 i 13).'),
    numberedItem('Spisuje protokół — ustalenia i ewentualne naruszenia.'),

    h3('Checklist na kontrolę'),
    bulletItem('Wpis do BDO (lub pisemne uzasadnienie dlaczego go nie masz)'),
    bulletItem('Karty Charakterystyki wszystkich produktów (sekcja 12 i 13)'),
    bulletItem('Umowa z firmą odbierającą odpady (z kodami w BDO)'),
    bulletItem('Umowa na odpady komunalne'),
    bulletItem('Faktury za KAŻDY wywóz szamba / mauzera'),
    bulletItem('Oznaczone pojemniki na odpady z kodami BDO'),
    bulletItem('Szczelny mauzer lub szambo na utwardzonym podłożu'),
    bulletItem('Zgoda właściciela lokalu na magazynowanie odpadów (jeśli wynajem)'),
    bulletItem('Ewidencja odpadów / Karty Przekazania Odpadu (KPO)'),
    bulletItem('Numer BDO na fakturach sprzedażowych'),

    h2('Twój checklist na start'),
    bulletItem('Sprawdź MPZP lokalizacji (urząd gminy)'),
    bulletItem('Zarejestruj działalność z odpowiednim PKD'),
    bulletItem('Zdecyduj: mata + mauzer / szambo / kanalizacja'),
    bulletItem('Zarejestruj się w BDO (rejestr-bdo.mos.gov.pl)'),
    bulletItem('Umieść numer BDO na fakturach'),
    bulletItem('Podpisz umowę z firmą odbierającą odpady BDO'),
    bulletItem('Podpisz umowę na odpady komunalne'),
    bulletItem('Postaw mauzer / szambo na szczelnym podłożu'),
    bulletItem('Oznacz pojemniki kodami odpadów'),
    bulletItem('Zbierz karty charakterystyki produktów (sekcja 12 i 13)'),
    bulletItem('Archiwizuj faktury za każdy wywóz'),
    bulletItem('Złóż sprawozdanie roczne BDO do 15 marca'),
  ];

  await client.createOrReplace({
    _id: 'blogPost-bdo',
    _type: 'blogPost',
    title: 'BDO dla studia detailingu – co musisz wiedzieć?',
    slug: { _type: 'slug', current: 'bdo-dla-studia-detailing-co-musisz-wiedziec' },
    excerpt: 'Rejestracja w BDO to obowiązek każdego studia detailingowego. Dowiedz się, krok po kroku, jak się zarejestrować, jakie kody odpadów wybrać i ile to kosztuje.',
    author: 'Carfect Team',
    publishedAt: '2026-02-16T10:00:00Z',
    featured: true,
    category: { _type: 'reference', _ref: 'blogCategory-formalnosci' },
    body: post2Body,
    seo: {
      metaTitle: 'BDO dla studia detailingu – co musisz wiedzieć?',
      metaDescription: 'Rejestracja w BDO to obowiązek każdego studia detailingowego. Dowiedz się, krok po kroku, jak się zarejestrować, jakie kody odpadów wybrać i ile to kosztuje.',
    },
  });
  console.log('  Post 2 created: BDO');

  console.log('\nBlog migration complete!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

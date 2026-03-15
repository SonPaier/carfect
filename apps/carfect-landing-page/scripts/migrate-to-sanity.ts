/**
 * Migration script: Seeds Sanity with all content from the landing page.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<token> npx tsx scripts/migrate-to-sanity.ts
 *
 * Idempotent: uses createOrReplace with deterministic _id values.
 */

import { createClient } from '@sanity/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectId = 'ticwtj5d';
const dataset = 'production';
const apiVersion = '2024-01-01';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN environment variable');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const ASSETS_DIR = join(__dirname, '..', 'src', 'assets');

// ── Helpers ──

type SanityImageRef = { _type: 'image'; asset: { _type: 'reference'; _ref: string } };

async function uploadImage(filename: string, label?: string): Promise<SanityImageRef> {
  const filepath = join(ASSETS_DIR, filename);
  const buffer = readFileSync(filepath);
  const asset = await client.assets.upload('image', buffer, {
    filename,
    label: label || filename,
  });
  console.log(`  Uploaded: ${filename} -> ${asset._id}`);
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
}

let keyCounter = 0;
function key() {
  keyCounter++;
  return `k${keyCounter.toString(36).padStart(6, '0')}`;
}

function slug(s: string) {
  return { _type: 'slug' as const, current: s };
}

// ── Main migration ──

async function main() {
  console.log('Starting Sanity migration...\n');

  // ── 1. Upload images ──
  console.log('Uploading images...');
  const images: Record<string, SanityImageRef> = {};

  const imageMap: Record<string, string> = {
    heroBg: 'car-detailing-myjnia-reczna-hero.webp',
    appDesktop: 'app-desktop.png',
    appMobile: 'crm-kalendarz-mobile.png',
    benefit1: 'kalendarz-rezerwacji-myjnia-reczna-korzysci-1.webp',
    benefit2: 'kalendarz-rezerwacji-myjnia-reczna-korzysci-2.webp',
    benefit3: 'kalendarz-rezerwacji-myjnia-reczna-korzysci-3.webp',
    benefit4: 'kalendarz-rezerwacji-myjnia-reczna-korzysci-4.webp',
    benefit5: 'kalendarz-rezerwacji-myjnia-reczna-korzysci-5.webp',
    benefit6: 'kalendarz-rezerwacji-myjnia-reczna-korzysci-6.webp',
    logoArmcar: 'logo-armcar.png',
    caseStudy1: 'studio-car-detailing-case-study-armcar-gdansk.jpg',
    caseStudy2: 'studio-car-detailing-case-study-armcar-gdansk-2.webp',
    caseStudy3: 'studio-car-detailing-case-study-armcar-gdansk-3.jpg',
    kalendarz: 'studio-detailing-myjnia-reczna-kalendarz.png',
    kalendarzMobile: 'studio-detailing-myjnia-reczna-kalendarz-rezerwacji-telefon.png',
    zewnetrznyKalendarz: 'studio-car-detailing-myjnia-reczna-zewnetrzny-kalendarz.webp',
    smsPrzypomnienie: 'studio-detailing-przypomnienia-sms-powloki-ceramiczne.webp',
    szablonyOfert: 'studio-detailing-szablony-ofert.webp',
    protokol: 'studio-detailing-protokol-przyjecia-samochodu.webp',
    crmMyjniaView: 'crm-studio-detailing-myjnia-reczna.webp',
    crmSmsPrzypomnienie: 'crm-sms-przypomnienie.jpg',
    ofertaKlient: 'studio-detailing-oferta-klient.webp',
    listaOfert: 'studio-detailingu-lista-ofert.webp',
    raportCzasuPracy: 'myjnia-reczna-studio-car-detailing-raport-czasu-pracy.webp',
  };

  for (const [k, filename] of Object.entries(imageMap)) {
    try {
      images[k] = await uploadImage(filename, k);
    } catch (e) {
      console.warn(`  Failed to upload ${filename}: ${(e as Error).message}`);
    }
  }

  // ── 2. Site Settings ──
  console.log('\nCreating siteSettings...');
  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: 'Carfect.pl',
    defaultSeo: {
      metaTitle: 'Carfect.pl - CRM i System Rezerwacji dla Myjni i Detailingu',
      metaDescription: 'Skup się na detailingu, chaos zostaw nam. Poznaj CRM i system rezerwacji stworzony przy udziale doświadczonych detailerów i właścicieli myjni samochodowych.',
    },
    header: {
      navLinks: [
        {
          _key: key(), label: 'CRM', href: '/crm',
          children: [
            { _key: key(), label: 'CRM dla myjni samochodowych', href: '/crm/crm-dla-myjni-samochodowych' },
            { _key: key(), label: 'CRM dla studia detailingu', href: '/crm/crm-dla-studia-detailingu' },
          ],
        },
        {
          _key: key(), label: 'Funkcje', href: '/funkcje',
          children: [
            { _key: key(), label: 'Kalendarz rezerwacji', href: '/funkcje/kalendarz-rezerwacji' },
            { _key: key(), label: 'Generator ofert', href: '/funkcje/generator-ofert' },
            { _key: key(), label: 'SMS przypomnienia', href: '/funkcje/sms-przypomnienia' },
            { _key: key(), label: 'Zarządzanie zespołem', href: '/funkcje/zarzadzanie-zespolem' },
            { _key: key(), label: 'Protokół przyjęcia pojazdu', href: '/funkcje/protokol-przyjecia-pojazdu' },
            { _key: key(), label: 'Analityka i raporty', href: '/funkcje/analityka-raporty' },
          ],
        },
        { _key: key(), label: 'Cennik', href: '/cennik-crm-myjnia-detailing' },
        { _key: key(), label: 'Historie Klientów', href: '/case-studies' },
        { _key: key(), label: 'Dlaczego Carfect?', href: '/dlaczego-carfect' },
        { _key: key(), label: 'Blog', href: '/blog' },
        { _key: key(), label: 'Kontakt', href: '/kontakt' },
      ],
      ctaText: 'Umów prezentację',
      ctaLink: '/umow-prezentacje',
    },
    footer: {
      email: 'hello@carfect.pl',
      phone: '+48 666 610 222',
      address: '',
      socialLinks: [],
    },
    contact: {
      email: 'hello@carfect.pl',
      phone1: '+48 666 610 222',
      phone2: '+48 666 610 011',
      companyName: 'Carfect.pl',
    },
    cookieBanner: {
      text: 'Ta strona używa plików cookies w celu zapewnienia najlepszej jakości usług. Kontynuując przeglądanie, wyrażasz zgodę na ich użycie.',
      acceptText: 'Akceptuję',
      rejectText: 'Odrzuć',
      privacyLink: '/polityka-prywatnosci',
    },
    gaId: 'G-7R7MH3MMJK',
  });
  console.log('  siteSettings created');

  // ── 3. Pricing Config ──
  console.log('\nCreating pricingConfig...');
  await client.createOrReplace({
    _id: 'pricingConfig',
    _type: 'pricingConfig',
    pricePerStation: 75,
    currency: 'zł',
    currencyCode: 'PLN',
    labels: {
      perStation: 'za stanowisko',
      perMonth: 'miesięcznie',
      perYear: 'rocznie',
      stations: 'stanowiska',
      station: 'stanowisko',
      monthly: 'Miesięcznie',
      yearly: 'Rocznie',
      yearlyDiscount: '20% taniej',
      totalMonthly: 'Razem miesięcznie',
      totalYearly: 'Razem rocznie',
      cta: 'Umów prezentację',
    },
    yearlyDiscountPercent: 20,
    additionalModules: {
      title: 'Moduły dodatkowe',
      subtitle: 'Wycena indywidualna',
      items: [
        { _key: key(), title: 'Widok dla pracowników', icon: 'monitor' },
        { _key: key(), title: 'Tworzenie i zarządzanie ofertami detailingu', icon: 'file-text' },
        { _key: key(), title: 'Protokoły przyjęcia pojazdu', icon: 'clipboard-check' },
        { _key: key(), title: 'Wsparcie sprzedaży', icon: 'trending-up' },
        { _key: key(), title: 'Zaawansowana analityka i raporty', icon: 'bar-chart-3' },
      ],
    },
  });
  console.log('  pricingConfig created');

  // ── 4. Homepage ──
  console.log('\nCreating homepage...');
  await client.createOrReplace({
    _id: 'page-home',
    _type: 'page',
    title: 'Strona główna',
    slug: slug('home'),
    seo: {
      metaTitle: 'Carfect.pl - CRM i System Rezerwacji dla Myjni i Detailingu',
      metaDescription: 'Skup się na detailingu, chaos zostaw nam. Poznaj CRM i system rezerwacji stworzony przy udziale doświadczonych detailerów i właścicieli myjni samochodowych.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Skup się na detailingu, chaos zostaw nam.',
        subheading: 'Poznaj jedyny CRM i system rezerwacji stworzony przy udziale doświadczonych detailerów i właścicieli myjni ręcznych.',
        ctaText: 'Umów się na prezentację',
        variant: 'gradient-dark',
        backgroundImage: images.heroBg,
      },
      {
        _key: key(), _type: 'appPreviewSection',
        heading: 'Jeden system, wszystkie urządzenia',
        subtitle: 'Zarządzaj rezerwacjami z laptopa, tabletu lub telefonu',
        desktopImage: images.appDesktop,
        mobileImage: images.appMobile,
      },
      {
        _key: key(), _type: 'benefitsZigZagSection',
        sectionTitle: 'Dlaczego Carfect.pl?',
        sectionSubtitle: 'Korzyści, które zmienią Twój biznes',
        items: [
          {
            _key: key(),
            title: 'Centrum Dowodzenia: pełna kontrola bez chaosu',
            subtitle: 'Zapomnij o zeszytach i rozrzuconych notatkach. Twój główny kalendarz to inteligentne serce firmy, które łączy grafik z bazą klientów.',
            points: [
              'Koniec z chaosem: Intuicyjny widok, który pozwala błyskawicznie sprawdzić obłożenie i statusy prac.',
              'Baza klientów na wyciągnięcie ręki: Każda rezerwacja jest połączona z profilem klienta.',
              'Błyskawiczny kontakt: Klikasz w rezerwację i dzwonisz do klienta prosto z aplikacji.',
              'Wszystko w jednym miejscu: Sprawdzaj terminy, twórz oferty i zarządzaj zespołem.',
            ],
            image: images.benefit1,
          },
          {
            _key: key(),
            title: 'Twój biznes działa 24/7 – nawet gdy śpisz',
            subtitle: 'Klienci rezerwują usługi wtedy, gdy o nich myślą – często wieczorami lub w weekendy.',
            points: [
              'Rezerwacje 24/7: Zewnętrzny kalendarz pozwala klientom bookować terminy bez zakładania konta.',
              'Mniej telefonów, więcej spokoju: Każda rezerwacja online to o jeden telefon mniej.',
              'Wygoda dla klienta: Możliwość zmiany lub odwołania wizyty dwoma kliknięciami.',
              'Automatyczne przypomnienia: SMS-y o nadchodzących wizytach redukują no-show.',
            ],
            image: images.benefit2,
          },
          {
            _key: key(),
            title: 'Maksymalna wydajność hali i zero pomyłek',
            subtitle: 'Twój zespół zawsze wie, co robić, a Ty masz pełną kontrolę nad grafikiem.',
            points: [
              'Precyzyjne planowanie: Czas usługi automatycznie dostosowany do rozmiaru auta.',
              'Podgląd na żywo dla pracowników: Ekran na hali zastępuje bieganie do biura.',
              'Zarządzanie zespołem: Planuj prace w oparciu o realną dostępność załogi.',
            ],
            image: images.benefit3,
          },
          {
            _key: key(),
            title: 'Wyższe zyski dzięki profesjonalnym ofertom',
            subtitle: 'Przestań tracić pieniądze przez zapomniane dodatki i nieaktualne cenniki.',
            points: [
              'Błyskawiczny detailing: Twórz profesjonalnie wyglądające oferty w kilka minut.',
              'Wsparcie sprzedaży: System automatycznie podpowiada usługi dodatkowe.',
              'Pilnujemy Twoich pieniędzy: System pamięta o klientach po usługach premium.',
            ],
            image: images.benefit4,
          },
          {
            _key: key(),
            title: 'Pełna kontrola nad zespołem',
            subtitle: 'Miej realny wgląd w pracę załogi i planuj grafik w oparciu o faktyczną dostępność.',
            points: [
              'Ewidencja czasu pracy: Pracownicy raportują czas bezpośrednio z tabletu lub telefonu.',
              'Przypisywanie do stanowisk: Określ, kto pracuje na jakim stanowisku.',
              'Planowanie grafiku: Układaj dyżury w oparciu o dostępność załogi i obłożenie.',
            ],
            image: images.benefit5,
          },
          {
            _key: key(),
            title: 'Koniec z papierami – profesjonalne protokoły przyjęć',
            subtitle: 'Dokumentuj stan pojazdu szybko, czytelnie i bezpiecznie.',
            points: [
              'Bez kartek i bałaganu: Protokół uzupełniony już o dane z oferty.',
              'Zdjęcia w jednym miejscu: Wgraj zdjęcia stanu auta bezpośrednio do protokołu.',
              'Automatyczna wysyłka i podpis: Protokół trafia do klienta automatycznie.',
            ],
            image: images.benefit6,
          },
        ],
      },
      {
        _key: key(), _type: 'testimonialsSection',
        heading: 'Opinie naszych klientów',
        testimonials: [
          {
            _key: key(),
            name: 'Armen',
            company: 'ARM-CAR Detailing & Wrapping',
            companyUrl: 'https://armcarautospa.pl/',
            location: 'Gdańsk',
            text: 'Na początku byłem sceptyczny, ale ten system serio ułatwił mi życie. Z kalendarza łatwo się korzysta na telefonie - wiem kto i kiedy przyjeżdża, nie muszę wszystkiego pamiętać. Podsumowując: mniej chaosu, mniej gadania, więcej czasu na rozwój biznesu.',
            rating: 5,
            logo: images.logoArmcar,
          },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Wypróbuj bezpłatnie przez 14 dni.\nBez karty i zobowiązań!',
        ctaText: 'Umów prezentację',
        ctaLink: '/umow-prezentacje',
      },
      {
        _key: key(), _type: 'pricingSection',
        heading: 'Prosty i przejrzysty cennik',
        subheading: 'Płacisz tylko za to, czego potrzebujesz',
        plans: [
          {
            _key: key(), name: 'Myjnia', price: '89',
            period: 'za pierwsze stanowisko / miesiąc',
            features: [
              'Główny kalendarz', 'Rezerwacje online 24/7', '100 powiadomień SMS',
              'Zarządzanie relacjami z klientami', 'Zarządzanie zespołem',
              'Obsługa aut z placu', 'Widok dla pracowników', 'Analityka i raporty',
            ],
            ctaText: 'Umów prezentację', ctaLink: '/umow-prezentacje', highlighted: false,
          },
          {
            _key: key(), name: 'Detailing', price: '139',
            period: 'za pierwsze stanowisko / miesiąc',
            features: [
              'Tworzenie i zarządzanie ofertami detailingu', 'Protokół przyjęcia pojazdu',
              'Wsparcie sprzedaży', 'Automatyczne przypomnienia o przeglądach serwisowych',
            ],
            ctaText: 'Umów prezentację', ctaLink: '/umow-prezentacje', highlighted: true,
          },
        ],
      },
    ],
  });
  console.log('  Homepage created');

  // ── 5. Kalendarz Rezerwacji ──
  console.log('\nCreating feature pages...');
  await client.createOrReplace({
    _id: 'page-funkcje-kalendarz-rezerwacji',
    _type: 'page',
    title: 'Kalendarz Rezerwacji',
    slug: slug('funkcje-kalendarz-rezerwacji'),
    seo: {
      metaTitle: 'Kalendarz Rezerwacji dla Myjni i Detailingu | Carfect',
      metaDescription: 'Widok dzienny i tygodniowy, przypisanie rezerwacji do stanowisk. Rezerwacje 24/7 bez telefonów.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Kalendarz Rezerwacji dla Myjni i Detailingu',
        subheading: 'Widok dzienny i tygodniowy, przypisanie rezerwacji do stanowisk. Rezerwacje 24/7 bez telefonów.',
        ctaText: 'Umów prezentację',
        variant: 'gradient-dark',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Jak działa kalendarz rezerwacji Carfect?',
        description: 'Intuicyjny widok, który łączy grafik z bazą klientów. Wszystko czytelne na Twoim telefonie. Każda rezerwacja jest połączona z profilem klienta – historia wizyt, numery telefonów i pojazdy dostępne jednym kliknięciem.',
        image: images.kalendarz,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Widoki kalendarza',
        columns: 3,
        items: [
          { _key: key(), icon: 'calendar-days', title: 'Widok dzienny', description: 'Szczegółowy podział na godziny z wszystkimi stanowiskami obok siebie. Widzisz obłożenie całego dnia na jednym ekranie.' },
          { _key: key(), icon: 'calendar', title: 'Widok tygodniowy', description: 'Przegląd całego tygodnia pozwala planować z wyprzedzeniem. Szybko identyfikujesz wolne terminy i optymalizujesz grafik.' },
          { _key: key(), icon: 'layers', title: 'Widok stanowisk', description: 'Każde stanowisko jako osobna kolumna z kolorowymi oznaczeniami usług. Pracownicy widzą zmiany w czasie rzeczywistym.' },
        ],
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Wygodna edycja',
        description: 'Przenoś rezerwacje między stanowiskami i godzinami jednym ruchem. Klikasz w rezerwację – edytujesz szczegóły, dzwonisz do klienta prosto z aplikacji albo zmieniasz status.',
        image: images.benefit1,
        imagePosition: 'left',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Rezerwacje wielodniowe',
        description: 'Idealne dla studiów detailingu – usługi takie jak położenie folii PPF czy powłoki ceramicznej to praca od 2 do 5 dni. Kalendarz pozwala szybko dodać rezerwację wielodniową.',
        image: images.benefit2,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Przerwy i dni wolne',
        columns: 2,
        items: [
          { _key: key(), icon: 'pause', title: 'Blokowanie godzin lub całych dni', description: 'Jednym kliknięciem blokujesz godziny na przerwę techniczną, konserwację sprzętu czy szkolenie zespołu.' },
          { _key: key(), icon: 'users', title: 'Urlopy pracowników', description: 'Planuj nieobecności zespołu bezpośrednio w kalendarzu. System uwzględnia dostępność załogi przy planowaniu grafiku.' },
        ],
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Zewnętrzny kalendarz to rezerwacje przez całą dobę',
        description: 'Zewnętrzny kalendarz dla Twoich klientów, pozwala im rezerwować terminy bez zakładania konta – Ty tylko je potwierdzasz. Każda rezerwacja online to o jeden telefon mniej.',
        image: images.zewnetrznyKalendarz,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Automatyczne potwierdzenia SMS',
        description: 'SMS-y o nadchodzących wizytach redukują liczbę klientów, którzy nie przyjeżdżają. Potwierdzenie rezerwacji, przypomnienie 24h przed wizytą – wszystko automatycznie.',
        image: images.smsPrzypomnienie,
        imagePosition: 'left',
      },
      {
        _key: key(), _type: 'relatedFeaturesSection',
        heading: 'Powiązane funkcje',
        items: [
          { _key: key(), icon: 'bell', title: 'SMS przypomnienia', description: 'Automatyczne powiadomienia dla klientów', href: '/funkcje/sms-przypomnienia' },
          { _key: key(), icon: 'users', title: 'Zarządzanie zespołem', description: 'Grafiki, urlopy i uprawnienia', href: '/funkcje/zarzadzanie-zespolem' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Wypróbuj kalendarz Carfect',
        subheading: 'Zobacz jak łatwo zarządzać rezerwacjami w Twojej myjni lub studiu detailingu. 30 dni za darmo, bez zobowiązań.',
        ctaText: 'Umów bezpłatną prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Kalendarz rezerwacji created');

  // ── 6. Generator Ofert ──
  await client.createOrReplace({
    _id: 'page-funkcje-generator-ofert',
    _type: 'page',
    title: 'Generator Ofert',
    slug: slug('funkcje-generator-ofert'),
    seo: {
      metaTitle: 'Generator Ofert Detailingowych – Twórz Profesjonalne Wyceny | Carfect',
      metaDescription: 'Kreator ofert z wariantami cenowymi, dodatkami i automatyczną wysyłką e-mail. Publiczny link dla klienta zwiększa skuteczność sprzedaży.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Generator Ofert Detailingowych – Twórz Profesjonalne Wyceny w 5 Minut',
        subheading: 'Kreator ofert z wariantami cenowymi, dodatkami i automatyczną wysyłką e-mail. Publiczny link dla klienta zwiększa skuteczność sprzedaży.',
        ctaText: 'Umów prezentację',
        variant: 'gradient-dark',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Dlaczego profesjonalna oferta ma znaczenie?',
        description: 'Klient, który dostaje profesjonalną ofertę z logo Twojej firmy, wariantami cenowymi i czytelnym opisem usług – traktuje Cię poważniej. To buduje zaufanie i pozwala uzasadnić wyższe ceny.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'metricsSection',
        heading: 'Efekty w liczbach',
        items: [
          { _key: key(), value: '5 minut', label: 'Tyle zajmuje stworzenie oferty', icon: 'clock' },
          { _key: key(), value: '+20%', label: 'skuteczności sprzedaży', icon: 'check-circle' },
          { _key: key(), value: 'Twoj branding', label: 'Logo, kolory firmowe, dane kontaktowe', icon: 'palette' },
        ],
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Jak stworzyć ofertę w Carfect?',
        description: 'Gotowe szablony dla PPF, powłok ceramicznych, korekty lakieru czy detailingu wnętrza. Dodawaj warianty cenowe, opcjonalne dodatki i rabaty. System automatycznie kalkuluje ceny.',
        image: images.szablonyOfert,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Publiczny link dla klienta',
        columns: 2,
        items: [
          { _key: key(), icon: 'mail', title: 'Wyślij bezpośrednio z systemu', description: 'Jednym kliknięciem wysyłasz ofertę do klienta prosto z aplikacji. Link do oferty trafia na email lub SMS.' },
          { _key: key(), icon: 'eye', title: 'Klient ogląda ofertę w przeglądarce', description: 'Klient otwiera link i widzi ofertę dopasowaną do telefonu lub komputera. Przejrzysty układ, bez pobierania plików.' },
          { _key: key(), icon: 'palette', title: 'Branding Twojej firmy', description: 'Oferta z Twoim logo, kolorami firmowymi i danymi kontaktowymi. Profesjonalny wygląd.' },
          { _key: key(), icon: 'link-2', title: 'Status: obejrzana', description: 'Wiesz, czy i kiedy klient otworzył ofertę. Dzięki temu wiesz, kiedy zadzwonić i dopytać.' },
        ],
      },
      {
        _key: key(), _type: 'relatedFeaturesSection',
        heading: 'Powiązane funkcje',
        items: [
          { _key: key(), icon: 'file-text', title: 'Protokół przyjęcia', description: 'Dokumentacja stanu pojazdu ze zdjęciami', href: '/funkcje/protokol-przyjecia-pojazdu' },
          { _key: key(), icon: 'layers', title: 'CRM dla detailingu', description: 'Pełne rozwiązanie dla studia', href: '/crm/crm-dla-studia-detailingu' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Stwórz pierwszą ofertę w 5 minut',
        subheading: 'Wypróbuj generator ofert Carfect i przekonaj się, jak łatwo tworzyć profesjonalne wyceny dla klientów.',
        ctaText: 'Umów bezpłatną prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Generator ofert created');

  // ── 7. SMS Przypomnienia ──
  await client.createOrReplace({
    _id: 'page-funkcje-sms-przypomnienia',
    _type: 'page',
    title: 'SMS Przypomnienia',
    slug: slug('funkcje-sms-przypomnienia'),
    seo: {
      metaTitle: 'Automatyczne SMS Przypomnienia dla Myjni i Detailingu | Carfect',
      metaDescription: 'Zmniejsz no-show o 80%. Przypomnienia o przeglądach powłoki. 100 SMS miesięcznie w cenie pakietu.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Automatyczne SMS Przypomnienia dla Myjni i Detailingu',
        subheading: 'Zmniejsz no-show o 80%. Przypomnienia o przeglądach powłoki. 100 SMS miesięcznie w cenie pakietu.',
        ctaText: 'Umów prezentację',
        variant: 'gradient-dark',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Problem no-show w branzy automotive',
        description: 'Nawet 15% rezerwacji w myjniach i studiach detailingu nie dochodzi do skutku. Puste stanowisko to utracone przychody i zmarnowany czas zespołu. Automatyczne przypomnienia SMS rozwiązują ten problem.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Rodzaje SMS-ów',
        columns: 2,
        items: [
          { _key: key(), icon: 'check', title: 'Potwierdzenie rezerwacji', description: 'Wysyłany automatycznie po utworzeniu rezerwacji. Klient dostaje datę, godzinę, adres i możliwość odwołania wizyty.' },
          { _key: key(), icon: 'bell', title: 'Przypomnienie 24h i 1h przed wizytą', description: 'System sam wysyła przypomnienie 24h i opcjonalnie 1h przed wizytą.' },
          { _key: key(), icon: 'car', title: 'Informacja o gotowym pojeździe', description: 'Po zakończeniu usługi wysyłasz klientowi SMS o gotowości pojazdu do odbioru. Jedno kliknięcie w aplikacji.' },
          { _key: key(), icon: 'sparkles', title: 'Przypomnienie o odświeżeniu powłoki', description: 'System pamięta o klientach po usługach premium. W odpowiednich cyklach sam wyśle zaproszenie na przegląd powłoki ceramicznej.' },
        ],
      },
      {
        _key: key(), _type: 'metricsSection',
        heading: 'Statystyki i efektywność',
        items: [
          { _key: key(), value: '80%', label: 'mniej no-show dzięki przypomnieniom', icon: 'trending-up' },
          { _key: key(), value: '+35%', label: 'większy zysk z usług premium', icon: 'bar-chart-3' },
        ],
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: '100 SMS miesięcznie w cenie',
        description: 'W każdym pakiecie (Myjnia i Detailing) dostajesz 100 SMS-ów miesięcznie bez dodatkowych opłat. Po wykorzystaniu, każdy kolejny SMS kosztuje 12 groszy. Bez ukrytych opłat.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'relatedFeaturesSection',
        heading: 'Powiązane funkcje',
        items: [
          { _key: key(), icon: 'calendar', title: 'Kalendarz rezerwacji', description: 'Zarządzanie terminami i stanowiskami', href: '/funkcje/kalendarz-rezerwacji' },
          { _key: key(), icon: 'users', title: 'Zarządzanie zespołem', description: 'Grafiki i uprawnienia pracowników', href: '/funkcje/zarzadzanie-zespolem' },
          { _key: key(), icon: 'bar-chart-3', title: 'CRM dla myjni', description: 'Pełne rozwiązanie dla myjni', href: '/crm/crm-dla-myjni-samochodowych' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Zacznij wysyłać przypomnienia już dziś',
        subheading: '100 SMS miesięcznie w cenie pakietu. Zmniejsz no-show i zwiększ przychody z przeglądów.',
        ctaText: 'Umów bezpłatną prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  SMS przypomnienia created');

  // ── 8. Zarządzanie Zespołem ──
  await client.createOrReplace({
    _id: 'page-funkcje-zarzadzanie-zespolem',
    _type: 'page',
    title: 'Zarządzanie Zespołem',
    slug: slug('funkcje-zarzadzanie-zespolem'),
    seo: {
      metaTitle: 'Zarządzanie Zespołem Myjni i Detailingu | Carfect',
      metaDescription: 'Zmień żmudne liczenie godzin w zautomatyzowany proces. Od rejestracji czasu pracy po gotowe listy płac.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Zarządzaj zespołem bez chaosu i zbędnych arkuszy',
        subheading: 'Zmień żmudne liczenie godzin w zautomatyzowany proces. Od rejestracji czasu pracy po gotowe listy płac – wszystko w jednym miejscu.',
        ctaText: 'Umów prezentację',
        variant: 'gradient-dark',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Wyzwania w zarządzaniu zespołem',
        subheading: 'Dokładna ewidencja czasu pracy to klucz do optymalizacji kosztów.',
        columns: 2,
        items: [
          { _key: key(), icon: 'alert-triangle', title: 'Ręczna ewidencja', description: 'Kartki papieru, ołówek i kalkulator prowadzą do błędów w rozliczeniach i sporów o godziny nadliczbowe.' },
          { _key: key(), icon: 'alert-triangle', title: 'Chaos w grafiku', description: 'Dwie osoby jednocześnie na tym samym stanowisku lub nikt w trakcie szczytu.' },
          { _key: key(), icon: 'alert-triangle', title: 'Kto robi co?', description: 'Niejasne przypisania prowadzą do zleceń wykonanych w pośpiechu lub w ogóle pominiętych.' },
          { _key: key(), icon: 'alert-triangle', title: 'Brak raportów', description: 'Bez danych nie wiesz, kto naprawdę generuje przychód, a kto potrzebuje szkolenia.' },
        ],
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Funkcje zarządzania zespołem w Carfect',
        columns: 2,
        items: [
          { _key: key(), icon: 'clock', title: 'Ewidencja czasu pracy', description: 'Pracownicy rozpoczynają i kończą pracę kliknięciem z tabletu lub telefonu. System automatycznie liczy godziny, przerwy i nadgodziny.' },
          { _key: key(), icon: 'calendar', title: 'Grafik pracowników', description: 'Planuj zmiany z tygodniowym lub miesięcznym wyprzedzeniem. Oznaczaj urlopy i nieobecności.' },
          { _key: key(), icon: 'layers', title: 'Przypisywanie do stanowisk', description: 'Przypisuj konkretnych pracowników do stanowisk w kalendarzu. Każdy widzi gdzie i kiedy pracuje.' },
          { _key: key(), icon: 'users', title: 'Przypisywanie do zleceń', description: 'Idealne dla wielodniowego detailingu – przypisz zlecenie konkretnemu pracownikowi. Rozliczaj prowizje za kompletne realizacje.' },
        ],
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Widok na żywo dla pracowników',
        description: 'Postaw tablet w miejscu widocznym dla całego zespołu. Widok odświeża się automatycznie. Pracownicy widzą aktualne i nadchodzące zlecenia z przypisaniami. Zespół widzi tylko to, co niezbędne do pracy.',
        image: images.crmMyjniaView,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'relatedFeaturesSection',
        heading: 'Powiązane funkcje',
        items: [
          { _key: key(), icon: 'calendar', title: 'Kalendarz rezerwacji', description: 'Zarządzanie terminami i stanowiskami', href: '/funkcje/kalendarz-rezerwacji' },
          { _key: key(), icon: 'users', title: 'CRM dla myjni', description: 'Pełne rozwiązanie dla myjni', href: '/crm/crm-dla-myjni-samochodowych' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Uporządkuj pracę swojego zespołu',
        subheading: 'Ewidencja czasu, grafik i widok na żywo dla hali. Zacznij zarządzać zespołem profesjonalnie.',
        ctaText: 'Umów bezpłatną prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Zarządzanie zespołem created');

  // ── 9. Protokół Przyjęcia Pojazdu ──
  await client.createOrReplace({
    _id: 'page-funkcje-protokol-przyjecia-pojazdu',
    _type: 'page',
    title: 'Protokół Przyjęcia Pojazdu',
    slug: slug('funkcje-protokol-przyjecia-pojazdu'),
    seo: {
      metaTitle: 'Protokół Przyjęcia Pojazdu dla Studia Detailingu | Carfect',
      metaDescription: 'Diagram uszkodzeń, zdjęcia, podpis klienta online. Koniec z papierowymi kartkami. Publiczny link dla klienta.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Protokół Przyjęcia Pojazdu dla Studia Detailingu',
        subheading: 'Diagram uszkodzeń, zdjęcia, podpis klienta online. Koniec z papierowymi kartkami. Publiczny link dla klienta.',
        ctaText: 'Umów prezentację',
        variant: 'gradient-dark',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Dlaczego warto mieć protokół przyjęcia i wydania pojazdu?',
        description: 'Profesjonalny protokół przyjęcia to Twoja ochrona przed nieuzasadnionymi reklamacjami. Dokumentujesz każde uszkodzenie ze zdjęciami i podpisem klienta.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Korzyści protokołu',
        columns: 3,
        items: [
          { _key: key(), icon: 'shield', title: 'Ochrona przed reklamacjami', description: 'Dokumentujesz stan pojazdu przed rozpoczęciem prac. W razie sporu masz zdjęcia i podpis klienta.' },
          { _key: key(), icon: 'camera', title: 'Dowód fotograficzny', description: 'Każde zdjęcie ma automatyczną datę i godzinę wykonania. Niepodważalny dowód.' },
          { _key: key(), icon: 'pen-tool', title: 'Podpis klienta', description: 'Klient potwierdza stan pojazdu cyfrowym podpisem na tablecie lub telefonie.' },
        ],
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Jak wygląda protokół w Carfect?',
        description: 'Interaktywny diagram pojazdu, galeria zdjęć, dane pojazdu i klienta, notatki i uwagi, podpis cyfrowy – wszystko w jednej aplikacji.',
        image: images.protokol,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Klient dostaje protokół na maila',
        description: 'Po podpisaniu protokołu, klient automatycznie otrzymuje link do protokołu na swojego maila. Może przeglądać wszystkie zdjęcia, sprawdzić zaznaczone uszkodzenia.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Korzyści',
        columns: 3,
        items: [
          { _key: key(), icon: 'shield', title: 'Brak sporów o stan pojazdu', description: 'Zdjęcia i diagram są niepodważalnym dowodem stanu przed pracą.' },
          { _key: key(), icon: 'award', title: 'Profesjonalny wizerunek', description: 'Cyfrowy protokół ze zdjęciami i podpisem na tablecie robi wrażenie.' },
          { _key: key(), icon: 'folder-open', title: 'Wszystko w jednym systemie', description: 'Koniec z szukaniem papierowych kartek. Wszystkie protokoły w chmurze.' },
        ],
      },
      {
        _key: key(), _type: 'relatedFeaturesSection',
        heading: 'Powiązane funkcje',
        items: [
          { _key: key(), icon: 'file-text', title: 'Generator ofert', description: 'Twórz profesjonalne wyceny', href: '/funkcje/generator-ofert' },
          { _key: key(), icon: 'camera', title: 'CRM dla detailingu', description: 'Pełne rozwiązanie dla studia', href: '/crm/crm-dla-studia-detailingu' },
          { _key: key(), icon: 'bell', title: 'SMS przypomnienia', description: 'Automatyczne powiadomienia', href: '/funkcje/sms-przypomnienia' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Koniec z papierowymi protokołami',
        subheading: 'Przejdź na cyfrowe protokoły przyjęcia i chroń swoje studio przed nieuzasadnionymi reklamacjami.',
        ctaText: 'Umów bezpłatną prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Protokół przyjęcia created');

  // ── 10. Analityka i Raporty (coming soon) ──
  await client.createOrReplace({
    _id: 'page-funkcje-analityka-raporty',
    _type: 'page',
    title: 'Analityka i Raporty',
    slug: slug('funkcje-analityka-raporty'),
    seo: {
      metaTitle: 'Analityka i Raporty | Carfect',
      metaDescription: 'Zaawansowane funkcje analityki i raportowania dla myjni i studiów detailingu. Wkrótce dostępne.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Analityka i Raporty',
        subheading: 'Moduł dostępny wkrótce. Pracujemy nad zaawansowanymi funkcjami analityki i raportowania.',
        ctaText: 'Umów prezentację',
        variant: 'simple',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Moduł dostępny wkrótce',
        description: 'Pracujemy nad zaawansowanymi funkcjami analityki i raportowania. Wkrótce będziesz mógł podejmować jeszcze lepsze decyzje biznesowe w oparciu o dane.',
        backgroundVariant: 'muted',
      },
    ],
  });
  console.log('  Analityka i raporty created');

  // ── 11. CRM dla Myjni Samochodowych ──
  await client.createOrReplace({
    _id: 'page-crm-dla-myjni-samochodowych',
    _type: 'page',
    title: 'CRM dla Myjni Samochodowych',
    slug: slug('crm-dla-myjni-samochodowych'),
    seo: {
      metaTitle: 'CRM dla Ręcznej Myjni Samochodowej | Carfect',
      metaDescription: 'System CRM dedykowany dla myjni ręcznych. Rezerwacje, kalendarz, baza klientów, przypomnienia SMS, raportowanie czasu pracy.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'CRM dla ręcznej myjni samochodowej',
        subheading: 'System CRM dedykowany dla myjni ręcznych. Rezerwacje, kalendarz, baza klientów, przypomnienia SMS, raportowanie czasu pracy.',
        ctaText: 'Umów prezentację',
        priceNote: 'Od 89 zł/msc | Bez zobowiązań | 30 dni za darmo',
        variant: 'gradient-dark',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Dlaczego myjnie ręczne potrzebują dedykowanego CRM?',
        description: 'Prowadzenie myjni to nie tylko mycie aut – to walka o optymalne obłożenie grafiku. Uniwersalne programy do zarządzania czy arkusze w Excelu nie rozumieją specyfiki Twojej pracy. Dedykowany system CRM zamienia chaos w uporządkowaną maszynę do zarabiania pieniędzy.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Największe wyzwania właścicieli myjni',
        columns: 2,
        items: [
          { _key: key(), icon: 'clock', title: 'Ciągłe telefony w trakcie pracy', description: 'Praca z lancą w ręku i ciągłe odbieranie rezerwacji to przepis na błędy. Nieodebrane połączenie to klient, który pojedzie do konkurencji.' },
          { _key: key(), icon: 'message-square', title: 'Klienci zapominają o wizytach', description: 'Klient nie przyjeżdża, nie odbiera i nie uprzedza. Ty zostajesz z opłaconym pracownikiem i wolnym stanowiskiem.' },
          { _key: key(), icon: 'car', title: 'Brak historii mycia pojazdu', description: 'Brak bazy danych to zgadywanie przy każdym aucie. Tracisz szansę na dodatkową sprzedaż.' },
          { _key: key(), icon: 'users', title: 'Trudności z organizacją pracy stanowisk', description: 'Zapisy na kartkach prowadzą do błędów w rezerwacjach. Chaos na stanowiskach frustruje pracowników i klientów.' },
        ],
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Kalendarz rezerwacji dla wielu stanowisk',
        description: 'Widzisz wszystkie stanowiska na jednym ekranie. Od razu wiesz, gdzie jest wolne. Koniec z bazgraniem w zeszycie i nakładaniem się aut.',
        image: images.appMobile,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Widok na żywo dla pracowników na hali',
        description: 'Monitor lub tablet na hali by każdy pracownik widział grafik. Koniec z ciągłym pytaniem managera. Ty decydujesz, które detale rezerwacji widzi pracownik.',
        image: images.crmMyjniaView,
        imagePosition: 'left',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Automatyczne SMS przypomnienia',
        description: 'System sam wyśle SMS-a danymi wizyty i nazwą Twojej myjni do klienta dzień wcześniej i godziny przed myciem. Koniec z zapominalskimi i pustymi stanowiskami.',
        image: images.crmSmsPrzypomnienie,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Raportowanie czasu pracy',
        description: 'Pracownicy w prosty sposób raportują czas pracy na tablecie lub telefonie. Mogą podać czas pracy, lub klikać START / STOP.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Gotowy, by usprawnić swoją myjnię?',
        subheading: 'Dołącz do wielu myjni, które już korzystają z Carfect. Zacznij bezpłatny okres próbny już dziś.',
        ctaText: 'Umów bezpłatną prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  CRM dla myjni created');

  // ── 12. CRM dla Studia Detailingu ──
  await client.createOrReplace({
    _id: 'page-crm-dla-studia-detailingu',
    _type: 'page',
    title: 'CRM dla Studia Detailingu',
    slug: slug('crm-dla-studia-detailingu'),
    seo: {
      metaTitle: 'CRM dla Studia Detailingu – System Rezerwacji i Ofert | Carfect',
      metaDescription: 'Oprogramowanie CRM dla studiów detailingu. Generator ofert, kalendarz, protokoły przyjęcia, przypomnienia o przeglądach powłok.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'CRM dla studia detailingu – System rezerwacji i ofert detailingowych',
        subheading: 'Oprogramowanie CRM dla studiów detailingu. Generator ofert, kalendarz, protokoły przyjęcia, przypomnienia o przeglądach powłok.',
        ctaText: 'Umów prezentację',
        priceNote: 'Od 139 zł/msc | Bez zobowiązań | 30 dni za darmo',
        variant: 'gradient-dark',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Czym różni się CRM dla studia detailingu od zwykłego CRM?',
        description: 'CRM dla studia detailingu przede wszystkim jest dostosowany do specyfiki branży. Obsługa wielu pojazdów jednego klienta, generowanie wielo-wariantowych ofert na usługi car detailing czy prosty widok CRM na telefonie.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Specyficzne potrzeby studiów detailingu',
        columns: 2,
        items: [
          { _key: key(), icon: 'clock', title: 'Wielodniowe zlecenia', description: 'Usługi car-detailing jak położenie powłoki ceramicznej czy folii PPF to najczęściej praca od 2 do 5 dni.' },
          { _key: key(), icon: 'file-text', title: 'Złożone oferty z wariantami cenowymi', description: 'Klient często prosi o ofertę PPF Full body oraz na PPF Full Front plus Powłoka ceramiczna na resztę karoserii.' },
          { _key: key(), icon: 'camera', title: 'Protokoły przyjęcia pojazdu ze zdjęciami', description: 'Protokół przyjęcia samochodu jest na złe czasy. Stan licznika, zdjęcia samochodu, podpis Klienta.' },
          { _key: key(), icon: 'bell', title: 'Przypomnienia o przeglądach powłoki', description: 'Przypomnienia SMS o odświeżeniu powłoki ceramicznej, to skuteczna strategia na stały dochód.' },
        ],
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Generator ofert z wariantami',
        description: 'Z generatorem ofert Carfect, przygotowanie oferty na PPF Full Body + Ceramika to 3 minuty. Oferta ma profesjonalny wygląd i jest natychmiastowo wysłana do Klienta.',
        image: images.szablonyOfert,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Protokół przyjęcia z diagramem uszkodzeń',
        description: 'Aplikacja Carfect pozwala Ci szybko tworzyć protokoły przyjęcia i odbioru samochodu. Koniec z papierem. Protokół jest powiązany z rezerwacją w kalendarzu i automatycznie wysłany do Klienta.',
        image: images.protokol,
        imagePosition: 'left',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Automatyczne przypomnienia o serwisach',
        description: 'Odświeżanie powłok ceramicznych czy serwis folii PPF to szybki, stały i łatwy dochód. System Carfect śledzi Twoje realizacje, sam planuje przypomnienia.',
        image: images.smsPrzypomnienie,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Wsparcie sprzedaży',
        description: 'Dzięki historii rezerwacji Klienta, znasz jego nawyki. System automatycznie podpowiada dodatkowe usługi do zaproponowania Klientowi.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Gotowy, by profesjonalizować swoje studio?',
        subheading: 'Dołącz do studiów detailingu, które już korzystają z Carfect. Zacznij bezpłatny okres próbny już dziś.',
        ctaText: 'Umów bezpłatną prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  CRM dla detailingu created');

  // ── 13. Dlaczego Carfect ──
  await client.createOrReplace({
    _id: 'page-dlaczego-carfect',
    _type: 'page',
    title: 'Dlaczego Carfect?',
    slug: slug('dlaczego-carfect'),
    seo: {
      metaTitle: 'Dlaczego Carfect? – System Stworzony z Doświadczonymi Detailerami',
      metaDescription: 'Poznaj powody, dla których właściciele myjni i studiów detailingu wybierają właśnie nas.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Dlaczego Carfect? – System Stworzony z Doświadczonymi Detailerami',
        subheading: 'Poznaj powody, dla których właściciele myjni i studiów detailingu wybierają właśnie nas',
        variant: 'gradient-dark',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Co wyróżnia Carfect na tle konkurencji?',
        subheading: 'Nie jesteśmy kolejnym uniwersalnym CRM. Jesteśmy systemem stworzonym specjalnie dla Twojej branży.',
        columns: 4,
        items: [
          { _key: key(), icon: 'users', title: 'Stworzony PRZEZ detailerów DLA detailerów', description: 'System powstał we współpracy z doświadczonymi właścicielami myjni i studiów detailingu.' },
          { _key: key(), icon: 'target', title: 'Wszystko działa na telefonie', description: 'Wszystkie akcje wykonasz wygodnie z telefonu, bez znaczenia czy to stworzenie oferty czy dodanie rezerwacji.' },
          { _key: key(), icon: 'zap', title: 'Prosty w użyciu', description: 'Szkolenie trwa 30 minut. Intuicyjny interfejs sprawia, że działasz od pierwszego dnia.' },
          { _key: key(), icon: 'phone', title: 'Polski support', description: 'Pomoc przez telefon i email w języku polskim. Nie zostawiamy Cię samego z problemem.' },
        ],
      },
      {
        _key: key(), _type: 'metricsSection',
        heading: 'Prosty w użyciu',
        items: [
          { _key: key(), value: '30 min', label: 'Szkolenie', sublabel: 'Tyle zajmuje pełne wdrożenie' },
          { _key: key(), value: '0', label: 'Instrukcji do czytania', sublabel: 'Intuicyjny interfejs' },
          { _key: key(), value: '1', label: 'Dzień do startu', sublabel: 'Działasz od pierwszego dnia' },
        ],
      },
      {
        _key: key(), _type: 'comparisonTableSection',
        heading: 'Carfect vs Excel / Zeszyt',
        subheading: 'Zobacz, co zyskujesz przechodząc z ręcznego zarządzania na Carfect',
        columnLabels: ['Funkcja', 'Carfect', 'Excel/Zeszyt'],
        rows: [
          { _key: key(), feature: 'Rezerwacje online 24/7', values: ['yes', 'no'] },
          { _key: key(), feature: 'Automatyczne przypomnienia SMS', values: ['yes', 'no'] },
          { _key: key(), feature: 'Historia klientów i pojazdów', values: ['yes', 'partial'] },
          { _key: key(), feature: 'Generator profesjonalnych ofert', values: ['yes', 'no'] },
          { _key: key(), feature: 'Protokół przyjęcia ze zdjęciami', values: ['yes', 'no'] },
          { _key: key(), feature: 'Widok dla pracowników na hali', values: ['yes', 'no'] },
          { _key: key(), feature: 'Raporty i analityka', values: ['yes', 'partial'] },
          { _key: key(), feature: 'Dostęp z telefonu', values: ['yes', 'partial'] },
          { _key: key(), feature: 'Kopia zapasowa danych', values: ['yes', 'no'] },
        ],
      },
      {
        _key: key(), _type: 'comparisonTableSection',
        heading: 'Carfect vs Uniwersalne CRM',
        subheading: 'Dlaczego dedykowany system dla myjni ręcznych i studiów detailingu jest lepszy',
        columnLabels: ['Funkcja', 'Carfect', 'Uniwersalne CRM'],
        rows: [
          { _key: key(), feature: 'Wszystko działa na telefonie', values: ['yes', 'no'] },
          { _key: key(), feature: 'Kalendarz działa na żywo pomiędzy wieloma urządzeniami', values: ['yes', 'no'] },
          { _key: key(), feature: 'Protokół przyjęcia pojazdu', values: ['yes', 'no'] },
          { _key: key(), feature: 'Diagram uszkodzeń', values: ['yes', 'no'] },
          { _key: key(), feature: 'Obsługa aut z placu', values: ['yes', 'no'] },
          { _key: key(), feature: 'Widok na żywo dla hali', values: ['yes', 'no'] },
          { _key: key(), feature: 'Generator ofert detailingowych', values: ['yes', 'no'] },
          { _key: key(), feature: 'Dedykowany dla automotive', values: ['yes', 'no'] },
          { _key: key(), feature: 'Polski support telefoniczny', values: ['yes', 'partial'] },
          { _key: key(), feature: 'Szybkie wdrożenie (30 min)', values: ['yes', 'no'] },
          { _key: key(), feature: 'Przypomnienia o odświeżaniu powłok ceramicznych', values: ['yes', 'no'] },
          { _key: key(), feature: 'Wiele samochodów przypisanych do jednego klienta', values: ['yes', 'no'] },
          { _key: key(), feature: 'Raportowanie czasu pracy prosto z tableta', values: ['yes', 'no'] },
          { _key: key(), feature: 'Różne ceny usług w zależności od rozmiaru pojazdu', values: ['yes', 'no'] },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Przekonaj się sam',
        subheading: 'Wypróbuj Carfect za darmo przez 30 dni. Bez karty, bez zobowiązań.',
        ctaText: 'Umów prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Dlaczego Carfect created');

  // ── 14. Cennik ──
  await client.createOrReplace({
    _id: 'page-cennik-crm-myjnia-detailing',
    _type: 'page',
    title: 'Cennik',
    slug: slug('cennik-crm-myjnia-detailing'),
    seo: {
      metaTitle: 'Cennik – Przejrzyste Plany dla Myjni i Detailingu | Carfect',
      metaDescription: 'Wybierz plan dopasowany do Twojego biznesu. Bez ukrytych kosztów, bez niespodzianek.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Cennik – Przejrzyste Plany dla Myjni i Detailingu',
        subheading: 'Wybierz plan dopasowany do Twojego biznesu. Bez ukrytych kosztów, bez niespodzianek.',
        variant: 'simple',
      },
      {
        _key: key(), _type: 'pricingSection',
        heading: 'Wybierz plan',
        subheading: 'Płacisz tylko za to, czego potrzebujesz',
        usePricingConfig: true,
        plans: [
          {
            _key: key(), name: 'Myjnia', price: '89',
            period: 'za pierwsze stanowisko / miesiąc',
            features: [
              'Główny kalendarz', 'Rezerwacje online 24/7', '100 powiadomień SMS',
              'Zarządzanie relacjami z klientami', 'Zarządzanie zespołem',
              'Obsługa aut z placu', 'Widok dla pracowników', 'Analityka i raporty',
            ],
            ctaText: 'Umów prezentację', ctaLink: '/umow-prezentacje', highlighted: false,
          },
          {
            _key: key(), name: 'Detailing', price: '139',
            period: 'za pierwsze stanowisko / miesiąc',
            features: [
              'Tworzenie i zarządzanie ofertami detailingu', 'Protokół przyjęcia pojazdu',
              'Wsparcie sprzedaży', 'Automatyczne przypomnienia o przeglądach serwisowych',
            ],
            ctaText: 'Umów prezentację', ctaLink: '/umow-prezentacje', highlighted: true,
          },
        ],
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Bez ukrytych kosztów',
        subheading: 'Płacisz tylko za to, co widzisz. Żadnych niespodzianek na fakturze.',
        columns: 3,
        items: [
          { _key: key(), icon: 'credit-card', title: 'Bezpłatna migracja danych', description: 'Przenosimy Twoją bazę klientów z Excela, zeszytu czy dowolnego innego systemu. Bez dodatkowych opłat.' },
          { _key: key(), icon: 'settings', title: 'Pomoc w konfiguracji', description: 'Pomagamy ustawić aplikację dokładnie pod Twoje usługi i cennik.' },
          { _key: key(), icon: 'calendar', title: '30 dni za darmo bez karty', description: 'Wypróbuj wszystkie funkcje przez 30 dni. Bez podawania karty, bez zobowiązań.' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Wypróbuj za darmo przez 30 dni',
        subheading: 'Bez podawania karty kredytowej. Bez zobowiązań. Pełny dostęp do wszystkich funkcji.',
        ctaText: 'Rozpocznij bezpłatny okres próbny',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Cennik created');

  // ── 15. Kontakt ──
  await client.createOrReplace({
    _id: 'page-kontakt',
    _type: 'page',
    title: 'Kontakt',
    slug: slug('kontakt'),
    seo: {
      metaTitle: 'Kontakt | Carfect',
      metaDescription: 'Masz pytania? Chętnie pomożemy. Skontaktuj się z nami telefonicznie, mailowo lub umów prezentację.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Kontakt',
        subheading: 'Masz pytania? Chętnie pomożemy. Skontaktuj się z nami telefonicznie, mailowo lub umów prezentację.',
        variant: 'simple',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Jak się z nami skontaktować',
        columns: 3,
        items: [
          { _key: key(), icon: 'mail', title: 'Email', description: 'hello@carfect.pl – Odpowiadamy w ciągu 24h' },
          { _key: key(), icon: 'phone', title: 'Tomek', description: '+48 666 610 222 – Sprzedaż, wdrożenia, wsparcie' },
          { _key: key(), icon: 'phone', title: 'Rafał', description: '+48 666 610 011 – Sprzedaż, wdrożenia, wsparcie' },
        ],
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Lokalizacja',
        description: 'Działamy zdalnie na terenie całej Polski. Prezentacje i wdrożenia przeprowadzamy zdalnie, w obrębie Trójmiasta i okolic, na miejscu.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Wolisz zobaczyć system w akcji?',
        subheading: 'Umów bezpłatną prezentację i przekonaj się, jak Carfect może usprawnić Twój biznes.',
        ctaText: 'Umów prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Kontakt created');

  // ── 16. Opinie ──
  await client.createOrReplace({
    _id: 'page-opinie',
    _type: 'page',
    title: 'Opinie',
    slug: slug('opinie'),
    seo: {
      metaTitle: 'Opinie Klientów Carfect – Co Mówią Właściciele Myjni i Studiów Detailingu',
      metaDescription: 'Prawdziwe historie sukcesu od właścicieli, którzy zaufali Carfect.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Opinie Klientów Carfect',
        subheading: 'Prawdziwe historie sukcesu od właścicieli, którzy zaufali Carfect',
        variant: 'simple',
      },
      {
        _key: key(), _type: 'testimonialsSection',
        heading: 'Zaufali nam właściciele z całej Polski',
        testimonials: [
          {
            _key: key(), name: 'Armen', company: 'ARM-CAR Detailing & Wrapping',
            companyUrl: 'https://armcarautospa.pl/', location: 'Gdańsk', rating: 5,
            text: 'Odkąd korzystam z Carfect, mój kalendarz rezerwacji jest uporządkowany, klienci otrzymują automatyczne przypomnienia, a ja oszczędzam mnóstwo czasu. Generator ofert pomógł mi domykać więcej zleceń.',
            logo: images.logoArmcar,
          },
          {
            _key: key(), name: 'Tomasz K.', company: 'Myjnia Ręczna AutoSpa',
            rating: 5,
            text: 'Rezerwacje online to był strzał w dziesiątkę. Telefon dzwoni o 70% mniej, a klienci sami wybierają dogodny termin. Widok na tablecie dla pracowników – nie wyobrażam sobie już pracy bez tego.',
          },
          {
            _key: key(), name: 'Marta W.', company: 'Detailing Studio Premium',
            rating: 5,
            text: 'System SMS-ów praktycznie wyeliminował no-showy. Wcześniej traciłam 2-3 terminy tygodniowo, teraz to sporadyczne przypadki. Protokół przyjęcia pojazdu ze zdjęciami uratował mnie przed kilkoma reklamacjami.',
          },
        ],
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Najczęściej doceniane funkcje',
        subheading: 'Te funkcje nasi klienci wymieniają najczęściej jako przełomowe',
        columns: 3,
        items: [
          { _key: key(), icon: 'phone', title: 'Rezerwacje online', description: 'Zmniejszyły liczbę telefonów o 70%. Klienci rezerwują o dowolnej porze.' },
          { _key: key(), icon: 'users', title: 'Widok dla pracowników', description: 'Pracownicy widzą harmonogram na tablecie w czasie rzeczywistym.' },
          { _key: key(), icon: 'file-text', title: 'Generator ofert', description: 'Profesjonalne oferty zwiększają konwersję sprzedaży.' },
        ],
      },
      {
        _key: key(), _type: 'metricsSection',
        heading: 'Wyniki liczbowe',
        subheading: 'Średnie wyniki raportowane przez naszych klientów',
        items: [
          { _key: key(), value: '+30%', label: 'więcej rezerwacji', sublabel: 'Dzięki rezerwacjom online 24/7', icon: 'calendar' },
          { _key: key(), value: '-80%', label: 'no-show dzięki SMS', sublabel: 'Automatyczne przypomnienia', icon: 'message-square' },
          { _key: key(), value: '2h', label: 'zaoszczędzonego czasu dziennie', sublabel: 'Na administrację i telefony', icon: 'clock' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Dołącz do grona zadowolonych właścicieli',
        ctaText: 'Wypróbuj Carfect za darmo',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Opinie created');

  // ── 17. Case Studies ──
  await client.createOrReplace({
    _id: 'page-case-studies',
    _type: 'page',
    title: 'Historie Klientów',
    slug: slug('case-studies'),
    seo: {
      metaTitle: 'Jak Studio ARM-CAR Odzyskało 10h Tygodniowo | Carfect Case Study',
      metaDescription: 'Case study ARM-CAR Detailing z Gdańska. Zobacz jak Carfect pomógł zwiększyć obroty o 10% i zaoszczędzić 10 godzin tygodniowo.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Jak studio Arm Car Detailing odzyskało 10 godzin tygodniowo i zwiększyło obroty dzięki Carfect',
        variant: 'simple',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'O kliencie',
        description: 'Arm Car Detailing & Wrapping to studio detailingowe z Gdańska. Firma dysponuje czterema stanowiskami: dwa przeznaczone na myjnię ręczną, jedno na detailing oraz jedno na oklejanie folią ochronną PPF.',
        backgroundVariant: 'muted',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Wyzwanie: Codzienność w cieniu papierowego zeszytu',
        description: 'Przed wdrożeniem Carfect, sercem firmy był papierowy kalendarz i arkusz w Excelu. Każda rezerwacja wymagała fizycznej obecności właściciela przy zeszycie lub dziesiątek telefonów po godzinach pracy.',
        image: images.caseStudy1,
        imagePosition: 'right',
      },
      {
        _key: key(), _type: 'quoteSection',
        text: 'Musiałem być dostępny non-stop. Pół dnia spędziłem na telefonach zamiast rozwijać biznes.',
        author: 'Armen',
        role: 'Właściciel ARM-CAR',
      },
      {
        _key: key(), _type: 'featureDetailSection',
        heading: 'Rozwiązanie: Cyfrowa rewolucja w trzy dni',
        description: 'Zespół Carfect w zaledwie trzy dni przeniósł bazę klientów i cennik do aplikacji. Armen otrzymał gotowe narzędzie, które już od pierwszego dnia wyeliminowało błędy i ograniczyło puste przebiegi.',
        image: images.caseStudy2,
        imagePosition: 'left',
      },
      {
        _key: key(), _type: 'metricsSection',
        heading: 'Kluczowe zmiany w liczbach',
        items: [
          { _key: key(), value: '40h', label: 'odzyskanego czasu', sublabel: 'miesięcznie' },
          { _key: key(), value: '+10%', label: 'wzrost obrotów', sublabel: 'miesięcznie' },
          { _key: key(), value: '-90%', label: 'no-show i pomyłek', sublabel: 'w rezerwacjach' },
        ],
      },
      {
        _key: key(), _type: 'quoteSection',
        text: 'Dzięki lepszej skuteczności ofert i praktycznie zerowym no-show zarabiam więcej, pracując mniej. Koszt aplikacji zwraca się wielokrotnie już w pierwszym miesiącu.',
        author: 'Armen',
        role: 'Właściciel ARM-CAR',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Co zyskało studio?',
        columns: 2,
        items: [
          { _key: key(), icon: 'message-square', title: 'Automatyczne przypomnienia SMS', description: 'Koniec z zapominalskimi klientami – no-show spadło niemal do zera.' },
          { _key: key(), icon: 'file-text', title: 'Generator ofert', description: 'Tworzenie profesjonalnych ofert w kilka minut – w dowolnej chwili i z dowolnego urządzenia.' },
          { _key: key(), icon: 'users', title: 'Autonomia zespołu', description: 'Pracownicy sami zarządzają statusami prac i raportują czas.' },
          { _key: key(), icon: 'refresh-cw', title: 'Powracalność klientów', description: 'System automatycznie przypomina o przeglądach powłok.' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Twój biznes też może działać bez Twojej ciągłej obecności',
        subheading: 'Jeśli masz dość zeszytów i uciekających rezerwacji – umów się na bezpłatną prezentację Carfect.',
        ctaText: 'Umów bezpłatną prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Case studies created');

  // ── 18. Umów Prezentację ──
  await client.createOrReplace({
    _id: 'page-umow-prezentacje',
    _type: 'page',
    title: 'Umów Prezentację',
    slug: slug('umow-prezentacje'),
    seo: {
      metaTitle: 'Umów Bezpłatną Prezentację | Carfect',
      metaDescription: 'Umów się na bezpłatną prezentację systemu Carfect. Pokażemy Ci jak ułatwić zarządzanie myjnią lub studiem detailingu.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Umów bezpłatną prezentację',
        subheading: 'Pokażemy Ci jak ułatwić zarządzanie myjnią lub studiem detailingu. Bez zobowiązań.',
        ctaText: 'Wyślij zgłoszenie',
        variant: 'gradient-dark',
      },
    ],
  });
  console.log('  Umów prezentację created');

  // ── 19. Funkcje (landing page) ──
  await client.createOrReplace({
    _id: 'page-funkcje',
    _type: 'page',
    title: 'Funkcje',
    slug: slug('funkcje'),
    seo: {
      metaTitle: 'Funkcje CRM dla Myjni i Detailingu | Carfect',
      metaDescription: 'Poznaj wszystkie funkcje systemu Carfect. Kalendarz rezerwacji, generator ofert, SMS, zarządzanie zespołem i wiele więcej.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'Funkcje systemu Carfect',
        subheading: 'Wszystko czego potrzebujesz do zarządzania myjnią ręczną lub studiem detailingu',
        variant: 'simple',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Poznaj nasze funkcje',
        columns: 3,
        items: [
          { _key: key(), icon: 'calendar', title: 'Kalendarz rezerwacji', description: 'Widok dzienny i tygodniowy, przypisanie do stanowisk, rezerwacje 24/7.', link: '/funkcje/kalendarz-rezerwacji' },
          { _key: key(), icon: 'file-text', title: 'Generator ofert', description: 'Profesjonalne wyceny z wariantami cenowymi w kilka minut.', link: '/funkcje/generator-ofert' },
          { _key: key(), icon: 'bell', title: 'SMS przypomnienia', description: 'Automatyczne potwierdzenia i przypomnienia zmniejszające no-show.', link: '/funkcje/sms-przypomnienia' },
          { _key: key(), icon: 'users', title: 'Zarządzanie zespołem', description: 'Ewidencja czasu pracy, grafik, przypisanie do stanowisk.', link: '/funkcje/zarzadzanie-zespolem' },
          { _key: key(), icon: 'clipboard', title: 'Protokół przyjęcia pojazdu', description: 'Cyfrowy protokół ze zdjęciami, diagramem i podpisem klienta.', link: '/funkcje/protokol-przyjecia-pojazdu' },
          { _key: key(), icon: 'bar-chart-3', title: 'Analityka i raporty', description: 'Zaawansowane raportowanie i analiza danych biznesowych.', link: '/funkcje/analityka-raporty' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Wypróbuj wszystkie funkcje za darmo',
        subheading: '30 dni bez zobowiązań i bez karty kredytowej.',
        ctaText: 'Umów prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  Funkcje landing created');

  // ── 20. CRM (landing page) ──
  await client.createOrReplace({
    _id: 'page-crm',
    _type: 'page',
    title: 'CRM',
    slug: slug('crm'),
    seo: {
      metaTitle: 'CRM dla Myjni i Detailingu | Carfect',
      metaDescription: 'Dedykowany system CRM dla myjni samochodowych i studiów detailingu. Kalendarz, rezerwacje, oferty, protokoły.',
    },
    sections: [
      {
        _key: key(), _type: 'heroSection',
        heading: 'CRM dla Myjni i Detailingu',
        subheading: 'Dedykowany system CRM stworzony specjalnie dla Twojej branży',
        variant: 'simple',
      },
      {
        _key: key(), _type: 'iconCardsSection',
        heading: 'Wybierz rozwiązanie dla siebie',
        columns: 2,
        items: [
          { _key: key(), icon: 'droplets', title: 'CRM dla myjni samochodowych', description: 'Kalendarz, rezerwacje online, SMS przypomnienia, zarządzanie zespołem.', link: '/crm/crm-dla-myjni-samochodowych' },
          { _key: key(), icon: 'sparkles', title: 'CRM dla studia detailingu', description: 'Generator ofert, protokoły przyjęcia, przypomnienia o przeglądach powłok.', link: '/crm/crm-dla-studia-detailingu' },
        ],
      },
      {
        _key: key(), _type: 'ctaSection',
        heading: 'Nie wiesz, który plan wybrać?',
        subheading: 'Umów bezpłatną prezentację i pomożemy Ci dobrać optymalne rozwiązanie.',
        ctaText: 'Umów prezentację',
        ctaLink: '/umow-prezentacje',
      },
    ],
  });
  console.log('  CRM landing created');

  // ── 21. ARM-CAR Case Study (dedicated document) ──
  console.log('\nCreating ARM-CAR case study document...');
  await client.createOrReplace({
    _id: 'caseStudy-armcar',
    _type: 'caseStudy',
    title: 'ARM-CAR Detailing & Wrapping – Case Study',
    slug: slug('armcar-detailing'),
    seo: {
      metaTitle: 'ARM-CAR Detailing Case Study – Jak Odzyskać 10h Tygodniowo',
      metaDescription: 'Case study ARM-CAR Detailing z Gdańska. Zobacz jak Carfect pomógł zwiększyć obroty o 10% i zaoszczędzić 10 godzin tygodniowo.',
    },
    heroTitle: 'Jak ARM-CAR odzyskał 40 godzin miesięcznie',
    heroHighlight: '40h miesięcznie',
    heroSubtitle: 'Od zeszytów i telefonów po profesjonalny system zarządzania',
    coverImage: images.caseStudy1,
    client: {
      name: 'ARM-CAR Detailing & Wrapping',
      description: 'ARM-CAR to studio detailingu z Gdańska specjalizujące się w profesjonalnym detailingu, oklejaniu i zabezpieczaniu pojazdów premium.',
      logo: images.logoArmcar,
    },
    challenge: {
      heading: 'Wyzwanie',
      description: 'Przed wdrożeniem Carfect, ARM-CAR zarządzał rezerwacjami za pomocą zeszytu i telefonów. Właściciel tracił godziny na koordynację grafiku, tworzenie wycen na kartce i odpowiadanie na telefony.',
      image: images.caseStudy2,
      quote: 'Na początku byłem sceptyczny, ale ten system serio ułatwił mi życie.',
      quoteAuthor: 'Armen, właściciel ARM-CAR',
    },
    solution: {
      heading: 'Rozwiązanie',
      description: 'Wdrożenie Carfect zajęło jeden dzień. System przejął zarządzanie kalendarzem, bazą klientów i ofertami. Pracownicy ARM-CAR otrzymali dedykowany widok na tablecie na hali.',
    },
    metrics: [
      { _key: key(), value: '40h', label: 'odzyskanego czasu', sublabel: 'miesięcznie', variant: 'primary' },
      { _key: key(), value: '+10%', label: 'wzrost obrotów', sublabel: 'miesięcznie', variant: 'success' },
      { _key: key(), value: '-90%', label: 'no-show i pomyłek', sublabel: 'w rezerwacjach', variant: 'default' },
    ],
    results: {
      heading: 'Rezultaty',
      items: [
        { _key: key(), icon: 'clock', text: 'Oszczędność 10h tygodniowo na zarządzaniu' },
        { _key: key(), icon: 'trending-up', text: 'Wzrost obrotów o 10% dzięki lepszemu planowaniu' },
        { _key: key(), icon: 'smartphone', text: 'Klienci rezerwują 24/7 bez telefonów' },
        { _key: key(), icon: 'check-circle', text: 'Profesjonalne oferty zamiast ręcznych wyliczeń' },
      ],
    },
    benefitCards: [
      { _key: key(), icon: 'calendar', title: 'Kalendarz na jednym ekranie', description: 'Cały grafik w przejrzystym widoku zamiast zeszytu.' },
      { _key: key(), icon: 'file-text', title: 'Automatyczne oferty', description: 'Generator ofert z szablonami zamiast obliczeń na kartce.' },
      { _key: key(), icon: 'bell', title: 'SMS-y automatycznie', description: 'Przypomnienia o wizytach redukują nieobecności.' },
      { _key: key(), icon: 'users', title: 'Zespół w synchronizacji', description: 'Pracownicy widzą zadania na tablecie na hali.' },
    ],
    ctaSection: {
      heading: 'Chcesz osiągnąć podobne rezultaty?',
      subheading: 'Umów się na bezpłatną prezentację i zobacz, jak Carfect może pomóc Twojej firmie.',
      ctaText: 'Umów prezentację',
      ctaLink: '/umow-prezentacje',
    },
  });
  console.log('  ARM-CAR case study created');

  console.log('\nMigration complete!');
  console.log('Open /studio to see the content in Sanity Studio');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

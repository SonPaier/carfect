SET search_path = public, extensions;
-- Total rows from XLS: 145
-- Station 1: 87 reservations, Station 2: 47 reservations
-- Unique customers: 88
-- Unique vehicles: 97
-- New services needed: {'Przegląd gwarancyjny', 'Folia na szyby WinCrest EVO', 'Konserwacja podwozia', 'Przygotowanie do sprzedaży'}

-- SERVICE MAPPING:
--   Czyszczenie + przygotowanie do sprzdaży → Mycie detailingowe
--   Czyszczenie motocykla + polerowanie baku → Mycie detailingowe
--   Czyszczenie wnętrza + pranie foteli + korekta jedno etapowa  → Korekta lakieru 1-etapowa
--   Dekontamincja + wosk → Dekontaminacja chemiczna + glinkowanie
--   Delikatne pranie - przygotownie do sprzedazy + One step + za → Pranie wnętrza (wykładzina, boczki, fotele)
--   FF + Zderzak tył + próg zewnętrzny wnęki progowe + ekran mul → Full Front - Folia PPF połysk UltraFit
--   FF lub FB → Full Front - Folia PPF połysk UltraFit
--   Ful body PPF ultrafit + wnętrze → Full Body - Folia PPF połysk UltraFit
--   Full Body + Ekran mat(do potwierdzenia) → Full Body - Folia PPF matowa UltraFit
--   Full Body + Powłoka na plastiki + felgi + ekrany multimediów → Full Body - Folia PPF połysk UltraFit
--   Full Body + Zabezpieczenie szklanego Dachu Folia WinCrest EV → Full Body - Folia PPF połysk UltraFit
--   Full Body + wnętrze. → Full Body - Folia PPF połysk UltraFit
--   Full Body - Bez Dachu - Dach powłoka Elastomer + Ekran Multi → Full Body - Folia PPF matowa UltraFit
--   Full Body Mat + Połysk dach oraz elementy czarne  + Powłoka  → Full Body - Folia PPF matowa UltraFit
--   Full Body PPF → Full Body - Folia PPF połysk UltraFit
--   Full Front + 4.szt drzwi → Full Front - Folia PPF połysk UltraFit
--   Full Front + Konserwac ja Podwozia → Full Front - Folia PPF połysk UltraFit
--   Full Front + Powłoka elastomerowa na cały samochód → Full Front - Folia PPF połysk UltraFit
--   Full Front + Zaprawki → Full Front - Folia PPF połysk UltraFit
--   Full Front + czarny dach → Full Front - Folia PPF połysk UltraFit
--   Full Front + oklejenie tylnych słupków czarną folią (słupek  → Full Front - Folia PPF połysk UltraFit
--   Full Front + powłoka + Konserwacja. → Full Front - Folia PPF połysk UltraFit
--   Full Front + promo EKRAN POŁYSK + wycena na progi + dyfuzor  → Full Front - Folia PPF połysk UltraFit
--   Full Front w tym - Maska,Zerzak przód, lampy przód, błotniki → Full Front - Folia PPF połysk UltraFit
--   Full Front w tym wnęki progowe + Wnęk klamek + Powłoka Elast → Full Front - Folia PPF połysk UltraFit
--   Full body zmiana koloru biały Oracal 946g+ lusterka czarne + → Full Body - Folia PPF połysk UltraFit
--   Full front + Dechrom → Full Front - Folia PPF połysk UltraFit
--   Full front + powłoka Elastomerowa → Full Front - Folia PPF połysk UltraFit
--   Full front - Zderzak, maska,reflekrory przód,błotniki przód, → Full Front - Folia PPF połysk UltraFit
--   Fullr Front + 4.szt Drzwi + Ekran multimediów matowy. → Full Front - Folia PPF połysk UltraFit
--   Konserwacja + Full Front + powłoka. → Full Front - Folia PPF połysk UltraFit
--   Konserwacja + wygłuszenie polimerem → Konserwacja podwozia
--   Konserwacja Podwozia - Wosk + Polimer → Konserwacja podwozia
--   Konserwacja Podwozia Kompleks → Konserwacja podwozia
--   Korekta + powłoka elastomer + Wycena : Progi black piano + z → Powłoka elastomerowa
--   Korekta Lakieru one - Step + usunięcie zarysowań Prawa Stron → Powłoka elastomerowa
--   Korekta jedno etapowa usunięcie 80% zarysowań + Oklejenie la → Zmiana koloru elementów (dach, lusterka)
--   Lampy + black piano + wnęki progowe + próg załadunkowy + tun → PPF Lampy przednie
--   Maska + dach + parapet tylnego zderzaka + wnęki klamek → Start - Folia PPF połysk UltraFit
--   Maska, zderzak, reflektory, błotniki, lusterka, słupki A, na → Powłoka elastomerowa
--   Mycie → Mycie premium
--   Mycie + dekontaminacja + QD → Mycie + dekontaminacja
--   Mycie + przeklejenie zderzaka tył → Mycie premium
--   Mycie Komplet → Mycie detailingowe
--   Mycie detailingowe + środek → Mycie detailingowe
--   Mycie komplet z szybami + przeklejenie pasów → Mycie detailingowe
--   Mycie zewnatrz + Czyszczenie skór wewnatrz → Czyszczenie skóry + nawilżanie
--   Oklejenie - Zderzak + lampy przód + słupki black piano + par → Full Front - Folia PPF połysk UltraFit
--   Oklejenie 4.szt Drzwi → Full Front - Folia PPF połysk UltraFit
--   Oklejenie Boków + maska + lampy + Parapet zderzaka → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie Folią PPF Full Front + 4.szt Drzwi + Cwiartka (bło → Full Front - Folia PPF połysk UltraFit
--   Oklejenie Full Body +Wnęki progowe + ekran multimediów mat + → Full Body - Folia PPF matowa UltraFit
--   Oklejenie Lamp przód + Słupki black piano + trójkąt drzwi pr → Powłoka elastomerowa
--   Oklejenie Maski PPF → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie Samochodu Folią PPF : Maska, przednie błotniki, wn → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie Zderzak Przód, Błotnik lewy przód, drzwi lewy przó → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie dachu + black piano + parapet tylnego zderzaka → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie dachu folia PPF + wgniotki + polerowania zderzaka  → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie drzwi 2.szt Strona prawa + usuniecie zarysowań drz → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie elementów zderzaka mat → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie folią PPF Full Front + Elastomer + Zabezpieczenie  → Full Front - Folia PPF połysk UltraFit
--   Oklejenie przedniego błotnika → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie słupków C + Relingi + Grill Folia Czarną → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie tylnej klapy Folia Carbon (ultrafit) + oklejenie m → Zmiana koloru elementów (dach, lusterka)
--   Oklejenie wszystkich elementów od lini szyb w dół ( kolor ol → Dechroming
--   Oklejenie zderzaka przód + Maska + Black piano zderzak przód → Zmiana koloru elementów (dach, lusterka)
--   Oklejnie przedniej szyby Wincrest Evo → Folia na szyby WinCrest EVO
--   One Step + Powłoka roczna → Korekta + powłoka ceramiczna (pakiet)
--   PRZEGLĄD → Przegląd gwarancyjny
--   Pakiet Full Front : Zderzak, maska, przednie reflektory, emb → Full Front - Folia PPF połysk UltraFit
--   Pakiet Medium Smart  - Elastomer + Szyby NW + PPF Wnęki + La → Powłoka elastomerowa
--   Pakiet Urban + Progi → Full Front - Folia PPF połysk UltraFit
--   Pakiet Urban - Oklejenie Full Front + progi + 4.szt drzwi +  → Full Front - Folia PPF połysk UltraFit
--   Poprawa lusterka + drzwi → Przegląd gwarancyjny
--   Poprawa lusterka oraz drzwi ! → Przegląd gwarancyjny
--   Porzegląd → Przegląd gwarancyjny
--   Powloka elastomerowa 5.lat 80.000 Km + Powloka na felgi + Ek → Powłoka elastomerowa
--   Powłoka Elastomerowa + pakiet PPF Start PPF na Lampy przód,  → Powłoka elastomerowa
--   Powłoka Elastomerowa Revivify Ultra 5.lat/80.000 KM → Powłoka elastomerowa
--   Powłoka Elastomerowa Trwałość 5 lat - 80.000km Oklejenie fol → Powłoka elastomerowa
--   Powłoka Elastomerowa na cały samochód  Dedykowana powłoka ce → Powłoka elastomerowa
--   Pranie foteli → Pranie foteli oraz boczków
--   Pranie foteli + podsufitki + ozonowanie + usuwanie zapachów. → Pranie foteli oraz boczków
--   Pranie wnętrza + Korekta jedno etapowa + usunięcie zarysowań → Korekta lakieru 1-etapowa
--   Pranie wnętrza + korekta lakieru + woskowanie + wgniotki drz → Korekta lakieru 1-etapowa
--   Przegląd → Przegląd gwarancyjny
--   Przegląd ! → Przegląd gwarancyjny
--   Przegląd !! → Przegląd gwarancyjny
--   Przegląd + mycie + wnętrze → Mycie premium
--   Przegląd + oklejenie klapki ładowania → Zmiana koloru elementów (dach, lusterka)
--   Przegląd + zaprawka na klapie + dół klapy PPF → Przegląd gwarancyjny
--   Przegląd Gwarancyjny → Przegląd gwarancyjny
--   Przegląd Gwarancyjny + mycie → Mycie premium
--   Przegląd Gwarancyjny + poprawa Lusterek + wymiana oklejenia  → Przegląd gwarancyjny
--   Przegląd Powłoki oraz Folii PPF → Przegląd gwarancyjny
--   Przegląd gwarancyjny → Przegląd gwarancyjny
--   Przegląd po 3tyg od aplikacji folii → Przegląd gwarancyjny
--   Przegląd po oklejaniu → Przegląd gwarancyjny
--   Przegląd powłoka + dekontaminacja → Przegląd gwarancyjny
--   Przeglądzik + listwa → Przegląd gwarancyjny
--   Przeklejenie zderzaka tył ( uszkodzenie) przepolerowanie pla → Pranie foteli oraz boczków
--   Przwgląd poł∑oki + dekontaminacja lakieru → Przegląd gwarancyjny
--   Przygotowanie do oddania do Leasingu z polerowaniem elementó → Przygotowanie do sprzedaży
--   Przygotowanie do sprzedazy → Przygotowanie do sprzedaży
--   Rozklejenie lamp przód PPF → PPF Lampy przednie
--   Usunięcie zarysowania parkingowego → Korekta lakieru 1-etapowa
--   Usunięcie śladów kleju → Korekta lakieru 1-etapowa
--   Wymiana Folii PPF na Dachu → Usunięcie starej folii PPF

-- ===========================================
-- Caldis → Carfect migration
-- Generated: 2026-04-14T19:44:21.501252
-- Instance: 50230fb6-fca0-4a09-b19c-f80215b2b715
-- ===========================================

BEGIN;


-- STEP 1: Add missing services
INSERT INTO unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
SELECT '50230fb6-fca0-4a09-b19c-f80215b2b715', c.id, 'Folia na szyby WinCrest EVO', 1500, 'ppf', 'both', 'everywhere', 99, true, false, false, 'szt'
FROM unified_categories c WHERE c.instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND c.slug = 'oklejanie-zmiana-koloru';

INSERT INTO unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
SELECT '50230fb6-fca0-4a09-b19c-f80215b2b715', c.id, 'Konserwacja podwozia', 2500, 'detailing', 'both', 'everywhere', 99, true, false, false, 'szt'
FROM unified_categories c WHERE c.instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND c.slug = 'woskowanie';

INSERT INTO unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
SELECT '50230fb6-fca0-4a09-b19c-f80215b2b715', c.id, 'Przegląd gwarancyjny', 200, 'detailing', 'both', 'everywhere', 99, true, false, false, 'szt'
FROM unified_categories c WHERE c.instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND c.slug = 'mycie-i-detailing';

INSERT INTO unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
SELECT '50230fb6-fca0-4a09-b19c-f80215b2b715', c.id, 'Przygotowanie do sprzedaży', 500, 'detailing', 'both', 'everywhere', 99, true, false, false, 'szt'
FROM unified_categories c WHERE c.instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND c.slug = 'mycie-i-detailing';

-- STEP 3: Customers
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('861a643e-044e-4efe-9a08-3697fd476937', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Tomasz Wesołowski', 'anitawesolowska@poczta.fm', '662283182', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('f8643ddd-64c3-48b4-9257-30c39a45d8b4', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Estera', 'estera.p@interia.pl', '662271176', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('0dde65ad-6169-4a1d-9125-ba75d81fb37a', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Wojciech Antonik', 'wojciech.pawel.antonik@gmail.com', '502863346', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('786e90f8-b01e-44a8-8a5a-e624666c89ba', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Kuba Cikowski', 'cikowskikuba@gmail.com', '508368799', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('c9160bd9-0fe8-44d3-a81c-2885c0688058', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Dariusz Wójcik', 'dariuszwojcik1@op.pl', '607535224', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('7323e0b2-2e23-4069-ae7a-abf4b9eb04a4', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Michał Uryga', 'urygamichal@interia.pl', '503975991', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('b0e6874f-49e1-4ee1-8d2a-2e12cf70558d', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Jacek Bednarz', 'Jacek.bednarz@vp.pl', '501184025', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('3bd0e12c-58c9-46ed-8450-d998b742736f', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Piotr Matras', 'kontakt@piotrmatras.com', '799133199', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('d9314d01-6170-4266-bc23-12a89a4f3e65', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Ivan Popov', 'ivan.i.popov.1992@gmail.com', '577948692', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('3700b862-7f4a-4590-b473-6fcc0e3285bd', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Kamil Staszewski', 'kamil.staszewski85@gmail.com', '665832346', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('4beed85c-380c-41a2-8cf4-84ff3a693e8b', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Marcin mazurek', 'mazmarcin@gmail.com', '733793733', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('0cf05774-1040-4b8e-befb-b5419cef51cb', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Andrzej Chwastek', 'achwastek@poczta.onet.pl', '693820502', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('8b6e7237-db4f-4a01-a2ea-d17dda717b91', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Mateusz Żurawiecki', NULL, '669090409', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('1c51ab3e-da43-497d-9c3d-d1dd0e3b7e8e', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Filip Mienkina', NULL, '537931015', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('784d618a-d04f-4219-b40a-d39cca8e4103', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Pan Paweł NIP: 6793239229', 'pawel@pawelkruk.com', '501080850', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('638f2440-ebca-4b83-a1ba-64e4520a249a', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Eleonora Pierozchenko', NULL, '574145426', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('c5b29cfd-2d6c-4937-b926-8df23b5933b8', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Mateusz Golf Gti', 'kowalczyk.hubert@o2.pl', '795183551', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('b9bed3a2-f1d1-41b9-bcab-6b3c4cba866a', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'SYLWESTER MICEK PLANET', NULL, '606664700', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('2faec128-8c9d-460b-8570-6c5ad146276a', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Klient Pranie', NULL, '513984640', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('22b35ab4-d53d-45a9-a459-fa86c61488a0', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Klaudia Nalik- Iwaniak', NULL, '886348039', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('23f71cfe-c124-44c4-a8e6-c141fa98ea5f', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'TOmasz Chojak', 'chojak.tomasz@gmail.com', '794057266', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('08dc551c-9f57-403e-afe1-c0661fe347b9', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Mariusz Bielecki', 'mariuszb725@gmail.com', '604605699', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('a2d2b15a-ece0-4099-9c88-c4c55171f523', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Remigiusz Jakowski', NULL, '504140963', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('6e5d4e40-ca70-43af-8a0a-c9e188835b13', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Wojciech Żurawski', 'w.zurawski65@gmail.com', '502715205', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('17e46071-e8c3-486b-94f9-10dfa5ec72da', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Paweł Piekarski', 'pawelxpiekarski@gmail.com', '503531979', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('bc5ddf74-33c9-4e81-9c33-4ccf6855d398', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Jarosław Kozub', NULL, '696048878', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('8325bcba-7dc4-4e27-a2f8-893dc59a6add', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Grzegorz Rak', 'grzegorz.rak@gmail.com', '692438023', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('5f111273-6a66-4e08-beca-94dc3c22aa8b', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Robert Kaczmarczyk', NULL, '515671807', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('d62bc86a-bfb2-43a9-a1d6-345fc3ecaa72', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Krzysztof Talaczek', NULL, '509510530', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('0fbd7863-4b0f-41c5-bb88-63bccd85132b', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Jakub Siedlecki', NULL, '578901489', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('f4acc19e-76a0-4a63-bc1e-2e843b0dd947', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Jacek Skalda', NULL, '792660511', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('82a84fe2-c3e8-4125-861a-f65dc40f97cd', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Grzegorz Hyc', 'kuros33@gmail.com', '604683502', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('7f4499f9-e36e-4626-9a64-5db0198802d9', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Jan Szwedo', 'szwedojan@gmail.com', '600925136', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('5dd76d83-dc66-49ce-8e76-58cc6f8953a8', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Konrad Kurek', 'kurek.konrad@vp.pl', '724731569', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('51334582-0d92-426a-bf13-bd5ef6a188a0', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Leszek Lelek', NULL, '662240166', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('09847504-61e3-49a7-87fd-47c0055ee468', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Pawel Zabderz', 'pawel8512@interia.pl', '606958136', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('5defa5b6-679a-4145-a7e9-d645312c80f8', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Dariusz Sokołowski', 'sokolowski8u@gmail.com', '788997413', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('7b6dbdb6-458b-4570-9996-57a5e65bf71e', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Pan od Seat Leon', NULL, '600960438', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('6c542521-e755-4ebf-bc78-c45dbdb96505', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Grzegorz Pyzik', 'grzegorzpyzik@wp.pl', '505481591', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('b9fc700d-4ea7-41e1-83f9-5414d6f1d892', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Tomasz GLC', NULL, '607244804', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('b79bff05-a771-4184-9ede-f29af111ef46', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Jolanta Lesniak', NULL, '509357860', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('46a80f56-0bee-40fb-9496-4e32d9d73c27', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Jasiek MUSTANG', NULL, '510497999', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('9b6c7761-c49c-42ee-8e96-acd578621cbf', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Grzegorz Nowak', NULL, '606915111', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('9aec195a-717c-4122-b523-c61fd3588d2e', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Marcin Rosadziński', NULL, '603604258', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('7911f849-0e56-4b99-a434-48169a3bfeff', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Jarosław Karbuz', 'harbuzjaroslaw@gmail.com', '570318257', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('20407c33-b3a5-4429-bf67-e478795f433a', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Maria Kuczaj-Ivarsson', 'maya.mimika@gmail.com', '517177795', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('f60fd8ee-efab-4703-a4b9-ed9023d9bdae', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Artur Łączny', NULL, '514088459', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('01da1b17-f34a-4908-b82a-7b0735816d11', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Witold Korzec', NULL, '6072341234', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('cd9ad1c7-aa98-4af3-aa9b-86607726de89', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Małgorzata Suder', NULL, '511450449', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('46936b7b-ba9c-4a59-8740-1f366b06a187', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Grzegorz Glijer', NULL, '731777753', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('ce1e3582-327f-4d61-8780-a8cbb4e65408', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Mariusz Pawelec', NULL, '601871007', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('f88805b9-1ce5-4d45-88af-2b688e76c4c7', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Kamil Paszkiewicz', NULL, '663808910', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('d9ea95f0-9e50-498c-8b8f-6025a2a360c1', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Witold Korzec', NULL, '607234123', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('41ec3cf9-a606-434b-a829-00c3fb0aee38', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Patryk Korpak', NULL, '506507059', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('d3181329-3f46-4d44-8406-df357d5de84f', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Piotr Sołtysiak', 'piotrek.soltysiak@gmail.com', '518515861', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('2342754a-7f47-47bd-8764-853f06598ce4', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Norbert Wilk', NULL, '600891541', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('1631c39a-a741-476d-ab5b-cb3982b5216f', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Ryszard Mazur', 'ryszardmazur1@gmail.com', '730496155', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('953f8657-2575-4848-82bc-8381db376d46', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Sławomir Tomal', 'slawek30000@gmail.com', '668438486', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('9b3ad82f-f7a8-4c81-ae83-aaf9839eecec', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Zbyszek Jeziorski', NULL, '792485007', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('260ad8b1-e7d3-47d0-9655-90c6f81c134c', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Mariusz Krupa', 'mariusz.krupa@vp.pl', '695406606', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('dd6530d2-ae28-41a2-8ea7-c6aad910099a', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Michał Komar', 'michal.komar@hotmail.com', '692926266', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('33d50fb2-7c6b-42f7-adca-5a9b0e9cbc85', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Paweł Hutyra', NULL, '604621352', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('679ad548-cbf3-497a-bfcb-d333068639e2', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Patryk Gębala', 'patryk.arnold.gebala@gmail.com', '516519916', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('c6f1a775-5bc9-4af3-a41e-6aa4da13e3a7', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Paweł Kisiel', 'pawel.kisiel@outlook.com', '502306985', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('94ee1c9b-455b-4e95-b4c1-f0cbb4fd3c9e', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Dominik Przystał', NULL, '535018941', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('8ab69c14-8531-4ac9-9602-a1c91892f9ae', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Wojciech Urbańczyk', NULL, '502903983', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('176811ca-d6f8-434e-ab47-3ac27db1d178', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Zbigniew Bielecki', NULL, '510694934', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('003f7200-2d31-4cbd-aaed-123b7bae9914', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Maciej Piekarz', 'mac.piekarz@gmail.com', '737489049', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('9970fddf-0ee0-4f84-ba45-36dbc238e7b3', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Mariusz banach', NULL, '505420485', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('af7345cc-725c-4715-bd85-684fddd9cd78', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Pan Wiesław', NULL, '669374607', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('2336873b-1d0b-469b-a8a0-bd0b489d39e3', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Audi Q3', NULL, '730931437', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('6a5d9a80-1bda-4956-8f81-1b8a5da1fd0e', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Bartek', NULL, '507939999', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('31a9c843-a67f-489c-a71b-639e0f9ffc5d', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Bartosz Strug', NULL, '668907901', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('3e4f8120-f89f-429a-8b93-04bc98e2bd43', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Edyta Fronckowiak', NULL, '695736665', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('c3a64ff2-21d1-422e-a4b3-e7f120eb2784', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Dominik', NULL, '728427147', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('66f3cc83-5159-4b72-80f5-0027279d912c', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Adrian', NULL, '571945703', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('1f63ac6b-67e4-44ab-b332-e80add37a9e5', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Angelika Parzyńska', NULL, '607507378', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('c92c60a3-6196-401c-96f7-9bb18d03c7f3', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Dominik Gil', 'dominik.gil@koronea.com', '506005165', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('c45edf68-290b-40a9-9372-ccfd97f8e97b', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Waldemar Cieślak', NULL, '609055417', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('3840bba7-09ca-427a-a394-efd6390ea893', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Agnieszka Janik', NULL, '602327110', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('ca27601a-b91f-49eb-b5a8-311950a97d2c', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Mateusz Chabrowski', NULL, '509094447', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('af20be0f-a39e-42af-be33-13c10ec75cad', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Dominik Piszczek', NULL, '515715533', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('2ae0abb9-b33b-4722-b218-d67617602646', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Zofia', NULL, '790761144', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('852c4fa1-1a61-4adf-9683-b6389f930c7b', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Piotr', NULL, '506251271', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('5eb028e7-9b35-42c8-9e1f-994583bc7813', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Katarzyna', NULL, '514953385', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('5e1a71c4-311c-47ee-b607-6d39e3d53ef1', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Tadeusz', NULL, '514536086', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('ec43721d-021f-48e4-ae03-6e8d853c99ef', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Aleks Ćwikła', NULL, '884840144', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);
INSERT INTO customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('dd1b68cd-af90-4f55-ae9e-10c224396860', '50230fb6-fca0-4a09-b19c-f80215b2b715', 'Lena Lis', NULL, '792658292', true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);

-- STEP 4: Customer vehicles
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'eb767cf8-ac61-412c-89fd-2c59e313a36d', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '662283182' LIMIT 1), '861a643e-044e-4efe-9a08-3697fd476937'),
  '662283182', 'Honda CR-V', 'KRA5711N', 'JHMRW2760KX208547', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '662283182' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '5196932f-d4e8-41c3-be18-d0b8fe2dcdb3', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '662271176' LIMIT 1), 'f8643ddd-64c3-48b4-9257-30c39a45d8b4'),
  '662271176', 'Kia ProCeed', 'KK8883K', 'UP5YH2G15ARL085869', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '662271176' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'dfaec36c-dc71-4607-acc7-2b6ec6e7da40', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502863346' LIMIT 1), '0dde65ad-6169-4a1d-9125-ba75d81fb37a'),
  '502863346', 'Hyundai i30', 'KK2747L', 'TMAH151D0SJ247325', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502863346' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '81af1028-bb47-4a6c-aa1a-4ee534ac646f', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '508368799' LIMIT 1), '786e90f8-b01e-44a8-8a5a-e624666c89ba'),
  '508368799', 'Volkswagen T-Roc', 'KK1851L', 'WVGZZZA16SV042893', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '508368799' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '13d6b6b1-1a4d-49ee-92c6-56ec21000433', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '607535224' LIMIT 1), 'c9160bd9-0fe8-44d3-a81c-2885c0688058'),
  '607535224', 'BMW X7', 'DX15487', 'WBA21EM0409X39927', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '607535224' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '71c53de4-b848-4d99-a5f4-84fe1c1883ca', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '503975991' LIMIT 1), '7323e0b2-2e23-4069-ae7a-abf4b9eb04a4'),
  '503975991', 'Cupra Formentor', 'KNS6607T', 'VSSZZZKM9SR004532', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '503975991' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '1cf7969b-ad6c-4368-a8cf-ff274fea9a89', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '501184025' LIMIT 1), 'b0e6874f-49e1-4ee1-8d2a-2e12cf70558d'),
  '501184025', 'Lexus NX', 'KK 3896L', 'JTJCKBFZ202051719', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '501184025' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '1c77ce38-c8d4-4e1f-a3a4-ed960a633003', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '799133199' LIMIT 1), '3bd0e12c-58c9-46ed-8450-d998b742736f'),
  '799133199', 'BMW Seria 3', 'KK8679K', 'WBA28FF0908F08075', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '799133199' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'cde5de76-3c40-4bd3-ae72-514e272cb05e', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '577948692' LIMIT 1), 'd9314d01-6170-4266-bc23-12a89a4f3e65'),
  '577948692', 'Renault Austral', 'KK 3434', 'VF1RHN00471039979', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '577948692' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '2f77a491-313f-489e-bb25-d9ea7ccb7017', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '665832346' LIMIT 1), '3700b862-7f4a-4590-b473-6fcc0e3285bd'),
  '665832346', 'Volkswagen Passat', 'KK30004', 'WVWZZZCJ5RD009689', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '665832346' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '15efc056-3949-49c2-b7de-ed7c8ca24f7f', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '733793733' LIMIT 1), '4beed85c-380c-41a2-8cf4-84ff3a693e8b'),
  '733793733', 'Toyota RAV4', 'KK5404', 'asdasd', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '733793733' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '89578652-653f-4c9a-886f-26a62115f16b', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '693820502' LIMIT 1), '0cf05774-1040-4b8e-befb-b5419cef51cb'),
  '693820502', 'Škoda Karoq', 'KK43387', 'TMBJR7NU0S5026764', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '693820502' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '8962bb7b-15e3-43c0-b36a-e8963794ed72', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '669090409' LIMIT 1), '8b6e7237-db4f-4a01-a2ea-d17dda717b91'),
  '669090409', 'Volvo S90', 'sdsd', 'sdsd', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '669090409' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '83ee5f83-5f00-4e4e-94d2-ceb249bd587c', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '537931015' LIMIT 1), '1c51ab3e-da43-497d-9c3d-d1dd0e3b7e8e'),
  '537931015', 'Civic Honda', 'KK2323', 'asas', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '537931015' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '399d9dd3-1916-4172-a91b-ff471763f3b1', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '501080850' LIMIT 1), '784d618a-d04f-4219-b40a-d39cca8e4103'),
  '501080850', 'Tesla Model 3', 'KK2369E', 'LRW3E7EKC439302', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '501080850' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '34799d23-8dcd-42dc-9e34-e87ce09da8c0', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '574145426' LIMIT 1), '638f2440-ebca-4b83-a1ba-64e4520a249a'),
  '574145426', 'Škoda Octavia', 'KK8650L', '34343434', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '574145426' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'e66774e4-bd21-4158-863e-1f870a64335b', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '795183551' LIMIT 1), 'c5b29cfd-2d6c-4937-b926-8df23b5933b8'),
  '795183551', 'Vw Golf Golf Gti', 'KK5973L', 'WVWZZZAUZKW133451', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '795183551' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'dfeaa10d-0ec8-48a9-8e1a-f8361e8dd036', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '606664700' LIMIT 1), 'b9bed3a2-f1d1-41b9-bcab-6b3c4cba866a'),
  '606664700', 'Toyota RAV4', 'sdsd', 'sadsd', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '606664700' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'fe492742-437f-4910-a092-5a627746e428', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502863346' LIMIT 1), '0dde65ad-6169-4a1d-9125-ba75d81fb37a'),
  '502863346', 'Hyundai i30 N', 'KK2747L', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502863346' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'e955a5f1-13f3-41ea-ade3-fb986b1e75cc', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '513984640' LIMIT 1), '2faec128-8c9d-460b-8570-6c5ad146276a'),
  '513984640', 'Kia ProCeed', 'KK43434', 'asas', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '513984640' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '974b14e0-0806-4dc7-8359-d4b77560ca18', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '886348039' LIMIT 1), '22b35ab4-d53d-45a9-a459-fa86c61488a0'),
  '886348039', 'Opel Corsa', 'KR9G268', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '886348039' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '39bedf4e-c13a-4b41-b641-3d503cd877c7', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '794057266' LIMIT 1), '23f71cfe-c124-44c4-a8e6-c141fa98ea5f'),
  '794057266', 'Dodge Charger', '073X', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '794057266' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '58e3331a-f7dd-4f8a-b17c-f41363591a0e', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '604605699' LIMIT 1), '08dc551c-9f57-403e-afe1-c0661fe347b9'),
  '604605699', 'Škoda Karoq', 'KK 7962M', '7MBLD7PS2ST086866', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '604605699' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'c37856c1-5d2e-4cc6-9725-73cc4e8a456f', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '504140963' LIMIT 1), 'a2d2b15a-ece0-4099-9c88-c4c55171f523'),
  '504140963', 'Honda Civic', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '504140963' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '72825933-b3df-454f-9e51-579c0e0752e5', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502715205' LIMIT 1), '6e5d4e40-ca70-43af-8a0a-c9e188835b13'),
  '502715205', 'Mazda 3', 'KRA595EN', 'JM4BP6HH401515288', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502715205' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '50012f0d-ff94-47c5-b141-ef2cae5dee0a', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '503531979' LIMIT 1), '17e46071-e8c3-486b-94f9-10dfa5ec72da'),
  '503531979', 'Lexus LX', 'KK6261N', 'JTHUCBDHX02009182', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '503531979' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '7bb05be7-253e-4686-9fa7-631585d9fc77', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '696048878' LIMIT 1), 'bc5ddf74-33c9-4e81-9c33-4ccf6855d398'),
  '696048878', 'Honda CR-V', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '696048878' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '3c03f6dd-cb0b-41bc-ae6e-e00b9eb8929a', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '692438023' LIMIT 1), '8325bcba-7dc4-4e27-a2f8-893dc59a6add'),
  '692438023', 'Škoda Kodiaq', 'KK5397N', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '692438023' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'e1ddc634-0afa-45fc-b997-fd686150bfa7', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '515671807' LIMIT 1), '5f111273-6a66-4e08-beca-94dc3c22aa8b'),
  '515671807', 'Volkswagen Jetta', 'KR7nt57', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '515671807' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'a9fbeb6c-8ca9-4d67-9a46-57cdc9761d92', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '509510530' LIMIT 1), 'd62bc86a-bfb2-43a9-a1d6-345fc3ecaa72'),
  '509510530', 'BMW Seria 8', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '509510530' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '97038736-5ef8-4fb5-9c2c-a4ee6dd48691', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '578901489' LIMIT 1), '0fbd7863-4b0f-41c5-bb88-63bccd85132b'),
  '578901489', 'Audi RS6', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '578901489' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '9b61210f-644e-4c63-bb4b-0af8cf2a54c1', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '792660511' LIMIT 1), 'f4acc19e-76a0-4a63-bc1e-2e843b0dd947'),
  '792660511', 'Ford EcoSport', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '792660511' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '16787f4e-ec9e-44b0-88db-35b816e76569', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '604683502' LIMIT 1), '82a84fe2-c3e8-4125-861a-f65dc40f97cd'),
  '604683502', 'Volkswagen Tiguan', 'WPR6622U', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '604683502' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'fdcbaad4-5f02-472d-a43a-918cd53067f7', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '600925136' LIMIT 1), '7f4499f9-e36e-4626-9a64-5db0198802d9'),
  '600925136', 'BMW Seria 3', 'KK 9580N', 'WBA81FF020FV20544', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '600925136' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '2c74e66f-df3e-40c4-a308-797b9c157707', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '724731569' LIMIT 1), '5dd76d83-dc66-49ce-8e76-58cc6f8953a8'),
  '724731569', 'Škoda Octavia', 'KK5231M', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '724731569' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'cb27543f-cc3b-47ad-a8ed-ff47b34a726e', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '662240166' LIMIT 1), '51334582-0d92-426a-bf13-bd5ef6a188a0'),
  '662240166', 'Renault Captur', 'KK2443T', 'VF1RJB00875028933', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '662240166' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '3cdef8f5-c09a-4fc1-9598-7379f82ea0d3', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '606958136' LIMIT 1), '09847504-61e3-49a7-87fd-47c0055ee468'),
  '606958136', 'Toyota RAV4', 'KMY57355', 'JTME63FV40D578135', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '606958136' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '216de255-d41b-401c-a646-c6ecaf812d85', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '788997413' LIMIT 1), '5defa5b6-679a-4145-a7e9-d645312c80f8'),
  '788997413', 'Audi A4', 'KOLXN75', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '788997413' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '92e6b8ad-2c94-4228-b656-8e0e4589a15d', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '600960438' LIMIT 1), '7b6dbdb6-458b-4570-9996-57a5e65bf71e'),
  '600960438', 'SEAT Leon', 'KN150FR', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '600960438' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '0cac5112-aa01-47d9-b6c5-cd4addf9d605', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '505481591' LIMIT 1), '6c542521-e755-4ebf-bc78-c45dbdb96505'),
  '505481591', 'Alfa Romeo Giulia', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '505481591' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'af3ecd69-2135-4ab2-9ae1-f099f5a34802', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '607244804' LIMIT 1), 'b9fc700d-4ea7-41e1-83f9-5414d6f1d892'),
  '607244804', 'Mercedes GLC', 'KK32323', 'as', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '607244804' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'fc22eaf1-a96b-4f62-ac0b-102d95d538f6', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '501080850' LIMIT 1), '784d618a-d04f-4219-b40a-d39cca8e4103'),
  '501080850', 'Toyota RAV4', NULL, '=-----', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '501080850' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'a7e82376-3f14-43ee-a1ad-79bcf2cc6614', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '509357860' LIMIT 1), 'b79bff05-a771-4184-9ede-f29af111ef46'),
  '509357860', 'Audi Q4 e-tron', 'KK1012E', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '509357860' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'ca2a20ee-36b2-449c-88f4-7cb1e5fafbf2', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '510497999' LIMIT 1), '46a80f56-0bee-40fb-9496-4e32d9d73c27'),
  '510497999', 'Ford Mustang', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '510497999' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '0b010622-6e0d-4eb7-96e6-0c92af687ca2', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '606915111' LIMIT 1), '9b6c7761-c49c-42ee-8e96-acd578621cbf'),
  '606915111', 'Volkswagen Golf', 'KR3ST98', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '606915111' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'e861a408-1568-4e83-8523-09cbc2718b37', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '603604258' LIMIT 1), '9aec195a-717c-4122-b523-c61fd3588d2e'),
  '603604258', 'Volvo XC60', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '603604258' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '8bcd3aa5-1ddd-48b6-b146-f6f326a560ec', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '570318257' LIMIT 1), '7911f849-0e56-4b99-a434-48169a3bfeff'),
  '570318257', 'Škoda Octavia', 'KK 3494T', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '570318257' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'fca076c7-aade-44fc-9d75-258f097db7f5', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '517177795' LIMIT 1), '20407c33-b3a5-4429-bf67-e478795f433a'),
  '517177795', 'Volkswagen Tayron', 'KK 5040R', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '517177795' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '67c8cd77-ce5c-483a-b003-55c6a27b2e4a', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '514088459' LIMIT 1), 'f60fd8ee-efab-4703-a4b9-ed9023d9bdae'),
  '514088459', 'Kia Picanto', 'KK 7459R', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '514088459' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'fd58ba62-7278-45c7-9cfd-17af03fc4a5a', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '6072341234' LIMIT 1), '01da1b17-f34a-4908-b82a-7b0735816d11'),
  '6072341234', 'Škoda Fabia', 'KSU RR888', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '6072341234' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '655ba621-e2aa-4188-9803-a0627208a7af', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '511450449' LIMIT 1), 'cd9ad1c7-aa98-4af3-aa9b-86607726de89'),
  '511450449', 'Honda ZR-V', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '511450449' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'a8895a7b-2a5e-46f6-a8d6-c839edccb5e4', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '731777753' LIMIT 1), '46936b7b-ba9c-4a59-8740-1f366b06a187'),
  '731777753', 'Škoda Superb', 'KR 9LA67', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '731777753' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '694cfff6-e04d-492f-80d6-d0d73f31be57', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '696048878' LIMIT 1), 'bc5ddf74-33c9-4e81-9c33-4ccf6855d398'),
  '696048878', 'Honda Accord', 'KR4GK80', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '696048878' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'f5b19a82-159e-430c-b894-8c010b606892', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '601871007' LIMIT 1), 'ce1e3582-327f-4d61-8780-a8cbb4e65408'),
  '601871007', 'Volkswagen Passat', 'DW1LH65', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '601871007' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'd7cb7628-52e1-4117-ac60-b54b0835d847', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '663808910' LIMIT 1), 'f88805b9-1ce5-4d45-88af-2b688e76c4c7'),
  '663808910', 'BMW X3', 'KK2827S', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '663808910' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '4b76adae-ff05-445b-9d80-8347c319196a', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '509357860' LIMIT 1), 'b79bff05-a771-4184-9ede-f29af111ef46'),
  '509357860', 'BMW X3', 'KK88109', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '509357860' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'f3c5d1a5-5e98-4664-a9e8-b94bfe379c93', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '607234123' LIMIT 1), 'd9ea95f0-9e50-498c-8b8f-6025a2a360c1'),
  '607234123', 'Škoda Fabia', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '607234123' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '499c4f93-c1f3-4c53-855d-f40b35971a29', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '506507059' LIMIT 1), '41ec3cf9-a606-434b-a829-00c3fb0aee38'),
  '506507059', 'BMW i8', 'KK5594S', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '506507059' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'ec802a3e-4f8c-4ce5-9272-533350b0f4c1', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '518515861' LIMIT 1), 'd3181329-3f46-4d44-8406-df357d5de84f'),
  '518515861', 'Volvo XC60', 'KK9383S', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '518515861' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '61a876b7-fecf-4d6e-872e-25e88efb29b6', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '600891541' LIMIT 1), '2342754a-7f47-47bd-8764-853f06598ce4'),
  '600891541', 'Audi Q5', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '600891541' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '38343421-31d4-4014-80b3-e8a031e51f85', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '730496155' LIMIT 1), '1631c39a-a741-476d-ab5b-cb3982b5216f'),
  '730496155', 'Lexus UX', 'KK2092L', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '730496155' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '09e4bbb6-847d-49a8-bf34-5f8a8b543d95', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '668438486' LIMIT 1), '953f8657-2575-4848-82bc-8381db376d46'),
  '668438486', 'Škoda Octavia', 'K0 MAMBA', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '668438486' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '50077eec-15e5-4396-9247-6edac18ba029', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '792485007' LIMIT 1), '9b3ad82f-f7a8-4c81-ae83-aaf9839eecec'),
  '792485007', 'BMW X4', 'KK2926U', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '792485007' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'f30e781e-643c-4808-8854-2e36830094f0', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '695406606' LIMIT 1), '260ad8b1-e7d3-47d0-9655-90c6f81c134c'),
  '695406606', 'Jaecoo J7', 'KK4820U', 'LNNBBDEEXSC205489', 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '695406606' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '5c645422-eb54-4990-b3b0-bee4bee2d6f9', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '692926266' LIMIT 1), 'dd6530d2-ae28-41a2-8ea7-c6aad910099a'),
  '692926266', 'Volvo XC60', 'KK5100U', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '692926266' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'b0a3754c-364f-4aa2-a70c-b228c1723bce', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '503531979' LIMIT 1), '17e46071-e8c3-486b-94f9-10dfa5ec72da'),
  '503531979', 'Lexus UX', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '503531979' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '6e0d8237-e8d2-4641-93bd-e8ad71b3b7d5', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '604621352' LIMIT 1), '33d50fb2-7c6b-42f7-adca-5a9b0e9cbc85'),
  '604621352', 'Mercedes CLA', 'KK5596N', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '604621352' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'accb76b4-d22b-4ccf-aabb-3693563cd1f4', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '516519916' LIMIT 1), '679ad548-cbf3-497a-bfcb-d333068639e2'),
  '516519916', 'Cupra Formentor', 'KK5845U', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '516519916' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'ac45f82b-6903-4c35-9f94-ab6efb0c7a25', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '668438486' LIMIT 1), '953f8657-2575-4848-82bc-8381db376d46'),
  '668438486', 'Škoda Octavia RS', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '668438486' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '81a088ae-bad8-45f3-83a1-76ab019d17b5', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502306985' LIMIT 1), 'c6f1a775-5bc9-4af3-a41e-6aa4da13e3a7'),
  '502306985', 'Lexus RX', 'KK3022G', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502306985' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '5a302e33-eae4-4c09-abcd-347152e40cf2', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '535018941' LIMIT 1), '94ee1c9b-455b-4e95-b4c1-f0cbb4fd3c9e'),
  '535018941', 'Audi A5', 'WI830RN', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '535018941' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'bbbce21f-3eff-4406-b423-cdc49ef1e95f', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502903983' LIMIT 1), '8ab69c14-8531-4ac9-9602-a1c91892f9ae'),
  '502903983', 'Honda Civic', 'KR1PP88', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '502903983' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '6ea9f963-c629-4156-be3f-ac313af58258', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '510694934' LIMIT 1), '176811ca-d6f8-434e-ab47-3ac27db1d178'),
  '510694934', 'Mazda CX-5', 'KK49504', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '510694934' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'd2706fbc-5ca6-4976-b811-2bd1a870f339', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '737489049' LIMIT 1), '003f7200-2d31-4cbd-aaed-123b7bae9914'),
  '737489049', 'Volvo XC40', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '737489049' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'ede49405-7c82-4b0f-8e7f-d34fafb54a0b', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '505420485' LIMIT 1), '9970fddf-0ee0-4f84-ba45-36dbc238e7b3'),
  '505420485', 'Mazda CX-60', 'KK4538S', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '505420485' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '7f8d2875-66a7-45c1-a7c4-b2ec6fb31216', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '669374607' LIMIT 1), 'af7345cc-725c-4715-bd85-684fddd9cd78'),
  '669374607', 'Škoda Karoq', 'TJE 74282', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '669374607' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '3f52c329-1473-4310-91bf-0324df31e979', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '730931437' LIMIT 1), '2336873b-1d0b-469b-a8a0-bd0b489d39e3'),
  '730931437', 'Audi Q3', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '730931437' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'a7cce187-6921-4aa8-8b7a-708c72b46198', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '507939999' LIMIT 1), '6a5d9a80-1bda-4956-8f81-1b8a5da1fd0e'),
  '507939999', 'BMW X2', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '507939999' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '9ca1454a-f527-4a29-9702-0c61492fc4a4', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '668907901' LIMIT 1), '31a9c843-a67f-489c-a71b-639e0f9ffc5d'),
  '668907901', 'bmw e60', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '668907901' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '371d8c85-fdc1-4d34-839a-95b0f7f77edf', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '695736665' LIMIT 1), '3e4f8120-f89f-429a-8b93-04bc98e2bd43'),
  '695736665', 'Alfa Romeo Giulia', 'KK1263Y', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '695736665' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '3a80e1c8-5e44-4daa-b4c7-049362b3f2b3', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '728427147' LIMIT 1), 'c3a64ff2-21d1-422e-a4b3-e7f120eb2784'),
  '728427147', 'Fiat 126p', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '728427147' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '836388d6-26e5-4561-9036-6f080384663b', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '571945703' LIMIT 1), '66f3cc83-5159-4b72-80f5-0027279d912c'),
  '571945703', 'BMW GS 1250', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '571945703' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'a8847790-db34-4566-bece-dfcf0366b363', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '607507378' LIMIT 1), '1f63ac6b-67e4-44ab-b332-e80add37a9e5'),
  '607507378', 'MINI Countryman', 'KR5HC68', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '607507378' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'e6829245-ab05-4497-8bb9-7c45d696ed8f', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '507939999' LIMIT 1), '6a5d9a80-1bda-4956-8f81-1b8a5da1fd0e'),
  '507939999', 'Dacia Dokker', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '507939999' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '4407fc2c-6bcd-44ad-a8e0-1282b77680c6', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '506005165' LIMIT 1), 'c92c60a3-6196-401c-96f7-9bb18d03c7f3'),
  '506005165', 'BMW Seria 3', 'TLW88SN', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '506005165' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'd985a5d5-1b1f-4f32-957b-3b4c06eec95d', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '609055417' LIMIT 1), 'c45edf68-290b-40a9-9372-ccfd97f8e97b'),
  '609055417', 'Lexus NX', 'KK10501U', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '609055417' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '1abf58d1-8e06-42b8-9f01-46a5773b912e', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '602327110' LIMIT 1), '3840bba7-09ca-427a-a394-efd6390ea893'),
  '602327110', 'Honda CR-V', 'KK3820Y', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '602327110' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'ee265e00-4681-4afc-8644-74b263f6c51b', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '509094447' LIMIT 1), 'ca27601a-b91f-49eb-b5a8-311950a97d2c'),
  '509094447', 'Mercedes Klasa E', 'KK6188G', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '509094447' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'c541860c-6850-4f47-a730-27b1d8bc81ae', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '515715533' LIMIT 1), 'af20be0f-a39e-42af-be33-13c10ec75cad'),
  '515715533', 'BMW Seria 5', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '515715533' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '974a5694-fca3-4f4f-812c-315fdbc65646', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '790761144' LIMIT 1), '2ae0abb9-b33b-4722-b218-d67617602646'),
  '790761144', 'Audi A1', 'KK1406V', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '790761144' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '0f19355f-f5f2-4940-a55f-c304803d52d3', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '604683502' LIMIT 1), '82a84fe2-c3e8-4125-861a-f65dc40f97cd'),
  '604683502', 'BMW Seria 5', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '604683502' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'fc6e8a1a-4a19-486c-9236-691a5488ec40', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '506251271' LIMIT 1), '852c4fa1-1a61-4adf-9683-b6389f930c7b'),
  '506251271', 'Audi RS6', 'KK213Y', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '506251271' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'e2060a01-5c96-483d-b616-2bcab3c7a917', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '514953385' LIMIT 1), '5eb028e7-9b35-42c8-9e1f-994583bc7813'),
  '514953385', 'Honda HR-V', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '514953385' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT 'ff1c6c0f-4530-450c-82c6-02b1958bca3f', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '514536086' LIMIT 1), '5e1a71c4-311c-47ee-b607-6d39e3d53ef1'),
  '514536086', 'BMW M240i', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '514536086' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '82e1ddce-38a3-441d-bed6-e6ee842229da', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '507939999' LIMIT 1), '6a5d9a80-1bda-4956-8f81-1b8a5da1fd0e'),
  '507939999', 'Kia XCeed', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '507939999' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '0cb32793-eca8-45e8-ad4c-2560581d9f52', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '884840144' LIMIT 1), 'ec43721d-021f-48e4-ae03-6e8d853c99ef'),
  '884840144', 'Nissan Qashqai', 'WE3gw36', NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '884840144' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '1308ea9d-48bf-4ff1-a633-d65a1a5db3ca', '50230fb6-fca0-4a09-b19c-f80215b2b715',
  COALESCE((SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '792658292' LIMIT 1), 'dd1b68cd-af90-4f55-ae9e-10c224396860'),
  '792658292', 'BMW Seria 4', NULL, NULL, 1, now()
WHERE (SELECT id FROM customers WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND phone = '792658292' LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;

-- STEP 5: Reservations
-- Temporarily disable FK checks for data import
SET session_replication_role = 'replica';
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '566a54ab-e373-44d7-b92e-b6e4b16ddab4', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-01-27', '07:15', '2025-01-31', '08:15',
  'Tomasz Wesołowski', 'anitawesolowska@poczta.fm', '662283182', 'Honda CR-V',
  0.0, 0.0, 'Korekta Lakieru one - Step + usunięcie zarysowań Prawa Strona + Powłoka Elastomer Selaf Heal ULTRA 5.Lat | Cena: 2900zł | Rej: KRA5711N | Przebieg: 24500 | Rok: 2018 | VIN: JHMRW2760KX208547', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), '3280EB2C', '2025-01-27 11:38:13', '2025-01-27 11:38:13'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '0b67a47c-c981-495f-b975-1a96d0be019e', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-01-27', '09:00', '2025-01-29', '17:00',
  'Estera', 'estera.p@interia.pl', '662271176', 'Kia ProCeed',
  4495.0, 5528.85, 'Oklejenie Samochodu Folią PPF : Maska, przednie błotniki, wnęki progowe (tylne do wysokości zamka) próg załadunkowy bagażnika, wnęki klamek.ranty | Cena: 2745 zł | Rej: KK8883K | Przebieg: 1540km | Rok: 2024 | VIN: UP5YH2G15ARL085869', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), 'BCC0C9E3', '2025-01-25 11:03:24', '2025-01-25 11:03:24'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'fb35b135-27ec-45e1-af18-1eeeec961456', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-01-28', '16:30', '2025-02-01', '17:30',
  'Wojciech Antonik', 'wojciech.pawel.antonik@gmail.com', '502863346', 'Hyundai i30',
  3100.0, 3813.0, 'Pakiet Medium Smart  - Elastomer + Szyby NW + PPF Wnęki + Lampy + Black piano wewnątrz + ekran  2700 Netto/ Szyby NW + 300zł netto + Ekran Gratis + Ekran 150/200.  3150 zł | Rej: KK2747L | Przebieg: 20 | Rok: 2024 | VIN: TMAH151D0SJ247325', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), '35C60641', '2025-01-28 15:01:59', '2025-01-28 15:01:59'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'f122aeb7-33bb-4305-833d-5c202c662493', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-01-28', '18:45', '2025-02-03', '17:00',
  'Kuba Cikowski', 'cikowskikuba@gmail.com', '508368799', 'Volkswagen T-Roc',
  6097.56, 7500.0, 'Full Front w tym - Maska,Zerzak przód, lampy przód, błotniki przód, Słupki A, Cabtop na dach, Lusterka, wnęki klamek, parapet tylnego zderzaka. + Powłoka Elastomerowa Na pozostałe elementy. | Rej: KK1851L | Przebieg: 25 | Rok: 2024 | VIN: WVGZZZA16SV042893', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '41E634C1', '2025-01-28 18:54:38', '2025-01-28 18:54:38'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '8f5723da-02eb-4a69-ba49-0fc15ac0e25f', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-01-31', '10:00', '2025-01-31', '15:00',
  'Dariusz Wójcik', 'dariuszwojcik1@op.pl', '607535224', 'BMW X7',
  0.0, 0.0, 'Przegląd gwarancyjny | Rej: DX15487 | Przebieg: 4000 | Rok: 2024 | VIN: WBA21EM0409X39927', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '0B4668D6', '2025-01-28 12:25:01', '2025-01-28 12:25:01'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'c31434a2-4875-4591-90d8-c7ef9208ad0c', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-02-05', '07:30', '2025-02-08', '16:30',
  'Michał Uryga', 'urygamichal@interia.pl', '503975991', 'Cupra Formentor',
  7500.0, 9225.0, 'Full Front w tym wnęki progowe + Wnęk klamek + Powłoka Elastomer 5.Lat 80.000 Km | Cena: 7500 | Rej: KNS6607T | Przebieg: 528 | Rok: 2024 | VIN: VSSZZZKM9SR004532', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '1718AC55', '2025-01-28 09:29:15', '2025-01-28 09:29:15'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'e303e8f7-ab1d-4940-a2ae-12d8807eebd1', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-02-06', '10:15', '2025-02-13', '11:15',
  'Jacek Bednarz', 'Jacek.bednarz@vp.pl', '501184025', 'Lexus NX',
  11700.0, 14391.0, 'Full Body - Bez Dachu - Dach powłoka Elastomer + Ekran Multimediów Matowy. | Cena: 11700 Netto | Rej: KK 3896L | Przebieg: 300 | Rok: 2024 | VIN: JTJCKBFZ202051719', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF matowa UltraFit' LIMIT 1), '1E675B6A', '2025-02-06 12:17:17', '2025-02-06 12:17:17'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'dab8bc87-8d87-47a2-978f-41a77fbfab32', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-02-13', '13:30', '2025-02-13', '14:30',
  'Wojciech Antonik', 'wojciech.pawel.antonik@gmail.com', '502863346', 'Hyundai i30',
  0.0, 0.0, 'Cena: usługa gwarancyjna | Rej: KK8883K | Przebieg: 4000 | Rok: 2024 | VIN: sdsdsd', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, 'B3322613', '2025-02-11 10:10:29', '2025-02-11 10:10:29'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'a116e7ae-5a63-4428-bc62-3fb7820c9442', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-02-16', '18:45', '2025-02-19', '19:45',
  'Piotr Matras', 'kontakt@piotrmatras.com', '799133199', 'BMW Seria 3',
  9100.0, 9100.0, 'FF + Zderzak tył + próg zewnętrzny wnęki progowe + ekran multimediów mat + zabezpieczenie felg 2.kpl. | Cena: 9100 | Rej: KK8679K | Przebieg: 2217 | Rok: 2024 | VIN: WBA28FF0908F08075', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), 'D5A75FFF', '2025-02-08 08:08:27', '2025-02-08 08:08:27'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '818c5b7d-c0c8-46c5-a1fe-336edf45a09f', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-02-19', '08:30', '2025-03-01', '15:30',
  'Ivan Popov', 'ivan.i.popov.1992@gmail.com', '577948692', 'Renault Austral',
  13900.0, 13900.0, 'Full Body + Zabezpieczenie szklanego Dachu Folia WinCrest EVO | Cena: 13900 | Rej: KK 3434 | Przebieg: 1266 | Rok: 2024 | VIN: VF1RHN00471039979', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF połysk UltraFit' LIMIT 1), 'A8F7D443', '2025-02-13 12:51:46', '2025-02-13 12:51:46'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '806e1626-e1bb-4a96-9c8e-ca37cddbafa6', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-02-22', '11:00', '2025-02-22', '12:00',
  'Estera', 'estera.p@interia.pl', '662271176', 'Kia ProCeed',
  0.0, 0.0, 'Rej: KK2342 | Przebieg: 4000 | Rok: 2024 | VIN: adssd', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, 'CBC8A390', '2025-02-15 10:16:44', '2025-02-15 10:16:44'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '3359b72a-4a0c-4c5f-9d77-ddb57da20a92', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-02-25', '17:00', '2025-02-27', '17:00',
  'Kamil Staszewski', 'kamil.staszewski85@gmail.com', '665832346', 'Volkswagen Passat',
  276.42, 3400.0, 'Oklejenie zderzaka przód + Maska + Black piano zderzak przód + emlblemat przód + elementy klapy oraz zderzaka tył + wnęki klamek + Lampy tył | Cena: 3000zł | Rej: KK30004 | Przebieg: 5569 | Rok: 2024 | VIN: WVWZZZCJ5RD009689', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), '5E598D34', '2025-02-04 19:31:53', '2025-02-04 19:31:53'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '50dbc6cf-4116-4b91-a6fd-0e24f0a1d55f', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-02-26', '09:15', '2025-02-26', '12:15',
  'Marcin mazurek', 'mazmarcin@gmail.com', '733793733', 'Toyota RAV4',
  0.0, 0.0, 'Porzegląd | Rej: KK5404 | Przebieg: 4000 | Rok: 2024 | VIN: asdasd', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '4B4F3D56', '2025-02-12 09:29:00', '2025-02-12 09:29:00'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '1ed30db5-9c56-42b3-a75b-ff66cd2dd89f', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-03-08', '10:30', '2025-03-08', '12:30',
  'Michał Uryga', 'urygamichal@interia.pl', '503975991', 'Cupra Formentor',
  0.0, 0.0, 'Rej: KKDJD | Przebieg: SSSS | Rok: SSSSS | VIN: JKHJH', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, '61152441', '2025-02-25 10:43:40', '2025-02-25 10:43:40'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '6512a22d-2e47-46c9-be72-843ef70edd0a', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-03-10', '15:30', '2025-03-10', '17:30',
  'Piotr Matras', 'kontakt@piotrmatras.com', '799133199', 'BMW Seria 3',
  0.0, 0.0, 'Rej: asas | Przebieg: asas | Rok: asas | VIN: asas', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, 'BD6518B3', '2025-02-27 13:08:56', '2025-02-27 13:08:56'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '80c5989b-f9d4-4d12-ba3a-5059a8001fa9', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-03-22', '08:30', '2025-03-22', '17:30',
  'Kamil Staszewski', 'kamil.staszewski85@gmail.com', '665832346', 'Volkswagen Passat',
  0.0, 0.0, 'Cena: Gwarancyjne | Rej: KK30004 | Przebieg: 5569 | Rok: 2024 | VIN: W', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, '26E4523A', '2025-02-28 17:18:11', '2025-02-28 17:18:11'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'f2b5e67c-d868-4630-8b6e-fd21739c5f97', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-03-26', '17:15', '2025-03-29', '18:15',
  'Andrzej Chwastek', 'achwastek@poczta.onet.pl', '693820502', 'Škoda Karoq',
  9900.0, 9900.0, 'Maska, zderzak, reflektory, błotniki, lusterka, słupki A, nadszybie, próg załadunkowy bagażnika, słupki black piano a i b + ekran multimediów folią matową (antypalcującą) + 4,szt drzwi + wnęki progowe 4.szt (tylne do wysokości zamka)   Powłoka Elastomerowa z funkcją samoregeneracji mikro zarysowań trwałośc 5.lat 80.000km | Cena: 9900 | Rej: KK43387 | Przebieg: 165km | Rok: 2025 | VIN: TMBJR7NU0S5026764', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), '1C1CDC6A', '2025-03-24 15:48:37', '2025-03-24 15:48:37'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '49b9644d-d9de-4a86-9ba9-b4bfb83d01b3', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-03-27', '11:30', '2025-03-27', '13:00',
  'Mateusz Żurawiecki', NULL, '669090409', 'Volvo S90',
  0.0, 0.0, 'Rej: sdsd | Przebieg: 21212 | Rok: 2024 | VIN: sdsd', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), NULL, '0C42EEEE', '2025-03-26 08:02:16', '2025-03-26 08:02:16'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'de93b105-4b44-49f9-96cb-27684de94076', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-04-04', '10:30', '2025-04-04', '17:30',
  'Filip Mienkina', NULL, '537931015', 'Civic Honda',
  0.0, 0.0, 'Przygotowanie do sprzedazy | Cena: 500zł netto | Rej: KK2323 | Przebieg: asass | Rok: 2024 | VIN: asas', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przygotowanie do sprzedaży' LIMIT 1), 'C708C3FF', '2025-04-02 08:12:01', '2025-04-02 08:12:01'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '95c8ea27-a315-4f0e-998f-f41c72108844', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-04-14', '16:30', '2025-04-23', '17:30',
  'Pan Paweł NIP: 6793239229', 'pawel@pawelkruk.com', '501080850', 'Tesla Model 3',
  13800.0, 16974.0, 'Full Body + wnętrze. | Cena: 13800 Netto Full Body | Rej: KK2369E | Przebieg: 1569 | Rok: 2025 | VIN: LRW3E7EKC439302', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF połysk UltraFit' LIMIT 1), 'E8A99693', '2025-03-25 12:18:28', '2025-03-25 12:18:28'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '44f25288-661a-4f52-bd25-a934d6667420', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-04-17', '07:00', '2025-04-21', '17:00',
  'Eleonora Pierozchenko', NULL, '574145426', 'Škoda Octavia',
  0.0, 0.0, 'Cena: 5700 | Rej: KK8650L | Przebieg: 40 | Rok: 2025 | VIN: 34343434', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), NULL, 'DA3600AC', '2025-04-17 11:28:37', '2025-04-17 11:28:37'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '257f1090-338a-4ac6-aa94-1880e905ed9d', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-04-17', '14:30', '2025-04-17', '16:30',
  'Andrzej Chwastek', 'achwastek@poczta.onet.pl', '693820502', 'Škoda Karoq',
  0.0, 0.0, 'PRZEGLĄD | Rej: asas | Przebieg: asas | Rok: asas | VIN: asassa', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), 'C5840AE0', '2025-04-03 15:47:37', '2025-04-03 15:47:37'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '7ac052e1-3eb0-4429-9da3-84d65c8c164c', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-04-22', '17:30', '2025-04-29', '17:30',
  'Mateusz Golf Gti', 'kowalczyk.hubert@o2.pl', '795183551', 'Vw Golf Golf Gti',
  0.0, 0.0, 'Korekta + powłoka elastomer + Wycena : Progi black piano + zderzak tył black piano + zderzak przód black piano + maska + lampy + dach płaski + dach szyber (black piano ) + Pranie wnętrza + naklejki + zaprawki + wnęki progowe przód | Cena: 1200 | Rej: KK5973L | Przebieg: 96000 | Rok: 2019 | VIN: WVWZZZAUZKW133451', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), '2509069B', '2025-03-31 15:40:15', '2025-03-31 15:40:15'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'ffe9c03a-7d14-4214-b882-c9b5ed587b14', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-04-25', '08:30', '2025-04-25', '14:30',
  'SYLWESTER MICEK PLANET', NULL, '606664700', 'Toyota RAV4',
  0.0, 0.0, 'Mycie detailingowe + środek | Cena: 250 | Rej: sdsd | Przebieg: 40000 | Rok: 2023 | VIN: sadsd', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie detailingowe' LIMIT 1), 'E63CA305', '2025-03-17 13:15:36', '2025-03-17 13:15:36'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '64855a05-8214-4f36-8116-2ec4fe944f21', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-05', '08:30', '2025-05-05', '16:30',
  'Wojciech Antonik', 'wojciech.pawel.antonik@gmail.com', '502863346', 'Hyundai i30 N',
  365.85, 450.0, 'Rej: KK2747L | Przebieg: 5352 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, '8183A629', '2025-04-23 13:20:12', '2025-04-23 13:20:12'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'fc5f7576-787b-46ca-925b-c1ae60858a58', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-05', '09:15', '2025-05-05', '15:15',
  'Klient Pranie', NULL, '513984640', 'Kia ProCeed',
  130.08, 160.0, 'Pranie foteli | Rej: KK43434 | Przebieg: sdsdd | Rok: 2024 | VIN: asas', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Pranie foteli oraz boczków' LIMIT 1), '96EAB14E', '2025-04-30 07:08:51', '2025-04-30 07:08:51'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '6f49db73-058e-4bd1-a94a-de7b5baf3997', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-07', '07:15', '2025-05-07', '18:15',
  'Klaudia Nalik- Iwaniak', NULL, '886348039', 'Opel Corsa',
  480.0, 480.0, 'Pranie foteli + podsufitki + ozonowanie + usuwanie zapachów. | Cena: 480 | Rej: KR9G268', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Pranie foteli oraz boczków' LIMIT 1), '0D85E8FD', '2025-05-07 07:35:17', '2025-05-07 07:35:17'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'cbeacc06-fb57-4dd1-aa80-5449ea56dbe0', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-08', '07:00', '2025-05-08', '15:00',
  'Olav Popov', 'ivan.i.popov.1992@gmail.com', '577948692', 'Renault Austral',
  0.0, 0.0, 'Rej: KK50004L | Przebieg: 2323 | Rok: 2024 | VIN: 23232323', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, '8FC22C77', '2025-04-26 09:04:01', '2025-04-26 09:04:01'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'f1ed9543-a0b6-47f6-98ec-775a2ea53cf4', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-10', '09:00', '2025-05-15', '10:00',
  'TOmasz Chojak', 'chojak.tomasz@gmail.com', '794057266', 'Dodge Charger',
  3850.0, 3850.0, 'Korekta jedno etapowa usunięcie 80% zarysowań + Oklejenie lampy lewy przód folia ppf (dragon skin)  Wnęki progowe 4.szt folia PPF.  3500 + 250 wnęki +  100 lampa + zaprawki. | Rej: 073X | Przebieg: 15630 | Rok: 2022', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), '3941F28F', '2025-04-11 11:27:16', '2025-04-11 11:27:16'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '9dcdc645-2e6b-41a0-9a08-f27d3a0bb8ce', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-13', '08:00', '2025-05-14', '07:00',
  'Eleonora Pierozchenko', NULL, '574145426', 'Škoda Octavia',
  0.0, 0.0, 'Rej: Maks | Przebieg: Ndnd | Rok: 2025 | VIN: Jdjd', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), NULL, 'DB0D4739', '2025-04-21 15:51:15', '2025-04-21 15:51:15'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '43c273b2-7088-4fd1-8a2d-fe4884d73979', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-19', '07:15', '2025-05-22', '08:15',
  'Mariusz Bielecki', 'mariuszb725@gmail.com', '604605699', 'Škoda Karoq',
  5700.0, 5700.0, 'Full Front + oklejenie tylnych słupków czarną folią (słupek C) | Cena: 5700 | Rej: KK 7962M | Przebieg: 400 | Rok: 2025 | VIN: 7MBLD7PS2ST086866', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '11E8EC36', '2025-05-19 17:29:16', '2025-05-19 17:29:16'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'de3637a9-022c-42fc-aa42-77f0ad2ee365', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-19', '18:15', '2025-05-22', '19:15',
  'Remigiusz Jakowski', NULL, '504140963', 'Honda Civic',
  0.0, 0.0, 'Oklejenie tylnej klapy Folia Carbon (ultrafit) + oklejenie maski PPF połysk + lampy przód + Mycie + dekontaminacja z kompletnym sprzątaniem wnętrza + booster na powłokę ceramiczną.', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), '7C403FD2', '2025-05-19 07:14:19', '2025-05-19 07:14:19'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'e7b2111f-6d2e-4399-8b76-79b668fdc616', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-21', '10:00', '2025-05-24', '11:00',
  'Wojciech Żurawski', 'w.zurawski65@gmail.com', '502715205', 'Mazda 3',
  2800.0, 2800.0, 'Oklejenie Lamp przód + Słupki black piano + trójkąt drzwi przednich + Wnętrze black piano drzwi przód 2.szt + tunel środkowy + oklejenie emblematu przód. + Powłoka Elastomerowa 5.lat 80.000 tyś. | Cena: 2800 | Rej: KRA595EN | Przebieg: 5km | Rok: 2025 | VIN: JM4BP6HH401515288', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), 'BCE1E5CB', '2025-05-19 08:02:25', '2025-05-19 08:02:25'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '28a695ab-bbf6-45da-8a06-539e28395a1b', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-22', '07:15', '2025-05-27', '08:15',
  'Paweł Piekarski', 'pawelxpiekarski@gmail.com', '503531979', 'Lexus LX',
  13670.0, 16814.1, 'Full Body Mat + Połysk dach oraz elementy czarne  + Powłoka Waxoyl na wnętrze + powłoka na Felgi + ekran multimediów mat + wnęki progowe do wysokości zamka. | Cena: 13670 | Rej: KK6261N | Przebieg: 23 | Rok: 2025 | VIN: JTHUCBDHX02009182', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF matowa UltraFit' LIMIT 1), '64E858E0', '2025-05-14 18:32:14', '2025-05-14 18:32:14'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '6c7dea7f-7eea-4899-aebc-377e055da0b1', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-22', '09:00', '2025-05-22', '16:00',
  'Jarosław Kozub', NULL, '696048878', 'Honda CR-V',
  0.0, 0.0, 'Poprawa lusterka + drzwi | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), 'FFEADA9C', '2025-05-19 10:45:18', '2025-05-19 10:45:18'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '80a272ba-ebfb-4d7f-b5f7-f57ee338d2bf', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-23', '14:00', '2025-05-23', '16:30',
  'Paweł Kruk', 'pawel@pawelkruk.com', '501080850', 'Tesla Model 3',
  0.0, 0.0, 'Przegląd + oklejenie klapki ładowania', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), 'DF1F79E5', '2025-05-09 07:45:09', '2025-05-09 07:45:09'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '1b84f17e-e339-4de5-8d0c-10a2ace71f98', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-24', '07:00', '2025-05-24', '08:00',
  'Grzegorz Rak', 'grzegorz.rak@gmail.com', '692438023', 'Škoda Kodiaq',
  1200.0, 1200.0, 'Oklejenie słupków C + Relingi + Grill Folia Czarną | Cena: 1200 | Rej: KK5397N | Przebieg: 580 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), 'B7FC8C30', '2025-05-24 07:08:40', '2025-05-24 07:08:40'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '28c3bcac-ccfd-41c4-a4da-4e567d896501', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-05-26', '09:00', '2025-05-26', '13:00',
  'Robert Kaczmarczyk', NULL, '515671807', 'Volkswagen Jetta',
  0.0, 0.0, 'Dekontamincja + wosk | Rej: KR7nt57', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Dekontaminacja chemiczna + glinkowanie' LIMIT 1), 'A31CFDED', '2025-05-19 14:51:42', '2025-05-19 14:51:42'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'f7ce879f-1be2-4100-80e9-24147984dd68', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-05', '07:15', '2025-06-11', '08:15',
  'Krzysztof Talaczek', NULL, '509510530', 'BMW Seria 8',
  14300.0, 17589.0, 'Oklejenie Full Body +Wnęki progowe + ekran multimediów mat + wnęki przy zamku. | Cena: 14 300 Netto | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF matowa UltraFit' LIMIT 1), '9069946A', '2025-06-05 12:36:56', '2025-06-05 12:36:56'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '948a1b94-03a8-4979-b3e1-1a5b4a1cf664', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-06', '07:00', '2025-06-09', '08:00',
  'Jakub Siedlecki', NULL, '578901489', 'Audi RS6',
  0.0, 0.0, 'FF lub FB', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '098BCA48', '2025-05-21 15:24:05', '2025-05-21 15:24:05'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '76d6f5ad-6722-4aa7-b04b-693a2fb54986', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-06', '07:15', '2025-06-07', '08:15',
  'Jacek Skalda', NULL, '792660511', 'Ford EcoSport',
  870.0, 870.0, 'Oklejenie Maski PPF', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), 'A26FE43E', '2025-05-21 12:10:36', '2025-05-21 12:10:36'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '32dba58b-50c8-447b-b112-c8f268669246', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-13', '20:10', '2025-06-18', '21:10',
  'Grzegorz Hyc', 'kuros33@gmail.com', '604683502', 'Volkswagen Tiguan',
  0.0, 0.0, 'Full Body + Ekran mat(do potwierdzenia) | Cena: 14000 | Rej: WPR6622U | Przebieg: 300 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF matowa UltraFit' LIMIT 1), '2C949C10', '2025-06-13 18:03:57', '2025-06-13 18:03:57'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '82297302-eadd-46ca-88e0-43a0d16edc32', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-16', '09:00', '2025-06-19', '16:00',
  'Jan Szwedo', 'szwedojan@gmail.com', '600925136', 'BMW Seria 3',
  7900.0, 9717.0, 'Pakiet Urban + Progi | Cena: 7 900 | Rej: KK 9580N | Przebieg: 394 | Rok: 2025 | VIN: WBA81FF020FV20544', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '15A52448', '2025-06-11 15:26:39', '2025-06-11 15:26:39'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '691c12ca-4e1f-47a0-9a48-b045478762b2', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-23', '18:30', '2025-06-24', '19:30',
  'Mariusz Bielecki', 'mariuszb725@gmail.com', '604605699', 'Škoda Karoq',
  0.0, 0.0, 'Przegląd !!', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '36B36F65', '2025-06-16 06:27:12', '2025-06-16 06:27:12'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '4b2b3668-28e9-4cf1-9ced-5edde993b73e', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-24', '09:15', '2025-06-28', '10:15',
  'Konrad Kurek', 'kurek.konrad@vp.pl', '724731569', 'Škoda Octavia',
  4850.0, 5965.5, 'Lampy + black piano + wnęki progowe + próg załadunkowy + tunel środkowy + ekran multimediów + listwy drzwi + maska Polerowanie + Chrysoberyl 5 lat. 80.000 km | Cena: 4850 | Rej: KK5231M | Przebieg: 5500 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'PPF Lampy przednie' LIMIT 1), '20E33CCA', '2025-06-12 08:19:57', '2025-06-12 08:19:57'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'a929c9b5-1831-411c-84ba-410ab21cecbb', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-27', '15:15', '2025-07-04', '16:15',
  'Leszek Lelek', NULL, '662240166', 'Renault Captur',
  2154.47, 2650.0, 'Powloka elastomerowa 5.lat 80.000 Km + Powloka na felgi + Ekran multimediów folia ppf matowa antyplacująca. | Cena: 2600 | Rej: KK2443T | Przebieg: 30 | Rok: 2025 | VIN: VF1RJB00875028933', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), 'CAA2208A', '2025-06-26 10:46:28', '2025-06-26 10:46:28'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '9d330b35-4e27-4682-8162-8b791796824c', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-30', '07:30', '2025-07-05', '08:30',
  'Pawel Zabderz', 'pawel8512@interia.pl', '606958136', 'Toyota RAV4',
  10900.0, 13407.0, 'Pakiet Full Front : Zderzak, maska, przednie reflektory, emblemat, przednie błotniki, słupki „a”(przy szybie czołowej) cabtop (pasek na dach od szyby czołowej w głąb dachu 20-30cm) lusterka, wnęki progowe 4.szt. .Oklejenie wszystkich elementów black piano - Sierpy błotników, doły drzwi, oraz doły zderzaka tył wraz z słupkiem black piano tylnej klapy + Powłoka Elastomerowa,  Powłoka na fotele, tylną kanapę oraz boczki drzwi - Waxoyl U.P.T, Zabezpieczenie Frontów felg (4.szt) Dedykowaną powłoką ceramiczną. | Cena: 10900 | Rej: KMY57355 | Przebieg: 300 | Rok: 2025 | VIN: JTME63FV40D578135', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '9FA550E5', '2025-06-12 13:00:46', '2025-06-12 13:00:46'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '48e6d5e1-b8a1-4af4-9122-12b520afe7af', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-06-30', '09:00', '2025-06-30', '13:00',
  'Olav Popov', 'ivan.i.popov.1992@gmail.com', '577948692', 'Renault Austral',
  170.0, 209.1, '', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, '40ADD100', '2025-06-26 10:00:56', '2025-06-26 10:00:56'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'c566528a-2363-41a2-af2b-5c02f7782256', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-07-10', '07:00', '2025-07-14', '08:00',
  'Dariusz Sokołowski', 'sokolowski8u@gmail.com', '788997413', 'Audi A4',
  1626.02, 2000.0, 'Pranie wnętrza + Korekta jedno etapowa + usunięcie zarysowań drzwi lewy tył + błotnik przód prawy (zaprawki) wneki klamek ppf + słupki black piano PPF + wnęki progowe PPF (prawy przód błotnik naprawić mocowanie chlapacza) | Cena: 2000 | Rej: KOLXN75 | Przebieg: 231000 | Rok: 2012', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Korekta lakieru 1-etapowa' LIMIT 1), '53797DC9', '2025-07-04 08:27:17', '2025-07-04 08:27:17'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '89d2367d-4e0d-4306-af12-26b0214a4255', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-07-17', '08:30', '2025-07-17', '14:30',
  'Pan od Seat Leon', NULL, '600960438', 'SEAT Leon',
  0.0, 0.0, 'Rozklejenie lamp przód PPF | Cena: 180zł | Rej: KN150FR | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'PPF Lampy przednie' LIMIT 1), '9E0B4C68', '2025-07-14 17:30:21', '2025-07-14 17:30:21'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'a22f9851-1e3e-4090-bd80-a49b7a5cfa10', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-07-18', '14:00', '2025-07-18', '17:00',
  'Grzegorz Pyzik', 'grzegorzpyzik@wp.pl', '505481591', 'Alfa Romeo Giulia',
  528.46, 650.0, 'Przegląd | Cena: 650 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '9F99A5C5', '2025-07-03 12:50:05', '2025-07-03 12:50:05'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'a30a8994-5581-45d0-b798-f6abde5e4489', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-07-23', '07:30', '2025-07-31', '08:30',
  'Tomasz GLC', NULL, '607244804', 'Mercedes GLC',
  13671.0, 16815.33, 'Full Body + Powłoka na plastiki + felgi + ekrany multimediów | Cena: 13671 Full Body | Rej: KK32323 | Przebieg: 12 | Rok: 2025 | VIN: as', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF połysk UltraFit' LIMIT 1), 'EF109886', '2025-04-16 07:02:23', '2025-04-16 07:02:23'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '8fbc13a2-2205-4f59-9072-a5cdb147428b', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-07-25', '07:00', '2025-07-25', '08:00',
  'Konrad Kurek', 'kurek.konrad@vp.pl', '724731569', 'Škoda Octavia',
  0.0, 0.0, '', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), NULL, 'E6EDF7AE', '2025-07-23 11:09:47', '2025-07-23 11:09:47'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'fadf4138-3cfc-4439-b935-a918a06e9cc6', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-08-01', '07:15', '2025-08-01', '08:15',
  'Pan Paweł NIP: 6793239229', 'pawel@pawelkruk.com', '501080850', 'Toyota RAV4',
  0.0, 0.0, 'Rok: 2025 | VIN: =-----', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, 'B5A0A1EC', '2025-07-22 10:01:41', '2025-07-22 10:01:41'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'f586c929-2d6f-4df8-9a2c-0007ea115740', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-08-01', '09:15', '2025-08-01', '16:15',
  'Jarosław Kozub', NULL, '696048878', 'Honda CR-V',
  0.0, 0.0, 'Poprawa lusterka oraz drzwi ! | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '4805F4DD', '2025-07-22 07:52:54', '2025-07-22 07:52:54'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '212681cf-9ee5-4309-b62d-1575b785b6cc', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-08-02', '10:15', '2025-08-02', '13:15',
  'Audi q4', NULL, '509357860', 'Audi Q4 e-tron',
  0.0, 0.0, 'Rej: KK1012E', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, 'C4154D70', '2025-07-25 13:00:13', '2025-07-25 13:00:13'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '47d802b2-6117-4a52-8564-eed175b3ba89', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-08-13', '17:15', '2025-08-18', '18:15',
  'Jasiek MUSTANG', NULL, '510497999', 'Ford Mustang',
  0.0, 0.0, 'One Step + Powłoka roczna', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Korekta + powłoka ceramiczna (pakiet)' LIMIT 1), 'A11D338C', '2025-08-11 17:25:13', '2025-08-11 17:25:13'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '86df3bc1-54fd-438e-928c-a4e341d2acb1', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-08-16', '09:15', '2025-08-16', '14:15',
  'Grzegorz Nowak', NULL, '606915111', 'Volkswagen Golf',
  284.55, 350.0, 'Cena: 350 | Rej: KR3ST98', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), NULL, '8CA5CA32', '2025-08-13 07:31:17', '2025-08-13 07:31:17'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '0c06e738-c103-42ad-a755-2fb06e489e1d', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-08-18', '10:15', '2025-08-18', '12:15',
  'Ivan Popov', 'ivan.i.popov.1992@gmail.com', '577948692', 'Renault Austral',
  0.0, 0.0, 'Mycie Komplet | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie detailingowe' LIMIT 1), 'CBD8B601', '2025-08-11 17:29:41', '2025-08-11 17:29:41'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'cfa911a7-217b-4ab0-bcb8-c0a85956852f', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-08-27', '11:30', '2025-08-27', '13:30',
  'Marcin Rosadziński', NULL, '603604258', 'Volvo XC60',
  0.0, 0.0, 'Przegląd Powłoki oraz Folii PPF | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '59C4E247', '2025-08-25 07:42:41', '2025-08-25 07:42:41'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '96914f15-9608-4ec3-bd57-3e399226d758', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-09-09', '07:30', '2025-09-12', '08:30',
  'Jarosław Karbuz', NULL, '570318257', 'Škoda Octavia',
  3700.0, 4551.0, 'Oklejenie - Zderzak + lampy przód + słupki black piano + parapet tylnego zderzaka + 4.szt drzwi | Cena: 4551 | Rej: KK 3494T | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '35A77E32', '2025-09-01 12:09:19', '2025-09-01 12:09:19'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'a5562deb-5544-41f4-ba30-0261706c7401', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-09-20', '10:00', '2025-09-25', '17:00',
  'Maria Kuczaj-Ivarsson', 'maya.mimika@gmail.com', '517177795', 'Volkswagen Tayron',
  9700.0, 11931.0, 'Pakiet Urban - Oklejenie Full Front + progi + 4.szt drzwi + Powłoka ceramiczna na pozostałe elementy samochodu | Cena: 9700 zł Netto | Rej: KK 5040R | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '3C57CF19', '2025-09-17 11:43:48', '2025-09-17 11:43:48'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '8e185f06-2fff-4dea-aa67-ecb20b3f5983', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-09-25', '07:15', '2025-09-29', '08:15',
  'Artur Łączny', NULL, '514088459', 'Kia Picanto',
  2600.0, 2600.0, 'Powłoka Elastomerowa Trwałość 5 lat - 80.000km Oklejenie folią PPF Lampy przód + pas przedni lamp + wneki klamek + próg załadunkowy bagażnika + elementy black piano wewnątrz + wnęki progowe drzwi przednich. Ekran multimediów folia mat anty palcująca | Cena: 2600 | Rej: KK 7459R | Przebieg: 550km | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), '477179E1', '2025-09-25 17:38:50', '2025-09-25 17:38:50'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '64fe476f-c250-4d7c-88b9-4a136eb6d6ad', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-10-13', '15:15', '2025-10-13', '16:45',
  'Jarosław Harbuz', 'harbuzjaroslaw@gmail.com', '570318257', 'Škoda Octavia',
  0.0, 0.0, 'Przegląd po 3tyg od aplikacji folii | Cena: 0zł', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '9DB22783', '2025-10-10 14:07:00', '2025-10-10 14:07:00'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '590b656f-2b9c-440d-a7b0-21b69970c46d', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-10-14', '07:45', '2025-10-14', '15:45',
  'Witold Korzec', NULL, '6072341234', 'Škoda Fabia',
  3000.0, 3000.0, 'Maska + dach + parapet tylnego zderzaka + wnęki klamek | Rej: KSU RR888 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Start - Folia PPF połysk UltraFit' LIMIT 1), '648DA58E', '2025-09-30 06:42:33', '2025-09-30 06:42:33'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '2ca97bc2-a12e-4f2c-8dd8-4afdfa52b37b', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-10-15', '08:30', '2025-10-15', '16:30',
  'Wojciech Antonik', 'wojciech.pawel.antonik@gmail.com', '502863346', 'Hyundai i30 N',
  200.0, 200.0, 'Rej: KK2747L | Przebieg: 9500 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, 'E6661ADF', '2025-10-13 09:31:51', '2025-10-13 09:31:51'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'dd035d6e-5af3-472a-971d-1d8a314d9b8d', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-10-16', '08:15', '2025-10-16', '15:15',
  'Małgorzata Suder', NULL, '511450449', 'Honda ZR-V',
  300.0, 300.0, '', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, 'A72773D9', '2025-10-13 13:12:26', '2025-10-13 13:12:26'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'ce560425-61de-4254-b729-20093582006b', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-10-22', '08:45', '2025-10-24', '16:45',
  'Grzegorz Glijer', NULL, '731777753', 'Škoda Superb',
  2000.0, 2000.0, 'Czyszczenie wnętrza + pranie foteli + korekta jedno etapowa + powłoka roczna | Cena: 2000 | Rej: KR 9LA67 | Przebieg: 190000 | Rok: 2016', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Korekta lakieru 1-etapowa' LIMIT 1), 'DE723FAA', '2025-10-15 12:27:34', '2025-10-15 12:27:34'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '67c9359e-af4d-47cd-b34a-cd546345c046', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-10-22', '09:15', '2025-10-23', '10:15',
  'Jarosław Kozub', NULL, '696048878', 'Honda Accord',
  0.0, 0.0, 'Rej: KR4GK80', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), NULL, '451DDB1F', '2025-10-15 09:41:16', '2025-10-15 09:41:16'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'e77c73d2-1866-4ac4-9deb-f9ed3cba8f90', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-10-27', '07:45', '2025-10-28', '08:45',
  'Kamil Staszewski', 'kamil.staszewski85@gmail.com', '665832346', 'Volkswagen Passat',
  1178.86, 1450.0, 'Oklejenie drzwi 2.szt Strona prawa + usuniecie zarysowań drzwi + Przegląd grill przód + Lampy tył. | Cena: 1450 | Rej: KK30004 | Przebieg: 12100 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), 'B6E01B25', '2025-10-26 18:31:58', '2025-10-26 18:31:58'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '26e43dff-45e2-4591-89c9-d961ca9406d8', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-11-03', '08:15', '2025-11-04', '17:15',
  'Estera', 'estera.p@interia.pl', '662271176', 'Kia ProCeed',
  0.0, 0.0, 'Oklejenie 4.szt Drzwi | Cena: ok 2000zł', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '4894DCF8', '2025-10-21 07:45:26', '2025-10-21 07:45:26'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '2a0b4117-0c0d-49e3-b040-acc6db73487f', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-11-05', '09:15', '2025-11-05', '15:15',
  'Mariusz Pawelec', NULL, '601871007', 'Volkswagen Passat',
  300.0, 369.0, 'Usunięcie zarysowania parkingowego | Cena: 300zł | Rej: DW1LH65 | Przebieg: 189400 | Rok: 2020', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Korekta lakieru 1-etapowa' LIMIT 1), 'D36F77BE', '2025-10-30 11:19:09', '2025-10-30 11:19:09'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '4697885a-b39a-4c41-a352-894ebbb619a6', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-11-06', '07:05', '2025-11-10', '16:05',
  'Kamil Paszkiewicz', NULL, '663808910', 'BMW X3',
  8000.0, 9840.0, 'Oklejenie folią PPF Full Front + Elastomer + Zabezpieczenie Wnętrza Waxoyl UPT | Cena: 8000 | Rej: KK2827S | Przebieg: 653 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), 'A2B67069', '2025-10-31 12:40:06', '2025-10-31 12:40:06'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'c5ddd072-9ef6-45cd-b383-37e1463390c2', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-11-08', '09:00', '2025-11-08', '13:00',
  'Jolanta Lesniak', NULL, '509357860', 'BMW X3',
  0.0, 0.0, 'Mycie zewnatrz + Czyszczenie skór wewnatrz | Cena: 350zł | Rej: KK88109', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Czyszczenie skóry + nawilżanie' LIMIT 1), 'E3E5244D', '2025-10-30 10:04:26', '2025-10-30 10:04:26'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '458398d5-4dee-4b17-93a1-a5f44a76ddff', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-11-08', '09:15', '2025-11-08', '13:15',
  'Witold Korzec', NULL, '607234123', 'Škoda Fabia',
  0.0, 0.0, 'Przegląd po oklejaniu', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), 'CC65ABB7', '2025-10-27 15:38:50', '2025-10-27 15:38:50'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'db236a99-b562-47d6-862c-8babfd617c9e', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-11-12', '08:15', '2025-11-12', '17:15',
  'Patryk Korpak', NULL, '506507059', 'BMW i8',
  0.0, 0.0, 'Oklejenie elementów zderzaka mat | Cena: 500 | Rej: KK5594S | Rok: 2018', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), '759837A3', '2025-11-05 13:55:29', '2025-11-05 13:55:29'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '2ba4e534-5157-462b-ac0b-a14ab05a4aa1', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-11-12', '08:15', '2025-11-12', '17:15',
  'Patryk Korpak', NULL, '506507059', 'BMW i8',
  0.0, 0.0, 'Oklejenie elementów zderzaka mat | Cena: 500 | Rej: KK5594S | Rok: 2018', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), 'C4D2CB8F', '2025-11-05 13:55:29', '2025-11-05 13:55:29'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '1c5c77e6-1d14-43dc-9fb8-afcbadc3daf6', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-12-01', '08:15', '2025-12-05', '09:15',
  'Piotr Sołtysiak', 'piotrek.soltysiak@gmail.com', '518515861', 'Volvo XC60',
  0.0, 0.0, 'Oklejenie Folią PPF Full Front + 4.szt Drzwi + Cwiartka (błotniki tył) + Elementy wnętrza black piano + Ekran multimediów folią matową + Lampy tył. + wnęki progowe 4.szt drzwi (tylne do wysokości zamka) + Zabezpieczenie Skór Waxoyl UPT | Cena: 9300 | Rej: KK9383S | Przebieg: 17KM | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), 'ED0DD474', '2025-11-24 09:00:37', '2025-11-24 09:00:37'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '5ec5df80-8bce-4ce0-9d31-cd3a9eb67463', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-12-07', '09:15', '2025-12-08', '15:15',
  'Witold Korzec', NULL, '607234123', 'Škoda Fabia',
  0.0, 0.0, 'Wymiana Folii PPF na Dachu | Cena: Naprawa Gwarancyjna | Rej: KSU RR888 | Przebieg: 1522 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Usunięcie starej folii PPF' LIMIT 1), '5309BC23', '2025-11-13 16:17:51', '2025-11-13 16:17:51'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'cded0856-4d45-4e08-9860-4d7beb07f7cc', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-12-09', '08:00', '2025-12-09', '13:00',
  'Estera', 'estera.p@interia.pl', '662271176', 'Kia ProCeed',
  0.0, 0.0, 'Przegląd Gwarancyjny + mycie', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie premium' LIMIT 1), 'F66142DD', '2025-12-05 10:46:01', '2025-12-05 10:46:01'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '4abdd5b4-fb91-4789-8d6b-6cc124945fe5', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-12-09', '08:30', '2025-12-14', '09:30',
  'Norbert Wilk', NULL, '600891541', 'Audi Q5',
  0.0, 0.0, '', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), NULL, 'D465EF8C', '2025-11-15 19:14:07', '2025-11-15 19:14:07'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '83497f8a-0b77-4605-84a7-dc3c6d4a29d3', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-12-15', '09:00', '2025-12-15', '12:00',
  'Kamil Paszkiewicz', NULL, '663808910', 'BMW X3',
  0.0, 0.0, 'Przegląd Gwarancyjny | Cena: 0 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '1D3D8F1E', '2025-12-04 11:19:29', '2025-12-04 11:19:29'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'f7bbf08e-0674-4ad3-9980-6580445c4f48', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-12-16', '07:30', '2025-12-16', '16:30',
  'Kuba Cikowski', 'cikowskikuba@gmail.com', '508368799', 'Volkswagen T-Roc',
  0.0, 0.0, 'Przegląd powłoka + dekontaminacja | Cena: 450 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '1539D27D', '2025-12-08 11:26:43', '2025-12-08 11:26:43'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '98c11248-ac7c-47c2-82a4-b61d9793e19f', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-12-17', '09:30', '2025-12-20', '10:30',
  'Ryszard Mazur', 'ryszardmazur1@gmail.com', '730496155', 'Lexus UX',
  7500.0, 9225.0, 'Fullr Front + 4.szt Drzwi + Ekran multimediów matowy. | Cena: 7500 netto | Rej: KK2092L | Przebieg: 12000 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '023F7E87', '2025-12-17 08:41:07', '2025-12-17 08:41:07'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'f1c1a9a7-1980-47e2-a483-7bb33705f6fd', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-12-29', '08:15', '2025-12-31', '09:15',
  'Piotr Sołtysiak', 'piotrek.soltysiak@gmail.com', '518515861', 'Volvo XC60',
  0.0, 0.0, 'Przegląd Gwarancyjny + poprawa Lusterek + wymiana oklejenia zderzaka | Cena: 0', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '8FA1705B', '2025-12-06 11:50:52', '2025-12-06 11:50:52'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '9e57a1ce-71ee-4749-8eb3-f38535b4fbd6', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2025-12-29', '08:15', '2025-12-31', '09:15',
  'Sławomir Tomal', 'slawek30000@gmail.com', '668438486', 'Škoda Octavia',
  0.0, 0.0, 'Full Front + czarny dach | Cena: 5700 | Rej: K0 MAMBA | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), 'A6846E39', '2025-12-09 14:40:46', '2025-12-09 14:40:46'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'a78298f4-3446-4dcf-baba-640f4923d337', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-05', '08:30', '2026-01-08', '09:30',
  'Zbyszek Jeziorski', NULL, '792485007', 'BMW X4',
  2700.0, 3321.0, 'Powłoka Elastomerowa Revivify Ultra 5.lat/80.000 KM | Cena: 2700 Netto | Rej: KK2926U | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), '3F4C3C9B', '2025-12-15 10:29:17', '2025-12-15 10:29:17'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '92b0227f-e2ea-4616-8cac-c811f839e08b', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-07', '08:15', '2026-01-10', '09:15',
  'Estera', 'estera.p@interia.pl', '662271176', 'Kia ProCeed',
  2500.0, 3075.0, 'Konserwacja Podwozia Kompleks | Cena: 2500 | Przebieg: 15000 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Konserwacja podwozia' LIMIT 1), '0F482DE8', '2025-12-11 17:53:53', '2025-12-11 17:53:53'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'b9c28559-74e4-4846-af46-42520c73ede0', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-09', '07:00', '2026-01-10', '09:00',
  'Ivan Popov', 'ivan.i.popov.1992@gmail.com', '577948692', 'Renault Austral',
  0.0, 0.0, 'Przeklejenie zderzaka tył ( uszkodzenie) przepolerowanie plastiku strukturalnego na zderzaku + klamki + ozonowanie + pranie fotela prawy przód, mycie + komplet - Kanapa lewy tył slady po butach. | Cena: Do ustalenia z klientem | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Pranie foteli oraz boczków' LIMIT 1), 'C95A04C4', '2026-01-09 06:12:20', '2026-01-09 06:12:20'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '14507d8a-fb35-4ba0-99f3-db0f4870955a', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-09', '14:00', '2026-01-09', '17:00',
  'Ryszard Mazur', 'ryszardmazur1@gmail.com', '730496155', 'Lexus UX',
  0.0, 0.0, 'Przegląd Gwarancyjny | Cena: 0zł | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '150CB4EC', '2025-12-23 16:19:11', '2025-12-23 16:19:11'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '7887cdf3-c905-4f50-9518-4ee330233717', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-12', '07:30', '2026-01-21', '08:30',
  'Mariusz Krupa', 'mariusz.krupa@vp.pl', '695406606', 'Jaecoo J7',
  13200.0, 16236.0, 'Oklejenie wszystkich elementów od lini szyb w dół ( kolor olive green) Folia PPF Satyna - Oklejenie słupków bocznych folią w połysku (bez dachu) + DeChroming Grilla przód + powłoka Ceramiczna na felgi + Niewidzialna wycieraczka na wszystkie szyby. | Cena: 13 200 zł | Rej: KK4820U | Przebieg: 5km | Rok: 2025 | VIN: LNNBBDEEXSC205489', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Dechroming' LIMIT 1), '70C868AD', '2026-01-12 13:39:07', '2026-01-12 13:39:07'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'd0e61046-e94e-40de-9767-92290685330d', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-12', '08:15', '2026-01-16', '17:15',
  'Michał Komar', 'michal.komar@hotmail.com', '692926266', 'Volvo XC60',
  7800.0, 9594.0, 'Full Front + Powłoka elastomerowa na cały samochód | Cena: 7800 netto | Rej: KK5100U | Przebieg: 500KM | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '9502BC47', '2026-01-05 10:41:02', '2026-01-05 10:41:02'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'be7ae0a9-3fdc-4aff-bcd8-ce52ee5c5649', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-16', '09:30', '2026-01-18', '10:30',
  'Ivan Popov', 'ivan.i.popov.1992@gmail.com', '577948692', 'Renault Austral',
  0.0, 0.0, 'Mycie + przeklejenie zderzaka tył', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie premium' LIMIT 1), '385E969C', '2025-12-29 14:51:25', '2025-12-29 14:51:25'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '3aec3c60-4f23-4e9e-849e-c32e68920fb0', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-18', '20:00', '2026-01-20', '21:00',
  'Paweł Piekarski', 'pawelxpiekarski@gmail.com', '503531979', 'Lexus UX',
  0.0, 0.0, 'Przegląd + mycie + wnętrze', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie premium' LIMIT 1), '128A165F', '2026-01-15 14:13:11', '2026-01-15 14:13:11'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'a1a569af-ea6d-4868-b704-937cc6aa50c9', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-19', '17:00', '2026-01-24', '18:00',
  'Paweł Hutyra', NULL, '604621352', 'Mercedes CLA',
  13200.0, 16236.0, 'Full Body PPF | Cena: 13200 Netto | Rej: KK5596N | Przebieg: 13500 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF połysk UltraFit' LIMIT 1), '30528577', '2026-01-02 14:33:05', '2026-01-02 14:33:05'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '9f9ded00-f5f0-4843-a4d7-047274488895', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-20', '09:30', '2026-01-22', '10:30',
  'Patryk Gębala', 'patryk.arnold.gebala@gmail.com', '516519916', 'Cupra Formentor',
  4000.0, 4920.0, 'Powłoka Elastomerowa na cały samochód  Dedykowana powłoka ceramiczna na felgi  Dedykowana powłoka na szyby (niewidziana wycieraczka)  Folia PPF na lampy przód, wnęki klamek, słupki black piano (słupki a i b)  Folia PPF na wnęki progowe drzwi przednich.+ Ekran multimediów folia matowa antypalcująca. | Cena: 4000zł netto | Rej: KK5845U | Przebieg: 249 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), '2396903F', '2026-01-05 10:21:26', '2026-01-05 10:21:26'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '15168115-213f-4fb3-93bf-67d3518603b0', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-27', '15:30', '2026-01-27', '16:30',
  'Sławomir Tomal', 'slawek30000@gmail.com', '668438486', 'Škoda Octavia RS',
  0.0, 0.0, 'Przegląd', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '5D89DB68', '2026-01-19 12:11:56', '2026-01-19 12:11:56'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'b2616cc2-793f-4702-b152-0ce765d6d77c', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-01-30', '07:30', '2026-02-08', '08:30',
  'Paweł Kisiel', 'pawel.kisiel@outlook.com', '502306985', 'Lexus RX',
  0.0, 0.0, 'Przygotowanie do oddania do Leasingu z polerowaniem elementów. | Rej: KK3022G | Przebieg: 23924 | Rok: 2023', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przygotowanie do sprzedaży' LIMIT 1), 'B11F560D', '2026-01-30 16:00:44', '2026-01-30 16:00:44'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'e2cc6db8-21d5-4813-a5ea-3943f960e87e', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-02-04', '08:00', '2026-02-07', '17:00',
  'Dominik Przystał', NULL, '535018941', 'Audi A5',
  3495.93, 4300.0, 'Powłoka Elastomerowa + pakiet PPF Start PPF na Lampy przód, wnęki klamek, słupki black piano, parapet tylnego zderzaka,wnęki progowe przód, ekrany w mat, konsola środkowa PPF | Cena: 4300 | Rej: WI830RN | Przebieg: 500 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Powłoka elastomerowa' LIMIT 1), '88B8E3A2', '2026-01-30 15:21:39', '2026-01-30 15:21:39'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'a10870d5-01e0-44e8-980f-b2aaa0879180', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-02-06', '17:00', '2026-02-06', '18:00',
  'Wojciech Urbańczyk', NULL, '502903983', 'Honda Civic',
  0.0, 0.0, 'Rej: KR1PP88 | Rok: 2004', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), NULL, '9046A590', '2026-01-27 17:31:07', '2026-01-27 17:31:07'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '5195a4e8-c2ad-4798-b80a-336a202f0b8d', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-02-10', '07:45', '2026-02-13', '08:45',
  'Zbigniew Bielecki', NULL, '510694934', 'Mazda CX-5',
  0.0, 0.0, 'Konserwacja Podwozia - Wosk + Polimer | Cena: 2500zł netto | Rej: KK49504 | Przebieg: 17000 | Rok: 2023', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Konserwacja podwozia' LIMIT 1), 'F02802F4', '2026-02-06 14:23:34', '2026-02-06 14:23:34'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '306e5668-a26b-46d1-b594-306614601fd2', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-02-13', '08:00', '2026-02-18', '09:00',
  'Maciej Piekarz', 'mac.piekarz@gmail.com', '737489049', 'Volvo XC40',
  7200.0, 8856.0, 'Full front + powłoka Elastomerowa | Cena: 7200zł netto | Przebieg: 100 | Rok: 2026', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), 'BDAB9D7F', '2026-01-29 12:56:53', '2026-01-29 12:56:53'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'dd48fc07-457b-43ca-8b91-c2857e2b5264', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-02-15', '07:00', '2026-02-22', '08:00',
  'Mariusz banach', NULL, '505420485', 'Mazda CX-60',
  0.0, 0.0, 'Oklejenie Boków + maska + lampy + Parapet zderzaka | Cena: 10000 | Rej: KK4538S | Przebieg: 11000 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), 'B7174B37', '2026-02-15 21:19:37', '2026-02-15 21:19:37'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '5a807cbc-fb21-44ab-be94-a973e6ab476d', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-02-16', '07:00', '2026-02-20', '08:00',
  'Pan Wiesław', NULL, '669374607', 'Škoda Karoq',
  4700.0, 5781.0, 'Full front - Zderzak, maska,reflekrory przód,błotniki przód, słupki a, nadszybie, wnęki klamek, parapet tylnego zderzaka, słupki black piano. Ekran multimediów folia matowa antypalcująca. | Cena: 4700 | Rej: TJE 74282 | Przebieg: 150 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '8F73A18C', '2026-02-11 06:54:18', '2026-02-11 06:54:18'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'de79d8c1-53dd-4f31-9ed0-a38e926661b5', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-02-19', '08:00', '2026-03-02', '09:00',
  'Audi Q3', NULL, '730931437', 'Audi Q3',
  0.0, 0.0, 'Full front + Dechrom | Cena: 7150', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '1B87CA08', '2026-02-07 20:28:00', '2026-02-07 20:28:00'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '71552b4e-99e4-4256-a5fa-1484caf302bb', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-02-25', '08:00', '2026-02-25', '09:00',
  'Bartek', NULL, '507939999', 'BMW X2',
  0.0, 0.0, 'Mycie + dekontaminacja + QD | Cena: 350 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie + dekontaminacja' LIMIT 1), 'E912D99D', '2026-02-19 12:42:12', '2026-02-19 12:42:12'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '31f1f219-d6ef-4a63-8e48-df4dd18801d5', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-02-28', '09:00', '2026-02-28', '12:00',
  'Paweł Hutyra', NULL, '604621352', 'Mercedes CLA',
  0.0, 0.0, 'Przegląd', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '4E04AD94', '2026-02-04 17:02:39', '2026-02-04 17:02:39'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'c4533a86-5ccb-4f30-9788-9f9002327e00', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-02', '07:00', '2026-03-07', '08:00',
  'Bartosz Strug', NULL, '668907901', 'bmw e60',
  0.0, 0.0, 'Oklejenie przedniego błotnika | Cena: 200 zł', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), '3D57B88D', '2026-03-02 15:51:16', '2026-03-02 15:51:16'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '5c1ee4b2-eb50-4450-84ba-9dbae0f6fcff', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-02', '08:15', '2026-03-02', '18:15',
  'Michał Komar', 'michal.komar@hotmail.com', '692926266', 'Volvo XC60',
  0.0, 0.0, 'Przegląd + zaprawka na klapie + dół klapy PPF | Cena: 0 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '9FF2E9B7', '2026-02-13 11:51:51', '2026-02-13 11:51:51'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '420f4e96-364e-43fa-8f1d-5722c2478a00', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-03', '07:00', '2026-03-07', '08:00',
  'Edyta Fronckowiak', NULL, '695736665', 'Alfa Romeo Giulia',
  7700.0, 9471.0, 'Full Front + 4.szt drzwi | Cena: 7700 | Rej: KK1263Y | Przebieg: 15km | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '352D8D3E', '2026-03-03 14:09:08', '2026-03-03 14:09:08'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'ba380fb6-6deb-485d-a304-04dc3f5b0938', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-03', '07:15', '2026-03-08', '08:15',
  'Dominik', NULL, '728427147', 'Fiat 126p',
  0.0, 0.0, 'Delikatne pranie - przygotownie do sprzedazy + One step + zaprawki.', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Pranie wnętrza (wykładzina, boczki, fotele)' LIMIT 1), '18E32FEE', '2026-02-18 10:22:46', '2026-02-18 10:22:46'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'bada990f-ea78-411f-88e5-b965d527b330', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-05', '08:00', '2026-03-05', '15:00',
  'Adrian', NULL, '571945703', 'BMW GS 1250',
  0.0, 0.0, 'Czyszczenie motocykla + polerowanie baku | Cena: 250zł', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie detailingowe' LIMIT 1), '746350F8', '2026-02-28 12:37:17', '2026-02-28 12:37:17'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '1dab84c8-b172-45e0-81ee-e2e709a65df6', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-09', '07:45', '2026-03-11', '08:45',
  'Angelika Parzyńska', NULL, '607507378', 'MINI Countryman',
  1100.0, 1100.0, 'Pranie wnętrza + korekta lakieru + woskowanie + wgniotki drzwi prawy tył + zaprawki lakierniczne | Cena: 1100zł | Rej: KR5HC68', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Korekta lakieru 1-etapowa' LIMIT 1), '1DAB3A53', '2026-03-03 10:16:51', '2026-03-03 10:16:51'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'a80647e5-f2ee-4677-af0c-a6a78d28f37e', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-09', '08:30', '2026-03-09', '17:30',
  'Bartek', NULL, '507939999', 'Dacia Dokker',
  0.0, 0.0, 'Usunięcie śladów kleju | Cena: 300', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Korekta lakieru 1-etapowa' LIMIT 1), 'A76A0FF3', '2026-02-19 12:39:49', '2026-02-19 12:39:49'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '33a02aa2-10a3-4f67-ab10-0f6b65f754a8', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-10', '08:30', '2026-03-17', '09:30',
  'Dominik Gil', 'dominik.gil@koronea.com', '506005165', 'BMW Seria 3',
  9500.0, 11685.0, 'Full body zmiana koloru biały Oracal 946g+ lusterka czarne + Folia PPF : słupki black piano, elementy zderzaka, wnęki progowe drzwi przednich. | Cena: 9700 netto | Rej: TLW88SN | Przebieg: 23833 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF połysk UltraFit' LIMIT 1), 'EFB5446D', '2026-02-27 11:33:29', '2026-02-27 11:33:29'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'ef974809-887c-4650-aa9b-1408dab449d6', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-12', '07:15', '2026-03-16', '08:15',
  'Waldemar Cieślak', NULL, '609055417', 'Lexus NX',
  0.0, 0.0, 'Full Front + Konserwac ja Podwozia | Cena: 8000zł | Rej: KK10501U | Przebieg: 901 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '6E67F311', '2026-02-02 08:31:43', '2026-02-02 08:31:43'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '50caca62-21d2-4db0-87e4-7567a7f57824', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-16', '07:00', '2026-03-16', '08:00',
  'Wojciech Antonik', 'wojciech.pawel.antonik@gmail.com', '502863346', 'Hyundai i30 N',
  0.0, 0.0, 'Mycie | Cena: 200 | Przebieg: 12384 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie premium' LIMIT 1), 'CC268306', '2026-03-16 07:59:22', '2026-03-16 07:59:22'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '49a7ec0c-4ee5-441c-ba14-153c4c9af598', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-16', '09:15', '2026-03-20', '10:15',
  'Agnieszka Janik', NULL, '602327110', 'Honda CR-V',
  0.0, 0.0, 'Full Front + powłoka + Konserwacja. | Cena: 5000 | Rej: KK3820Y | Przebieg: 30 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), 'BD4ED094', '2026-01-28 14:19:43', '2026-01-28 14:19:43'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '799e12aa-1d9b-449f-b9bb-0e06b23df662', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-17', '07:00', '2026-03-28', '08:00',
  'Grzegorz Pyzik', 'grzegorzpyzik@wp.pl', '505481591', 'Alfa Romeo Giulia',
  0.0, 0.0, 'Oklejenie Zderzak Przód, Błotnik lewy przód, drzwi lewy przód. | Cena: 2596,10 | Rej: KK9303K | Przebieg: 14700 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), '4D1A283D', '2026-03-18 10:02:36', '2026-03-18 10:02:36'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '4e2e2617-0336-49d9-9229-bff2caa97a58', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-18', '08:00', '2026-03-18', '17:00',
  'Mateusz Chabrowski', NULL, '509094447', 'Mercedes Klasa E',
  0.0, 0.0, 'Oklejnie przedniej szyby Wincrest Evo | Cena: 1552zł netto | Rej: KK6188G | Przebieg: 33700 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Folia na szyby WinCrest EVO' LIMIT 1), '49F956FA', '2026-02-19 07:08:52', '2026-02-19 07:08:52'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '7bd3b8b1-ba21-499d-8f68-17a459173399', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-20', '07:00', '2026-03-20', '08:00',
  'Michał Uryga', 'urygamichal@interia.pl', '503975991', 'Cupra Formentor',
  0.0, 0.0, 'Przegląd ! | Cena: 200zł | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), 'B1A7ADB7', '2026-03-09 07:04:52', '2026-03-09 07:04:52'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '7f505ef4-73a4-40be-a4b5-c2e52235ba8c', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-20', '11:00', '2026-03-21', '17:00',
  'Dominik Piszczek', NULL, '515715533', 'BMW Seria 5',
  0.0, 0.0, 'Mycie komplet z szybami + przeklejenie pasów | Cena: 500zł', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie detailingowe' LIMIT 1), '1A2645A3', '2026-03-10 13:32:13', '2026-03-10 13:32:13'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'f4284fe0-9f7d-44ac-aec4-e5036cf716d8', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-23', '08:15', '2026-03-27', '17:15',
  'Jarosław Kozub', NULL, '696048878', 'Honda CR-V',
  3500.0, 4305.0, 'Konserwacja + wygłuszenie polimerem | Cena: 3500 netto | Przebieg: 5000 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Konserwacja podwozia' LIMIT 1), '6233CE60', '2026-02-13 13:08:06', '2026-02-13 13:08:06'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'be06404a-291d-4afe-b3dc-663d27f04c1b', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-23', '08:15', '2026-03-23', '12:15',
  'Maciej Piekarz', 'mac.piekarz@gmail.com', '737489049', 'Volvo XC40',
  0.0, 0.0, 'Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), NULL, '75B8ECC2', '2026-02-20 10:00:59', '2026-02-20 10:00:59'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'eb7e5809-0d5a-4364-9bfe-cf9a4e65917a', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-24', '07:00', '2026-03-30', '08:00',
  'Mateusz Żurawiecki', NULL, '669090409', 'Volvo S90',
  0.0, 0.0, 'Oklejenie dachu folia PPF + wgniotki + polerowania zderzaka dół + lewy próg | Cena: do ustalenia z klientem | Rej: KK4521K | Przebieg: 34347 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), 'D0590101', '2026-03-24 14:06:27', '2026-03-24 14:06:27'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '4380ceb8-7919-4401-ac67-565df97b55a8', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-03-24', '08:15', '2026-03-26', '09:15',
  'Zofia', NULL, '790761144', 'Audi A1',
  1500.0, 1500.0, 'Oklejenie dachu + black piano + parapet tylnego zderzaka | Cena: 1500 | Rej: KK1406V | Rok: 2020', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Zmiana koloru elementów (dach, lusterka)' LIMIT 1), '096A000E', '2026-03-06 12:01:26', '2026-03-06 12:01:26'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'cccdec30-0aa5-4606-b97d-fcfdf5295f29', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-04-07', '08:15', '2026-04-10', '09:15',
  'Paweł', 'kuros33@gmail.com', '604683502', 'BMW Seria 5',
  0.0, 0.0, 'Full Front + promo EKRAN POŁYSK + wycena na progi + dyfuzor tył. | Cena: 5200', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), 'E5565F61', '2026-03-13 13:08:30', '2026-03-13 13:08:30'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '4aaeee52-fad2-42a4-9f91-8a28a7fec215', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-04-09', '09:00', '2026-04-17', '10:00',
  'Piotr', NULL, '506251271', 'Audi RS6',
  13000.0, 15990.0, 'Ful body PPF ultrafit + wnętrze | Rej: KK213Y | Przebieg: 500 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Body - Folia PPF połysk UltraFit' LIMIT 1), '2AEF3EBC', '2026-04-03 14:09:02', '2026-04-03 14:09:02'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '144f754b-4810-443a-b037-ba940732499b', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-04-14', '08:15', '2026-04-18', '09:15',
  'Katarzyna', NULL, '514953385', 'Honda HR-V',
  0.0, 0.0, 'Konserwacja + Full Front + powłoka. | Cena: 7500 | Przebieg: 100 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '7167E58B', '2026-04-02 12:17:09', '2026-04-02 12:17:09'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '40caaa0e-b7a9-4330-8645-7ea6d6299278', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-04-15', '09:00', '2026-04-15', '12:00',
  'Ivan Popov', 'ivan.i.popov.1992@gmail.com', '577948692', 'Renault Austral',
  0.0, 0.0, 'Mycie', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 1), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie premium' LIMIT 1), 'E13227A6', '2026-04-07 16:20:46', '2026-04-07 16:20:46'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'eeb0a9fd-f783-47a9-a839-88343b02fbda', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-04-20', '09:00', '2026-04-20', '17:00',
  'Tadeusz', NULL, '514536086', 'BMW M240i',
  0.0, 0.0, 'Przeglądzik + listwa | Cena: bezpłatnie | Przebieg: 6000 | Rok: 2025', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '05E6964D', '2026-03-25 16:02:28', '2026-03-25 16:02:28'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '42600a0c-0b1c-4568-a115-8c4aa74b543f', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-04-21', '07:15', '2026-04-24', '08:15',
  'Bartek', NULL, '507939999', 'Kia XCeed',
  0.0, 0.0, 'Czyszczenie + przygotowanie do sprzdaży', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Mycie detailingowe' LIMIT 1), 'EA71EB56', '2026-04-10 10:02:08', '2026-04-10 10:02:08'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  'c703b727-acbc-4a57-b142-61ab438bdb29', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-05-06', '13:15', '2026-05-06', '15:15',
  'Aleks Ćwikła', NULL, '884840144', 'Nissan Qashqai',
  0.0, 0.0, 'Przwgląd poł∑oki + dekontaminacja lakieru | Cena: 450 | Rej: WE3gw36 | Rok: 2024', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Przegląd gwarancyjny' LIMIT 1), '75581F0D', '2026-04-14 09:17:05', '2026-04-14 09:17:05'
) ON CONFLICT DO NOTHING;
INSERT INTO reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '858b619c-b1ae-4347-bc1f-6ed11116bf5e', '50230fb6-fca0-4a09-b19c-f80215b2b715', '2026-05-15', '07:15', '2026-05-22', '08:15',
  'Lena Lis', NULL, '792658292', 'BMW Seria 4',
  0.0, 0.0, 'Full Front + Zaprawki | Cena: 5700 netto | Przebieg: 50.000 | Rok: 2023', 'caldis_import', 'confirmed',
  (SELECT id FROM stations WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' ORDER BY sort_order LIMIT 1 OFFSET 0), (SELECT id FROM unified_services WHERE instance_id = '50230fb6-fca0-4a09-b19c-f80215b2b715' AND name = 'Full Front - Folia PPF połysk UltraFit' LIMIT 1), '4C690299', '2026-03-18 09:16:06', '2026-03-18 09:16:06'
) ON CONFLICT DO NOTHING;

COMMIT;

-- Done! 134 reservations, 88 customers, 97 vehicles

-- Re-enable FK checks
SET session_replication_role = 'origin';

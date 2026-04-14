-- Seed HP Detailing (hpdetailing) services
-- Instance ID: 50230fb6-fca0-4a09-b19c-f80215b2b715

DO $$
DECLARE
  v_instance_id uuid := '50230fb6-fca0-4a09-b19c-f80215b2b715';
  v_cat_ppf uuid;
  v_cat_powloki uuid;
  v_cat_korekta uuid;
  v_cat_mycie uuid;
  v_cat_tapicerka uuid;
  v_cat_woskowanie uuid;
  v_cat_oklejanie uuid;
  v_cat_ppf_elementy uuid;
BEGIN

  -- ============================================================
  -- KATEGORIE
  -- ============================================================
  INSERT INTO public.unified_categories (id, instance_id, category_type, name, slug, sort_order, active, prices_are_net)
  VALUES
    (gen_random_uuid(), v_instance_id, 'both', 'Folie PPF', 'folie-ppf', 1, true, false),
    (gen_random_uuid(), v_instance_id, 'both', 'PPF Elementy', 'ppf-elementy', 2, true, false),
    (gen_random_uuid(), v_instance_id, 'both', 'Powłoki ochronne', 'powloki-ochronne', 3, true, false),
    (gen_random_uuid(), v_instance_id, 'both', 'Korekta lakieru', 'korekta-lakieru', 4, true, false),
    (gen_random_uuid(), v_instance_id, 'both', 'Mycie i detailing', 'mycie-i-detailing', 5, true, false),
    (gen_random_uuid(), v_instance_id, 'both', 'Czyszczenie tapicerki', 'czyszczenie-tapicerki', 6, true, false),
    (gen_random_uuid(), v_instance_id, 'both', 'Woskowanie', 'woskowanie', 7, true, false),
    (gen_random_uuid(), v_instance_id, 'both', 'Oklejanie / Zmiana koloru', 'oklejanie-zmiana-koloru', 8, true, false);

  SELECT id INTO v_cat_ppf FROM public.unified_categories WHERE instance_id = v_instance_id AND slug = 'folie-ppf';
  SELECT id INTO v_cat_ppf_elementy FROM public.unified_categories WHERE instance_id = v_instance_id AND slug = 'ppf-elementy';
  SELECT id INTO v_cat_powloki FROM public.unified_categories WHERE instance_id = v_instance_id AND slug = 'powloki-ochronne';
  SELECT id INTO v_cat_korekta FROM public.unified_categories WHERE instance_id = v_instance_id AND slug = 'korekta-lakieru';
  SELECT id INTO v_cat_mycie FROM public.unified_categories WHERE instance_id = v_instance_id AND slug = 'mycie-i-detailing';
  SELECT id INTO v_cat_tapicerka FROM public.unified_categories WHERE instance_id = v_instance_id AND slug = 'czyszczenie-tapicerki';
  SELECT id INTO v_cat_woskowanie FROM public.unified_categories WHERE instance_id = v_instance_id AND slug = 'woskowanie';
  SELECT id INTO v_cat_oklejanie FROM public.unified_categories WHERE instance_id = v_instance_id AND slug = 'oklejanie-zmiana-koloru';

  -- ============================================================
  -- FOLIE PPF
  -- is_popular: Full Front UltraFit, Full Body UltraFit
  -- ============================================================
  INSERT INTO public.unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
  VALUES
    -- UltraFit połysk
    (v_instance_id, v_cat_ppf, 'Start - Folia PPF połysk UltraFit', 770, 'ppf', 'both', 'everywhere', 1, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Bikini - Folia PPF połysk UltraFit', 2700, 'ppf', 'both', 'everywhere', 2, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Front - Folia PPF połysk UltraFit', 4700, 'ppf', 'both', 'everywhere', 3, true, false, true, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Body - Folia PPF połysk UltraFit', 9700, 'ppf', 'both', 'everywhere', 4, true, false, true, 'szt'),
    -- UltraFit matowa
    (v_instance_id, v_cat_ppf, 'Start - Folia PPF matowa UltraFit', 886, 'ppf', 'both', 'everywhere', 5, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Bikini - Folia PPF matowa UltraFit', 3105, 'ppf', 'both', 'everywhere', 6, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Front - Folia PPF matowa UltraFit', 5405, 'ppf', 'both', 'everywhere', 7, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Body - Folia PPF matowa UltraFit', 11155, 'ppf', 'both', 'everywhere', 8, true, false, false, 'szt'),
    -- UltraFit satynowa
    (v_instance_id, v_cat_ppf, 'Start - Folia PPF satynowa UltraFit', 886, 'ppf', 'both', 'everywhere', 9, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Bikini - Folia PPF satynowa UltraFit', 3105, 'ppf', 'both', 'everywhere', 10, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Front - Folia PPF satynowa UltraFit', 5405, 'ppf', 'both', 'everywhere', 11, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Body - Folia PPF satynowa UltraFit', 11155, 'ppf', 'both', 'everywhere', 12, true, false, false, 'szt'),
    -- STEK DYNOshield połysk
    (v_instance_id, v_cat_ppf, 'Start - Folia PPF połysk STEK DYNOshield', 770, 'ppf', 'both', 'everywhere', 13, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Bikini - Folia PPF połysk STEK DYNOshield', 2700, 'ppf', 'both', 'everywhere', 14, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Front - Folia PPF połysk STEK DYNOshield', 4700, 'ppf', 'both', 'everywhere', 15, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Body - Folia PPF połysk STEK DYNOshield', 9700, 'ppf', 'both', 'everywhere', 16, true, false, false, 'szt'),
    -- STEK DYNOmatte matowa
    (v_instance_id, v_cat_ppf, 'Start - Folia PPF matowa STEK DYNOmatte', 886, 'ppf', 'both', 'everywhere', 17, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Bikini - Folia PPF matowa STEK DYNOmatte', 3105, 'ppf', 'both', 'everywhere', 18, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Front - Folia PPF matowa STEK DYNOmatte', 5405, 'ppf', 'both', 'everywhere', 19, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Body - Folia PPF matowa STEK DYNOmatte', 11155, 'ppf', 'both', 'everywhere', 20, true, false, false, 'szt'),
    -- STEK DYNOsatin satynowa
    (v_instance_id, v_cat_ppf, 'Start - Folia PPF satynowa STEK DYNOsatin', 886, 'ppf', 'both', 'everywhere', 21, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Bikini - Folia PPF satynowa STEK DYNOsatin', 3105, 'ppf', 'both', 'everywhere', 22, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Front - Folia PPF satynowa STEK DYNOsatin', 5405, 'ppf', 'both', 'everywhere', 23, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Body - Folia PPF satynowa STEK DYNOsatin', 11155, 'ppf', 'both', 'everywhere', 24, true, false, false, 'szt'),
    -- STEK karbonowa
    (v_instance_id, v_cat_ppf, 'Full Front - Folia PPF karbonowa STEK', 5640, 'ppf', 'both', 'everywhere', 25, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf, 'Full Body - Folia PPF karbonowa STEK', 11640, 'ppf', 'both', 'everywhere', 26, true, false, false, 'szt');

  -- ============================================================
  -- PPF ELEMENTY
  -- ============================================================
  INSERT INTO public.unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
  VALUES
    (v_instance_id, v_cat_ppf_elementy, 'PPF Lampy przednie', 300, 'ppf', 'both', 'everywhere', 1, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Lampy tylne', 300, 'ppf', 'both', 'everywhere', 2, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Lusterka', 300, 'ppf', 'both', 'everywhere', 3, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Wnęki klamek', 80, 'ppf', 'both', 'everywhere', 4, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Krawędzie drzwi', 50, 'ppf', 'both', 'everywhere', 5, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Słupki piano black', 150, 'ppf', 'both', 'everywhere', 6, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Parapet bagażnika', 200, 'ppf', 'both', 'everywhere', 7, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Progi wewnętrzne', 250, 'ppf', 'both', 'everywhere', 8, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Wnęki progowe dolne', 80, 'ppf', 'both', 'everywhere', 9, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Elementy wnętrza', 250, 'ppf', 'both', 'everywhere', 10, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'PPF Ekran multimediów', 200, 'ppf', 'both', 'everywhere', 11, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'Korekta lakieru przed aplikacją PPF', 500, 'ppf', 'both', 'everywhere', 12, true, false, false, 'szt'),
    (v_instance_id, v_cat_ppf_elementy, 'Usuwanie starej folii PPF', 500, 'ppf', 'both', 'everywhere', 13, true, false, false, 'szt');

  -- ============================================================
  -- POWŁOKI OCHRONNE
  -- is_popular: ceramiczna 3-letnia
  -- ============================================================
  INSERT INTO public.unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
  VALUES
    (v_instance_id, v_cat_powloki, 'Powłoka ceramiczna 1-letnia', 800, 'detailing', 'both', 'everywhere', 1, true, false, false, 'szt'),
    (v_instance_id, v_cat_powloki, 'Powłoka ceramiczna 3-letnia', 1500, 'detailing', 'both', 'everywhere', 2, true, false, true, 'szt'),
    (v_instance_id, v_cat_powloki, 'Powłoka ceramiczna 5-letnia', 2500, 'detailing', 'both', 'everywhere', 3, true, false, false, 'szt'),
    (v_instance_id, v_cat_powloki, 'Powłoka grafenowa', 2000, 'detailing', 'both', 'everywhere', 4, true, false, false, 'szt'),
    (v_instance_id, v_cat_powloki, 'Powłoka elastomerowa', 3000, 'detailing', 'both', 'everywhere', 5, true, false, false, 'szt'),
    (v_instance_id, v_cat_powloki, 'Powłoka na felgi / szyby', 400, 'detailing', 'both', 'everywhere', 6, true, false, false, 'szt'),
    (v_instance_id, v_cat_powloki, 'Korekta lakieru przed powłoką', 500, 'detailing', 'both', 'everywhere', 7, true, false, false, 'szt'),
    (v_instance_id, v_cat_powloki, 'Mycie detailingowe przed aplikacją', 300, 'detailing', 'both', 'everywhere', 8, true, false, false, 'szt'),
    (v_instance_id, v_cat_powloki, 'Odświeżenie powłoki (boost)', 400, 'detailing', 'both', 'everywhere', 9, true, false, false, 'szt');

  -- ============================================================
  -- KOREKTA LAKIERU
  -- is_popular: 2-etapowa, korekta+ceramika pakiet
  -- ============================================================
  INSERT INTO public.unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
  VALUES
    (v_instance_id, v_cat_korekta, 'Korekta lakieru 1-etapowa', 500, 'detailing', 'both', 'everywhere', 1, true, false, false, 'szt'),
    (v_instance_id, v_cat_korekta, 'Korekta lakieru 2-etapowa', 800, 'detailing', 'both', 'everywhere', 2, true, false, true, 'szt'),
    (v_instance_id, v_cat_korekta, 'Korekta lakieru 3-etapowa', 1200, 'detailing', 'both', 'everywhere', 3, true, false, false, 'szt'),
    (v_instance_id, v_cat_korekta, 'Korekta + powłoka ceramiczna (pakiet)', 2500, 'detailing', 'both', 'everywhere', 4, true, false, true, 'szt'),
    (v_instance_id, v_cat_korekta, 'Polerowanie lamp przednich', 150, 'detailing', 'both', 'everywhere', 5, true, false, false, 'szt'),
    (v_instance_id, v_cat_korekta, 'Polerowanie lamp tylnych', 100, 'detailing', 'both', 'everywhere', 6, true, false, false, 'szt'),
    (v_instance_id, v_cat_korekta, 'Dekontaminacja chemiczna + glinkowanie', 200, 'detailing', 'both', 'everywhere', 7, true, false, false, 'szt');

  -- ============================================================
  -- MYCIE I DETAILING
  -- is_popular: mycie detailingowe
  -- ============================================================
  INSERT INTO public.unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
  VALUES
    (v_instance_id, v_cat_mycie, 'Mycie podstawowe (ręczne)', 80, 'washing', 'both', 'everywhere', 1, true, false, false, 'szt'),
    (v_instance_id, v_cat_mycie, 'Mycie premium', 150, 'washing', 'both', 'everywhere', 2, true, false, false, 'szt'),
    (v_instance_id, v_cat_mycie, 'Mycie detailingowe', 250, 'washing', 'both', 'everywhere', 3, true, false, true, 'szt'),
    (v_instance_id, v_cat_mycie, 'Mycie + dekontaminacja', 400, 'washing', 'both', 'everywhere', 4, true, false, false, 'szt'),
    (v_instance_id, v_cat_mycie, 'Mycie silnika', 150, 'washing', 'both', 'everywhere', 5, true, false, false, 'szt'),
    (v_instance_id, v_cat_mycie, 'Mycie podwozia', 150, 'washing', 'both', 'everywhere', 6, true, false, false, 'szt'),
    (v_instance_id, v_cat_mycie, 'Quick Detailer', 80, 'washing', 'both', 'everywhere', 7, true, false, false, 'szt');

  -- ============================================================
  -- CZYSZCZENIE TAPICERKI
  -- ============================================================
  INSERT INTO public.unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
  VALUES
    (v_instance_id, v_cat_tapicerka, 'Pranie wnętrza (wykładzina, boczki, fotele)', 700, 'detailing', 'both', 'everywhere', 1, true, false, false, 'szt'),
    (v_instance_id, v_cat_tapicerka, 'Pranie foteli oraz boczków', 500, 'detailing', 'both', 'everywhere', 2, true, false, false, 'szt'),
    (v_instance_id, v_cat_tapicerka, 'Ozonowanie', 150, 'detailing', 'both', 'everywhere', 3, true, false, false, 'szt'),
    (v_instance_id, v_cat_tapicerka, 'Czyszczenie skóry + nawilżanie', 300, 'detailing', 'both', 'everywhere', 4, true, false, false, 'szt'),
    (v_instance_id, v_cat_tapicerka, 'Impregnacja tapicerki materiałowej', 150, 'detailing', 'both', 'everywhere', 5, true, false, false, 'szt'),
    (v_instance_id, v_cat_tapicerka, 'Pranie podsufitki', 200, 'detailing', 'both', 'everywhere', 6, true, false, false, 'szt'),
    (v_instance_id, v_cat_tapicerka, 'Czyszczenie bagażnika', 100, 'detailing', 'both', 'everywhere', 7, true, false, false, 'szt'),
    (v_instance_id, v_cat_tapicerka, 'Pranie + ozonowanie', 350, 'detailing', 'both', 'everywhere', 8, true, false, false, 'szt');

  -- ============================================================
  -- WOSKOWANIE
  -- ============================================================
  INSERT INTO public.unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
  VALUES
    (v_instance_id, v_cat_woskowanie, 'Woskowanie syntetyczne (sealant)', 300, 'detailing', 'both', 'everywhere', 1, true, false, false, 'szt'),
    (v_instance_id, v_cat_woskowanie, 'Woskowanie hybrydowe', 500, 'detailing', 'both', 'everywhere', 2, true, false, false, 'szt'),
    (v_instance_id, v_cat_woskowanie, 'Woskowanie carnauba premium', 700, 'detailing', 'both', 'everywhere', 3, true, false, false, 'szt'),
    (v_instance_id, v_cat_woskowanie, 'Woskowanie luksusowe (Swissvax / Zymöl)', 1200, 'detailing', 'both', 'everywhere', 4, true, false, false, 'szt'),
    (v_instance_id, v_cat_woskowanie, 'Korekta jednoetapowa + woskowanie', 800, 'detailing', 'both', 'everywhere', 5, true, false, false, 'szt');

  -- ============================================================
  -- OKLEJANIE / ZMIANA KOLORU
  -- ============================================================
  INSERT INTO public.unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
  VALUES
    (v_instance_id, v_cat_oklejanie, 'Zmiana koloru - hatchback / kompakt', 8000, 'ppf', 'both', 'everywhere', 1, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Zmiana koloru - sedan / coupe', 10000, 'ppf', 'both', 'everywhere', 2, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Zmiana koloru - SUV / crossover', 12000, 'ppf', 'both', 'everywhere', 3, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Zmiana koloru elementów (dach, lusterka)', 800, 'ppf', 'both', 'everywhere', 4, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Dechroming', 1500, 'ppf', 'both', 'everywhere', 5, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Color PPF (zmiana koloru z ochroną)', 15000, 'ppf', 'both', 'everywhere', 6, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Usunięcie starej folii', 2000, 'ppf', 'both', 'everywhere', 7, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Projekt kolorystyczny (wizualizacja)', 500, 'ppf', 'both', 'everywhere', 8, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Oklejanie reklamowe - logo', 500, 'ppf', 'both', 'everywhere', 9, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Oklejanie reklamowe częściowe (boki + tył)', 2000, 'ppf', 'both', 'everywhere', 10, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Full wrap reklamowy (osobowe)', 4500, 'ppf', 'both', 'everywhere', 11, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Full wrap reklamowy (bus / van)', 6000, 'ppf', 'both', 'everywhere', 12, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Projekt graficzny', 800, 'ppf', 'both', 'everywhere', 13, true, false, false, 'szt'),
    (v_instance_id, v_cat_oklejanie, 'Demontaż starej grafiki', 500, 'ppf', 'both', 'everywhere', 14, true, false, false, 'szt');

END $$;

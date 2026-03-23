CREATE OR REPLACE FUNCTION public.seed_demo_data(_instance_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_station_id uuid;
  v_customer1_id uuid;
  v_customer2_id uuid;
  v_first_svc_id uuid;
  v_second_svc_id uuid;
  v_first_scope_id uuid;
  v_offer1_id uuid;
  v_offer2_id uuid;
  v_offer3_id uuid;
  v_option_id uuid;
  v_protocol_id uuid;
  v_cat_0 uuid;
  v_cat_1 uuid;
  v_cat_2 uuid;
  v_cat_3 uuid;
  v_cat_4 uuid;
  v_cat_5 uuid;
  v_cat_6 uuid;
  v_svc_0 uuid;
  v_svc_1 uuid;
  v_svc_2 uuid;
  v_svc_3 uuid;
  v_svc_4 uuid;
  v_svc_5 uuid;
  v_svc_6 uuid;
  v_svc_7 uuid;
  v_svc_8 uuid;
  v_svc_9 uuid;
  v_svc_10 uuid;
  v_svc_11 uuid;
  v_svc_12 uuid;
  v_svc_13 uuid;
  v_svc_14 uuid;
  v_svc_15 uuid;
  v_svc_16 uuid;
  v_svc_17 uuid;
  v_svc_18 uuid;
  v_svc_19 uuid;
  v_svc_20 uuid;
  v_svc_21 uuid;
  v_svc_22 uuid;
  v_svc_23 uuid;
  v_svc_24 uuid;
  v_svc_25 uuid;
  v_svc_26 uuid;
  v_svc_27 uuid;
  v_svc_28 uuid;
  v_svc_29 uuid;
  v_svc_30 uuid;
  v_svc_31 uuid;
  v_svc_32 uuid;
  v_svc_33 uuid;
  v_svc_34 uuid;
  v_svc_35 uuid;
  v_svc_36 uuid;
  v_svc_37 uuid;
  v_svc_38 uuid;
  v_svc_39 uuid;
  v_svc_40 uuid;
  v_svc_41 uuid;
  v_svc_42 uuid;
  v_svc_43 uuid;
  v_svc_44 uuid;
  v_svc_45 uuid;
  v_svc_46 uuid;
  v_svc_47 uuid;
  v_svc_48 uuid;
  v_svc_49 uuid;
  v_svc_50 uuid;
  v_svc_51 uuid;
  v_svc_52 uuid;
  v_svc_53 uuid;
  v_svc_54 uuid;
  v_svc_55 uuid;
  v_svc_56 uuid;
  v_svc_57 uuid;
  v_svc_58 uuid;
  v_svc_59 uuid;
  v_svc_60 uuid;
  v_svc_61 uuid;
  v_svc_62 uuid;
  v_svc_63 uuid;
  v_svc_64 uuid;
  v_svc_65 uuid;
  v_svc_66 uuid;
  v_svc_67 uuid;
  v_svc_68 uuid;
  v_svc_69 uuid;
  v_svc_70 uuid;
  v_svc_71 uuid;
  v_svc_72 uuid;
  v_svc_73 uuid;
  v_svc_74 uuid;
  v_svc_75 uuid;
  v_svc_76 uuid;
  v_svc_77 uuid;
  v_svc_78 uuid;
  v_svc_79 uuid;
  v_svc_80 uuid;
  v_svc_81 uuid;
  v_svc_82 uuid;
  v_svc_83 uuid;
  v_svc_84 uuid;
  v_svc_85 uuid;
  v_svc_86 uuid;
  v_scope_0 uuid;
  v_scope_1 uuid;
  v_scope_2 uuid;
  v_scope_3 uuid;
  v_scope_4 uuid;
  v_scope_5 uuid;
  v_scope_6 uuid;
  v_scope_7 uuid;
  v_scope_8 uuid;
  v_scope_9 uuid;
  v_scope_10 uuid;
BEGIN
  -- Early exit: don't double-seed
  IF EXISTS (SELECT 1 FROM customers WHERE instance_id = _instance_id) THEN
    RETURN;
  END IF;

  -- Look up default station
  SELECT id INTO v_station_id FROM stations WHERE instance_id = _instance_id LIMIT 1;

  -- ============================================================
  -- STEP 1: Insert categories
  -- ============================================================
  v_cat_0 := gen_random_uuid();
  INSERT INTO unified_categories (id, instance_id, name, slug, category_type, sort_order, active, prices_are_net)
  VALUES (v_cat_0, _instance_id, 'MYJNIA SAMOCHODOWA', 'myjnia-samochodowa', 'both', 0, true, false);

  v_cat_1 := gen_random_uuid();
  INSERT INTO unified_categories (id, instance_id, name, slug, category_type, sort_order, active, prices_are_net)
  VALUES (v_cat_1, _instance_id, 'Pranie tapicerki', 'pranie-tapicerki', 'both', 1, true, false);

  v_cat_2 := gen_random_uuid();
  INSERT INTO unified_categories (id, instance_id, name, slug, category_type, sort_order, active, prices_are_net)
  VALUES (v_cat_2, _instance_id, 'Dodatkowe usługi', 'dodatkowe-uslugi', 'both', 3, true, false);

  v_cat_3 := gen_random_uuid();
  INSERT INTO unified_categories (id, instance_id, name, slug, category_type, sort_order, active, prices_are_net)
  VALUES (v_cat_3, _instance_id, 'USŁUGI DETAILINGOWE', 'uslugi-detailingowe', 'both', 4, true, true);

  v_cat_4 := gen_random_uuid();
  INSERT INTO unified_categories (id, instance_id, name, slug, category_type, sort_order, active, prices_are_net)
  VALUES (v_cat_4, _instance_id, 'KOREKTA LAKIERU', 'korekta-lakieru', 'both', 5, true, true);

  v_cat_5 := gen_random_uuid();
  INSERT INTO unified_categories (id, instance_id, name, slug, category_type, sort_order, active, prices_are_net)
  VALUES (v_cat_5, _instance_id, 'POWŁOKI OCHRONNE', 'powloki-ochronne', 'both', 6, true, true);

  v_cat_6 := gen_random_uuid();
  INSERT INTO unified_categories (id, instance_id, name, slug, category_type, sort_order, active, prices_are_net)
  VALUES (v_cat_6, _instance_id, 'WRAPPING - FOLIA PPF', 'wrapping-folia-ppf', 'both', 7, true, true);

  -- ============================================================
  -- STEP 2: Insert services
  -- ============================================================
  v_svc_0 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_0, _instance_id, v_cat_5, 'Powłoka na tapicerkę i elementy skórzane Gyeon Q² LeatherShield', NULL, 'Zapewnij wnętrzu swojego samochodu niezrównaną ochronę i nieskazitelny wygląd dzięki Gyeon Q² LeatherShield – specjalistycznej powłoce ceramicznej stworzonej z myślą o tapicerce i elementach skórzanych. Ten innowacyjny produkt gwarantuje długotrwałą ochronę przed przetarciami, blaknięciem i plamami, zachowując jednocześnie naturalną miękkość i matowe wykończenie skóry, a jego trwałość sięgająca nawet 12 miesięcy sprawia, że wnętrze Twojego pojazdu pozostanie w doskonałej kondycji na długo.',
    NULL, NULL, NULL, 700, 700,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "original_category": "POWŁOKI OCHRONNE", "reminder_template_id": null}'
  );

  v_svc_1 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_1, _instance_id, v_cat_6, 'Folia ochronna Piano Black', 'Piano Black', 'Zabezpieczenie elementów Piano Black przed rysami, zmatowieniem i odciskami palców.',
    NULL, NULL, NULL, 200, 200,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Gyeon", "source": "offer", "_source": "manual", "original_category": "WRAPPING - FOLIA PPF", "reminder_template_id": null}'
  );

  v_svc_2 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_2, _instance_id, v_cat_2, 'Mycie podwozia hurricanem', NULL, NULL,
    NULL, NULL, NULL, 200, 200,
    NULL, NULL, NULL, NULL,
    false, false, false, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "original_category": "MYJNIA SAMOCHODOWA", "reminder_template_id": null}'
  );

  v_svc_3 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_3, _instance_id, v_cat_1, 'Pranie fotela', NULL, NULL,
    NULL, NULL, NULL, 150, 150,
    NULL, NULL, NULL, NULL,
    false, false, false, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "original_category": "MYJNIA SAMOCHODOWA", "produkt_do_lakierow": null, "reminder_template_id": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_4 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_4, _instance_id, v_cat_2, 'Ozonowanie', NULL, NULL,
    NULL, NULL, NULL, 200, 200,
    NULL, NULL, NULL, NULL,
    false, false, false, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "original_category": "MYJNIA SAMOCHODOWA", "reminder_template_id": null}'
  );

  v_svc_5 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_5, _instance_id, v_cat_1, 'Pranie sufitu', NULL, NULL,
    NULL, NULL, NULL, 300, 300,
    NULL, NULL, NULL, NULL,
    false, false, false, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "original_category": "MYJNIA SAMOCHODOWA", "reminder_template_id": null}'
  );

  v_svc_6 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_6, _instance_id, v_cat_1, 'Pranie podłogi', NULL, NULL,
    NULL, NULL, NULL, 200, 200,
    NULL, NULL, NULL, NULL,
    false, false, false, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "original_category": "MYJNIA SAMOCHODOWA", "reminder_template_id": null}'
  );

  v_svc_7 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_7, _instance_id, v_cat_4, 'Zaprawki lakiernicze', NULL, NULL,
    NULL, NULL, NULL, 350, 350,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "original_category": "KOREKTA LAKIERU", "reminder_template_id": null}'
  );

  v_svc_8 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_8, _instance_id, v_cat_4, 'Polerowanie reflektorów', NULL, NULL,
    NULL, NULL, NULL, 250, 250,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "original_category": "KOREKTA LAKIERU", "reminder_template_id": null}'
  );

  v_svc_9 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_9, _instance_id, v_cat_4, 'Korekta lakieru punktowa', NULL, 'Lokalna korekta wybranych miejsc',
    NULL, NULL, NULL, 250, 250,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "original_category": "KOREKTA LAKIERU", "reminder_template_id": null}'
  );

  v_svc_10 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_10, _instance_id, v_cat_0, 'Mycie zewnętrzne', 'MZ', NULL,
    100, 130, 160, NULL, 0,
    30, 40, 40, NULL,
    true, true, false, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_11 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_11, _instance_id, v_cat_2, 'Mycie silnika', NULL, NULL,
    NULL, NULL, NULL, 300, 300,
    NULL, NULL, NULL, NULL,
    false, false, false, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "original_category": "MYJNIA SAMOCHODOWA", "reminder_template_id": null}'
  );

  v_svc_12 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_12, _instance_id, v_cat_6, 'Folia PPF Izotronik Kolor', 'Izotronik KOLOR', '1️⃣ Charakterystyka ogólna
Folie kolorowe Izotronik to nowoczesne rozwiązanie 2w1 – zmiana koloru pojazdu połączona z realną ochroną lakieru. Stanowią alternatywę dla klasycznych folii winylowych, oferując większą trwałość, grubość oraz odporność mechaniczną.
Ponad 230 wariantów barw.
2️⃣ Specyfikacja techniczna (do oferty)
	•	Typ folii: Color PPF / Color Protection Film
	•	Materiał: TPU (termoplastyczny poliuretan)
	•	Grubość: ok. 190–210 mikronów
	•	Warstwa samoregenerująca: TAK (mikrozarysowania znikają pod wpływem ciepła)
	•	Wykończenia:
	•	Gloss
	•	Satin / Semi-matt
	•	Matt
	•	Efekty specjalne (perła, metalik, kolory niestandardowe)
	•	Ochrona UV: wysoka – brak blaknięcia koloru
	•	Hydrofobowość: TAK – łatwiejsze mycie i mniejsze osadzanie brudu
	•	Klej: akrylowy, bezpieczny dla lakieru OEM
	•	Demontaż: bezpieczny, bez uszkodzeń lakieru (przy prawidłowej aplikacji)
3️⃣ Efekt wizualny
	•	Jednolity, głęboki kolor
	•	Brak „plastikowego” efektu znanego z tanich winyli
	•	Bardzo dobra głębia koloru i połysk (szczególnie wersje gloss)
	•	Lakier wygląda jak po profesjonalnym lakierowaniu, ale pozostaje w pełni odwracalny
4️⃣ Ochrona lakieru

Folia zabezpiecza karoserię przed:
	•	odpryskami kamieni
	•	mikrozarysowaniami
	•	solą drogową i chemią
	•	ptasimi odchodami i owadami
	•	promieniowaniem UV

➡️ Znacznie wyższy poziom ochrony niż folia winylowa',
    NULL, NULL, NULL, 12000, 13000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    0, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Izotronik", "source": "offer", "_source": "manual", "variant": "kolor", "original_category": "WRAPPING - FOLIA PPF", "produkt_do_lakierow": null, "reminder_template_id": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_13 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_13, _instance_id, v_cat_6, 'Progi drzwi wewnętrzne', NULL, NULL,
    NULL, NULL, NULL, 70, 70,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    1, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "original_category": "WRAPPING - FOLIA PPF", "reminder_template_id": null}'
  );

  v_svc_14 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_14, _instance_id, v_cat_4, 'Lekka korekta (Light One Step) - usunięcie 30–50% zarysowań', NULL, 'Świetny połysk, wyraźnie czystszy i odświeżony lakier',
    NULL, NULL, NULL, 800, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    1, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_15 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_15, _instance_id, v_cat_0, 'Komplet mycia', 'KPL', NULL,
    200, 250, 300, NULL, 0,
    60, 80, 100, NULL,
    true, true, false, true,
    NULL, NULL, NULL, NULL,
    1, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_16 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_16, _instance_id, v_cat_3, 'Wosk Fusso Coat – ochrona do 12 miesięcy', NULL, '•	Rodzaj zabezpieczenia: wosk syntetyczny (sealant)
	•	Trwałość: do 12 miesięcy
	•	Hydrofobowość: bardzo wysoka – silne odpychanie wody i zabrudzeń
	•	Ochrona: sól drogowa, chemia, kwaśne deszcze, promieniowanie UV
	•	Efekt wizualny: czysty, uporządkowany połysk bez „tłustego” filmu
	•	Powierzchnia lakieru: gładka i śliska w dotyku
	•	Odporność: wysoka odporność na częste mycie
	•	Zastosowanie: lakiery nowe i używane
	•	Sezonowość: idealny na jesień i zimę
	•	Alternatywa dla ceramiki: długotrwała ochrona w niższym budżecie',
    NULL, NULL, NULL, 500, 700,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    1, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "SOFT99", "source": "offer", "_source": "manual", "original_category": "USŁUGI DETAILINGOWE", "produkt_do_lakierow": null, "reminder_template_id": "553e9c77-47ae-4f5f-bc0a-02e499b4d166", "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_17 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_17, _instance_id, v_cat_5, 'Elastomer 12 miesięcy', 'Elastomer 12', NULL,
    NULL, NULL, NULL, 2000, 2000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    1, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": 12}'
  );

  v_svc_18 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_18, _instance_id, v_cat_6, 'Próg załadunkowy bagażnika', 'Próg bagażnika', NULL,
    NULL, NULL, NULL, 200, 250,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    2, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "original_category": "WRAPPING - FOLIA PPF", "reminder_template_id": null}'
  );

  v_svc_19 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_19, _instance_id, v_cat_4, 'Korekta lakieru 1-etapowa - od 60% zarysowań', NULL, 'Bardzo wysoki połysk, wyraźna poprawa kondycji lakieru',
    NULL, NULL, NULL, 1000, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    2, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_20 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_20, _instance_id, v_cat_3, 'Wosk Gyeon Q² Wax do 6 miesięcy', NULL, '⭐ Co zyskujesz po aplikacji?
	•	Efekt „mokrego lakieru” – intensywny połysk i wyraźne pogłębienie koloru
	•	Silna hydrofobowość – woda i zabrudzenia są skutecznie odpychane
	•	Lakier dłużej pozostaje czysty i łatwiejszy w pielęgnacji
	•	Ochrona przed UV, solą drogową i chemią myjniową
🛡️ Ochrona i trwałość
	•	Trwałość zabezpieczenia do 6 miesięcy
	•	Bezpieczny dla lakierów nowych i używanych
	•	Chroni lakier przed utlenianiem i matowieniem
🧼 Komfort użytkowania
	•	Brak smug i zacieków
	•	Gładka, śliska powierzchnia lakieru
	•	Idealny jako szybkie odświeżenie wyglądu pojazdu
✔️ Dlaczego warto?
	•	Natychmiastowy efekt wizualny
	•	Krótki czas realizacji usługi
	•	Doskonały stosunek ceny do efektu
	•	Idealne rozwiązanie sezonowe lub jako uzupełnienie',
    NULL, NULL, NULL, 350, 500,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    2, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Gyeon", "source": "offer", "_source": "manual", "original_category": "USŁUGI DETAILINGOWE", "reminder_template_id": null}'
  );

  v_svc_21 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_21, _instance_id, v_cat_5, 'Elastomer 24 miesiące', 'Elastomer 24', NULL,
    NULL, NULL, NULL, 2600, 2600,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    2, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": 24}'
  );

  v_svc_22 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_22, _instance_id, v_cat_0, 'Mycie detailingowe zewnętrzne', NULL, 'Kompleksowe mycie zewnętrzne z dbałością o detale:
- Mycie wstępne pianą (pre-wash, TFR)
- Mycie na dwa wiadra
- Czyszczenie detali (emblematy, kratki, wnęki drzwi, progi, uszczelki)
- Dokładne mycie felg, wnęk i opon
- Pędzelkowanie zakamarków
- Suszenie powietrzem + mikrofibrą
- Dressing na opony i plastiki zewnętrzne
- Opcjonalnie: dekontaminację chemiczną *dodatkowo płatne',
    NULL, NULL, NULL, 350, 350,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    2, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "subcategory": "mycie", "original_category": "MYJNIA SAMOCHODOWA", "reminder_template_id": null}'
  );

  v_svc_23 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_23, _instance_id, v_cat_4, 'Korekta lakieru 2-etapowa - od 80% zarysowań', NULL, 'Pierwszy etap mocno niweluje głębsze rysy, drugi wygładza i wykańcza lakier. Idealna opcja dla samochodów z większą ilością rys, zmatowień i oksydacji.',
    NULL, NULL, NULL, 1800, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    3, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_24 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_24, _instance_id, v_cat_0, 'Szampon dedykowany powłokom', NULL, NULL,
    50, 60, 70, NULL, 0,
    1, 1, 1, NULL,
    true, false, false, true,
    NULL, NULL, NULL, NULL,
    3, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_25 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_25, _instance_id, v_cat_5, 'Elastomer 36 miesięcy', 'Elastomer', 'Właściwości i korzyści
	•	Trwałość ochrony: do 36 miesięcy
	•	Twardość struktury 9H – zwiększona odporność na mikrozarysowania
	•	Efekt self-healing – redukcja drobnych śladów użytkowania pod wpływem temperatury
	•	Silna hydrofobowość – szybkie odprowadzanie wody i ograniczone osadzanie brudu
	•	Wysoka odporność chemiczna – sól drogowa, detergenty, kwaśne opady, promieniowanie UV
	•	Wyraźne pogłębienie koloru i szklisty połysk lakieru

⸻

 Efekt wizualny

Lakier zyskuje głębię koloru, wysoki połysk oraz efekt czystej, gładkiej powierzchni. Samochód dłużej pozostaje czysty, a bieżąca pielęgnacja staje się łatwiejsza i bezpieczniejsza dla lakieru.

⸻

Przeznaczenie

Powłoka rekomendowana jest dla:
	•	pojazdów nowych,
	•	samochodów po korekcie lakieru,
	•	aut użytkowanych na co dzień, również w warunkach miejskich i autostradowych.

⸻

 Pielęgnacja i utrzymanie efektu

Dla zachowania maksymalnych właściwości ochronnych i wizualnych zalecana jest:
	•	regularna, bezpieczna pielęgnacja pojazdu,
	•	stosowanie odpowiednich środków myjących,
	•	okresowa kontrola stanu powłoki.

Powłoka nie wymaga obowiązkowych serwisów producenta.',
    NULL, NULL, NULL, 3200, 3200,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    3, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": 36}'
  );

  v_svc_26 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_26, _instance_id, v_cat_3, 'Impregnacja tapicerki Gyeon Q² FabricCoat', NULL, 'Hydrofobowa ochrona tapicerki materiałowej przed plamami i wnikaniem brudu.',
    NULL, NULL, NULL, 600, 700,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    3, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Gyeon", "source": "offer", "_source": "manual", "original_category": "USŁUGI DETAILINGOWE", "reminder_template_id": null}'
  );

  v_svc_27 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_27, _instance_id, v_cat_6, 'Folia ochronna Wyświetlacze', 'Wyswietlacze', 'Bezbarwna folia chroniąca ekrany przed zarysowaniami i śladami użytkowania.',
    NULL, NULL, NULL, 250, 250,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    3, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Gyeon", "source": "offer", "_source": "manual", "original_category": "WRAPPING - FOLIA PPF", "reminder_template_id": null}'
  );

  v_svc_28 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_28, _instance_id, v_cat_6, 'Folia ochronna Tunel środkowy', 'Tunel środkowy', 'Ochrona tunelu środkowego przed rysami i uszkodzeniami mechanicznymi.',
    NULL, NULL, NULL, 500, 500,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    4, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Gyeon", "source": "offer", "_source": "manual", "original_category": "WRAPPING - FOLIA PPF", "reminder_template_id": null}'
  );

  v_svc_29 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_29, _instance_id, v_cat_5, 'Elastomer 48 miesięcy', 'Elastomer 48', NULL,
    NULL, NULL, NULL, 3600, 3600,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    4, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": 48}'
  );

  v_svc_30 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_30, _instance_id, v_cat_0, 'Mycie szyb', NULL, NULL,
    30, 35, 40, NULL, 0,
    10, 15, 15, NULL,
    true, false, false, true,
    NULL, NULL, NULL, NULL,
    4, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_31 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_31, _instance_id, v_cat_4, 'Korekta lakieru 3-etapowa - od 90% zarysowań', NULL, 'Likwidacja zmatowień i oksydacji, usunięcie głębokich zarysowań, wyrównanie najbardziej uszkodzonych fragmentów lakieru.',
    NULL, NULL, NULL, 2800, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    4, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_32 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_32, _instance_id, v_cat_3, 'Czyszczenie i konserwacja skór', 'SKÓRY', 'Profesjonalna pielęgnacja tapicerki skórzanej',
    NULL, NULL, NULL, 350, 350,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    4, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "subcategory": "wnętrze", "original_category": "USŁUGI DETAILINGOWE", "reminder_template_id": null}'
  );

  v_svc_33 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_33, _instance_id, v_cat_1, 'Pranie dywaników (komplet)', NULL, NULL,
    NULL, NULL, NULL, 100, 81,
    NULL, NULL, NULL, 60,
    false, false, false, true,
    NULL, NULL, NULL, NULL,
    4, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_34 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_34, _instance_id, v_cat_5, 'Elastomer 60 miesięcy', 'Elastomer 60', NULL,
    NULL, NULL, NULL, 4200, 4200,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    5, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": 60}'
  );

  v_svc_35 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_35, _instance_id, v_cat_4, 'Korekta lakieru punktowa', NULL, 'Punktowe usunięcie rys',
    NULL, NULL, NULL, 250, 250,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    5, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_36 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_36, _instance_id, v_cat_1, 'Pranie boczków drzwiowych', NULL, NULL,
    NULL, NULL, NULL, 100, 0,
    NULL, NULL, NULL, 60,
    false, false, false, true,
    NULL, NULL, NULL, NULL,
    5, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_37 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_37, _instance_id, v_cat_3, 'Detailingowe czyszczenie wnętrza', NULL, 'Głębokie czyszczenie wnętrza pojazdu',
    NULL, NULL, NULL, 400, 400,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    5, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "subcategory": "wnętrze", "original_category": "USŁUGI DETAILINGOWE", "reminder_template_id": null}'
  );

  v_svc_38 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_38, _instance_id, v_cat_0, 'Mycie wycieraczek', NULL, NULL,
    10, 15, 20, NULL, 0,
    5, 5, 5, NULL,
    true, false, false, true,
    NULL, NULL, NULL, NULL,
    5, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_39 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_39, _instance_id, v_cat_0, 'Odkurzanie auta', NULL, NULL,
    60, 70, 80, NULL, 0,
    30, 40, 50, NULL,
    true, false, false, true,
    NULL, NULL, NULL, NULL,
    6, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_40 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_40, _instance_id, v_cat_3, 'Gyeon – impregnacja alcantary', NULL, 'Impregnacja chroniąca alcantarę przed wilgocią, zabrudzeniami i przetarciami.',
    NULL, NULL, NULL, 600, 600,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    6, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Gyeon", "source": "offer", "_source": "manual", "original_category": "USŁUGI DETAILINGOWE", "reminder_template_id": null}'
  );

  v_svc_41 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_41, _instance_id, v_cat_1, 'Pranie pasów bezpieczeństwa', NULL, NULL,
    NULL, NULL, NULL, 100, 81,
    NULL, NULL, NULL, 60,
    false, false, false, true,
    NULL, NULL, NULL, NULL,
    6, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_42 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_42, _instance_id, v_cat_5, 'Powłoka ceramiczna na felgi Gyeon Q² Rim EVO', NULL, NULL,
    NULL, NULL, NULL, 100, 0,
    60, 60, 60, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    6, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_43 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_43, _instance_id, v_cat_6, 'Folia PPF UltraFit Crystal XP bezbarwna', 'UltraFit Crystal XP', '•	Realna ochrona lakieru
Skutecznie zabezpiecza karoserię przed odpryskami kamieni, piaskiem, rysami parkingowymi oraz uszkodzeniami eksploatacyjnymi.
	•	Samoregeneracja rys (Self-Healing)
Drobne zarysowania znikają pod wpływem ciepła (słońce, ciepła woda), dzięki czemu lakier przez lata wygląda jak nowy.
	•	Idealna przejrzystość – niewidoczna na aucie
Folia jest krystalicznie czysta, nie zmienia koloru lakieru i nie powoduje efektu „skórki pomarańczy”.
	•	Grubość ok. 200 mikronów
Znacznie grubsza niż lakier bezbarwny – tworzy fizyczną barierę ochronną, której lakier sam w sobie nie zapewnia.
	•	Wbudowana nano-ceramika
Powierzchnia jest hydrofobowa – woda, brud i owady słabiej przylegają, a auto dłużej pozostaje czyste.
	•	Brak żółknięcia i odporność UV
Folia zachowuje przejrzystość przez lata, nawet przy intensywnej ekspozycji na słońce.
	•	Zwiększony połysk i efekt „szkła”
Lakier wygląda głębiej, bardziej elegancko i jak świeżo po wyjeździe z salonu.
	•	Bezpieczna i odwracalna
Po demontażu folii lakier pozostaje w oryginalnym stanie – bez śladów i uszkodzeń.
	•	10 lat gwarancji producenta
Potwierdzenie jakości materiału i długoterminowej ochrony pojazdu.
	•	Realna oszczędność
Chroniąc lakier, unikasz kosztownych napraw, lakierowania i spadku wartości auta przy sprzedaży.',
    NULL, NULL, NULL, 12000, 6000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    6, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Ultrafit", "source": "offer", "Wariant": "bezbarwna", "_source": "manual", "original_category": "WRAPPING - FOLIA PPF", "reminder_template_id": "f6d18a1f-0ee0-4f98-b885-1daed91af126"}'
  );

  v_svc_44 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_44, _instance_id, v_cat_3, 'Usuwanie wgnieceń (PDR)', NULL, 'Bezlakierowe usuwanie wgnieceń',
    NULL, NULL, NULL, NULL, 1,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    7, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": null, "source": "offer", "_source": "manual", "subcategory": "naprawa", "original_category": "USŁUGI DETAILINGOWE", "reminder_template_id": null}'
  );

  v_svc_45 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_45, _instance_id, v_cat_0, 'Odkurzanie dywaników', NULL, NULL,
    20, 30, 40, NULL, 0,
    10, 10, 10, NULL,
    true, false, false, true,
    NULL, NULL, NULL, NULL,
    7, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_46 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_46, _instance_id, v_cat_6, 'Folia PPF UltraFit XP Retro Mat', 'UltraFit Mat', 'UltraFit XP Retro Matte 2 to zaawansowana folia ochronna PPF klasy premium, która łączy najwyższy poziom ochrony lakieru z wyjątkowym, matowym efektem wizualnym. Zastosowanie tej folii pozwala całkowicie odmienić wygląd samochodu, nadając mu eleganckie, satynowo-matowe wykończenie, przy jednoczesnym zachowaniu pełnej ochrony fabrycznego lakieru.

Folia została wykonana z wysokiej jakości poliuretanu TPU o grubości około 200 mikronów, który skutecznie absorbuje uderzenia kamieni, żwiru oraz chroni lakier przed zarysowaniami i uszkodzeniami mechanicznymi. Dzięki temu lakier samochodu pozostaje w idealnym stanie, a w przypadku uszkodzenia wystarczy wymienić fragment folii bez konieczności lakierowania elementu.

UltraFit XP Retro Matte 2 posiada nowoczesną warstwę top-coat z technologią nano-ceramiczną, która zapewnia właściwości hydrofobowe, ogranicza przywieranie zabrudzeń oraz ułatwia bieżącą pielęgnację pojazdu. Dodatkowo powierzchnia folii posiada właściwości samoregeneracji (self-healing), dzięki którym drobne zarysowania mogą zniknąć pod wpływem ciepła lub promieni słonecznych.

Matowe wykończenie folii tworzy charakterystyczny efekt „retro matte”, który subtelnie tłumi połysk lakieru, zachowując jednocześnie głębię koloru i nadając pojazdowi bardzo prestiżowy wygląd. Jest to idealne rozwiązanie dla osób, które chcą uzyskać efekt lakieru matowego bez konieczności trwałego lakierowania samochodu.

Dzięki specjalnemu klejowi typu pressure-sensitive folia pozwala na precyzyjną aplikację oraz repozycjonowanie podczas montażu, co przekłada się na wysoką jakość instalacji i trwałość zabezpieczenia.

Najważniejsze zalety folii UltraFit XP Retro Matte 2:
	•	matowe, satynowe wykończenie zmieniające wygląd samochodu
	•	skuteczna ochrona lakieru przed kamieniami, zarysowaniami i uszkodzeniami
	•	gruba warstwa poliuretanu TPU (~200 µm) zapewniająca wysoką odporność
	•	technologia self-healing – samoregeneracja drobnych rys pod wpływem ciepła
	•	hydrofobowa powierzchnia ułatwiająca utrzymanie auta w czystości
	•	możliwość bezpiecznego demontażu folii bez ingerencji w lakier

Zastosowanie folii UltraFit XP Retro Matte 2 pozwala uzyskać wyjątkowy wygląd pojazdu przy jednoczesnym zachowaniu najwyższego poziomu ochrony lakieru.',
    NULL, NULL, NULL, 12000, 9000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    7, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_47 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_47, _instance_id, v_cat_5, 'Powłoka ceramiczna Gyeon Q² CanCoat EVO - 12 miesięcy ochrony', 'EVO 12', NULL,
    NULL, NULL, NULL, 1700, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    7, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": 12}'
  );

  v_svc_48 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_48, _instance_id, v_cat_6, 'Folia ochronna RIVASHIELD Kolorowa', 'KOLOROWA R', NULL,
    NULL, NULL, NULL, 13000, 17000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    8, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_49 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_49, _instance_id, v_cat_0, 'Czyszczenie plastików wewnątrz', NULL, NULL,
    50, 60, 70, NULL, 0,
    20, 30, 40, NULL,
    true, false, false, true,
    NULL, NULL, NULL, NULL,
    8, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_50 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_50, _instance_id, v_cat_5, 'Powłoka ceramiczna Gyeon Q² One EVO - 24 miesięcy ochrony', 'ONE 24', 'Jednowarstwowa powłoka ceramiczna o trwałości do 24 miesięcy. Poprawia połysk, zabezpiecza lakier przed chemią i czynnikami atmosferycznymi. Rozwiązanie pośrednie między CanCoat a Mohs.',
    NULL, NULL, NULL, 2200, 2200,
    60, 60, 60, NULL,
    true, false, true, true,
    NULL, NULL, NULL, NULL,
    8, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": 24}'
  );

  v_svc_51 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_51, _instance_id, v_cat_3, 'Bezpieczne mycie ręczne na dwa wiadra', 'DWA WIADRA', 'Jedno wiadro z szamponem, drugie wiadro z czystą wodą do płukania rękawicy, szampon o neutralnym pH, suszenie sprężonym powietrzem, bezpieczna wersja zwykłego mycia',
    NULL, NULL, NULL, 250, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    8, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_52 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_52, _instance_id, v_cat_6, 'Folia PPF UltraFit XP Satyna', 'UltraFit Satyna', 'Folia ochronna satynowa premium',
    NULL, NULL, NULL, 12000, 9000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    9, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Ultrafit", "source": "offer", "_source": "manual", "variant": "satyna", "original_category": "WRAPPING - FOLIA PPF", "reminder_template_id": "f6d18a1f-0ee0-4f98-b885-1daed91af126"}'
  );

  v_svc_53 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_53, _instance_id, v_cat_3, 'Mycie detailingowe (External Detailing Wash)', NULL, 'Mycie wstępne pianą (pre-wash, TFR), mycie na dwa wiadra, czyszczenie detali (emblematy, kratki, wnęki drzwi, progi, uszczelki), dokładne mycie felg, wnęk i opon, pędzelkowanie zakamarków, suszenie powietrzem + mikrofibrą, dressing na opony i plastiki zewnętrzne, opcjonalnie: dekontaminację chemiczną *dodatkowo płatne',
    NULL, NULL, NULL, 350, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    9, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_54 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_54, _instance_id, v_cat_5, 'Powłoka ceramiczna Gyeon Q² Mohs EVO - 36 miesięcy ochrony', 'MOHS 36', 'Gyeon Q² Mohs EVO – co daje na karoserii
	•	✨ Szklisty, wyraźny połysk – lakier wygląda na czystszy i bardziej „premium”
	•	🎨 Podbicie głębi koloru – kolor staje się bardziej nasycony
	•	💧 Mocna hydrofobowość – woda i brud słabo przylegają do powierzchni
	•	🛡️ Ochrona przed chemią i solą drogową
	•	☀️ Ochrona UV – spowalnia blaknięcie lakieru
	•	🧱 Zwiększona odporność na mikrorysy w codziennym użytkowaniu
	•	🧼 Łatwiejsze i bezpieczniejsze mycie
	•	⏳ Długotrwały efekt ochronny (do ok. 36 miesięcy)',
    NULL, NULL, NULL, 2700, 2700,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    9, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_55 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_55, _instance_id, v_cat_6, 'Folia PPF Izotronik Clear Mat', 'Izotronik MAT', 'Izotronik PPF Pure Matte White  – matowa folia ochronna Color PPF

Izotronik PPF Pure Matte White MS-2066 to zaawansowana folia ochronna typu Color PPF, która łączy funkcję zmiany koloru pojazdu z wysokim poziomem ochrony lakieru. Dzięki niej samochód zyskuje elegancki efekt matowej bieli o satynowym wykończeniu, jednocześnie pozostając skutecznie zabezpieczonym przed codziennymi uszkodzeniami eksploatacyjnymi.

Folia została wykonana z wysokiej jakości poliuretanu TPU (Thermoplastic Polyurethane) o całkowitej grubości około 190–200 mikronów, co zapewnia znacznie większą odporność niż w przypadku klasycznych folii do zmiany koloru. Tak duża grubość skutecznie chroni lakier przed odpryskami od kamieni, drobnymi zarysowaniami, otarciami parkingowymi oraz innymi uszkodzeniami mechanicznymi.

Zastosowana warstwa top-coat zwiększa odporność powierzchni na zabrudzenia, działanie chemii samochodowej oraz wpływ czynników atmosferycznych. Powierzchnia folii jest łatwa w pielęgnacji i ogranicza przywieranie zanieczyszczeń, co pozwala utrzymać samochód w idealnym stanie przez długi czas.

Matowe wykończenie w odcieniu Pure Matte White nadaje pojazdowi wyjątkowy, nowoczesny i prestiżowy charakter. Efekt wizualny przypomina fabryczny lakier matowy, jednak w przeciwieństwie do niego folia tworzy dodatkową warstwę ochronną i może zostać w przyszłości bezpiecznie usunięta bez ingerencji w oryginalny lakier.

Dzięki zastosowaniu kleju typu PSA (pressure-sensitive adhesive) folia umożliwia precyzyjną aplikację oraz repozycjonowanie podczas montażu, co pozwala uzyskać bardzo estetyczny efekt końcowy i trwałość instalacji.

Najważniejsze zalety folii Izotronik PPF Pure Matte White MS-2066:

- zmiana koloru samochodu na elegancki matowy biały  
- jednoczesna ochrona lakieru przed odpryskami, rysami i otarciami  
- całkowita grubość folii około 190–200 µm, zapewniająca wysoką odporność mechaniczną  
- warstwa ochronna top-coat zwiększająca odporność na zabrudzenia i chemię  
- łatwiejsza pielęgnacja w porównaniu do lakieru matowego  
- możliwość bezpiecznego demontażu folii bez uszkodzenia fabrycznego lakieru  

Zastosowanie folii Izotronik PPF Pure Matte White  pozwala całkowicie odmienić wygląd pojazdu, nadając mu wyjątkowy charakter przy jednoczesnym zapewnieniu wysokiego poziomu ochrony lakieru.',
    NULL, NULL, NULL, 12000, 4000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    10, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_56 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_56, _instance_id, v_cat_5, 'Powłoka ceramiczna Gyeon Q² Pure EVO - 36 miesięcy ochrony', 'PURE 36', 'Powłoka ceramiczna o wysokim połysku, dedykowana szczególnie do ciemnych lakierów. Trwałość do 3 lat. Zapewnia maksymalną głębię koloru i dobrą odporność mechaniczną.',
    NULL, NULL, NULL, 2700, 2700,
    60, 60, 60, NULL,
    true, false, true, true,
    NULL, NULL, NULL, NULL,
    10, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": "ciemne", "trwalosc_produktu_w_mesiacach": 36}'
  );

  v_svc_57 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_57, _instance_id, v_cat_3, 'Szybki wosk (Quick DETAILER)', NULL, 'Szybki wosk z ochroną do 4 tygodni',
    NULL, NULL, NULL, 150, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    10, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_58 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_58, _instance_id, v_cat_6, 'Folia PPF Izotronik Satyna', 'Izotronik SATYNA', 'Folia ochronna satynowa',
    NULL, NULL, NULL, 12000, 4000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    11, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Izotronik", "source": "offer", "_source": "manual", "variant": "satyna", "original_category": "WRAPPING - FOLIA PPF", "reminder_template_id": null}'
  );

  v_svc_59 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_59, _instance_id, v_cat_3, 'Dekontaminacja lakieru chemicznie', NULL, 'Usuwanie lotnej rdzy i pyłu metalicznego, smoły, asfaltu i żywicy',
    NULL, NULL, NULL, 350, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    11, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_60 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_60, _instance_id, v_cat_5, 'Powłoka ceramiczna Gyeon Q² Syncro EVO - 48 miesięcy ochrony', 'SYNCRO 48', 'Gyeon Q² EVO to dwuwarstwowy system powłoki ceramicznej, który łączy maksymalną trwałość z bardzo mocnym efektem wizualnym. Na lakierze daje wyraźnie „premium” rezultat – zarówno w wyglądzie, jak i w ochronie.

Efekt wizualny
	•	🔥 Głębia koloru i szklisty połysk – lakier wygląda na bardziej nasycony i „mokry”
	•	✨ Wyostrzenie refleksów – światło odbija się równomiernie, auto wygląda świeżo jak po lakierowaniu
	•	🖤 Lepsze podkreślenie ciemnych kolorów, ale jasne również zyskują czystość i klarowność

Ochrona lakieru
	•	🛡️ Bardzo wysoka odporność chemiczna – sól drogowa, detergenty, kwaśne deszcze
	•	☀️ Ochrona UV – spowalnia blaknięcie lakieru
	•	🐦 Mniejsza przyczepność brudu i owadów – łatwiejsze i bezpieczniejsze mycie

Hydrofobowość
	•	💧 Silny efekt odpychania wody (beading & sheeting)
	•	🚿 Auto dłużej pozostaje czyste, a mycie zajmuje mniej czasu
	•	🧼 Mniejsze ryzyko mikrorys przy regularnej pielęgnacji

Trwałość
	•	⏳ Do ok. 60 miesięcy (przy prawidłowej aplikacji i pielęgnacji)
	•	System EVO jest bardziej odporny i stabilny niż poprzednie generacje

Dlaczego Syncro, a nie zwykła ceramika
	•	🔗 Dwie warstwy:
	•	baza – trwałość i odporność
	•	top – połysk, śliskość i hydrofobowość
	•	Efekt jest mocniejszy wizualnie i dłużej się utrzymuje niż w klasycznych, jednowarstwowych powłokach',
    NULL, NULL, NULL, 3000, 3000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    11, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_61 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_61, _instance_id, v_cat_5, 'Powłoka ceramiczna Gyeon Q² evo dwu warstwowa', '5 LAT', NULL,
    NULL, NULL, NULL, 3300, 3300,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    12, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_62 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_62, _instance_id, v_cat_6, 'Folia PPF Izotronik Clear Gloss bezbarwna', 'Izotronik BEZBARWNA', '* grubość 190 µm zapewniająca skuteczną ochronę przed uszkodzeniami
* bezbarwna, błyszcząca folia PPF do codziennej ochrony lakieru
* samoregenerująca warstwa topcoat redukująca drobne rysy pod wpływem ciepła
* wysoka elastyczność umożliwiająca idealne dopasowanie do przetłoczeń i kształtów nadwozia
* ochrona przed zarysowaniami, chemią drogową i czynnikami atmosferycznymi bez wpływu na kolor i połysk lakieru',
    NULL, NULL, NULL, 12000, 4000,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    12, 'szt', 'universal', 'both', 'everywhere', NULL, '{"brand": "Izotronik", "source": "offer", "_source": "manual", "variant": "bezbarwna", "original_category": "WRAPPING - FOLIA PPF", "reminder_template_id": "f6d18a1f-0ee0-4f98-b885-1daed91af126"}'
  );

  v_svc_63 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_63, _instance_id, v_cat_3, 'Dekontaminacja lakieru mechaniczna', NULL, 'Usuwanie pyłu przemysłowego i metalicznego wbitego w lakier, resztki po owadach i smole',
    NULL, NULL, NULL, 1200, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    12, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_64 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_64, _instance_id, v_cat_3, 'Usuwanie wgnieceń (metodą PDR)', NULL, 'Specjalistyczna metoda wyciągania wgnieceń z karoserii bez potrzeby lakierowania elementu',
    NULL, NULL, NULL, NULL, 0,
    NULL, NULL, NULL, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    13, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_65 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_65, _instance_id, v_cat_5, 'Powłoka ceramiczna do lakierów matowych Gyeon Q² Matte EVO - 24 miesiące ochrony', 'MATTE 24', NULL,
    NULL, NULL, NULL, 2200, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    13, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": 24}'
  );

  v_svc_66 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_66, _instance_id, v_cat_6, 'Serwis Folia PPF', NULL, 'Darmowy serwis połowki miesiac po położeniu',
    NULL, NULL, NULL, 350, 0,
    60, 60, 60, NULL,
    true, false, true, true,
    NULL, NULL, NULL, NULL,
    13, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_67 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_67, _instance_id, v_cat_5, 'Powłoka ceramiczna do opon Gyeon Q² Tire', NULL, NULL,
    NULL, NULL, NULL, 100, 100,
    60, 60, 60, 60,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    14, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_68 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_68, _instance_id, v_cat_3, 'Renowacja tapicerki skórzanej i malowanie skór', NULL, NULL,
    NULL, NULL, NULL, NULL, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    14, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_69 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_69, _instance_id, v_cat_5, 'Powłoka ceramiczna do szyb Gyeon Q² View EVO', NULL, 'Zapewnij sobie nieskazitelną widoczność i długotrwałą ochronę szyb dzięki Gyeon Q² View EVO, innowacyjnej powłoce ceramicznej, która skutecznie odpycha wodę i zabrudzenia, minimalizując potrzebę użycia wycieraczek nawet przy prędkościach powyżej 50 km/h. Ta zaawansowana formuła gwarantuje niezrównaną trwałość, utrzymując swoje właściwości hydrofobowe przez imponujące 12 miesięcy, zapewniając komfort i bezpieczeństwo jazdy w każdych warunkach.',
    NULL, NULL, NULL, 150, 150,
    60, 60, 60, NULL,
    true, false, true, true,
    NULL, NULL, NULL, NULL,
    15, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_70 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_70, _instance_id, v_cat_5, 'Powłoka ceramiczna do szyb Gyeon Quick View', NULL, 'Szybka aplikacja hydrofobowej ochrony szyb poprawiającej odprowadzanie wody.',
    NULL, NULL, NULL, 100, 100,
    60, 60, 60, NULL,
    true, false, true, true,
    NULL, NULL, NULL, NULL,
    16, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_71 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_71, _instance_id, v_cat_5, 'Serwis powłoki ceramicznej', 'SER_POW', NULL,
    350, 350, 350, NULL, 0,
    60, 60, 60, 60,
    true, false, true, true,
    NULL, NULL, NULL, NULL,
    17, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_72 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_72, _instance_id, v_cat_1, 'Pranie fotelika dziecięcego', NULL, NULL,
    NULL, NULL, NULL, 80, 0,
    30, 30, 30, NULL,
    true, false, false, true,
    NULL, NULL, NULL, NULL,
    36, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_73 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_73, _instance_id, v_cat_6, 'Wnęka klamki', NULL, NULL,
    NULL, NULL, NULL, 50, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    81, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_74 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_74, _instance_id, v_cat_6, 'Rant drzwi', NULL, NULL,
    NULL, NULL, NULL, 50, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    82, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_75 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_75, _instance_id, v_cat_6, 'Reflektor przedni', NULL, NULL,
    NULL, NULL, NULL, 150, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    83, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_76 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_76, _instance_id, v_cat_6, 'Lampa tylna', NULL, NULL,
    NULL, NULL, NULL, 150, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    84, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_77 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_77, _instance_id, v_cat_6, 'Zabezpieczenie przedniej szyby', NULL, NULL,
    NULL, NULL, NULL, 1300, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    85, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_78 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_78, _instance_id, v_cat_6, 'Lusterko', NULL, NULL,
    NULL, NULL, NULL, 150, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    86, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_79 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_79, _instance_id, v_cat_6, 'Elementy Piano Black', NULL, NULL,
    NULL, NULL, NULL, 70, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    87, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_80 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_80, _instance_id, v_cat_6, 'Dechroming', NULL, NULL,
    NULL, NULL, NULL, NULL, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    88, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_81 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_81, _instance_id, v_cat_6, 'Przyciemnianie szyb', NULL, NULL,
    NULL, NULL, NULL, NULL, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    89, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_82 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_82, _instance_id, v_cat_5, 'Impregnacja dachu cabrio', 'IMPREGNACJ', 'GYEON FabricCoat na dachu cabrio – praktyka

Jak działa na dachu materiałowym:
	•	tworzy silną barierę hydrofobową – woda perli się i szybko spływa
	•	znacząco ogranicza nasiąkanie tkaniny
	•	chroni przed:
	•	deszczem i wilgocią
	•	zabrudzeniami drogowymi
	•	solą
	•	ptasimi odchodami
	•	dach wolniej się brudzi i łatwiej go domyć

Efekt wizualny:
	•	nie zmienia koloru dachu
	•	nie powoduje połysku ani efektu „mokrej tkaniny”
	•	zachowuje naturalny, fabryczny wygląd

Trwałość na cabrio:
	•	realnie 6–9 miesięcy (zależnie od pogody i mycia)
	•	bardzo dobra odporność na deszcz i krótkotrwałe opady
	•	zalecane odświeżenie raz w sezonie',
    NULL, NULL, NULL, 800, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    89, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_83 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_83, _instance_id, NULL, 'Konserwacja podwozia', 'KONSERWACJ', 'Zadbaj o długowieczność i nienaganny stan swojego pojazdu dzięki profesjonalnej konserwacji podwozia, która skutecznie chroni przed korozją, ścieraniem i uszkodzeniami mechanicznymi, zachowując jego wartość na lata. Stosujemy zaawansowane preparaty, które tworzą trwałą barierę ochronną, zapewniając spokój ducha i bezpieczeństwo na każdej drodze.',
    NULL, NULL, NULL, 2000, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    89, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": 36}'
  );

  v_svc_84 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_84, _instance_id, v_cat_0, 'Usuwanie sierści', NULL, NULL,
    NULL, NULL, NULL, NULL, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    91, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  v_svc_85 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_85, _instance_id, v_cat_0, 'Większe zabrudzenia', NULL, NULL,
    NULL, NULL, NULL, NULL, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    92, 'szt', 'universal', 'both', 'everywhere', NULL, '{"produkt_do_lakierow": null, "trwalosc_produktu_w_mesiacach": null}'
  );

  v_svc_86 := gen_random_uuid();
  INSERT INTO unified_services (
    id, instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    duration_small, duration_medium, duration_large, duration_minutes,
    requires_size, is_popular, prices_are_net, active,
    default_validity_days, default_payment_terms, default_warranty_terms, default_service_info,
    sort_order, unit, station_type, service_type, visibility, shortcut, metadata
  ) VALUES (
    v_svc_86, _instance_id, v_cat_0, 'Czyszczenie schowka podłokietnika', NULL, NULL,
    NULL, NULL, NULL, NULL, 0,
    NULL, NULL, NULL, NULL,
    false, false, true, true,
    NULL, NULL, NULL, NULL,
    93, 'szt', 'universal', 'both', 'everywhere', NULL, '{}'
  );

  -- Grab first two services for demo reservations/offers
  v_first_svc_id := v_svc_0;
  v_second_svc_id := v_svc_1;

  -- ============================================================
  -- STEP 3: Insert offer scopes
  -- ============================================================
  v_scope_0 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_0, _instance_id, 'PPF Full Body', 'PPF Full body POŁYSK', 'Full Body obejmuje:
* pełne oklejenie wszystkich elementów lakierowanych
* montaż na mokro z użyciem techniki „wrapping from the brit”
* maksymalne zawijanie krawędzi (tam, gdzie pozwala konstrukcja elementów)
* minimalna ilość łączeń, wysoka estetyka
* końcowa kontrola jakości oraz wygrzewanie newralgicznych stref',
    false, false, true,
    0, '* 10 lat gwarancji producenta na folię
* 2 lata gwarancji na montaż
* możliwość przedłużenia gwarancji montażowej przy corocznym serwisie', '* zaliczka: 20% wartości usługi
* rezerwacja terminu i materiału
* pozostała kwota płatna przy odbiorze pojazdu

', NULL, 'Serwis posprzedażowy – w cenie
* po około 30 dniach od realizacji:
* profesjonalne mycie zewnętrzne
* kontrola stanu folii i krawędzi

Po zakończeniu usługi wykonujemy profesjonalny film z wydania pojazdu, przekazywany klientowi w formie cyfrowej.',
    'instance', true, NULL, NULL, '{https://vklavozvzfqhxzoczqnp.supabase.co/storage/v1/object/public/service-photos/scope-20260305-220409.gif}'
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_0, v_svc_43, 'Premium', true, 0, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_0, v_svc_62, 'Standard', false, 1, _instance_id);

  v_scope_1 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_1, _instance_id, 'PPF Full body MAT', 'PPF Full body MAT', 'Full Body obejmuje:
* pełne oklejenie wszystkich elementów lakierowanych
* montaż na mokro z użyciem techniki „wrapping from the brit”
* maksymalne zawijanie krawędzi (tam, gdzie pozwala konstrukcja elementów)
* minimalna ilość łączeń, wysoka estetyka
* końcowa kontrola jakości oraz wygrzewanie newralgicznych stref',
    false, false, true,
    1, '* 10 lat gwarancji producenta na folię
* 2 lata gwarancji na montaż
* możliwość przedłużenia gwarancji montażowej przy corocznym serwisie', '* zaliczka: 20% wartości usługi
* rezerwacja terminu i materiału
* pozostała kwota płatna przy odbiorze pojazdu

', NULL, 'Serwis posprzedażowy – w cenie
* po około 30 dniach od realizacji:
* profesjonalne mycie zewnętrzne
* kontrola stanu folii i krawędzi

Po zakończeniu usługi wykonujemy profesjonalny film z wydania pojazdu, przekazywany klientowi w formie cyfrowej.',
    'instance', true, NULL, NULL, '{https://xsscqmlrnrodwydmgvac.supabase.co/storage/v1/object/public/service-photos/scope-20260313-164828-kpl7q.gif}'
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_1, v_svc_46, 'Premium', true, 0, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_1, v_svc_55, 'Standard', true, 1, _instance_id);

  v_scope_2 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_2, _instance_id, 'PPF Full Body KOLOR', 'PPF KOLOR ', 'PPF Full Body KOLOR obejmuje:
* pełne oklejenie wszystkich elementów lakierowanych, z wyjątkiem wnęk
* montaż na mokro z użyciem techniki „wrapping from the brit”
* maksymalne zawijanie krawędzi (tam, gdzie pozwala konstrukcja elementów)
* minimalna ilość łączeń, wysoka estetyka
* końcowa kontrola jakości oraz wygrzewanie newralgicznych stref',
    false, false, true,
    2, '* 10 lat gwarancji producenta na folię
* 2 lata gwarancji na montaż
* możliwość przedłużenia gwarancji montażowej przy corocznym serwisie', '* zaliczka: 20% wartości usługi
* rezerwacja terminu i materiału
* pozostała kwota płatna przy odbiorze pojazdu

', NULL, NULL,
    'instance', true, NULL, NULL, NULL
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_2, v_svc_48, NULL, true, 0, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_2, v_svc_12, NULL, false, 1, _instance_id);

  v_scope_3 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_3, _instance_id, 'PPF Full Front', 'PPF Full Front', 'Pakiet PPF Full Front obejmuje:
* Zderzak przedni
* Reflektory
* Cała maska
* Błotnik
* Lusterka
* Słupki przednie
* 1/5 dachu',
    false, false, true,
    3, '* 10 lat gwarancji producenta na folię
* 2 lata gwarancji na montaż
* możliwość przedłużenia gwarancji montażowej przy corocznym serwisie', '* zaliczka: 20% wartości usługi
* rezerwacja terminu i materiału
* pozostała kwota płatna przy odbiorze pojazdu

', NULL, NULL,
    'instance', true, NULL, NULL, '{https://vklavozvzfqhxzoczqnp.supabase.co/storage/v1/object/public/service-photos/scope-20260305-220423.gif}'
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_3, v_svc_43, 'Premium', true, 0, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_3, v_svc_62, NULL, false, 1, _instance_id);

  v_scope_4 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_4, _instance_id, 'PPF FULL FRONT MAT ', 'Front mat ', 'Pakiet Obejmuje: 
cała maska,zderzak, błotniki, lusterka, reflektory, słupki przednie, 1/3 nad szyba czołową.',
    false, false, true,
    4, NULL, '* zaliczka: 20% wartości usługi
* rezerwacja terminu i materiału
* pozostała kwota płatna przy odbiorze pojazdu

', NULL, NULL,
    'instance', true, NULL, NULL, NULL
  );

  v_scope_5 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_5, _instance_id, 'Powłoka ceramiczna do pakietu PPF Full Front', 'Powłoka ceramiczna do pakietu PPF Full Front', 'W pakiecie zawarte są:
* kompleksowe czyszczenie zewnętrzne
* dekontaminacja lakieru
* korekta lakieru Light one step, usunięcie mikrorys, poprawa połysku
* aplikacja powłoki na elementy niezabezpieczone folią PPF
* zabezpieczenie szyb powłoką hydrofobową
* aplikacja powłoki na felgi i opony

Uzyskany efekt na lakierze:
* bardzo mocne podbicie koloru i głębi lakieru
* wysoki, „szklany” połysk
* wyraźna śliskość powierzchni
* silny efekt hydrofobowy (szybkie odprowadzanie wody)
* ograniczone osadzanie się brudu i zanieczyszczeń
* znacznie łatwiejsze i bezpieczniejsze mycie pojazdu
* zwiększona odporność na chemię i warunki atmosferyczne',
    false, false, true,
    5, NULL, NULL, NULL, NULL,
    'instance', true, NULL, NULL, NULL
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_5, v_svc_50, NULL, false, 0, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_5, v_svc_60, NULL, false, 1, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_5, v_svc_61, NULL, false, 2, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_5, v_svc_54, NULL, false, 3, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_5, v_svc_56, NULL, false, 4, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_5, v_svc_65, NULL, false, 5, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_5, v_svc_47, NULL, false, 6, _instance_id);

  v_scope_6 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_6, _instance_id, 'Powłoka ceramiczna Cała karoseria', 'Powłoka ceramiczna FULL', 'W pakiecie zawarte są:
* kompleksowe czyszczenie zewnętrzne
* dekontaminacja lakieru
* korekta lakieru Light one step, usunięcie mikrorys, poprawa połysku
* aplikacja powłoki na całą karoserię
* zabezpieczenie szyb powłoką hydrofobową
* aplikacja powłoki na felgi i opony

Uzyskany efekt na lakierze:
* bardzo mocne podbicie koloru i głębi lakieru
* wysoki, „szklany” połysk
* wyraźna śliskość powierzchni
* silny efekt hydrofobowy (szybkie odprowadzanie wody)
* ograniczone osadzanie się brudu i zanieczyszczeń
* znacznie łatwiejsze i bezpieczniejsze mycie pojazdu
* zwiększona odporność na chemię i warunki atmosferyczne',
    false, false, true,
    6, NULL, 'Płatność po wykonaniu usługi.', NULL, NULL,
    'instance', true, NULL, NULL, NULL
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_6, v_svc_50, NULL, false, 0, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_6, v_svc_54, NULL, false, 1, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_6, v_svc_56, NULL, false, 2, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_6, v_svc_60, NULL, false, 3, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_6, v_svc_61, NULL, false, 4, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_6, v_svc_65, NULL, false, 5, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_6, v_svc_47, NULL, false, 6, _instance_id);

  v_scope_7 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_7, _instance_id, 'Powłoka elastomerowa', 'Powłoka elastomerowa', NULL,
    false, false, true,
    7, NULL, 'Płatność po wykonaniu usługi.', NULL, NULL,
    'instance', true, NULL, NULL, NULL
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_7, v_svc_25, NULL, true, 0, _instance_id);

  v_scope_8 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_8, _instance_id, 'Dodatki', 'Dodatki', NULL,
    true, false, true,
    8, NULL, NULL, NULL, NULL,
    'instance', true, NULL, NULL, NULL
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_60, NULL, false, 27, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_25, NULL, false, 28, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_61, NULL, false, 30, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_32, NULL, false, 31, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_37, NULL, false, 32, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_40, NULL, false, 33, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_26, NULL, false, 34, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_13, NULL, false, 35, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_1, NULL, false, 36, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_27, NULL, false, 37, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_18, NULL, false, 38, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_28, NULL, false, 39, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_58, NULL, false, 40, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_62, NULL, false, 41, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_55, NULL, false, 42, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_43, NULL, false, 43, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_52, NULL, false, 44, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_46, NULL, false, 45, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_48, NULL, false, 47, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_44, NULL, false, 1, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_8, NULL, false, 2, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_9, NULL, false, 3, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_7, NULL, false, 4, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_22, NULL, false, 9, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_70, NULL, false, 11, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_67, NULL, false, 13, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_69, NULL, false, 14, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_20, NULL, false, 17, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_0, NULL, false, 18, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_16, NULL, false, 19, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_50, NULL, false, 22, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_54, NULL, false, 24, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_8, v_svc_56, NULL, false, 25, _instance_id);

  v_scope_9 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_9, _instance_id, 'PPF Bikini', 'PPF Bikini', 'Pakiet PPF Bikini obejmuje:
* Zderzak przedni
* Reflektory
* Maska 1/3
* Błotnik 1/3
* Lusterka
* Słupki przednie',
    false, false, true,
    8, '* 10 lat gwarancji producenta na folię
* 2 lata gwarancji na montaż
* możliwość przedłużenia gwarancji montażowej przy corocznym serwisie', '* zaliczka: 20% wartości usługi
* rezerwacja terminu i materiału
* pozostała kwota płatna przy odbiorze pojazdu

', NULL, 'Serwis posprzedażowy – w cenie
* po około 30 dniach od realizacji:
* profesjonalne mycie zewnętrzne
* kontrola stanu folii i krawędzi',
    'instance', true, NULL, NULL, '{https://vklavozvzfqhxzoczqnp.supabase.co/storage/v1/object/public/service-photos/scope-20260305-220434.gif}'
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_9, v_svc_43, 'Premium', true, 0, _instance_id);
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_9, v_svc_62, 'Standard', false, 1, _instance_id);

  v_scope_10 := gen_random_uuid();
  INSERT INTO offer_scopes (
    id, instance_id, name, short_name, description,
    is_extras_scope, has_coating_upsell, has_unified_services,
    sort_order, default_warranty, default_payment_terms, default_notes, default_service_info,
    source, active, price_from, available_durations, photo_urls
  ) VALUES (
    v_scope_10, _instance_id, 'Konserwacja Podowzia ', 'Konserwacja podwozia ', 'Teroson WX999',
    false, false, true,
    9, NULL, '* zaliczka: 20% wartości usługi
* rezerwacja terminu i materiału
* pozostała kwota płatna przy odbiorze pojazdu

', NULL, 'Czas realizacji 3 dni robocze ',
    'instance', true, NULL, NULL, NULL
  );
  INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
  VALUES (v_scope_10, v_svc_83, NULL, true, 0, _instance_id);

  -- Grab first scope for offers
  v_first_scope_id := v_scope_0;

  -- ============================================================
  -- STEP 4: Insert demo customers
  -- ============================================================
  v_customer1_id := gen_random_uuid();
  v_customer2_id := gen_random_uuid();

  INSERT INTO customers (id, instance_id, name, phone, source)
  VALUES (v_customer1_id, _instance_id, 'Tomasz Nastały', '666610222', 'myjnia');

  INSERT INTO customers (id, instance_id, name, phone, source)
  VALUES (v_customer2_id, _instance_id, 'Rafał Nastały', '666610011', 'myjnia');

  -- ============================================================
  -- STEP 5: Insert 5 demo reservations
  -- ============================================================

  INSERT INTO reservations (
    instance_id, customer_name, customer_phone, vehicle_plate, car_size,
    reservation_date, start_time, end_time, status, confirmation_code,
    station_id, has_unified_services, service_items, completed_at
  ) VALUES (
    _instance_id, 'Tomasz Nastały', '666610222', 'Tesla Cybertruck', 'large',
    CURRENT_DATE - 2, '09:00', '11:00', 'completed', 'DEMO-001',
    v_station_id, true,
    jsonb_build_array(jsonb_build_object('service_id', v_first_svc_id::text, 'custom_price', null)),
    (CURRENT_DATE - 2 + TIME '11:00')::timestamptz
  );

  INSERT INTO reservations (
    instance_id, customer_name, customer_phone, vehicle_plate, car_size,
    reservation_date, start_time, end_time, status, confirmation_code,
    station_id, has_unified_services, service_items, completed_at
  ) VALUES (
    _instance_id, 'Rafał Nastały', '666610011', 'Porsche 911', 'medium',
    CURRENT_DATE - 1, '10:00', '12:00', 'completed', 'DEMO-002',
    v_station_id, true,
    jsonb_build_array(jsonb_build_object('service_id', v_second_svc_id::text, 'custom_price', null)),
    (CURRENT_DATE - 1 + TIME '12:00')::timestamptz
  );

  INSERT INTO reservations (
    instance_id, customer_name, customer_phone, vehicle_plate, car_size,
    reservation_date, start_time, end_time, status, confirmation_code,
    station_id, has_unified_services, service_items, started_at
  ) VALUES (
    _instance_id, 'Tomasz Nastały', '666610222', 'Tesla Cybertruck', 'large',
    CURRENT_DATE, '09:00', '11:00', 'in_progress', 'DEMO-003',
    v_station_id, true,
    jsonb_build_array(jsonb_build_object('service_id', v_first_svc_id::text, 'custom_price', null)),
    (CURRENT_DATE + TIME '09:00')::timestamptz
  );

  INSERT INTO reservations (
    instance_id, customer_name, customer_phone, vehicle_plate, car_size,
    reservation_date, start_time, end_time, status, confirmation_code,
    station_id, has_unified_services, service_items, confirmed_at
  ) VALUES (
    _instance_id, 'Rafał Nastały', '666610011', 'Porsche 911', 'medium',
    CURRENT_DATE + 1, '11:00', '13:00', 'confirmed', 'DEMO-004',
    v_station_id, true,
    jsonb_build_array(jsonb_build_object('service_id', v_second_svc_id::text, 'custom_price', null)),
    NOW()
  );

  INSERT INTO reservations (
    instance_id, customer_name, customer_phone, vehicle_plate, car_size,
    reservation_date, start_time, end_time, status, confirmation_code,
    station_id, has_unified_services, service_items, confirmed_at
  ) VALUES (
    _instance_id, 'Tomasz Nastały', '666610222', 'Tesla Cybertruck', 'large',
    CURRENT_DATE + 2, '10:00', '12:30', 'confirmed', 'DEMO-005',
    v_station_id, true,
    jsonb_build_array(jsonb_build_object('service_id', v_first_svc_id::text, 'custom_price', null)),
    NOW()
  );

  -- ============================================================
  -- STEP 6: Insert 3 demo offers
  -- ============================================================

  v_offer1_id := gen_random_uuid();
  INSERT INTO offers (
    id, instance_id, offer_number, public_token, status, has_unified_services,
    customer_data, vehicle_data, total_net, total_gross, vat_rate
  ) VALUES (
    v_offer1_id, _instance_id, 'DEMO/001', gen_random_uuid()::text, 'draft', true,
    jsonb_build_object('name', 'Tomasz Nastały', 'phone', '666610222'),
    jsonb_build_object('model', 'Tesla Cybertruck', 'plate', 'DEMO 001'),
    1500, 1845, 23
  );

  v_option_id := gen_random_uuid();
  INSERT INTO offer_options (id, offer_id, scope_id, name, is_selected, subtotal_net)
  VALUES (v_option_id, v_offer1_id, v_first_scope_id, 'Pakiet podstawowy', true, 1500);

  INSERT INTO offer_option_items (option_id, product_id, quantity, unit, unit_price, sort_order)
  VALUES (v_option_id, v_first_svc_id, 1, 'szt', 1500, 1);

  v_offer2_id := gen_random_uuid();
  INSERT INTO offers (
    id, instance_id, offer_number, public_token, status, has_unified_services,
    customer_data, vehicle_data, total_net, total_gross, vat_rate,
    sent_at, viewed_at
  ) VALUES (
    v_offer2_id, _instance_id, 'DEMO/002', gen_random_uuid()::text, 'viewed', true,
    jsonb_build_object('name', 'Rafał Nastały', 'phone', '666610011'),
    jsonb_build_object('model', 'Porsche 911', 'plate', 'DEMO 002'),
    3200, 3936, 23,
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
  );

  v_option_id := gen_random_uuid();
  INSERT INTO offer_options (id, offer_id, scope_id, name, is_selected, subtotal_net)
  VALUES (v_option_id, v_offer2_id, v_first_scope_id, 'Pakiet podstawowy', true, 3200);

  INSERT INTO offer_option_items (option_id, product_id, quantity, unit, unit_price, sort_order)
  VALUES (v_option_id, v_second_svc_id, 1, 'szt', 3200, 1);

  v_offer3_id := gen_random_uuid();
  INSERT INTO offers (
    id, instance_id, offer_number, public_token, status, has_unified_services,
    customer_data, vehicle_data, total_net, total_gross, vat_rate,
    sent_at, viewed_at, responded_at, approved_at
  ) VALUES (
    v_offer3_id, _instance_id, 'DEMO/003', gen_random_uuid()::text, 'approved', true,
    jsonb_build_object('name', 'Tomasz Nastały', 'phone', '666610222'),
    jsonb_build_object('model', 'Tesla Cybertruck', 'plate', 'DEMO 001'),
    5000, 6150, 23,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
  );

  v_option_id := gen_random_uuid();
  INSERT INTO offer_options (id, offer_id, scope_id, name, is_selected, subtotal_net)
  VALUES (v_option_id, v_offer3_id, v_first_scope_id, 'Pakiet premium', true, 5000);

  INSERT INTO offer_option_items (option_id, product_id, quantity, unit, unit_price, sort_order)
  VALUES (v_option_id, v_first_svc_id, 1, 'szt', 3000, 1);

  INSERT INTO offer_option_items (option_id, product_id, quantity, unit, unit_price, sort_order)
  VALUES (v_option_id, v_second_svc_id, 1, 'szt', 2000, 2);

  -- ============================================================
  -- STEP 7: Insert 1 demo protocol + damage points
  -- ============================================================
  v_protocol_id := gen_random_uuid();
  INSERT INTO vehicle_protocols (
    id, instance_id, offer_id, offer_number, customer_name, phone,
    vehicle_model, registration_number, body_type,
    fuel_level, odometer_reading, protocol_type, status,
    protocol_date, public_token
  ) VALUES (
    v_protocol_id, _instance_id, v_offer3_id, 'DEMO/003', 'Tomasz Nastały', '666610222',
    'Tesla Cybertruck', 'DEMO 001', 'suv',
    75, 12500, 'reception', 'draft',
    CURRENT_DATE, gen_random_uuid()::text
  );

  INSERT INTO protocol_damage_points (protocol_id, view, x_percent, y_percent, damage_type)
  VALUES (v_protocol_id, 'full', 30, 40, 'scratch');

  INSERT INTO protocol_damage_points (protocol_id, view, x_percent, y_percent, damage_type)
  VALUES (v_protocol_id, 'full', 70, 60, 'dent');

END;
$function$;
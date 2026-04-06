-- Seed PPF services for Bling instance (29f15eeb-5ada-446c-9351-0194dbc886fd)
-- 1. Deactivate unified_services used in existing offers (don't delete — they're referenced)
-- 2. Delete unused unified_services for this instance
-- 3. Delete all existing unified_categories for this instance
-- 4. Create 1 new category "Folie PPF"
-- 5. Create 12 new PPF services in that category

DO $$
DECLARE
  v_instance_id uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
  v_cat_id      uuid;
BEGIN

  -- ============================================================
  -- STEP 1: Deactivate unified_services used in existing offers
  -- ============================================================
  UPDATE unified_services
  SET active = false
  WHERE instance_id = v_instance_id
    AND id IN (
      SELECT DISTINCT ooi.product_id
      FROM offer_option_items ooi
      JOIN offer_options oo ON oo.id = ooi.option_id
      JOIN offers o ON o.id = oo.offer_id
      WHERE o.instance_id = v_instance_id
        AND ooi.product_id IS NOT NULL
    );

  -- ============================================================
  -- STEP 1b: Unlink scopes from offers, then delete scope products and scopes
  -- ============================================================
  UPDATE offer_options SET scope_id = NULL
  WHERE scope_id IN (SELECT id FROM offer_scopes WHERE instance_id = v_instance_id);

  DELETE FROM offer_scope_products
  WHERE scope_id IN (SELECT id FROM offer_scopes WHERE instance_id = v_instance_id);

  DELETE FROM offer_scopes
  WHERE instance_id = v_instance_id;

  -- ============================================================
  -- STEP 2: Delete unified_services NOT used in any offers
  -- ============================================================
  DELETE FROM unified_services
  WHERE instance_id = v_instance_id
    AND id NOT IN (
      SELECT DISTINCT ooi.product_id
      FROM offer_option_items ooi
      JOIN offer_options oo ON oo.id = ooi.option_id
      JOIN offers o ON o.id = oo.offer_id
      WHERE o.instance_id = v_instance_id
        AND ooi.product_id IS NOT NULL
    );

  -- ============================================================
  -- STEP 2b: Null out category_id on deactivated services (so we can delete categories)
  -- ============================================================
  UPDATE unified_services SET category_id = NULL
  WHERE instance_id = v_instance_id AND active = false;

  -- ============================================================
  -- STEP 3: Delete all existing categories for this instance
  -- ============================================================
  DELETE FROM unified_categories
  WHERE instance_id = v_instance_id;

  -- ============================================================
  -- STEP 4: Create category "Folie PPF"
  -- ============================================================
  v_cat_id := gen_random_uuid();
  INSERT INTO unified_categories (id, instance_id, name, slug, category_type, prices_are_net, sort_order, active)
  VALUES (v_cat_id, v_instance_id, 'Folie PPF', 'folie-ppf', 'both', true, 1, true);

  -- ============================================================
  -- STEP 5: Create 12 PPF services
  -- ============================================================

  -- ── FRONT MINI ──────────────────────────────────────────────

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Front Mini — Ultrafit Crystal XP', 'Front Mini Crystal XP',
    'W tym pakiecie oklejenie folią ochronną obejmuje: maskę, zderzak, reflektory, lusterka.

Ultrafit XP Crystal to bezbarwna folia ochronna PPF o wykończeniu high-gloss. Posiada technologię Nano Ceramic zapewniającą ultra-hydrofobową powierzchnię z kątem zwilżania 105°. Samonaprawiające się zarysowania pod wpływem ciepła, ochrona UV odrzucająca 99% promieniowania oraz absorpcja uderzeń kamieni i drobnych uszkodzeń dzięki wysokiej jakości TPU.',
    2600, 3000, 3400, 2600, 0,
    true, 'both', true, 'both', 'szt.', 1
  );

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Front Mini — Ultrafit Kolor', 'Front Mini Kolor',
    'W tym pakiecie oklejenie folią ochronną obejmuje: maskę, zderzak, reflektory, lusterka.

Ultrafit XP Kolor to kolorowa folia ochronna PPF dostępna w wielu odcieniach — od klasycznej czerni po unikalne barwy. Łączy zmianę koloru nadwozia z pełną ochroną lakieru. Powłoka Nano Ceramic z kątem zwilżania 105° odpycha wodę i brud, a technologia samonaprawy likwiduje drobne zarysowania pod wpływem ciepła. Ochrona UV 99% i absorpcja uderzeń TPU.',
    2600, 3000, 3400, 2600, 0,
    true, 'both', true, 'both', 'szt.', 2
  );

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Front Mini — Ultrafit Satyna', 'Front Mini Satyna',
    'W tym pakiecie oklejenie folią ochronną obejmuje: maskę, zderzak, reflektory, lusterka.

Ultrafit XP Satyna to folia ochronna PPF o eleganckim, satynowym wykończeniu — pomiędzy połyskiem a matem. Nadaje lakierowi subtelny, jedwabisty efekt przy jednoczesnej pełnej ochronie. Hydrofobowa powłoka Nano Ceramic z kątem zwilżania 105°, samonaprawiające się zarysowania oraz absorpcja uderzeń kamieni dzięki TPU. Ochrona UV 99%.',
    2600, 3000, 3400, 2600, 0,
    true, 'both', true, 'both', 'szt.', 3
  );

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Front Mini — Ultrafit Mat', 'Front Mini Mat',
    'W tym pakiecie oklejenie folią ochronną obejmuje: maskę, zderzak, reflektory, lusterka.

Ultrafit XP Retro Matte to folia ochronna PPF o matowym wykończeniu, nadająca lakierowi nowoczesny, retro-matowy charakter. Samonaprawiające się właściwości pod wpływem ciepła utrzymują gładką powierzchnię bez zarysowań. Hydrofobowa powłoka Nano Ceramic z kątem zwilżania 105° zapobiega osadom wodnym, a materiał TPU absorbuje uderzenia kamieni i żwiru.',
    2600, 3000, 3400, 2600, 0,
    true, 'both', true, 'both', 'szt.', 4
  );

  -- ── FULL FRONT ──────────────────────────────────────────────

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Full Front — Ultrafit Crystal XP', 'Full Front Crystal XP',
    'W tym pakiecie oklejenie folią ochronną obejmuje: maskę, zderzak, reflektory, lusterka, błotniki, przestrzenie pod klamkami, słupki A, próg załadunkowy bagażnika.

Ultrafit XP Crystal to bezbarwna folia ochronna PPF o wykończeniu high-gloss. Posiada technologię Nano Ceramic zapewniającą ultra-hydrofobową powierzchnię z kątem zwilżania 105°. Samonaprawiające się zarysowania pod wpływem ciepła, ochrona UV odrzucająca 99% promieniowania oraz absorpcja uderzeń kamieni i drobnych uszkodzeń dzięki wysokiej jakości TPU.',
    4600, 5000, 5400, 4600, 0,
    true, 'both', true, 'both', 'szt.', 5
  );

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Full Front — Ultrafit Kolor', 'Full Front Kolor',
    'W tym pakiecie oklejenie folią ochronną obejmuje: maskę, zderzak, reflektory, lusterka, błotniki, przestrzenie pod klamkami, słupki A, próg załadunkowy bagażnika.

Ultrafit XP Kolor to kolorowa folia ochronna PPF dostępna w wielu odcieniach — od klasycznej czerni po unikalne barwy. Łączy zmianę koloru nadwozia z pełną ochroną lakieru. Powłoka Nano Ceramic z kątem zwilżania 105° odpycha wodę i brud, a technologia samonaprawy likwiduje drobne zarysowania pod wpływem ciepła. Ochrona UV 99% i absorpcja uderzeń TPU.',
    4600, 5000, 5400, 4600, 0,
    true, 'both', true, 'both', 'szt.', 6
  );

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Full Front — Ultrafit Satyna', 'Full Front Satyna',
    'W tym pakiecie oklejenie folią ochronną obejmuje: maskę, zderzak, reflektory, lusterka, błotniki, przestrzenie pod klamkami, słupki A, próg załadunkowy bagażnika.

Ultrafit XP Satyna to folia ochronna PPF o eleganckim, satynowym wykończeniu — pomiędzy połyskiem a matem. Nadaje lakierowi subtelny, jedwabisty efekt przy jednoczesnej pełnej ochronie. Hydrofobowa powłoka Nano Ceramic z kątem zwilżania 105°, samonaprawiające się zarysowania oraz absorpcja uderzeń kamieni dzięki TPU. Ochrona UV 99%.',
    4600, 5000, 5400, 4600, 0,
    true, 'both', true, 'both', 'szt.', 7
  );

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Full Front — Ultrafit Mat', 'Full Front Mat',
    'W tym pakiecie oklejenie folią ochronną obejmuje: maskę, zderzak, reflektory, lusterka, błotniki, przestrzenie pod klamkami, słupki A, próg załadunkowy bagażnika.

Ultrafit XP Retro Matte to folia ochronna PPF o matowym wykończeniu, nadająca lakierowi nowoczesny, retro-matowy charakter. Samonaprawiające się właściwości pod wpływem ciepła utrzymują gładką powierzchnię bez zarysowań. Hydrofobowa powłoka Nano Ceramic z kątem zwilżania 105° zapobiega osadom wodnym, a materiał TPU absorbuje uderzenia kamieni i żwiru.',
    4600, 5000, 5400, 4600, 0,
    true, 'both', true, 'both', 'szt.', 8
  );

  -- ── FULL BODY ───────────────────────────────────────────────

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Full Body — Ultrafit Crystal XP', 'Full Body Crystal XP',
    'W tym pakiecie oklejenie folią ochronną obejmuje całe nadwozie auta.

Ultrafit XP Crystal to bezbarwna folia ochronna PPF o wykończeniu high-gloss. Posiada technologię Nano Ceramic zapewniającą ultra-hydrofobową powierzchnię z kątem zwilżania 105°. Samonaprawiające się zarysowania pod wpływem ciepła, ochrona UV odrzucająca 99% promieniowania oraz absorpcja uderzeń kamieni i drobnych uszkodzeń dzięki wysokiej jakości TPU.',
    11000, 13000, 15000, 11000, 0,
    true, 'both', true, 'both', 'szt.', 9
  );

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Full Body — Ultrafit Kolor', 'Full Body Kolor',
    'W tym pakiecie oklejenie folią ochronną obejmuje całe nadwozie auta.

Ultrafit XP Kolor to kolorowa folia ochronna PPF dostępna w wielu odcieniach — od klasycznej czerni po unikalne barwy. Łączy zmianę koloru nadwozia z pełną ochroną lakieru. Powłoka Nano Ceramic z kątem zwilżania 105° odpycha wodę i brud, a technologia samonaprawy likwiduje drobne zarysowania pod wpływem ciepła. Ochrona UV 99% i absorpcja uderzeń TPU.',
    11000, 13000, 15000, 11000, 0,
    true, 'both', true, 'both', 'szt.', 10
  );

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Full Body — Ultrafit Satyna', 'Full Body Satyna',
    'W tym pakiecie oklejenie folią ochronną obejmuje całe nadwozie auta.

Ultrafit XP Satyna to folia ochronna PPF o eleganckim, satynowym wykończeniu — pomiędzy połyskiem a matem. Nadaje lakierowi subtelny, jedwabisty efekt przy jednoczesnej pełnej ochronie. Hydrofobowa powłoka Nano Ceramic z kątem zwilżania 105°, samonaprawiające się zarysowania oraz absorpcja uderzeń kamieni dzięki TPU. Ochrona UV 99%.',
    11000, 13000, 15000, 11000, 0,
    true, 'both', true, 'both', 'szt.', 11
  );

  INSERT INTO unified_services (
    instance_id, category_id, name, short_name, description,
    price_small, price_medium, price_large, price_from, default_price,
    requires_size, service_type, active, visibility, unit, sort_order
  ) VALUES (
    v_instance_id, v_cat_id,
    'PPF Full Body — Ultrafit Mat', 'Full Body Mat',
    'W tym pakiecie oklejenie folią ochronną obejmuje całe nadwozie auta.

Ultrafit XP Retro Matte to folia ochronna PPF o matowym wykończeniu, nadająca lakierowi nowoczesny, retro-matowy charakter. Samonaprawiające się właściwości pod wpływem ciepła utrzymują gładką powierzchnię bez zarysowań. Hydrofobowa powłoka Nano Ceramic z kątem zwilżania 105° zapobiega osadom wodnym, a materiał TPU absorbuje uderzenia kamieni i żwiru.',
    11000, 13000, 15000, 11000, 0,
    true, 'both', true, 'both', 'szt.', 12
  );

END $$;

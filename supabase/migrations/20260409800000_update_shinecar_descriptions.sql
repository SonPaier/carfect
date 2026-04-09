-- Update ShineCar service descriptions with marketing copy
DO $$
DECLARE
  v_inst uuid := '02ca2ed6-5c2e-4c19-9cad-ef6964930a3c';
BEGIN

-- Polerowanie
UPDATE unified_services SET description = 'Jednoetapowa korekta lakieru to szybki sposób na odświeżenie wyglądu auta i usunięcie drobnych zarysowań. Lakier odzyskuje połysk i głębię koloru. Idealna opcja dla aut w dobrym stanie. Efekt widoczny od razu po zabiegu.' WHERE instance_id = v_inst AND name = 'Korekta lakieru one step';

UPDATE unified_services SET description = 'Dwuetapowa korekta pozwala skutecznie usunąć większość rys i hologramów. Przywraca lakierowi niemal fabryczny wygląd. To kompromis między efektem a czasem realizacji. Doskonały wybór dla wymagających właścicieli.' WHERE instance_id = v_inst AND name = '2-etapowa korekta lakieru';

UPDATE unified_services SET description = 'Najbardziej zaawansowana forma renowacji lakieru, zapewniająca maksymalny efekt wizualny. Usuwamy głębokie rysy i niedoskonałości. Lakier staje się perfekcyjnie gładki i lśniący. Idealna dla pasjonatów i aut premium.' WHERE instance_id = v_inst AND name = 'Wieloetapowa korekta lakieru';

UPDATE unified_services SET description = 'Przywracamy przejrzystość i estetykę zmatowiałych reflektorów. Poprawia to nie tylko wygląd auta, ale też bezpieczeństwo jazdy nocą. Usuwamy zarysowania i utlenienia. Reflektory odzyskują fabryczny wygląd.' WHERE instance_id = v_inst AND name = 'Polerowanie reflektorów (komplet)';

-- Powłoki ochronne
UPDATE unified_services SET description = 'Zapewnia skuteczną ochronę lakieru przed zabrudzeniami i czynnikami atmosferycznymi. Nadaje intensywny połysk i efekt hydrofobowy. Ułatwia codzienne mycie auta. Idealna jako podstawowe zabezpieczenie.' WHERE instance_id = v_inst AND name = 'Powłoka ceramiczna 1 rok';

UPDATE unified_services SET description = 'Elastyczna powłoka chroniąca lakier przed mikrozarysowaniami i chemią drogową. Utrzymuje świetny wygląd auta przez długi czas. Działa samoregenerująco w niewielkim stopniu. Doskonały balans trwałości i ceny.' WHERE instance_id = v_inst AND name = 'Powłoka elastomerowa 3 lata';

UPDATE unified_services SET description = 'Zaawansowana ochrona lakieru o zwiększonej odporności na uszkodzenia. Zapewnia głęboki połysk i długotrwały efekt hydrofobowy. Minimalizuje ryzyko powstawania rys. Świetna inwestycja w wygląd auta.' WHERE instance_id = v_inst AND name = 'Powłoka elastomerowa 5 lat';

UPDATE unified_services SET description = 'Najwyższy poziom zabezpieczenia lakieru dostępny w naszej ofercie. Maksymalna trwałość i odporność na warunki zewnętrzne. Lakier pozostaje w doskonałym stanie przez lata. Idealna dla najbardziej wymagających klientów.' WHERE instance_id = v_inst AND name = 'Powłoka elastomerowa 7 lat';

UPDATE unified_services SET description = 'Chroni felgi przed osadzaniem się pyłu hamulcowego i zabrudzeń. Ułatwia ich czyszczenie i pielęgnację. Nadaje estetyczny połysk. Idealne rozwiązanie dla zachowania perfekcyjnego wyglądu kół.' WHERE instance_id = v_inst AND name = 'Powłoka ceramiczna na felgi (komplet)';

UPDATE unified_services SET description = 'Poprawia widoczność podczas deszczu dzięki efektowi hydrofobowemu. Woda i brud szybciej spływają z powierzchni. Zwiększa komfort i bezpieczeństwo jazdy. Redukuje konieczność używania wycieraczek.' WHERE instance_id = v_inst AND name = 'Powłoka ceramiczna na szyby';

UPDATE unified_services SET description = 'Chroni skórę przed zabrudzeniami, przetarciami i starzeniem. Zachowuje jej naturalny wygląd i miękkość. Ułatwia codzienną pielęgnację wnętrza. Idealna dla aut z jasną tapicerką.' WHERE instance_id = v_inst AND name = 'Powłoka na tapicerkę skórzaną';

UPDATE unified_services SET description = 'Nadaje lakierowi głęboki połysk i elegancki wygląd. Chroni przed lekkimi zabrudzeniami i czynnikami zewnętrznymi. To szybkie i skuteczne odświeżenie auta. Doskonałe jako sezonowa ochrona.' WHERE instance_id = v_inst AND name = 'Zabezpieczenie woskiem';

-- Folia PPF
UPDATE unified_services SET description = 'Chroni ekran multimedialny przed zarysowaniami i odciskami palców. Zachowuje jego idealną przejrzystość. Nie wpływa na czułość dotyku. Proste zabezpieczenie na lata.' WHERE instance_id = v_inst AND name = 'Folia PPF — Ekran (wnętrze)';

UPDATE unified_services SET description = 'Zabezpiecza delikatne, błyszczące elementy wnętrza przed rysami. Chroni przed mikrouszkodzeniami powstającymi w codziennym użytkowaniu. Zachowuje estetyczny wygląd. Idealna dla wymagających detali.' WHERE instance_id = v_inst AND name = 'Folia PPF — Dekory Black Piano';

UPDATE unified_services SET description = 'Najwyższej klasy folia chroniąca całe auto przed uszkodzeniami mechanicznymi. Samoregenerująca powierzchnia usuwa drobne rysy pod wpływem ciepła. Zapewnia maksymalną ochronę i trwałość. Lakier pozostaje jak nowy przez lata.' WHERE instance_id = v_inst AND name = 'Folia ochronna PPF Ultrafit Crystal XP';

UPDATE unified_services SET description = 'Zabezpieczenie najbardziej narażonych elementów przodu pojazdu, takich jak maska, zderzak, reflektory, błotniki i lusterka. Skuteczna ochrona przy codziennej jeździe. Minimalizuje ryzyko uszkodzeń od kamieni i owadów. Zachowuje estetykę i wartość auta.' WHERE instance_id = v_inst AND name = 'PPF Full Front' AND category_id = '336c6537-52dd-4b52-9b74-ca4ad8500c79';

UPDATE unified_services SET description = 'Podstawowy pakiet obejmujący lampy, słupki Black Piano, wnęki klamek, próg załadunkowy oraz progi wewnętrzne drzwi. Chroni miejsca najbardziej narażone na zarysowania. Idealny do codziennego użytkowania auta. Praktyczna i ekonomiczna ochrona.' WHERE instance_id = v_inst AND name = 'PPF Pakiet Mini';

UPDATE unified_services SET description = 'Chroni szybę przed odpryskami i mikropęknięciami. Zwiększa jej trwałość i bezpieczeństwo. Poprawia komfort jazdy w trudnych warunkach. Idealna dla kierowców pokonujących długie trasy.' WHERE instance_id = v_inst AND name = 'Folia ochronna na szybę czołową';

UPDATE unified_services SET description = 'Zabezpiecza reflektory przed zarysowaniami i matowieniem. Chroni przed odpryskami kamieni. Utrzymuje ich przejrzystość na dłużej. Wydłuża żywotność oświetlenia.' WHERE instance_id = v_inst AND name = 'Folia PPF na reflektory (komplet)';

UPDATE unified_services SET description = 'Nadaje reflektorom nowoczesny, przyciemniony wygląd. Jednocześnie chroni je przed uszkodzeniami. Podkreśla charakter auta. Idealna dla fanów stylu.' WHERE instance_id = v_inst AND name = 'Folia PPF przyciemniająca na reflektory (komplet)';

UPDATE unified_services SET description = 'Automatycznie dostosowuje stopień przyciemnienia do światła. Zapewnia efekt wizualny i ochronę w jednym. Chroni przed zarysowaniami i UV. Unikalne rozwiązanie premium.' WHERE instance_id = v_inst AND name = 'Folia fotochromatyczna na reflektory (komplet)';

-- PPF Full Body (offer_scopes - template descriptions)
UPDATE unified_services SET description = 'Kompleksowe oklejenie całego nadwozia folią PPF zapewnia maksymalną ochronę lakieru. Chroni przed zarysowaniami, odpryskami i czynnikami atmosferycznymi. Idealne rozwiązanie dla nowych i wartościowych aut. Lakier pozostaje w perfekcyjnym stanie przez lata.' WHERE instance_id = v_inst AND name = 'PPF Full Body' AND category_id IS NOT NULL;

-- Detailing wnętrza
UPDATE unified_services SET description = 'Kompleksowe czyszczenie i odświeżenie całego wnętrza auta. Usuwamy zabrudzenia nawet z trudno dostępnych miejsc. Przywracamy świeżość i estetykę. Wnętrze wygląda jak nowe.' WHERE instance_id = v_inst AND name = 'Detailing wnętrza';

UPDATE unified_services SET description = 'Dokładnie usuwamy plamy, zabrudzenia i nieprzyjemne zapachy. Tapicerka odzyskuje świeżość i kolor. Bezpieczne metody czyszczenia. Idealne rozwiązanie po intensywnym użytkowaniu.' WHERE instance_id = v_inst AND name = 'Pranie tapicerki materiałowej';

UPDATE unified_services SET description = 'Przywracamy skórze naturalny wygląd i miękkość. Usuwamy zabrudzenia i zabezpieczamy powierzchnię. Chronimy przed pękaniem i wysychaniem. Skóra wygląda jak nowa.' WHERE instance_id = v_inst AND name = 'Czyszczenie i impregnacja tapicerki skórzanej';

UPDATE unified_services SET description = 'Specjalistyczne czyszczenie delikatnych materiałów dachów cabrio. Usuwamy zabrudzenia i zabezpieczamy przed wilgocią. Chronimy przed pleśnią i blaknięciem. Dach zachowuje estetykę na dłużej.' WHERE instance_id = v_inst AND name = 'Czyszczenie i impregnacja dachu cabrio';

-- Mycie i konserwacja
UPDATE unified_services SET description = 'Bezpieczne i dokładne mycie auta z użyciem profesjonalnych technik. Usuwamy zabrudzenia bez ryzyka zarysowań. Przywracamy czystość i połysk. Idealna baza do dalszych usług.' WHERE instance_id = v_inst AND name = 'Mycie detailingowe';

UPDATE unified_services SET description = 'Połączenie dokładnego mycia z dodatkowym podbiciem połysku. Lakier staje się bardziej śliski i błyszczący. Zapewnia krótkotrwałą ochronę. Szybki efekt premium.' WHERE instance_id = v_inst AND name = 'Mycie + quick detailer';

UPDATE unified_services SET description = 'Powłoka hydrofobowa poprawiająca widoczność podczas deszczu. Woda spływa z szyb przy większych prędkościach. Zwiększa komfort jazdy. Idealna na każdą porę roku.' WHERE instance_id = v_inst AND name = 'Niewidzialna wycieraczka';

UPDATE unified_services SET description = 'Odświeżenie i konserwacja istniejącej powłoki ochronnej. Przywracamy jej właściwości hydrofobowe i wygląd. Przedłużamy trwałość zabezpieczenia. Auto znów wygląda jak po aplikacji.' WHERE instance_id = v_inst AND name = 'Serwis powłoki';

UPDATE unified_services SET description = 'Czyszczenie i pielęgnacja folii ochronnej. Przywracamy jej estetykę i właściwości. Usuwamy zabrudzenia i drobne defekty. Folia wygląda jak nowa.' WHERE instance_id = v_inst AND name = 'Serwis folii PPF';

UPDATE unified_services SET description = 'Zabezpieczamy podwozie przed korozją i działaniem soli drogowej. Chronimy newralgiczne elementy konstrukcyjne. Wydłużamy żywotność auta. Idealne rozwiązanie na polskie warunki drogowe.' WHERE instance_id = v_inst AND name = 'Konserwacja podwozia';

UPDATE unified_services SET description = 'Zmiana chromowanych elementów na eleganckie wykończenie w czerni lub innym kolorze. Nadaje autu nowoczesny i sportowy wygląd. Wykonujemy precyzyjnie i estetycznie. Idealne do personalizacji.' WHERE instance_id = v_inst AND name = 'Dechroming';

UPDATE unified_services SET description = 'Pozwala całkowicie odmienić wygląd auta bez ingerencji w lakier. Jednocześnie zapewnia pełną ochronę powierzchni. Szeroka gama kolorów i wykończeń. Styl i ochrona w jednym.' WHERE instance_id = v_inst AND name = 'Zmiana koloru folią PPF';

-- Offer scopes (PPF templates)
UPDATE offer_scopes SET description = 'Kompleksowe oklejenie całego nadwozia folią PPF zapewnia maksymalną ochronę lakieru. Chroni przed zarysowaniami, odpryskami i czynnikami atmosferycznymi. Idealne rozwiązanie dla nowych i wartościowych aut. Lakier pozostaje w perfekcyjnym stanie przez lata.' WHERE instance_id = v_inst AND name = 'PPF Full Body';

UPDATE offer_scopes SET description = 'Zabezpieczenie najbardziej narażonych elementów przodu pojazdu, takich jak maska, zderzak, reflektory, błotniki i lusterka. Skuteczna ochrona przy codziennej jeździe. Minimalizuje ryzyko uszkodzeń od kamieni i owadów. Zachowuje estetykę i wartość auta.' WHERE instance_id = v_inst AND name = 'PPF Full Front';

UPDATE offer_scopes SET description = 'Podstawowy pakiet obejmujący lampy, słupki Black Piano, wnęki klamek, próg załadunkowy oraz progi wewnętrzne drzwi. Chroni miejsca najbardziej narażone na zarysowania. Idealny do codziennego użytkowania auta. Praktyczna i ekonomiczna ochrona.' WHERE instance_id = v_inst AND name = 'PPF Pakiet Mini';

END $$;

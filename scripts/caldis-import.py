#!/usr/bin/env python3
"""
Caldis → Carfect migration script.
Reads 2 XLS files (2025 + 2026), generates SQL for:
1. Missing services for hpdetailing
2. Customers (deduplicated by phone)
3. Customer vehicles
4. Reservations (split across 2 stations to avoid overlap)
"""

import openpyxl
import json
import re
import uuid
from datetime import datetime, timedelta

INSTANCE_ID = "50230fb6-fca0-4a09-b19c-f80215b2b715"
CAR_MODELS_FILE = "/tmp/car_models.json"

# Brand normalization aliases
BRAND_ALIASES = {
    'vw': 'Volkswagen', 'v': 'Volkswagen', 'volkswagen': 'Volkswagen',
    'bmw': 'BMW', 'bmw 4': 'BMW',
    'mercedes benz': 'Mercedes', 'mercedes-benz': 'Mercedes', 'mercedes': 'Mercedes', 'mercedesa': 'Mercedes',
    'skoda': 'Škoda', 'škoda': 'Škoda',
    'renaul': 'Renault', 'renault': 'Renault', 'reno': 'Renault',
    'vovlo': 'Volvo', 'volvo': 'Volvo',
    'aud': 'Audi', 'audi': 'Audi',
    'fiat': 'Fiat',
    'alfa romeo': 'Alfa Romeo',
    'mini': 'MINI',
    'citroen': 'Citroën', 'citroën': 'Citroën',
    'peugo': 'Peugeot', 'peugeot': 'Peugeot',
    'cupra': 'Cupra',
    'honda': 'Honda',
    'lexus': 'Lexus',
    'toyota': 'Toyota',
    'mazda': 'Mazda',
    'hyundai': 'Hyundai',
    'kia': 'Kia',
    'dacia': 'Dacia',
    'nissan': 'Nissan',
    'tesla': 'Tesla',
    'opel': 'Opel',
    'ford': 'Ford',
    'subaru': 'Subaru',
    'suzuki': 'Suzuki',
    'porsche': 'Porsche',
    'jaguar': 'Jaguar',
    'jeep': 'Jeep',
    'land rover': 'Land Rover',
    'maserati': 'Maserati',
    'doge': 'Dodge', 'dodge': 'Dodge',
    'jaecoo': 'Jaecoo',
    'motocykl': 'BMW',  # motorcycle mapped to BMW
}

# (normalized_brand_lower, model_lower) → correct model name in car_models
MODEL_FIXES = {
    # BMW
    ('bmw', '5'): 'Seria 5', ('bmw', '3'): 'Seria 3', ('bmw', '4'): 'Seria 4',
    ('bmw', '5 g60'): 'Seria 5', ('bmw', 'g60'): 'Seria 5', ('bmw', 'g20 3'): 'Seria 3',
    ('bmw', 'm2 35'): 'M2', ('bmw', 'm235i'): 'M240i',
    ('bmw', '8 cabrio'): 'Seria 8', ('bmw', '420d'): 'Seria 4',
    ('bmw', '530'): 'Seria 5', ('bmw', 'e60'): 'Seria 5',
    # Mercedes
    ('mercedes', 'cla'): 'CLA', ('mercedes', 'cla 200'): 'CLA',
    ('mercedes', 'klasa e'): 'Klasa E', ('mercedes', 'klasa s'): 'Klasa S',
    # Honda
    ('honda', 'crv'): 'CR-V', ('honda', 'hrv'): 'HR-V',
    ('honda', 'civc'): 'Civic', ('honda', 'civic'): 'Civic',
    ('honda', 'zrv'): 'ZR-V', ('honda', 'accord'): 'Accord',
    # Lexus
    ('lexus', 'rx 450h'): 'RX', ('lexus', 'rx550'): 'RX550',
    ('lexus', 'ux 300h'): 'UX', ('lexus', 'ux450'): 'UX', ('lexus', 'lexus ux450'): 'UX',
    ('lexus', 'nx 350'): 'NX', ('lexus', 'lx'): 'LX',
    # Volvo
    ('volvo', 'xc 60'): 'XC60', ('volvo', 'xc60'): 'XC60',
    ('volvo', 'xc40'): 'XC40', ('volvo', 'xc 40'): 'XC40',
    ('volvo', 's90'): 'S90',
    # Renault
    ('renault', 'austral'): 'Austral', ('renault', 'australl'): 'Austral', ('renault', 'austrtall'): 'Austral',
    # Škoda
    ('škoda', 'octavia'): 'Octavia', ('škoda', 'octavia vrs'): 'Octavia RS', ('škoda', 'karoq'): 'Karoq',
    # VW
    ('volkswagen', 'passat'): 'Passat', ('volkswagen', 'troc'): 'T-Roc',
    ('volkswagen', 't-roc'): 'T-Roc', ('volkswagen', 'golf gti'): 'Golf GTI',
    ('volkswagen', 'golf'): 'Golf',
    # Cupra
    ('cupra', 'formentor'): 'Formentor', ('cupra', 'formentor 2025'): 'Formentor',
    # Kia
    ('kia', 'proceed'): 'ProCeed', ('kia', 'poceed'): 'ProCeed', ('kia', 'xceed'): 'XCeed',
    # Toyota
    ('toyota', 'chr'): 'C-HR', ('toyota', 'rav4'): 'RAV4',
    # Nissan
    ('nissan', 'quashqai'): 'Qashqai', ('nissan', 'qashqai'): 'Qashqai',
    # Tesla
    ('tesla', '3'): 'Model 3',
    # Mazda
    ('mazda', 'cx5'): 'CX-5', ('mazda', 'cx60'): 'CX-60', ('mazda', 'cx-60'): 'CX-60', ('mazda', 'cx-5'): 'CX-5',
    # Hyundai
    ('hyundai', 'i30'): 'i30', ('hyundai', 'i30n line'): 'i30 N', ('hyundai', 'i30 nline'): 'i30 N',
    # Dacia
    ('dacia', 'dokker'): 'Dokker',
    # MINI
    ('mini', 'countryman'): 'Countryman',
    # Audi
    ('audi', 'a5'): 'A5', ('audi', 'q3'): 'Q3', ('audi', 'rs6'): 'RS6', ('audi', 'a1'): 'A1',
    # Alfa Romeo
    ('alfa romeo', 'giulia'): 'Giulia',
    # Dodge
    ('dodge', 'charger'): 'Charger',
    # Fiat
    ('fiat', '126'): '126p',
    # Jaecoo (brand+model reversed in Caldis: "Jaecoo" "Omoda")
    ('jaecoo', 'omoda'): 'J7',
    # Motocykl → BMW GS 1250
    ('bmw', 'bmw'): 'GS 1250',
}

# New car_models to add to DB
NEW_CAR_MODELS = [
    ('Volkswagen', 'Tayron', 'L'),
    ('Jaecoo', 'J7', 'L'),
    ('Fiat', '126p', 'S'),
]

FILES = [
    "/Users/tomasznastaly/Downloads/2026-04-14T17_23_38-Rezerwacje.xlsx",  # 2025
    "/Users/tomasznastaly/Downloads/2026-04-14T17_23_19-Rezerwacje.xlsx",  # 2026
]

# Column indices (0-based) from XLS header:
# 0: Data utworzenia, 1: Od, 2: Do, 3: Czas trwania (dni), 4: Czas trwania (godziny),
# 5: Imię i nazwisko, 6: Email, 7: Telefon, 8: Cena netto, 9: Cena brutto,
# 10: Rabat [%], 11: Suma netto, 12: Suma brutto, 13: VAT (z rez), 14: VAT (obliczony),
# 15: Kalendarz, 16: Kategoria, 17: Status rezerwacji, 18: Typ rezerwacji,
# 19: Status płatności, 20: Sposób płatności,
# 21-36: Informacja dodatkowa 1-16
# 21: marka, 22: model, 23: VIN, 24: rejestracja, 25: przebieg, 26: rok
# 27: opis usługi, 28: cena text

COL_CREATED = 0
COL_FROM = 1
COL_TO = 2
COL_NAME = 5
COL_EMAIL = 6
COL_PHONE = 7
COL_PRICE_NETTO = 11  # Suma netto
COL_PRICE_BRUTTO = 12  # Suma brutto
COL_STATUS = 17
COL_PAYMENT_STATUS = 19
COL_PAYMENT_METHOD = 20
COL_BRAND = 21
COL_MODEL = 22
COL_VIN = 23
COL_PLATE = 24
COL_MILEAGE = 25
COL_YEAR = 26
COL_SERVICE_DESC = 27
COL_PRICE_TEXT = 28


def normalize_phone(phone):
    """Normalize phone to digits only, strip country code."""
    if phone is None:
        return ""
    phone = str(phone).strip()
    phone = re.sub(r'[^\d]', '', phone)
    if phone.startswith('48') and len(phone) == 11:
        phone = phone[2:]
    return phone


def clean_str(val):
    """Clean a cell value to string, stripping dashes/dots placeholders."""
    if val is None:
        return ""
    s = str(val).strip()
    # If it's all dashes, dots, or similar placeholders → empty
    if re.match(r'^[\-\.—–_/\\]+$', s):
        return ""
    return s


def parse_datetime(val):
    """Parse datetime from XLS cell."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    s = str(val).strip()
    for fmt in ['%Y-%m-%d %H:%M:%S', '%d.%m.%Y %H:%M', '%Y-%m-%d %H:%M']:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def parse_price(val):
    """Parse price from XLS cell."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip().replace(',', '.').replace(' ', '')
    try:
        return float(s)
    except ValueError:
        return 0.0


def escape_sql(s):
    """Escape string for SQL."""
    if s is None:
        return "NULL"
    s = str(s).replace("'", "''")
    return f"'{s}'"


def map_service(desc):
    """Map Caldis service description to a Carfect unified_services name.
    Returns (service_name, is_new_service).
    """
    if not desc:
        return None, False

    d = desc.lower().strip()

    # Full Body PPF
    if 'full body' in d or 'ful body' in d:
        if 'mat' in d:
            return 'Full Body - Folia PPF matowa UltraFit', False
        if 'satyn' in d:
            return 'Full Body - Folia PPF satynowa UltraFit', False
        return 'Full Body - Folia PPF połysk UltraFit', False

    # Full Front PPF
    if 'full front' in d or 'fullr front' in d or d.startswith('ff ') or d == 'ff':
        return 'Full Front - Folia PPF połysk UltraFit', False

    # Zmiana koloru
    if 'zmiana koloru' in d:
        return 'Zmiana koloru - sedan / coupe', False

    # Dechroming
    if 'dechrom' in d:
        return 'Dechroming', False

    # Powłoka elastomerowa
    if 'elastomer' in d or 'powłoka elastomer' in d or 'powloka elastomer' in d:
        return 'Powłoka elastomerowa', False

    # Powłoka ceramiczna
    if 'powłoka ceramiczna' in d or 'powloka ceramiczna' in d:
        return 'Powłoka ceramiczna 3-letnia', False

    # Konserwacja podwozia
    if 'konserwacja podwozia' in d or 'konserwacja + wygłuszenie' in d:
        return 'Konserwacja podwozia', True

    # Konserwacja + Full Front combo
    if 'konserwacja' in d and 'full front' in d:
        return 'Full Front - Folia PPF połysk UltraFit', False

    # Oklejenie elementów PPF (partial)
    if 'oklejenie' in d or 'oklejanie' in d:
        if 'szyb' in d or 'wincrest' in d or 'wincest' in d:
            return 'Folia na szyby WinCrest EVO', True
        if 'drzwi' in d and '4' in d:
            return 'Full Front - Folia PPF połysk UltraFit', False  # closest match
        if 'bok' in d or 'maska' in d or 'dach' in d or 'element' in d:
            return 'Zmiana koloru elementów (dach, lusterka)', False
        if 'błotnik' in d or 'zderzak' in d or 'klapk' in d:
            return 'Zmiana koloru elementów (dach, lusterka)', False
        if 'reklamow' in d or 'logo' in d:
            return 'Oklejanie reklamowe - logo', False
        # Generic oklejenie → PPF elementy
        return 'Zmiana koloru elementów (dach, lusterka)', False

    # Korekta lakieru
    if 'korekta' in d:
        if 'jedno' in d or 'one' in d or '1' in d or 'one-step' in d or 'one step' in d:
            return 'Korekta lakieru 1-etapowa', False
        if 'dwu' in d or '2' in d:
            return 'Korekta lakieru 2-etapowa', False
        return 'Korekta lakieru 1-etapowa', False

    # Pranie
    if 'pranie wnętrza' in d or 'pranie wnętrz' in d:
        return 'Pranie wnętrza (wykładzina, boczki, fotele)', False
    if 'pranie foteli' in d or 'pranie fotel' in d:
        return 'Pranie foteli oraz boczków', False
    if 'pranie' in d:
        return 'Pranie wnętrza (wykładzina, boczki, fotele)', False

    # Ozonowanie
    if 'ozonowanie' in d:
        return 'Ozonowanie', False

    # Czyszczenie
    if 'czyszczenie' in d:
        if 'tapicerk' in d or 'skór' in d:
            return 'Czyszczenie skóry + nawilżanie', False
        if 'motocykl' in d:
            return 'Mycie detailingowe', False
        return 'Mycie detailingowe', False

    # Mycie
    if 'mycie' in d:
        if 'dekontaminacja' in d:
            return 'Mycie + dekontaminacja', False
        if 'detailing' in d:
            return 'Mycie detailingowe', False
        if 'komplet' in d or 'komplecik' in d:
            return 'Mycie detailingowe', False
        return 'Mycie premium', False

    # Przegląd
    if 'przegląd' in d or 'przegl' in d or 'przwgląd' in d or 'porzegląd' in d:
        return 'Przegląd gwarancyjny', True

    # Przygotowanie do sprzedaży
    if 'sprzedaż' in d or 'sprzedaz' in d or 'sprzedazy' in d or 'sprzdaż' in d or 'sprzdaży' in d:
        return 'Przygotowanie do sprzedaży', True

    # Quick Detailer
    if 'qd' in d or 'quick detailer' in d:
        return 'Quick Detailer', False

    # Dekontaminacja
    if 'dekontaminacja' in d or 'dekontamincja' in d:
        return 'Dekontaminacja chemiczna + glinkowanie', False

    # Woskowanie / wosk
    if 'wosk' in d or 'wax' in d:
        return 'Woskowanie syntetyczne (sealant)', False

    # Zaprawki
    if 'zaprawk' in d:
        return 'Zaprawki lakiernicze', True

    # Wgniotki / PDR
    if 'wgniot' in d or 'pdr' in d:
        return 'Usuwanie wgnieceń PDR', True

    # Pakiet
    if 'pakiet' in d:
        if 'urban' in d:
            return 'Full Front - Folia PPF połysk UltraFit', False
        if 'medium' in d:
            return 'Powłoka elastomerowa', False
        return 'Full Front - Folia PPF połysk UltraFit', False

    # Lampy PPF
    if 'lamp' in d and 'ppf' in d:
        return 'PPF Lampy przednie', False
    if 'lamp' in d:
        return 'PPF Lampy przednie', False

    # Usunięcie folii
    if 'usunięcie' in d and 'foli' in d:
        return 'Usunięcie starej folii PPF', False
    if 'rozklejenie' in d:
        return 'Usunięcie starej folii PPF', False

    # Usunięcie zarysowań / kleju
    if 'usunięcie' in d:
        return 'Korekta lakieru 1-etapowa', False

    # Wymiana folii
    if 'wymiana' in d and 'foli' in d:
        return 'Usunięcie starej folii PPF', False

    # Poprawa / przeklejenie
    if 'poprawa' in d or 'przeklejenie' in d:
        return 'Przegląd gwarancyjny', True

    # One Step + Powłoka
    if 'one step' in d and 'powłoka' in d:
        return 'Korekta + powłoka ceramiczna (pakiet)', False

    # Maska + dach + inne elementy PPF
    if 'maska' in d and ('dach' in d or 'parapet' in d):
        return 'Start - Folia PPF połysk UltraFit', False

    # Przygotowanie do leasingu
    if 'leasing' in d:
        return 'Przygotowanie do sprzedaży', True

    # Oklejenie szyby wincrest (typo: oklejnie)
    if 'wincrest' in d or 'wincest' in d:
        return 'Folia na szyby WinCrest EVO', True

    # Fallback
    return None, False


def load_car_models():
    """Load car_models from JSON dump and build lookup."""
    with open(CAR_MODELS_FILE) as f:
        models = json.load(f)
    # brand_lower → {model_lower → (brand, name, size)}
    lookup = {}
    for m in models:
        b = m['brand'].strip().lower()
        n = m['name'].strip().lower()
        if b not in lookup:
            lookup[b] = {}
        lookup[b][n] = (m['brand'], m['name'], m['size'])
    return lookup


def normalize_car(brand_raw, model_raw, car_lookup):
    """Normalize brand+model from Caldis to match car_models.
    Returns (brand, model, size) from car_models, or (brand, model, 'M') if new.
    """
    brand_raw = clean_str(brand_raw)
    model_raw = clean_str(model_raw)
    if not brand_raw and not model_raw:
        return '', '', 'M'

    # Normalize brand
    brand_key = brand_raw.lower().strip().rstrip('.')
    brand_norm = BRAND_ALIASES.get(brand_key, brand_raw)
    brand_lower = brand_norm.lower()
    model_lower = model_raw.lower().strip()

    # Check MODEL_FIXES alias
    fix_key = (brand_lower, model_lower)
    if fix_key in MODEL_FIXES:
        fixed_model = MODEL_FIXES[fix_key]
        if brand_lower in car_lookup and fixed_model.lower() in car_lookup[brand_lower]:
            m = car_lookup[brand_lower][fixed_model.lower()]
            return m[0], m[1], m[2]
        # Fixed model but not in DB yet → will be added via NEW_CAR_MODELS
        return brand_norm, fixed_model, 'M'

    # Direct match
    if brand_lower in car_lookup:
        if model_lower in car_lookup[brand_lower]:
            m = car_lookup[brand_lower][model_lower]
            return m[0], m[1], m[2]
        # Partial match
        for name_low, m in car_lookup[brand_lower].items():
            if model_lower in name_low or name_low in model_lower:
                return m[0], m[1], m[2]

    # Fallback — return cleaned brand + model, size M
    return brand_norm, model_raw, 'M'


def read_all_reservations():
    """Read all reservations from both XLS files."""
    rows = []
    for f in FILES:
        wb = openpyxl.load_workbook(f)
        ws = wb.active
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                continue  # skip header
            rows.append(row)
    return rows


def check_overlap(reservations):
    """Check if two reservations overlap in time."""
    # Sort by start datetime
    sorted_res = sorted(reservations, key=lambda r: r['from_dt'])
    overlaps = []
    for i in range(len(sorted_res)):
        for j in range(i + 1, len(sorted_res)):
            a = sorted_res[i]
            b = sorted_res[j]
            if b['from_dt'] >= a['to_dt']:
                break  # no more overlaps possible
            overlaps.append((a, b))
    return overlaps


def assign_stations(reservations):
    """Assign station 1 or 2 to each reservation so they don't overlap.
    Simple greedy: sort by start time, assign to station whose last end is earliest.
    """
    sorted_res = sorted(reservations, key=lambda r: r['from_dt'])
    station_ends = [datetime.min, datetime.min]  # station 0 and 1

    for r in sorted_res:
        # Pick station with earliest end
        if station_ends[0] <= r['from_dt']:
            r['station_idx'] = 0
            station_ends[0] = r['to_dt']
        elif station_ends[1] <= r['from_dt']:
            r['station_idx'] = 1
            station_ends[1] = r['to_dt']
        else:
            # Both overlap — assign to whichever ends sooner
            if station_ends[0] <= station_ends[1]:
                r['station_idx'] = 0
                station_ends[0] = r['to_dt']
            else:
                r['station_idx'] = 1
                station_ends[1] = r['to_dt']

    return sorted_res


def main():
    raw_rows = read_all_reservations()
    car_lookup = load_car_models()
    print(f"-- Total rows from XLS: {len(raw_rows)}")

    # Parse all reservations
    reservations = []
    customers = {}  # phone → customer data
    vehicles = {}  # (phone, vehicle_plate) → vehicle data
    new_services_needed = set()
    service_mapping = {}  # desc → service_name

    for row in raw_rows:
        from_dt = parse_datetime(row[COL_FROM])
        to_dt = parse_datetime(row[COL_TO])
        if not from_dt or not to_dt:
            continue

        name = clean_str(row[COL_NAME])
        email = clean_str(row[COL_EMAIL])
        phone = normalize_phone(row[COL_PHONE])
        if not phone:
            continue

        price_netto = parse_price(row[COL_PRICE_NETTO])
        price_brutto = parse_price(row[COL_PRICE_BRUTTO])

        brand_raw = clean_str(row[COL_BRAND])
        model_raw = clean_str(row[COL_MODEL])
        vin = clean_str(row[COL_VIN])
        plate_reg = clean_str(row[COL_PLATE])  # rejestracja → admin_notes
        mileage = clean_str(row[COL_MILEAGE])
        year = clean_str(row[COL_YEAR])
        service_desc = clean_str(row[COL_SERVICE_DESC])
        price_text = clean_str(row[COL_PRICE_TEXT])
        created_at = parse_datetime(row[COL_CREATED])

        # Normalize car brand+model to match car_models DB
        brand, model, car_size = normalize_car(brand_raw, model_raw, car_lookup)
        # vehicle_plate in Carfect = "Brand Model"
        vehicle_plate = f"{brand} {model}".strip()

        # Map service
        mapped_service, is_new = map_service(service_desc)
        if mapped_service and is_new:
            new_services_needed.add(mapped_service)
        if service_desc:
            service_mapping[service_desc[:60]] = mapped_service or "(unmapped)"

        # Build admin_notes from service description + extra info
        notes_parts = []
        if service_desc:
            notes_parts.append(service_desc)
        if price_text:
            notes_parts.append(f"Cena: {price_text}")
        if plate_reg:
            notes_parts.append(f"Rej: {plate_reg}")
        if mileage:
            notes_parts.append(f"Przebieg: {mileage}")
        if year:
            notes_parts.append(f"Rok: {year}")
        if vin:
            notes_parts.append(f"VIN: {vin}")
        admin_notes = " | ".join(notes_parts)

        # Customer dedup by phone
        if phone not in customers:
            customers[phone] = {
                'id': str(uuid.uuid4()),
                'name': name,
                'email': email,
                'phone': phone,
            }
        else:
            # Update name/email if better
            if not customers[phone]['email'] and email:
                customers[phone]['email'] = email
            if len(name) > len(customers[phone]['name']):
                customers[phone]['name'] = name

        # Vehicle dedup by phone + vehicle_plate (normalized)
        vkey = (phone, vehicle_plate)
        if vehicle_plate and vkey not in vehicles:
            vehicles[vkey] = {
                'id': str(uuid.uuid4()),
                'customer_id': customers[phone]['id'],
                'phone': phone,
                'model': vehicle_plate,
                'plate': plate_reg if plate_reg else None,
                'vin': vin if vin else None,
                'car_size': car_size,
            }

        reservations.append({
            'id': str(uuid.uuid4()),
            'from_dt': from_dt,
            'to_dt': to_dt,
            'customer_name': name,
            'customer_email': email,
            'customer_phone': phone,
            'vehicle_plate': vehicle_plate,
            'price_netto': price_netto,
            'price_brutto': price_brutto,
            'admin_notes': admin_notes,
            'service_name': mapped_service,
            'created_at': created_at or from_dt,
            'station_idx': 0,
        })

    # Assign stations
    reservations = assign_stations(reservations)

    # Count station assignments
    s1 = sum(1 for r in reservations if r['station_idx'] == 0)
    s2 = sum(1 for r in reservations if r['station_idx'] == 1)
    print(f"-- Station 1: {s1} reservations, Station 2: {s2} reservations")
    print(f"-- Unique customers: {len(customers)}")
    print(f"-- Unique vehicles: {len(vehicles)}")
    print(f"-- New services needed: {new_services_needed}")
    print()

    # Print service mapping summary
    print("-- SERVICE MAPPING:")
    for desc, svc in sorted(service_mapping.items()):
        print(f"--   {desc} → {svc}")
    print()

    # ==========================================
    # GENERATE SQL
    # ==========================================
    print("-- ===========================================")
    print("-- Caldis → Carfect migration")
    print(f"-- Generated: {datetime.now().isoformat()}")
    print(f"-- Instance: {INSTANCE_ID}")
    print("-- ===========================================")
    print()
    print("BEGIN;")
    print()

    # STEP 0: Add missing car_models
    print("-- STEP 0: Add missing car models")
    for brand, model_name, size in NEW_CAR_MODELS:
        print(f"INSERT INTO public.car_models (brand, name, size) VALUES ({escape_sql(brand)}, {escape_sql(model_name)}, {escape_sql(size)}) ON CONFLICT (brand, name) DO NOTHING;")
    print()

    # 1. Add missing services
    print("-- STEP 1: Add missing services")
    new_service_defs = {
        'Konserwacja podwozia': ('woskowanie', 'detailing', 2500),
        'Przegląd gwarancyjny': ('mycie-i-detailing', 'detailing', 200),
        'Przygotowanie do sprzedaży': ('mycie-i-detailing', 'detailing', 500),
        'Zaprawki lakiernicze': ('korekta-lakieru', 'detailing', 300),
        'Usuwanie wgnieceń PDR': ('korekta-lakieru', 'detailing', 500),
        'Folia na szyby WinCrest EVO': ('oklejanie-zmiana-koloru', 'ppf', 1500),
    }
    for svc_name in sorted(new_services_needed):
        if svc_name in new_service_defs:
            cat_slug, station_type, price = new_service_defs[svc_name]
            print(f"""INSERT INTO public.unified_services (instance_id, category_id, name, price_from, station_type, service_type, visibility, sort_order, active, requires_size, is_popular, unit)
SELECT '{INSTANCE_ID}', c.id, {escape_sql(svc_name)}, {price}, '{station_type}', 'both', 'everywhere', 99, true, false, false, 'szt'
FROM public.unified_categories c WHERE c.instance_id = '{INSTANCE_ID}' AND c.slug = '{cat_slug}';""")
            print()

    # Stations already exist in hpdetailing (2 purchased)

    # 3. Customers
    print("-- STEP 3: Customers")
    for c in customers.values():
        email_sql = escape_sql(c['email']) if c['email'] else "NULL"
        print(f"""INSERT INTO public.customers (id, instance_id, name, email, phone, sms_consent, has_no_show, is_net_payer)
VALUES ('{c['id']}', '{INSTANCE_ID}', {escape_sql(c['name'])}, {email_sql}, {escape_sql(c['phone'])}, true, false, true)
ON CONFLICT (instance_id, phone) DO UPDATE SET
  name = CASE WHEN length(EXCLUDED.name) > length(customers.name) THEN EXCLUDED.name ELSE customers.name END,
  email = COALESCE(EXCLUDED.email, customers.email);""")
    print()

    # 4. Customer vehicles
    print("-- STEP 4: Customer vehicles")
    for v in vehicles.values():
        vin_sql = escape_sql(v['vin']) if v['vin'] else "NULL"
        plate_sql = escape_sql(v['plate']) if v['plate'] else "NULL"
        print(f"""INSERT INTO public.customer_vehicles (id, instance_id, customer_id, phone, model, plate, vin, usage_count, last_used_at)
SELECT '{v['id']}', '{INSTANCE_ID}',
  COALESCE((SELECT id FROM public.customers WHERE instance_id = '{INSTANCE_ID}' AND phone = {escape_sql(v['phone'])} LIMIT 1), '{v['customer_id']}'),
  {escape_sql(v['phone'])}, {escape_sql(v['model'])}, {plate_sql}, {vin_sql}, 1, now()
ON CONFLICT DO NOTHING;""")
    print()

    # 5. Reservations
    print("-- STEP 5: Reservations")
    for r in reservations:
        res_date = r['from_dt'].strftime('%Y-%m-%d')
        start_time = r['from_dt'].strftime('%H:%M')
        end_date = r['to_dt'].strftime('%Y-%m-%d')
        end_time = r['to_dt'].strftime('%H:%M')
        email_sql = escape_sql(r['customer_email']) if r['customer_email'] else "NULL"
        station_num = r['station_idx'] + 1  # 1-based

        # Service ID lookup
        if r['service_name']:
            service_id_sql = f"(SELECT id FROM public.unified_services WHERE instance_id = '{INSTANCE_ID}' AND name = {escape_sql(r['service_name'])} LIMIT 1)"
        else:
            service_id_sql = "NULL"

        # Station ID lookup
        station_id_sql = f"(SELECT id FROM public.stations WHERE instance_id = '{INSTANCE_ID}' ORDER BY sort_order LIMIT 1 OFFSET {r['station_idx']})"

        created_at = r['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        conf_code = str(uuid.uuid4())[:8].upper()

        # Status mapping
        status = "'confirmed'"

        print(f"""INSERT INTO public.reservations (
  id, instance_id, reservation_date, start_time, end_date, end_time,
  customer_name, customer_email, customer_phone, vehicle_plate,
  price_netto, price, admin_notes, source, status,
  station_id, service_id, confirmation_code, created_at, confirmed_at
) VALUES (
  '{r['id']}', '{INSTANCE_ID}', '{res_date}', '{start_time}', '{end_date}', '{end_time}',
  {escape_sql(r['customer_name'])}, {email_sql}, {escape_sql(r['customer_phone'])}, {escape_sql(r['vehicle_plate'])},
  {r['price_netto']}, {r['price_brutto']}, {escape_sql(r['admin_notes'])}, 'caldis_import', {status},
  {station_id_sql}, {service_id_sql}, '{conf_code}', '{created_at}', '{created_at}'
) ON CONFLICT DO NOTHING;""")
    print()

    print("COMMIT;")
    print()
    print(f"-- Done! {len(reservations)} reservations, {len(customers)} customers, {len(vehicles)} vehicles")


if __name__ == '__main__':
    main()

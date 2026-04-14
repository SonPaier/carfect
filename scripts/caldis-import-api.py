#!/usr/bin/env python3
"""
Caldis → Carfect import via Supabase REST API.
Uses service_role key to bypass RLS.
"""

import openpyxl
import json
import os
import re
import uuid
import urllib.request
from datetime import datetime

INSTANCE_ID = "50230fb6-fca0-4a09-b19c-f80215b2b715"
SUPABASE_URL = "https://xsscqmlrnrodwydmgvac.supabase.co"
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
CAR_MODELS_FILE = "/tmp/car_models.json"

FILES = [
    "/Users/tomasznastaly/Downloads/2026-04-14T17_23_38-Rezerwacje.xlsx",
    "/Users/tomasznastaly/Downloads/2026-04-14T17_23_19-Rezerwacje.xlsx",
]

COL_CREATED = 0; COL_FROM = 1; COL_TO = 2; COL_NAME = 5; COL_EMAIL = 6
COL_PHONE = 7; COL_PRICE_NETTO = 11; COL_PRICE_BRUTTO = 12
COL_STATUS = 17; COL_PAYMENT_STATUS = 19; COL_PAYMENT_METHOD = 20
COL_BRAND = 21; COL_MODEL = 22; COL_VIN = 23; COL_PLATE = 24
COL_MILEAGE = 25; COL_YEAR = 26; COL_SERVICE_DESC = 27; COL_PRICE_TEXT = 28

# --- Same imports from caldis-import.py ---
BRAND_ALIASES = {
    'vw': 'Volkswagen', 'v': 'Volkswagen', 'volkswagen': 'Volkswagen',
    'bmw': 'BMW', 'bmw 4': 'BMW',
    'mercedes benz': 'Mercedes', 'mercedes-benz': 'Mercedes', 'mercedes': 'Mercedes', 'mercedesa': 'Mercedes',
    'skoda': 'Škoda', 'škoda': 'Škoda',
    'renaul': 'Renault', 'renault': 'Renault', 'reno': 'Renault',
    'vovlo': 'Volvo', 'volvo': 'Volvo',
    'aud': 'Audi', 'audi': 'Audi', 'fiat': 'Fiat',
    'alfa romeo': 'Alfa Romeo', 'mini': 'MINI',
    'citroen': 'Citroën', 'citroën': 'Citroën',
    'peugo': 'Peugeot', 'peugeot': 'Peugeot',
    'cupra': 'Cupra', 'honda': 'Honda', 'lexus': 'Lexus',
    'toyota': 'Toyota', 'mazda': 'Mazda', 'hyundai': 'Hyundai',
    'kia': 'Kia', 'dacia': 'Dacia', 'nissan': 'Nissan', 'tesla': 'Tesla',
    'doge': 'Dodge', 'dodge': 'Dodge', 'jaecoo': 'Jaecoo', 'motocykl': 'BMW',
}

MODEL_FIXES = {
    ('bmw', '5'): 'Seria 5', ('bmw', '3'): 'Seria 3', ('bmw', '4'): 'Seria 4',
    ('bmw', '5 g60'): 'Seria 5', ('bmw', 'g60'): 'Seria 5', ('bmw', 'g20 3'): 'Seria 3',
    ('bmw', 'm2 35'): 'M2', ('bmw', 'm235i'): 'M240i',
    ('bmw', '8 cabrio'): 'Seria 8', ('bmw', '420d'): 'Seria 4',
    ('bmw', '530'): 'Seria 5', ('bmw', 'e60'): 'Seria 5', ('bmw', 'bmw'): 'GS 1250',
    ('mercedes', 'cla'): 'CLA', ('mercedes', 'cla 200'): 'CLA',
    ('mercedes', 'klasa e'): 'Klasa E', ('mercedes', 'klasa s'): 'Klasa S',
    ('honda', 'crv'): 'CR-V', ('honda', 'hrv'): 'HR-V',
    ('honda', 'civc'): 'Civic', ('honda', 'civic'): 'Civic',
    ('honda', 'zrv'): 'ZR-V', ('honda', 'accord'): 'Accord',
    ('lexus', 'rx 450h'): 'RX', ('lexus', 'rx550'): 'RX550',
    ('lexus', 'ux 300h'): 'UX', ('lexus', 'ux450'): 'UX', ('lexus', 'lexus ux450'): 'UX',
    ('lexus', 'nx 350'): 'NX', ('lexus', 'lx'): 'LX',
    ('volvo', 'xc 60'): 'XC60', ('volvo', 'xc60'): 'XC60',
    ('volvo', 'xc40'): 'XC40', ('volvo', 'xc 40'): 'XC40', ('volvo', 's90'): 'S90',
    ('renault', 'austral'): 'Austral', ('renault', 'australl'): 'Austral', ('renault', 'austrtall'): 'Austral',
    ('škoda', 'octavia'): 'Octavia', ('škoda', 'octavia vrs'): 'Octavia RS', ('škoda', 'karoq'): 'Karoq',
    ('volkswagen', 'passat'): 'Passat', ('volkswagen', 'troc'): 'T-Roc',
    ('volkswagen', 't-roc'): 'T-Roc', ('volkswagen', 'golf gti'): 'Golf GTI', ('volkswagen', 'golf'): 'Golf',
    ('cupra', 'formentor'): 'Formentor', ('cupra', 'formentor 2025'): 'Formentor',
    ('kia', 'proceed'): 'ProCeed', ('kia', 'poceed'): 'ProCeed', ('kia', 'xceed'): 'XCeed',
    ('toyota', 'chr'): 'C-HR', ('toyota', 'rav4'): 'RAV4',
    ('nissan', 'quashqai'): 'Qashqai', ('nissan', 'qashqai'): 'Qashqai',
    ('tesla', '3'): 'Model 3',
    ('mazda', 'cx5'): 'CX-5', ('mazda', 'cx60'): 'CX-60', ('mazda', 'cx-60'): 'CX-60', ('mazda', 'cx-5'): 'CX-5',
    ('hyundai', 'i30'): 'i30', ('hyundai', 'i30n line'): 'i30 N', ('hyundai', 'i30 nline'): 'i30 N',
    ('dacia', 'dokker'): 'Dokker', ('mini', 'countryman'): 'Countryman',
    ('audi', 'a5'): 'A5', ('audi', 'q3'): 'Q3', ('audi', 'rs6'): 'RS6', ('audi', 'a1'): 'A1',
    ('alfa romeo', 'giulia'): 'Giulia', ('dodge', 'charger'): 'Charger',
    ('fiat', '126'): '126p', ('jaecoo', 'omoda'): 'J7',
}


def api_call(endpoint, method="GET", data=None, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=minimal",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in (200, 201):
                try:
                    return json.loads(resp.read())
                except:
                    return True
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  ERROR {e.code}: {error_body[:200]}")
        return None


def api_get(endpoint, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())
    headers = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def clean_str(val):
    if val is None: return ""
    s = str(val).strip()
    if re.match(r'^[\-\.—–_/\\]+$', s): return ""
    return s

def normalize_phone(phone):
    if phone is None: return ""
    phone = re.sub(r'[^\d]', '', str(phone).strip())
    if phone.startswith('48') and len(phone) == 11: phone = phone[2:]
    return phone

def parse_datetime(val):
    if val is None: return None
    if isinstance(val, datetime): return val
    s = str(val).strip()
    for fmt in ['%Y-%m-%d %H:%M:%S', '%d.%m.%Y %H:%M', '%Y-%m-%d %H:%M']:
        try: return datetime.strptime(s, fmt)
        except ValueError: continue
    return None

def parse_price(val):
    if val is None: return 0.0
    if isinstance(val, (int, float)): return float(val)
    s = str(val).strip().replace(',', '.').replace(' ', '')
    try: return float(s)
    except ValueError: return 0.0

def normalize_car(brand_raw, model_raw, car_lookup):
    brand_raw = clean_str(brand_raw)
    model_raw = clean_str(model_raw)
    if not brand_raw and not model_raw: return '', '', 'M'
    brand_key = brand_raw.lower().strip().rstrip('.')
    brand_norm = BRAND_ALIASES.get(brand_key, brand_raw)
    brand_lower = brand_norm.lower()
    model_lower = model_raw.lower().strip()
    fix_key = (brand_lower, model_lower)
    if fix_key in MODEL_FIXES:
        fixed_model = MODEL_FIXES[fix_key]
        if brand_lower in car_lookup and fixed_model.lower() in car_lookup[brand_lower]:
            m = car_lookup[brand_lower][fixed_model.lower()]
            return m[0], m[1], m[2]
        return brand_norm, fixed_model, 'M'
    if brand_lower in car_lookup:
        if model_lower in car_lookup[brand_lower]:
            m = car_lookup[brand_lower][model_lower]
            return m[0], m[1], m[2]
        for name_low, m in car_lookup[brand_lower].items():
            if model_lower in name_low or name_low in model_lower:
                return m[0], m[1], m[2]
    return brand_norm, model_raw, 'M'

def map_service(desc):
    if not desc: return None
    d = desc.lower().strip()
    if 'full body' in d or 'ful body' in d:
        if 'mat' in d: return 'Full Body - Folia PPF matowa UltraFit'
        if 'satyn' in d: return 'Full Body - Folia PPF satynowa UltraFit'
        return 'Full Body - Folia PPF połysk UltraFit'
    if 'full front' in d or 'fullr front' in d or d.startswith('ff ') or d == 'ff':
        return 'Full Front - Folia PPF połysk UltraFit'
    if 'zmiana koloru' in d: return 'Zmiana koloru - sedan / coupe'
    if 'dechrom' in d: return 'Dechroming'
    if 'elastomer' in d: return 'Powłoka elastomerowa'
    if 'powłoka ceramiczna' in d or 'powloka ceramiczna' in d: return 'Powłoka ceramiczna 3-letnia'
    if 'konserwacja podwozia' in d or 'konserwacja + wygłuszenie' in d: return 'Konserwacja podwozia'
    if 'konserwacja' in d and 'full front' in d: return 'Full Front - Folia PPF połysk UltraFit'
    if 'oklejenie' in d or 'oklejanie' in d:
        if 'szyb' in d or 'wincrest' in d: return 'Folia na szyby WinCrest EVO'
        if 'drzwi' in d and '4' in d: return 'Full Front - Folia PPF połysk UltraFit'
        if any(k in d for k in ['bok', 'maska', 'dach', 'element', 'błotnik', 'zderzak', 'klapk', 'słupk', 'relingi']):
            return 'Zmiana koloru elementów (dach, lusterka)'
        if 'reklamow' in d or 'logo' in d: return 'Oklejanie reklamowe - logo'
        return 'Zmiana koloru elementów (dach, lusterka)'
    if 'korekta' in d:
        if any(k in d for k in ['jedno', 'one', 'one-step', 'one step']): return 'Korekta lakieru 1-etapowa'
        return 'Korekta lakieru 1-etapowa'
    if 'pranie wnętrza' in d or 'pranie wnętrz' in d: return 'Pranie wnętrza (wykładzina, boczki, fotele)'
    if 'pranie foteli' in d: return 'Pranie foteli oraz boczków'
    if 'pranie' in d: return 'Pranie wnętrza (wykładzina, boczki, fotele)'
    if 'ozonowanie' in d: return 'Ozonowanie'
    if 'czyszczenie' in d: return 'Mycie detailingowe'
    if 'mycie' in d:
        if 'dekontaminacja' in d: return 'Mycie + dekontaminacja'
        if 'detailing' in d or 'komplet' in d: return 'Mycie detailingowe'
        return 'Mycie premium'
    if any(k in d for k in ['przegląd', 'przegl', 'przwgląd', 'porzegląd']): return 'Przegląd gwarancyjny'
    if any(k in d for k in ['sprzedaż', 'sprzedaz', 'sprzdaż', 'sprzdaży']): return 'Przygotowanie do sprzedaży'
    if 'qd' in d or 'quick detailer' in d: return 'Quick Detailer'
    if 'dekontaminacja' in d or 'dekontamincja' in d: return 'Dekontaminacja chemiczna + glinkowanie'
    if 'wosk' in d or 'wax' in d: return 'Woskowanie syntetyczne (sealant)'
    if 'zaprawk' in d: return 'Zaprawki lakiernicze'
    if 'wgniot' in d: return 'Usuwanie wgnieceń PDR'
    if 'pakiet' in d: return 'Full Front - Folia PPF połysk UltraFit'
    if 'lamp' in d: return 'PPF Lampy przednie'
    if 'usunięcie' in d and 'foli' in d: return 'Usunięcie starej folii PPF'
    if 'rozklejenie' in d: return 'Usunięcie starej folii PPF'
    if 'usunięcie' in d: return 'Korekta lakieru 1-etapowa'
    if 'wymiana' in d and 'foli' in d: return 'Usunięcie starej folii PPF'
    if 'poprawa' in d or 'przeklejenie' in d: return 'Przegląd gwarancyjny'
    if 'one step' in d and 'powłoka' in d: return 'Korekta + powłoka ceramiczna (pakiet)'
    if 'maska' in d and ('dach' in d or 'parapet' in d): return 'Start - Folia PPF połysk UltraFit'
    if 'leasing' in d: return 'Przygotowanie do sprzedaży'
    if 'wincrest' in d: return 'Folia na szyby WinCrest EVO'
    return None


def main():
    # Load car models lookup
    with open(CAR_MODELS_FILE) as f:
        car_models_data = json.load(f)
    car_lookup = {}
    for m in car_models_data:
        b = m['brand'].strip().lower()
        n = m['name'].strip().lower()
        if b not in car_lookup: car_lookup[b] = {}
        car_lookup[b][n] = (m['brand'], m['name'], m['size'])

    # Get existing stations
    stations = api_get("stations", {"instance_id": f"eq.{INSTANCE_ID}", "order": "sort_order", "select": "id,name"})
    print(f"Stations: {[(s['id'], s['name']) for s in stations]}")
    if len(stations) < 2:
        print("ERROR: Need 2 stations!")
        return
    station_ids = [s['id'] for s in stations]

    # Get existing services for mapping
    services = api_get("unified_services", {"instance_id": f"eq.{INSTANCE_ID}", "select": "id,name"})
    service_map = {s['name']: s['id'] for s in services}
    print(f"Services loaded: {len(service_map)}")

    # Add missing services via categories
    NEW_SERVICES = {
        'Konserwacja podwozia': ('woskowanie', 'detailing', 2500),
        'Przegląd gwarancyjny': ('mycie-i-detailing', 'detailing', 200),
        'Przygotowanie do sprzedaży': ('mycie-i-detailing', 'detailing', 500),
        'Zaprawki lakiernicze': ('korekta-lakieru', 'detailing', 300),
        'Usuwanie wgnieceń PDR': ('korekta-lakieru', 'detailing', 500),
        'Folia na szyby WinCrest EVO': ('oklejanie-zmiana-koloru', 'ppf', 1500),
    }
    categories = api_get("unified_categories", {"instance_id": f"eq.{INSTANCE_ID}", "select": "id,slug"})
    cat_map = {c['slug']: c['id'] for c in categories}

    for svc_name, (cat_slug, station_type, price) in NEW_SERVICES.items():
        if svc_name not in service_map and cat_slug in cat_map:
            print(f"  Adding service: {svc_name}")
            result = api_call("unified_services", "POST", {
                "instance_id": INSTANCE_ID,
                "category_id": cat_map[cat_slug],
                "name": svc_name,
                "price_from": price,
                "station_type": station_type,
                "service_type": "both",
                "visibility": "everywhere",
                "sort_order": 99,
                "active": True,
                "requires_size": False,
                "is_popular": False,
                "unit": "szt",
            })
        elif svc_name not in service_map:
            print(f"  WARN: Category {cat_slug} not found for {svc_name}")

    # Refresh service map
    services = api_get("unified_services", {"instance_id": f"eq.{INSTANCE_ID}", "select": "id,name"})
    service_map = {s['name']: s['id'] for s in services}

    # Read XLS data
    rows = []
    for f in FILES:
        wb = openpyxl.load_workbook(f)
        ws = wb.active
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0: continue
            rows.append(row)
    print(f"\nTotal XLS rows: {len(rows)}")

    # Parse reservations
    reservations = []
    customers = {}
    vehicles = {}

    for row in rows:
        from_dt = parse_datetime(row[COL_FROM])
        to_dt = parse_datetime(row[COL_TO])
        if not from_dt or not to_dt: continue

        name = clean_str(row[COL_NAME])
        email = clean_str(row[COL_EMAIL])
        phone = normalize_phone(row[COL_PHONE])
        if not phone: continue

        price_netto = parse_price(row[COL_PRICE_NETTO])
        price_brutto = parse_price(row[COL_PRICE_BRUTTO])
        brand_raw = clean_str(row[COL_BRAND])
        model_raw = clean_str(row[COL_MODEL])
        vin = clean_str(row[COL_VIN])
        plate_reg = clean_str(row[COL_PLATE])
        mileage = clean_str(row[COL_MILEAGE])
        year = clean_str(row[COL_YEAR])
        service_desc = clean_str(row[COL_SERVICE_DESC])
        price_text = clean_str(row[COL_PRICE_TEXT])
        created_at = parse_datetime(row[COL_CREATED])

        brand, model, car_size = normalize_car(brand_raw, model_raw, car_lookup)
        vehicle_plate = f"{brand} {model}".strip()

        mapped_service = map_service(service_desc)
        service_id = service_map.get(mapped_service) if mapped_service else None

        notes_parts = []
        if service_desc: notes_parts.append(service_desc)
        if price_text: notes_parts.append(f"Cena: {price_text}")
        if plate_reg: notes_parts.append(f"Rej: {plate_reg}")
        if mileage: notes_parts.append(f"Przebieg: {mileage}")
        if year: notes_parts.append(f"Rok: {year}")
        if vin: notes_parts.append(f"VIN: {vin}")
        admin_notes = " | ".join(notes_parts)

        if phone not in customers:
            customers[phone] = {'name': name, 'email': email, 'phone': phone}
        else:
            if not customers[phone]['email'] and email: customers[phone]['email'] = email
            if len(name) > len(customers[phone]['name']): customers[phone]['name'] = name

        vkey = (phone, vehicle_plate)
        if vehicle_plate and vkey not in vehicles:
            vehicles[vkey] = {
                'phone': phone, 'model': vehicle_plate,
                'plate': plate_reg or None, 'vin': vin or None, 'car_size': car_size,
            }

        reservations.append({
            'from_dt': from_dt, 'to_dt': to_dt,
            'customer_name': name, 'customer_email': email, 'customer_phone': phone,
            'vehicle_plate': vehicle_plate, 'price_netto': price_netto, 'price_brutto': price_brutto,
            'admin_notes': admin_notes, 'service_id': service_id,
            'created_at': created_at or from_dt, 'station_idx': 0,
        })

    # Assign stations (greedy no-overlap)
    reservations.sort(key=lambda r: r['from_dt'])
    station_ends = [datetime.min, datetime.min]
    for r in reservations:
        if station_ends[0] <= r['from_dt']:
            r['station_idx'] = 0; station_ends[0] = r['to_dt']
        elif station_ends[1] <= r['from_dt']:
            r['station_idx'] = 1; station_ends[1] = r['to_dt']
        else:
            idx = 0 if station_ends[0] <= station_ends[1] else 1
            r['station_idx'] = idx; station_ends[idx] = r['to_dt']

    s1 = sum(1 for r in reservations if r['station_idx'] == 0)
    s2 = sum(1 for r in reservations if r['station_idx'] == 1)
    print(f"Station 1: {s1}, Station 2: {s2}")
    print(f"Customers: {len(customers)}, Vehicles: {len(vehicles)}")

    # --- INSERT DATA ---

    # 1. Customers (batch upsert)
    print("\n--- Inserting customers ---")
    cust_data = []
    for c in customers.values():
        obj = {
            "instance_id": INSTANCE_ID,
            "name": c['name'],
            "phone": c['phone'],
            "sms_consent": True,
            "has_no_show": False,
            "is_net_payer": True,
        }
        if c['email']: obj['email'] = c['email']
        cust_data.append(obj)

    # Ensure all objects have same keys (PostgREST requirement)
    all_keys = set()
    for c in cust_data:
        all_keys.update(c.keys())
    for c in cust_data:
        for k in all_keys:
            if k not in c:
                c[k] = None

    # Batch in chunks of 20
    for i in range(0, len(cust_data), 20):
        chunk = cust_data[i:i+20]
        url = f"{SUPABASE_URL}/rest/v1/customers"
        headers = {
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        }
        body = json.dumps(chunk).encode()
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"  Customers batch {i//20+1}: {resp.status}")
        except urllib.error.HTTPError as e:
            print(f"  Customers batch {i//20+1} ERROR: {e.read().decode()[:200]}")

    # Get customer IDs by phone
    all_customers = api_get("customers", {
        "instance_id": f"eq.{INSTANCE_ID}",
        "select": "id,phone",
    })
    phone_to_id = {c['phone']: c['id'] for c in all_customers}

    # 2. Customer vehicles
    print("\n--- Inserting vehicles ---")
    veh_data = []
    for v in vehicles.values():
        cust_id = phone_to_id.get(v['phone'])
        if not cust_id: continue
        obj = {
            "instance_id": INSTANCE_ID,
            "customer_id": cust_id,
            "phone": v['phone'],
            "model": v['model'],
            "usage_count": 1,
            "car_size": v['car_size'],
        }
        obj['plate'] = v['plate']
        obj['vin'] = v['vin']
        veh_data.append(obj)

    for i in range(0, len(veh_data), 20):
        chunk = veh_data[i:i+20]
        url = f"{SUPABASE_URL}/rest/v1/customer_vehicles"
        headers = {
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates,return=minimal",
        }
        body = json.dumps(chunk).encode()
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"  Vehicles batch {i//20+1}: {resp.status}")
        except urllib.error.HTTPError as e:
            print(f"  Vehicles batch {i//20+1} ERROR: {e.read().decode()[:200]}")

    # 3. Reservations
    print("\n--- Inserting reservations ---")
    res_data = []
    for r in reservations:
        conf_code = str(uuid.uuid4())[:8].upper()
        created = r['created_at'].strftime('%Y-%m-%dT%H:%M:%S')
        obj = {
            "instance_id": INSTANCE_ID,
            "reservation_date": r['from_dt'].strftime('%Y-%m-%d'),
            "start_time": r['from_dt'].strftime('%H:%M'),
            "end_date": r['to_dt'].strftime('%Y-%m-%d'),
            "end_time": r['to_dt'].strftime('%H:%M'),
            "customer_name": r['customer_name'],
            "customer_phone": r['customer_phone'],
            "vehicle_plate": r['vehicle_plate'],
            "price_netto": r['price_netto'],
            "price": r['price_brutto'],
            "admin_notes": r['admin_notes'],
            "source": "caldis_import",
            "status": "confirmed",
            "station_id": station_ids[r['station_idx']],
            "confirmation_code": conf_code,
            "created_at": created,
            "confirmed_at": created,
        }
        obj['customer_email'] = r['customer_email'] if r['customer_email'] else None
        # service_id FK → old services table, use service_ids JSON for unified_services
        if r['service_id']:
            obj['service_ids'] = [r['service_id']]
        else:
            obj['service_ids'] = None
        res_data.append(obj)

    for i in range(0, len(res_data), 10):
        chunk = res_data[i:i+10]
        url = f"{SUPABASE_URL}/rest/v1/reservations"
        headers = {
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates,return=minimal",
        }
        body = json.dumps(chunk).encode()
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"  Reservations batch {i//10+1}: {resp.status}")
        except urllib.error.HTTPError as e:
            print(f"  Reservations batch {i//10+1} ERROR: {e.read().decode()[:200]}")

    print("\n=== DONE ===")


if __name__ == '__main__':
    main()

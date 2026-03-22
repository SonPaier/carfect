# Demo Seed Data — Design Spec

## Goal

When a new instance is created, seed it with demo data so the client sees a working app immediately. Data is seeded via SQL function called from `init-admin` edge function.

## What gets seeded

### Copied from armcar instance

1. **unified_categories** — all active categories, remapped to new instance_id
2. **unified_services** — all active services, with category_id remapped to new categories. All copied with `service_type = 'both'`
3. **offer_scopes** — all active scopes + their `has_unified_services = true` + their:
   - `offer_scope_products` (product_id remapped to new services)
   - `offer_scope_extras` + `offer_scope_extra_products` (product_id remapped)

### Created from scratch (fictional demo data)

4. **customers** — 2 records:
   - Tomasz Nastały, 666610222
   - Rafał Nastały, 666610011

5. **vehicles in reservations/protocols** — referenced by name, not separate table:
   - Tesla Cyber Truck (rejestracja np. "DEMO 001")
   - Porsche 911 (rejestracja np. "DEMO 002")

6. **reservations** — 5 records, dates relative to `NOW()`:
   - 2 completed (yesterday, 2 days ago)
   - 1 in_progress (today)
   - 2 confirmed (tomorrow, day after)
   - Mixed services from seeded unified_services, `has_unified_services = true`
   - `service_items` jsonb with service references
   - Assigned to default station ("Stanowisko 1" created by AddInstanceDialog)

7. **offers** — 3 records:
   - 1 draft
   - 1 sent (with viewed_at)
   - 1 approved
   - Each with `has_unified_services = true`
   - Each with offer_options + offer_option_items referencing seeded scopes/services

8. **vehicle_protocols** — 1 record:
   - Linked to one of the offers
   - Type: reception, status: draft
   - Tesla Cyber Truck, fuel_level: 75, odometer: 12500
   - 2-3 protocol_damage_points (scratch, dent)

## Mechanism

### SQL function: `seed_demo_data(_instance_id UUID)`

- Called from `init-admin` after `copy_global_scopes_to_instance`
- Early exit if instance already has customers (prevents double-seeding)
- Uses armcar's `instance_id` looked up by `slug = 'armcar'`
- All IDs generated via `gen_random_uuid()`
- All dates relative to `NOW()`
- SECURITY DEFINER, search_path = 'public'

### init-admin change

- Add RPC call: `supabase.rpc('seed_demo_data', { _instance_id: instanceId })` after scope copy
- Non-fatal (log error, continue)

## Out of scope

- Super admin UI for managing global data
- Editing seed via UI
- Demo photos/signatures (text fields left empty or minimal)

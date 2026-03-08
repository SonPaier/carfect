create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "pg_trgm" with schema "extensions";

drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";

create type "public"."app_role" as enum ('super_admin', 'admin', 'user', 'employee', 'hall', 'sales');

create type "public"."car_size" as enum ('small', 'medium', 'large');

create type "public"."reservation_status" as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'released', 'no_show', 'change_requested');

create type "public"."service_category" as enum ('car_wash', 'ppf', 'detailing', 'upholstery', 'other');

create type "public"."station_type" as enum ('washing', 'ppf', 'detailing', 'universal');

create type "public"."training_type" as enum ('group_basic', 'individual', 'master');


  create table "public"."breaks" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "station_id" uuid,
    "break_date" date not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "note" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."breaks" enable row level security;


  create table "public"."car_models" (
    "id" uuid not null default gen_random_uuid(),
    "brand" text not null,
    "name" text not null,
    "size" text not null,
    "active" boolean not null default true,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "status" text not null default 'active'::text
      );


alter table "public"."car_models" enable row level security;


  create table "public"."closed_days" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "closed_date" date not null,
    "reason" text,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid
      );


alter table "public"."closed_days" enable row level security;


  create table "public"."customer_reminders" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "reminder_template_id" uuid not null,
    "reservation_id" uuid,
    "customer_name" text not null,
    "customer_phone" text not null,
    "vehicle_plate" text not null default ''::text,
    "scheduled_date" date not null,
    "months_after" integer not null,
    "service_type" text not null,
    "status" text not null default 'scheduled'::text,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."customer_reminders" enable row level security;


  create table "public"."customer_vehicles" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid,
    "instance_id" uuid not null,
    "phone" text not null,
    "model" text not null,
    "plate" text,
    "usage_count" integer not null default 1,
    "last_used_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "car_size" text
      );


alter table "public"."customer_vehicles" enable row level security;


  create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "phone" text not null,
    "name" text not null,
    "email" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "phone_verified" boolean default false,
    "source" text not null default 'myjnia'::text,
    "company" text,
    "nip" text,
    "address" text,
    "discount_percent" integer,
    "short_name" text,
    "contact_person" text,
    "contact_phone" text,
    "contact_email" text,
    "sales_notes" text,
    "country_code" text,
    "phone_country_code" text,
    "contact_phone_country_code" text,
    "default_currency" text default 'PLN'::text,
    "vat_eu_number" text,
    "billing_street" text,
    "billing_street_line2" text,
    "billing_postal_code" text,
    "billing_city" text,
    "billing_region" text,
    "billing_country_code" text,
    "shipping_street" text,
    "shipping_street_line2" text,
    "shipping_postal_code" text,
    "shipping_city" text,
    "shipping_region" text,
    "shipping_country_code" text,
    "has_no_show" boolean not null default false,
    "sms_consent" boolean not null default false,
    "is_net_payer" boolean not null default false
      );


alter table "public"."customers" enable row level security;


  create table "public"."employee_breaks" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "employee_id" uuid not null,
    "break_date" date not null,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "duration_minutes" integer,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."employee_breaks" enable row level security;


  create table "public"."employee_days_off" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "employee_id" uuid not null,
    "date_from" date not null,
    "date_to" date not null,
    "day_off_type" text not null default 'vacation'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."employee_days_off" enable row level security;


  create table "public"."employee_edit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "entity_type" text not null,
    "entity_id" uuid not null,
    "old_value" jsonb,
    "new_value" jsonb,
    "edited_at" timestamp with time zone default now(),
    "edited_by" uuid
      );


alter table "public"."employee_edit_logs" enable row level security;


  create table "public"."employee_permissions" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "user_id" uuid not null,
    "feature_key" text not null,
    "enabled" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."employee_permissions" enable row level security;


  create table "public"."employees" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "name" text not null,
    "photo_url" text,
    "hourly_rate" numeric,
    "active" boolean not null default true,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."employees" enable row level security;


  create table "public"."followup_events" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "customer_id" uuid,
    "customer_name" text not null,
    "customer_phone" text not null,
    "notes" text,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "followup_service_id" uuid,
    "next_reminder_date" date not null default CURRENT_DATE
      );


alter table "public"."followup_events" enable row level security;


  create table "public"."followup_services" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "name" text not null,
    "description" text,
    "default_interval_months" integer not null default 12,
    "active" boolean not null default true,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."followup_services" enable row level security;


  create table "public"."followup_tasks" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "event_id" uuid not null,
    "title" text not null,
    "customer_name" text not null,
    "customer_phone" text not null,
    "due_date" date not null,
    "status" text not null default 'pending'::text,
    "notes" text,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."followup_tasks" enable row level security;


  create table "public"."halls" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "name" text not null,
    "slug" text not null,
    "station_ids" uuid[] default '{}'::uuid[],
    "visible_fields" jsonb default '{"services": true, "admin_notes": false, "customer_name": true, "vehicle_plate": true, "customer_phone": false}'::jsonb,
    "allowed_actions" jsonb default '{"change_time": false, "add_services": false, "change_station": false}'::jsonb,
    "sort_order" integer default 0,
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."halls" enable row level security;


  create table "public"."instance_features" (
    "instance_id" uuid not null,
    "feature_key" text not null,
    "enabled" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "parameters" jsonb
      );


alter table "public"."instance_features" enable row level security;


  create table "public"."instance_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "plan_id" uuid not null,
    "station_limit" integer not null default 1,
    "monthly_price" numeric,
    "starts_at" date not null default CURRENT_DATE,
    "ends_at" date,
    "status" text default 'active'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_trial" boolean default false,
    "trial_expires_at" timestamp with time zone
      );


alter table "public"."instance_subscriptions" enable row level security;


  create table "public"."instances" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "phone" text,
    "address" text,
    "email" text,
    "website" text,
    "logo_url" text,
    "primary_color" text default '#0ea5e9'::text,
    "secondary_color" text default '#06b6d4'::text,
    "social_facebook" text,
    "social_instagram" text,
    "active" boolean default true,
    "working_hours" jsonb default '{"friday": {"open": "08:00", "close": "18:00"}, "monday": {"open": "08:00", "close": "18:00"}, "sunday": null, "tuesday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "14:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "nip" text,
    "background_color" text default '#ffffff'::text,
    "sms_limit" integer not null default 50,
    "sms_used" integer not null default 0,
    "auto_confirm_reservations" boolean default false,
    "booking_days_ahead" integer not null default 90,
    "use_global_products" boolean not null default true,
    "google_maps_url" text,
    "subdomain" text,
    "invoice_company_name" text,
    "show_unit_prices_in_offer" boolean not null default false,
    "customer_edit_cutoff_hours" integer default 1,
    "offer_branding_enabled" boolean not null default false,
    "offer_bg_color" text default '#f8fafc'::text,
    "offer_header_bg_color" text default '#ffffff'::text,
    "offer_header_text_color" text default '#1e293b'::text,
    "offer_section_bg_color" text default '#ffffff'::text,
    "offer_section_text_color" text default '#1e293b'::text,
    "offer_primary_color" text default '#2563eb'::text,
    "offer_scope_header_text_color" text default '#1e293b'::text,
    "offer_default_payment_terms" text,
    "offer_default_notes" text,
    "offer_default_warranty" text,
    "offer_default_service_info" text,
    "offer_email_template" text,
    "offer_portfolio_url" text,
    "contact_person" text,
    "short_name" text,
    "reservation_phone" text,
    "offer_google_reviews_url" text,
    "offer_bank_company_name" text,
    "offer_bank_account_number" text,
    "offer_bank_name" text,
    "offer_trust_header_title" text,
    "offer_trust_description" text,
    "offer_trust_tiles" jsonb,
    "protocol_email_template" text,
    "timezone" text default 'Europe/Warsaw'::text,
    "public_api_key" text,
    "widget_config" jsonb default '{}'::jsonb,
    "assign_employees_to_stations" boolean default false,
    "assign_employees_to_reservations" boolean default false,
    "deleted_at" timestamp with time zone,
    "sms_sender_name" text,
    "bank_accounts" jsonb default '[]'::jsonb
      );


alter table "public"."instances" enable row level security;


  create table "public"."login_attempts" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "instance_id" uuid not null,
    "success" boolean not null default false,
    "ip_hint" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."login_attempts" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "type" text not null,
    "title" text not null,
    "description" text,
    "read" boolean not null default false,
    "entity_type" text,
    "entity_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."offer_history" (
    "id" uuid not null default gen_random_uuid(),
    "offer_id" uuid not null,
    "action" text not null,
    "old_data" jsonb,
    "new_data" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid
      );


alter table "public"."offer_history" enable row level security;


  create table "public"."offer_option_items" (
    "id" uuid not null default gen_random_uuid(),
    "option_id" uuid not null,
    "product_id" uuid,
    "custom_name" text,
    "custom_description" text,
    "unit" text not null default 'szt'::text,
    "quantity" numeric not null default 1,
    "unit_price" numeric not null default 0,
    "discount_percent" numeric not null default 0,
    "is_custom" boolean not null default false,
    "is_optional" boolean not null default false,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_option_items" enable row level security;


  create table "public"."offer_options" (
    "id" uuid not null default gen_random_uuid(),
    "offer_id" uuid not null,
    "name" text not null,
    "description" text,
    "sort_order" integer not null default 0,
    "is_selected" boolean not null default true,
    "subtotal_net" numeric not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "scope_id" uuid,
    "variant_id" uuid,
    "parent_option_id" uuid,
    "is_upsell" boolean not null default false
      );


alter table "public"."offer_options" enable row level security;


  create table "public"."offer_product_categories" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "name" text not null,
    "sort_order" integer default 0,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_product_categories" enable row level security;


  create table "public"."offer_reminders" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "offer_id" uuid,
    "customer_id" uuid,
    "product_id" uuid,
    "customer_name" text not null,
    "customer_phone" text not null,
    "vehicle_info" text,
    "scheduled_date" date not null,
    "months_after" integer not null,
    "is_paid" boolean not null default true,
    "service_type" text not null,
    "service_name" text not null,
    "sms_template" text not null,
    "status" text not null default 'scheduled'::text,
    "sent_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "cancelled_reason" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."offer_reminders" enable row level security;


  create table "public"."offer_scope_extra_products" (
    "id" uuid not null default gen_random_uuid(),
    "extra_id" uuid not null,
    "instance_id" uuid not null,
    "product_id" uuid,
    "custom_name" text,
    "custom_description" text,
    "unit_price" numeric not null default 0,
    "quantity" numeric not null default 1,
    "unit" text not null default 'szt'::text,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_scope_extra_products" enable row level security;


  create table "public"."offer_scope_extras" (
    "id" uuid not null default gen_random_uuid(),
    "scope_id" uuid not null,
    "instance_id" uuid not null,
    "name" text not null,
    "description" text,
    "is_upsell" boolean not null default true,
    "sort_order" integer default 0,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_scope_extras" enable row level security;


  create table "public"."offer_scope_products" (
    "id" uuid not null default gen_random_uuid(),
    "scope_id" uuid not null,
    "product_id" uuid not null,
    "variant_name" text,
    "is_default" boolean not null default false,
    "sort_order" integer not null default 0,
    "instance_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_scope_products" enable row level security;


  create table "public"."offer_scope_variant_products" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "scope_id" uuid not null,
    "variant_id" uuid not null,
    "product_id" uuid,
    "custom_name" text,
    "custom_description" text,
    "quantity" numeric not null default 1,
    "unit" text not null default 'szt'::text,
    "unit_price" numeric not null default 0,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_scope_variant_products" enable row level security;


  create table "public"."offer_scope_variants" (
    "id" uuid not null default gen_random_uuid(),
    "scope_id" uuid not null,
    "variant_id" uuid not null,
    "instance_id" uuid not null,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_scope_variants" enable row level security;


  create table "public"."offer_scopes" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid,
    "name" text not null,
    "description" text,
    "sort_order" integer default 0,
    "active" boolean not null default true,
    "has_coating_upsell" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "is_extras_scope" boolean not null default false,
    "default_payment_terms" text,
    "default_notes" text,
    "default_warranty" text,
    "default_service_info" text,
    "short_name" text,
    "source" text not null default 'instance'::text,
    "has_unified_services" boolean default false,
    "price_from" numeric,
    "available_durations" integer[],
    "photo_urls" text[]
      );


alter table "public"."offer_scopes" enable row level security;


  create table "public"."offer_text_blocks" (
    "id" uuid not null default gen_random_uuid(),
    "offer_id" uuid not null,
    "block_id" uuid,
    "content" text not null,
    "block_type" text not null default 'general'::text,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_text_blocks" enable row level security;


  create table "public"."offer_variants" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "name" text not null,
    "description" text,
    "sort_order" integer default 0,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_variants" enable row level security;


  create table "public"."offer_views" (
    "id" uuid not null default gen_random_uuid(),
    "offer_id" uuid not null,
    "instance_id" uuid not null,
    "started_at" timestamp with time zone not null default now(),
    "duration_seconds" integer default 0,
    "is_admin_preview" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."offer_views" enable row level security;


  create table "public"."offers" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "offer_number" text not null,
    "public_token" text not null,
    "status" text not null default 'draft'::text,
    "customer_data" jsonb not null default '{}'::jsonb,
    "vehicle_data" jsonb,
    "total_net" numeric not null default 0,
    "total_gross" numeric not null default 0,
    "vat_rate" numeric not null default 23,
    "notes" text,
    "payment_terms" text,
    "valid_until" date,
    "sent_at" timestamp with time zone,
    "viewed_at" timestamp with time zone,
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "hide_unit_prices" boolean not null default false,
    "approved_at" timestamp with time zone,
    "approved_by" uuid,
    "selected_state" jsonb,
    "rejected_at" timestamp with time zone,
    "warranty" text,
    "service_info" text,
    "completed_at" timestamp with time zone,
    "completed_by" uuid,
    "has_unified_services" boolean default false,
    "admin_approved_net" numeric,
    "admin_approved_gross" numeric,
    "follow_up_phone_status" text,
    "budget_suggestion" numeric,
    "source" text default 'admin'::text,
    "paint_color" text,
    "paint_finish" text,
    "planned_date" date,
    "inquiry_notes" text,
    "widget_selected_extras" uuid[],
    "widget_duration_selections" jsonb,
    "internal_notes" text
      );


alter table "public"."offers" enable row level security;


  create table "public"."paint_colors" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "brand" text,
    "color_code" text,
    "paint_type" text not null default 'standard'::text,
    "color_family" text,
    "sort_order" integer default 0,
    "active" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."paint_colors" enable row level security;


  create table "public"."price_lists" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid,
    "name" text not null,
    "file_path" text not null,
    "file_type" text not null,
    "status" text not null default 'pending'::text,
    "products_count" integer default 0,
    "extracted_at" timestamp with time zone,
    "error_message" text,
    "is_global" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "salesperson_name" text,
    "salesperson_email" text,
    "salesperson_phone" text
      );


alter table "public"."price_lists" enable row level security;


  create table "public"."products_library" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid,
    "source" text not null default 'instance'::text,
    "name" text not null,
    "description" text,
    "category" text,
    "unit" text not null default 'szt'::text,
    "default_price" numeric not null default 0,
    "active" boolean not null default true,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "metadata" jsonb default '{}'::jsonb,
    "brand" text,
    "reminder_template_id" uuid,
    "default_validity_days" integer,
    "default_payment_terms" text,
    "default_warranty_terms" text,
    "default_service_info" text,
    "short_name" text
      );


alter table "public"."products_library" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "full_name" text,
    "phone" text,
    "instance_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "username" text,
    "is_blocked" boolean not null default false
      );


alter table "public"."profiles" enable row level security;


  create table "public"."protocol_damage_points" (
    "id" uuid not null default gen_random_uuid(),
    "protocol_id" uuid not null,
    "view" text not null,
    "x_percent" numeric not null,
    "y_percent" numeric not null,
    "damage_type" text,
    "custom_note" text,
    "photo_url" text,
    "created_at" timestamp with time zone not null default now(),
    "photo_urls" text[]
      );


alter table "public"."protocol_damage_points" enable row level security;


  create table "public"."push_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "instance_id" uuid,
    "endpoint" text not null,
    "p256dh" text not null,
    "auth" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."push_subscriptions" enable row level security;


  create table "public"."reminder_templates" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "name" text not null,
    "description" text,
    "sms_template" text not null default '{short_name}: Przypominamy o {service_type} dla {vehicle_info}. {paid_info}. Zadzwon: {reservation_phone}'::text,
    "items" jsonb not null default '[]'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."reminder_templates" enable row level security;


  create table "public"."reservation_changes" (
    "id" uuid not null default gen_random_uuid(),
    "reservation_id" uuid,
    "instance_id" uuid not null,
    "change_type" text not null,
    "field_name" text,
    "old_value" jsonb,
    "new_value" jsonb not null,
    "batch_id" uuid not null,
    "changed_by" uuid,
    "changed_by_username" text not null,
    "changed_by_type" text not null default 'admin'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."reservation_changes" enable row level security;


  create table "public"."reservation_events" (
    "id" uuid not null default gen_random_uuid(),
    "reservation_id" uuid,
    "event_type" text not null,
    "created_at" timestamp with time zone default now(),
    "instance_id" uuid
      );


alter table "public"."reservation_events" enable row level security;


  create table "public"."reservation_photos" (
    "id" uuid not null default gen_random_uuid(),
    "reservation_id" uuid,
    "instance_id" uuid not null,
    "photo_url" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."reservation_photos" enable row level security;


  create table "public"."reservations" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "service_id" uuid,
    "station_id" uuid,
    "customer_name" text not null,
    "customer_phone" text not null,
    "customer_email" text,
    "vehicle_plate" text not null,
    "car_size" public.car_size,
    "reservation_date" date not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "status" public.reservation_status default 'pending'::public.reservation_status,
    "confirmation_code" text not null,
    "price" numeric,
    "customer_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "end_date" date,
    "source" text default 'admin'::text,
    "service_ids" jsonb default '[]'::jsonb,
    "started_at" timestamp with time zone,
    "created_by" uuid,
    "confirmed_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "released_at" timestamp with time zone,
    "no_show_at" timestamp with time zone,
    "cancelled_by" uuid,
    "edited_by_customer_at" timestamp with time zone,
    "original_reservation_id" uuid,
    "change_request_note" text,
    "admin_notes" text,
    "reminder_1day_sent" boolean,
    "reminder_1hour_sent" boolean,
    "offer_number" text,
    "created_by_username" text,
    "confirmation_sms_sent_at" timestamp with time zone,
    "pickup_sms_sent_at" timestamp with time zone,
    "reminder_1hour_last_attempt_at" timestamp with time zone,
    "reminder_1day_last_attempt_at" timestamp with time zone,
    "reminder_failure_count" integer default 0,
    "reminder_permanent_failure" boolean default false,
    "reminder_failure_reason" text,
    "service_items" jsonb default '[]'::jsonb,
    "has_unified_services" boolean default false,
    "photo_urls" text[],
    "checked_service_ids" jsonb default '[]'::jsonb,
    "assigned_employee_ids" jsonb default '[]'::jsonb
      );


alter table "public"."reservations" enable row level security;


  create table "public"."sales_order_items" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "product_id" uuid,
    "name" text not null,
    "quantity" integer not null default 1,
    "price_net" numeric not null default 0,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "vehicle" text
      );


alter table "public"."sales_order_items" enable row level security;


  create table "public"."sales_orders" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "customer_id" uuid,
    "order_number" text not null,
    "customer_name" text not null,
    "city" text,
    "contact_person" text,
    "total_net" numeric not null default 0,
    "total_gross" numeric not null default 0,
    "currency" text not null default 'PLN'::text,
    "comment" text,
    "status" text not null default 'nowy'::text,
    "tracking_number" text,
    "shipped_at" timestamp with time zone,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "vehicle" text,
    "delivery_type" text default 'shipping'::text,
    "payment_method" text not null default 'cod'::text,
    "bank_account_number" text
      );


alter table "public"."sales_orders" enable row level security;


  create table "public"."sales_products" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "full_name" text not null,
    "short_name" text not null,
    "description" text,
    "price_net" numeric not null default 0,
    "price_unit" text not null default 'piece'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "category_id" uuid
      );


alter table "public"."sales_products" enable row level security;


  create table "public"."service_categories" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "name" text not null,
    "slug" text not null,
    "description" text,
    "sort_order" integer default 0,
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "prices_are_net" boolean not null default false
      );


alter table "public"."service_categories" enable row level security;


  create table "public"."services" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "category_id" uuid not null,
    "name" text not null,
    "description" text,
    "duration_minutes" integer default 60,
    "price_from" numeric,
    "price_small" numeric,
    "price_medium" numeric,
    "price_large" numeric,
    "requires_size" boolean default false,
    "station_type" public.station_type,
    "active" boolean default true,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "subcategory" text,
    "duration_small" integer,
    "duration_medium" integer,
    "duration_large" integer,
    "shortcut" text,
    "is_popular" boolean default false
      );


alter table "public"."services" enable row level security;


  create table "public"."sms_logs" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "phone" text not null,
    "message" text not null,
    "message_type" text not null,
    "sent_by" uuid,
    "reservation_id" uuid,
    "customer_id" uuid,
    "status" text not null default 'sent'::text,
    "error_message" text,
    "smsapi_response" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."sms_logs" enable row level security;


  create table "public"."sms_message_settings" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "message_type" text not null,
    "enabled" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "send_at_time" time without time zone
      );


alter table "public"."sms_message_settings" enable row level security;


  create table "public"."sms_verification_codes" (
    "id" uuid not null default gen_random_uuid(),
    "phone" text not null,
    "code" text not null,
    "instance_id" uuid not null,
    "reservation_data" jsonb not null,
    "expires_at" timestamp with time zone not null,
    "verified" boolean default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."sms_verification_codes" enable row level security;


  create table "public"."station_employees" (
    "id" uuid not null default gen_random_uuid(),
    "station_id" uuid not null,
    "employee_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."station_employees" enable row level security;


  create table "public"."stations" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "name" text not null,
    "type" public.station_type not null default 'universal'::public.station_type,
    "active" boolean default true,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "color" text
      );


alter table "public"."stations" enable row level security;


  create table "public"."subscription_plans" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "base_price" numeric not null,
    "price_per_station" numeric not null default 49,
    "sms_limit" integer not null default 100,
    "included_features" jsonb not null default '[]'::jsonb,
    "sort_order" integer default 0,
    "active" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."subscription_plans" enable row level security;


  create table "public"."text_blocks_library" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid,
    "source" text not null default 'instance'::text,
    "name" text not null,
    "content" text not null,
    "block_type" text not null default 'general'::text,
    "active" boolean not null default true,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."text_blocks_library" enable row level security;


  create table "public"."time_entries" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "employee_id" uuid not null,
    "entry_date" date not null,
    "entry_number" integer not null default 1,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "total_minutes" integer,
    "entry_type" text not null default 'startstop'::text,
    "is_auto_closed" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."time_entries" enable row level security;


  create table "public"."training_types" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "name" text not null,
    "duration_days" numeric not null default 1,
    "sort_order" integer default 0,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."training_types" enable row level security;


  create table "public"."trainings" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "training_type" text not null default 'individual'::public.training_type,
    "title" text not null,
    "description" text,
    "start_date" date not null,
    "end_date" date,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "station_id" uuid,
    "status" text not null default 'open'::text,
    "assigned_employee_ids" jsonb default '[]'::jsonb,
    "photo_urls" text[],
    "created_by" uuid,
    "created_by_username" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "training_type_id" uuid
      );


alter table "public"."trainings" enable row level security;


  create table "public"."unified_categories" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "category_type" text not null,
    "name" text not null,
    "slug" text,
    "description" text,
    "sort_order" integer default 0,
    "prices_are_net" boolean default false,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "active" boolean default true
      );


alter table "public"."unified_categories" enable row level security;


  create table "public"."unified_services" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "category_id" uuid,
    "name" text not null,
    "short_name" text,
    "description" text,
    "price_small" numeric,
    "price_medium" numeric,
    "price_large" numeric,
    "default_price" numeric default 0,
    "duration_small" integer,
    "duration_medium" integer,
    "duration_large" integer,
    "requires_size" boolean default false,
    "is_popular" boolean default false,
    "prices_are_net" boolean default false,
    "active" boolean default true,
    "default_validity_days" integer,
    "default_payment_terms" text,
    "default_warranty_terms" text,
    "default_service_info" text,
    "sort_order" integer default 0,
    "unit" text default 'szt'::text,
    "metadata" jsonb default '{}'::jsonb,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "shortcut" text,
    "price_from" numeric,
    "duration_minutes" integer,
    "station_type" text default 'washing'::text,
    "service_type" text default 'reservation'::text,
    "reminder_template_id" uuid,
    "visibility" text default 'everywhere'::text,
    "photo_urls" text[]
      );


alter table "public"."unified_services" enable row level security;


  create table "public"."user_roles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "role" public.app_role not null default 'user'::public.app_role,
    "instance_id" uuid,
    "hall_id" uuid
      );


alter table "public"."user_roles" enable row level security;


  create table "public"."vehicle_protocols" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "offer_id" uuid,
    "offer_number" text,
    "customer_name" text not null,
    "vehicle_model" text,
    "nip" text,
    "phone" text,
    "registration_number" text,
    "fuel_level" integer,
    "odometer_reading" integer,
    "body_type" text not null default 'sedan'::text,
    "protocol_date" date not null default CURRENT_DATE,
    "received_by" text,
    "customer_signature" text,
    "status" text not null default 'draft'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "protocol_time" time without time zone,
    "public_token" text not null,
    "customer_email" text,
    "protocol_type" text not null default 'reception'::text,
    "notes" text,
    "photo_urls" text[] default '{}'::text[],
    "reservation_id" uuid
      );


alter table "public"."vehicle_protocols" enable row level security;


  create table "public"."workers_settings" (
    "instance_id" uuid not null,
    "start_stop_enabled" boolean not null default false,
    "breaks_enabled" boolean not null default false,
    "overtime_enabled" boolean not null default false,
    "standard_hours_per_day" integer not null default 8,
    "report_frequency" text default 'monthly'::text,
    "report_email" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "time_calculation_mode" text not null default 'start_to_stop'::text
      );


alter table "public"."workers_settings" enable row level security;


  create table "public"."yard_vehicles" (
    "id" uuid not null default gen_random_uuid(),
    "instance_id" uuid not null,
    "customer_name" text not null,
    "customer_phone" text not null,
    "vehicle_plate" text not null,
    "car_size" public.car_size,
    "service_ids" jsonb default '[]'::jsonb,
    "arrival_date" date not null default CURRENT_DATE,
    "deadline_time" time without time zone,
    "notes" text,
    "status" text not null default 'waiting'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "pickup_date" date
      );


alter table "public"."yard_vehicles" enable row level security;

CREATE UNIQUE INDEX breaks_pkey ON public.breaks USING btree (id);

CREATE UNIQUE INDEX car_models_brand_name_key ON public.car_models USING btree (brand, name);

CREATE UNIQUE INDEX car_models_pkey ON public.car_models USING btree (id);

CREATE UNIQUE INDEX closed_days_instance_id_closed_date_key ON public.closed_days USING btree (instance_id, closed_date);

CREATE UNIQUE INDEX closed_days_pkey ON public.closed_days USING btree (id);

CREATE UNIQUE INDEX customer_reminders_instance_id_customer_phone_vehicle_plate_key ON public.customer_reminders USING btree (instance_id, customer_phone, vehicle_plate, reminder_template_id, months_after);

CREATE UNIQUE INDEX customer_reminders_pkey ON public.customer_reminders USING btree (id);

CREATE UNIQUE INDEX customer_vehicles_pkey ON public.customer_vehicles USING btree (id);

CREATE UNIQUE INDEX customers_instance_id_source_phone_key ON public.customers USING btree (instance_id, source, phone);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX employee_breaks_pkey ON public.employee_breaks USING btree (id);

CREATE UNIQUE INDEX employee_days_off_pkey ON public.employee_days_off USING btree (id);

CREATE UNIQUE INDEX employee_edit_logs_pkey ON public.employee_edit_logs USING btree (id);

CREATE UNIQUE INDEX employee_permissions_instance_id_user_id_feature_key_key ON public.employee_permissions USING btree (instance_id, user_id, feature_key);

CREATE UNIQUE INDEX employee_permissions_pkey ON public.employee_permissions USING btree (id);

CREATE UNIQUE INDEX employees_pkey ON public.employees USING btree (id);

CREATE UNIQUE INDEX followup_events_pkey ON public.followup_events USING btree (id);

CREATE UNIQUE INDEX followup_services_pkey ON public.followup_services USING btree (id);

CREATE UNIQUE INDEX followup_tasks_pkey ON public.followup_tasks USING btree (id);

CREATE UNIQUE INDEX halls_pkey ON public.halls USING btree (id);

CREATE INDEX idx_breaks_employee_date ON public.employee_breaks USING btree (employee_id, break_date);

CREATE INDEX idx_breaks_instance_date ON public.breaks USING btree (instance_id, break_date);

CREATE INDEX idx_breaks_station ON public.breaks USING btree (station_id);

CREATE INDEX idx_car_models_active ON public.car_models USING btree (active) WHERE (active = true);

CREATE INDEX idx_car_models_brand ON public.car_models USING btree (brand);

CREATE INDEX idx_car_models_brand_search ON public.car_models USING gin (brand extensions.gin_trgm_ops);

CREATE INDEX idx_car_models_name_search ON public.car_models USING gin (name extensions.gin_trgm_ops);

CREATE INDEX idx_car_models_status ON public.car_models USING btree (status);

CREATE INDEX idx_customer_reminders_instance_status ON public.customer_reminders USING btree (instance_id, status);

CREATE INDEX idx_customer_reminders_phone ON public.customer_reminders USING btree (customer_phone);

CREATE INDEX idx_customer_reminders_scheduled_date ON public.customer_reminders USING btree (scheduled_date);

CREATE INDEX idx_customer_vehicles_instance_phone ON public.customer_vehicles USING btree (instance_id, phone);

CREATE UNIQUE INDEX idx_customer_vehicles_unique ON public.customer_vehicles USING btree (instance_id, phone, model);

CREATE INDEX idx_customers_phone_instance ON public.customers USING btree (phone, instance_id);

CREATE INDEX idx_customers_source ON public.customers USING btree (instance_id, source);

CREATE INDEX idx_days_off_employee ON public.employee_days_off USING btree (employee_id, date_from, date_to);

CREATE INDEX idx_edit_logs_entity ON public.employee_edit_logs USING btree (entity_type, entity_id);

CREATE INDEX idx_employees_active_not_deleted ON public.employees USING btree (instance_id, active) WHERE (deleted_at IS NULL);

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (instance_id) WHERE (read = false);

CREATE INDEX idx_offer_option_items_option_id ON public.offer_option_items USING btree (option_id);

CREATE INDEX idx_offer_options_offer_id ON public.offer_options USING btree (offer_id);

CREATE INDEX idx_offer_options_scope_id ON public.offer_options USING btree (scope_id);

CREATE INDEX idx_offers_instance ON public.offers USING btree (instance_id);

CREATE INDEX idx_offers_instance_id ON public.offers USING btree (instance_id);

CREATE INDEX idx_offers_public_token ON public.offers USING btree (public_token);

CREATE INDEX idx_offers_token ON public.offers USING btree (public_token);

CREATE INDEX idx_reservations_confirmation_code ON public.reservations USING btree (confirmation_code);

CREATE INDEX idx_reservations_instance_date ON public.reservations USING btree (instance_id, reservation_date);

CREATE INDEX idx_reservations_instance_status ON public.reservations USING btree (instance_id, status);

CREATE INDEX idx_sms_logs_instance ON public.sms_logs USING btree (instance_id, created_at);

CREATE UNIQUE INDEX instance_features_pkey ON public.instance_features USING btree (instance_id, feature_key);

CREATE UNIQUE INDEX instance_subscriptions_instance_id_key ON public.instance_subscriptions USING btree (instance_id);

CREATE UNIQUE INDEX instance_subscriptions_pkey ON public.instance_subscriptions USING btree (id);

CREATE UNIQUE INDEX instances_pkey ON public.instances USING btree (id);

CREATE UNIQUE INDEX login_attempts_pkey ON public.login_attempts USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX offer_history_pkey ON public.offer_history USING btree (id);

CREATE UNIQUE INDEX offer_option_items_pkey ON public.offer_option_items USING btree (id);

CREATE UNIQUE INDEX offer_options_pkey ON public.offer_options USING btree (id);

CREATE UNIQUE INDEX offer_product_categories_pkey ON public.offer_product_categories USING btree (id);

CREATE UNIQUE INDEX offer_reminders_pkey ON public.offer_reminders USING btree (id);

CREATE UNIQUE INDEX offer_scope_extra_products_pkey ON public.offer_scope_extra_products USING btree (id);

CREATE UNIQUE INDEX offer_scope_extras_pkey ON public.offer_scope_extras USING btree (id);

CREATE UNIQUE INDEX offer_scope_products_pkey ON public.offer_scope_products USING btree (id);

CREATE UNIQUE INDEX offer_scope_variant_products_pkey ON public.offer_scope_variant_products USING btree (id);

CREATE UNIQUE INDEX offer_scope_variants_pkey ON public.offer_scope_variants USING btree (id);

CREATE UNIQUE INDEX offer_scopes_pkey ON public.offer_scopes USING btree (id);

CREATE UNIQUE INDEX offer_text_blocks_pkey ON public.offer_text_blocks USING btree (id);

CREATE UNIQUE INDEX offer_variants_pkey ON public.offer_variants USING btree (id);

CREATE UNIQUE INDEX offer_views_pkey ON public.offer_views USING btree (id);

CREATE UNIQUE INDEX offers_pkey ON public.offers USING btree (id);

CREATE UNIQUE INDEX paint_colors_pkey ON public.paint_colors USING btree (id);

CREATE UNIQUE INDEX price_lists_pkey ON public.price_lists USING btree (id);

CREATE UNIQUE INDEX products_library_pkey ON public.products_library USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX protocol_damage_points_pkey ON public.protocol_damage_points USING btree (id);

CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id);

CREATE UNIQUE INDEX reminder_templates_pkey ON public.reminder_templates USING btree (id);

CREATE UNIQUE INDEX reservation_changes_pkey ON public.reservation_changes USING btree (id);

CREATE UNIQUE INDEX reservation_events_pkey ON public.reservation_events USING btree (id);

CREATE UNIQUE INDEX reservation_photos_pkey ON public.reservation_photos USING btree (id);

CREATE UNIQUE INDEX reservations_pkey ON public.reservations USING btree (id);

CREATE UNIQUE INDEX sales_order_items_pkey ON public.sales_order_items USING btree (id);

CREATE UNIQUE INDEX sales_orders_pkey ON public.sales_orders USING btree (id);

CREATE UNIQUE INDEX sales_products_pkey ON public.sales_products USING btree (id);

CREATE UNIQUE INDEX service_categories_pkey ON public.service_categories USING btree (id);

CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);

CREATE UNIQUE INDEX sms_logs_pkey ON public.sms_logs USING btree (id);

CREATE UNIQUE INDEX sms_message_settings_pkey ON public.sms_message_settings USING btree (id);

CREATE UNIQUE INDEX sms_verification_codes_pkey ON public.sms_verification_codes USING btree (id);

CREATE UNIQUE INDEX station_employees_pkey ON public.station_employees USING btree (id);

CREATE UNIQUE INDEX stations_pkey ON public.stations USING btree (id);

CREATE UNIQUE INDEX subscription_plans_pkey ON public.subscription_plans USING btree (id);

CREATE UNIQUE INDEX text_blocks_library_pkey ON public.text_blocks_library USING btree (id);

CREATE UNIQUE INDEX time_entries_pkey ON public.time_entries USING btree (id);

CREATE UNIQUE INDEX training_types_pkey ON public.training_types USING btree (id);

CREATE UNIQUE INDEX trainings_pkey ON public.trainings USING btree (id);

CREATE UNIQUE INDEX unified_categories_pkey ON public.unified_categories USING btree (id);

CREATE UNIQUE INDEX unified_services_pkey ON public.unified_services USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX vehicle_protocols_pkey ON public.vehicle_protocols USING btree (id);

CREATE UNIQUE INDEX workers_settings_pkey ON public.workers_settings USING btree (instance_id);

CREATE UNIQUE INDEX yard_vehicles_pkey ON public.yard_vehicles USING btree (id);

alter table "public"."breaks" add constraint "breaks_pkey" PRIMARY KEY using index "breaks_pkey";

alter table "public"."car_models" add constraint "car_models_pkey" PRIMARY KEY using index "car_models_pkey";

alter table "public"."closed_days" add constraint "closed_days_pkey" PRIMARY KEY using index "closed_days_pkey";

alter table "public"."customer_reminders" add constraint "customer_reminders_pkey" PRIMARY KEY using index "customer_reminders_pkey";

alter table "public"."customer_vehicles" add constraint "customer_vehicles_pkey" PRIMARY KEY using index "customer_vehicles_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."employee_breaks" add constraint "employee_breaks_pkey" PRIMARY KEY using index "employee_breaks_pkey";

alter table "public"."employee_days_off" add constraint "employee_days_off_pkey" PRIMARY KEY using index "employee_days_off_pkey";

alter table "public"."employee_edit_logs" add constraint "employee_edit_logs_pkey" PRIMARY KEY using index "employee_edit_logs_pkey";

alter table "public"."employee_permissions" add constraint "employee_permissions_pkey" PRIMARY KEY using index "employee_permissions_pkey";

alter table "public"."employees" add constraint "employees_pkey" PRIMARY KEY using index "employees_pkey";

alter table "public"."followup_events" add constraint "followup_events_pkey" PRIMARY KEY using index "followup_events_pkey";

alter table "public"."followup_services" add constraint "followup_services_pkey" PRIMARY KEY using index "followup_services_pkey";

alter table "public"."followup_tasks" add constraint "followup_tasks_pkey" PRIMARY KEY using index "followup_tasks_pkey";

alter table "public"."halls" add constraint "halls_pkey" PRIMARY KEY using index "halls_pkey";

alter table "public"."instance_features" add constraint "instance_features_pkey" PRIMARY KEY using index "instance_features_pkey";

alter table "public"."instance_subscriptions" add constraint "instance_subscriptions_pkey" PRIMARY KEY using index "instance_subscriptions_pkey";

alter table "public"."instances" add constraint "instances_pkey" PRIMARY KEY using index "instances_pkey";

alter table "public"."login_attempts" add constraint "login_attempts_pkey" PRIMARY KEY using index "login_attempts_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."offer_history" add constraint "offer_history_pkey" PRIMARY KEY using index "offer_history_pkey";

alter table "public"."offer_option_items" add constraint "offer_option_items_pkey" PRIMARY KEY using index "offer_option_items_pkey";

alter table "public"."offer_options" add constraint "offer_options_pkey" PRIMARY KEY using index "offer_options_pkey";

alter table "public"."offer_product_categories" add constraint "offer_product_categories_pkey" PRIMARY KEY using index "offer_product_categories_pkey";

alter table "public"."offer_reminders" add constraint "offer_reminders_pkey" PRIMARY KEY using index "offer_reminders_pkey";

alter table "public"."offer_scope_extra_products" add constraint "offer_scope_extra_products_pkey" PRIMARY KEY using index "offer_scope_extra_products_pkey";

alter table "public"."offer_scope_extras" add constraint "offer_scope_extras_pkey" PRIMARY KEY using index "offer_scope_extras_pkey";

alter table "public"."offer_scope_products" add constraint "offer_scope_products_pkey" PRIMARY KEY using index "offer_scope_products_pkey";

alter table "public"."offer_scope_variant_products" add constraint "offer_scope_variant_products_pkey" PRIMARY KEY using index "offer_scope_variant_products_pkey";

alter table "public"."offer_scope_variants" add constraint "offer_scope_variants_pkey" PRIMARY KEY using index "offer_scope_variants_pkey";

alter table "public"."offer_scopes" add constraint "offer_scopes_pkey" PRIMARY KEY using index "offer_scopes_pkey";

alter table "public"."offer_text_blocks" add constraint "offer_text_blocks_pkey" PRIMARY KEY using index "offer_text_blocks_pkey";

alter table "public"."offer_variants" add constraint "offer_variants_pkey" PRIMARY KEY using index "offer_variants_pkey";

alter table "public"."offer_views" add constraint "offer_views_pkey" PRIMARY KEY using index "offer_views_pkey";

alter table "public"."offers" add constraint "offers_pkey" PRIMARY KEY using index "offers_pkey";

alter table "public"."paint_colors" add constraint "paint_colors_pkey" PRIMARY KEY using index "paint_colors_pkey";

alter table "public"."price_lists" add constraint "price_lists_pkey" PRIMARY KEY using index "price_lists_pkey";

alter table "public"."products_library" add constraint "products_library_pkey" PRIMARY KEY using index "products_library_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."protocol_damage_points" add constraint "protocol_damage_points_pkey" PRIMARY KEY using index "protocol_damage_points_pkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_pkey" PRIMARY KEY using index "push_subscriptions_pkey";

alter table "public"."reminder_templates" add constraint "reminder_templates_pkey" PRIMARY KEY using index "reminder_templates_pkey";

alter table "public"."reservation_changes" add constraint "reservation_changes_pkey" PRIMARY KEY using index "reservation_changes_pkey";

alter table "public"."reservation_events" add constraint "reservation_events_pkey" PRIMARY KEY using index "reservation_events_pkey";

alter table "public"."reservation_photos" add constraint "reservation_photos_pkey" PRIMARY KEY using index "reservation_photos_pkey";

alter table "public"."reservations" add constraint "reservations_pkey" PRIMARY KEY using index "reservations_pkey";

alter table "public"."sales_order_items" add constraint "sales_order_items_pkey" PRIMARY KEY using index "sales_order_items_pkey";

alter table "public"."sales_orders" add constraint "sales_orders_pkey" PRIMARY KEY using index "sales_orders_pkey";

alter table "public"."sales_products" add constraint "sales_products_pkey" PRIMARY KEY using index "sales_products_pkey";

alter table "public"."service_categories" add constraint "service_categories_pkey" PRIMARY KEY using index "service_categories_pkey";

alter table "public"."services" add constraint "services_pkey" PRIMARY KEY using index "services_pkey";

alter table "public"."sms_logs" add constraint "sms_logs_pkey" PRIMARY KEY using index "sms_logs_pkey";

alter table "public"."sms_message_settings" add constraint "sms_message_settings_pkey" PRIMARY KEY using index "sms_message_settings_pkey";

alter table "public"."sms_verification_codes" add constraint "sms_verification_codes_pkey" PRIMARY KEY using index "sms_verification_codes_pkey";

alter table "public"."station_employees" add constraint "station_employees_pkey" PRIMARY KEY using index "station_employees_pkey";

alter table "public"."stations" add constraint "stations_pkey" PRIMARY KEY using index "stations_pkey";

alter table "public"."subscription_plans" add constraint "subscription_plans_pkey" PRIMARY KEY using index "subscription_plans_pkey";

alter table "public"."text_blocks_library" add constraint "text_blocks_library_pkey" PRIMARY KEY using index "text_blocks_library_pkey";

alter table "public"."time_entries" add constraint "time_entries_pkey" PRIMARY KEY using index "time_entries_pkey";

alter table "public"."training_types" add constraint "training_types_pkey" PRIMARY KEY using index "training_types_pkey";

alter table "public"."trainings" add constraint "trainings_pkey" PRIMARY KEY using index "trainings_pkey";

alter table "public"."unified_categories" add constraint "unified_categories_pkey" PRIMARY KEY using index "unified_categories_pkey";

alter table "public"."unified_services" add constraint "unified_services_pkey" PRIMARY KEY using index "unified_services_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."vehicle_protocols" add constraint "vehicle_protocols_pkey" PRIMARY KEY using index "vehicle_protocols_pkey";

alter table "public"."workers_settings" add constraint "workers_settings_pkey" PRIMARY KEY using index "workers_settings_pkey";

alter table "public"."yard_vehicles" add constraint "yard_vehicles_pkey" PRIMARY KEY using index "yard_vehicles_pkey";

alter table "public"."breaks" add constraint "breaks_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."breaks" validate constraint "breaks_instance_id_fkey";

alter table "public"."breaks" add constraint "breaks_station_id_fkey" FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE not valid;

alter table "public"."breaks" validate constraint "breaks_station_id_fkey";

alter table "public"."car_models" add constraint "car_models_brand_name_key" UNIQUE using index "car_models_brand_name_key";

alter table "public"."car_models" add constraint "car_models_size_check" CHECK ((size = ANY (ARRAY['S'::text, 'M'::text, 'L'::text]))) not valid;

alter table "public"."car_models" validate constraint "car_models_size_check";

alter table "public"."closed_days" add constraint "closed_days_instance_id_closed_date_key" UNIQUE using index "closed_days_instance_id_closed_date_key";

alter table "public"."closed_days" add constraint "closed_days_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."closed_days" validate constraint "closed_days_instance_id_fkey";

alter table "public"."customer_reminders" add constraint "customer_reminders_instance_id_customer_phone_vehicle_plate_key" UNIQUE using index "customer_reminders_instance_id_customer_phone_vehicle_plate_key";

alter table "public"."customer_reminders" add constraint "customer_reminders_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."customer_reminders" validate constraint "customer_reminders_instance_id_fkey";

alter table "public"."customer_reminders" add constraint "customer_reminders_reminder_template_id_fkey" FOREIGN KEY (reminder_template_id) REFERENCES public.reminder_templates(id) ON DELETE CASCADE not valid;

alter table "public"."customer_reminders" validate constraint "customer_reminders_reminder_template_id_fkey";

alter table "public"."customer_reminders" add constraint "customer_reminders_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE SET NULL not valid;

alter table "public"."customer_reminders" validate constraint "customer_reminders_reservation_id_fkey";

alter table "public"."customer_vehicles" add constraint "customer_vehicles_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE not valid;

alter table "public"."customer_vehicles" validate constraint "customer_vehicles_customer_id_fkey";

alter table "public"."customer_vehicles" add constraint "customer_vehicles_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."customer_vehicles" validate constraint "customer_vehicles_instance_id_fkey";

alter table "public"."customers" add constraint "customers_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."customers" validate constraint "customers_instance_id_fkey";

alter table "public"."customers" add constraint "customers_instance_id_source_phone_key" UNIQUE using index "customers_instance_id_source_phone_key";

alter table "public"."employee_breaks" add constraint "employee_breaks_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."employee_breaks" validate constraint "employee_breaks_employee_id_fkey";

alter table "public"."employee_breaks" add constraint "employee_breaks_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."employee_breaks" validate constraint "employee_breaks_instance_id_fkey";

alter table "public"."employee_days_off" add constraint "employee_days_off_check" CHECK ((date_to >= date_from)) not valid;

alter table "public"."employee_days_off" validate constraint "employee_days_off_check";

alter table "public"."employee_days_off" add constraint "employee_days_off_day_off_type_check" CHECK ((day_off_type = ANY (ARRAY['vacation'::text, 'day_off'::text]))) not valid;

alter table "public"."employee_days_off" validate constraint "employee_days_off_day_off_type_check";

alter table "public"."employee_days_off" add constraint "employee_days_off_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."employee_days_off" validate constraint "employee_days_off_employee_id_fkey";

alter table "public"."employee_days_off" add constraint "employee_days_off_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."employee_days_off" validate constraint "employee_days_off_instance_id_fkey";

alter table "public"."employee_edit_logs" add constraint "employee_edit_logs_entity_type_check" CHECK ((entity_type = ANY (ARRAY['employee'::text, 'time_entry'::text]))) not valid;

alter table "public"."employee_edit_logs" validate constraint "employee_edit_logs_entity_type_check";

alter table "public"."employee_edit_logs" add constraint "employee_edit_logs_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."employee_edit_logs" validate constraint "employee_edit_logs_instance_id_fkey";

alter table "public"."employee_permissions" add constraint "employee_permissions_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."employee_permissions" validate constraint "employee_permissions_instance_id_fkey";

alter table "public"."employee_permissions" add constraint "employee_permissions_instance_id_user_id_feature_key_key" UNIQUE using index "employee_permissions_instance_id_user_id_feature_key_key";

alter table "public"."employees" add constraint "employees_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."employees" validate constraint "employees_instance_id_fkey";

alter table "public"."followup_events" add constraint "followup_events_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."followup_events" validate constraint "followup_events_customer_id_fkey";

alter table "public"."followup_events" add constraint "followup_events_followup_service_id_fkey" FOREIGN KEY (followup_service_id) REFERENCES public.followup_services(id) not valid;

alter table "public"."followup_events" validate constraint "followup_events_followup_service_id_fkey";

alter table "public"."followup_events" add constraint "followup_events_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."followup_events" validate constraint "followup_events_instance_id_fkey";

alter table "public"."followup_services" add constraint "followup_services_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."followup_services" validate constraint "followup_services_instance_id_fkey";

alter table "public"."followup_tasks" add constraint "followup_tasks_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.followup_events(id) ON DELETE CASCADE not valid;

alter table "public"."followup_tasks" validate constraint "followup_tasks_event_id_fkey";

alter table "public"."followup_tasks" add constraint "followup_tasks_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."followup_tasks" validate constraint "followup_tasks_instance_id_fkey";

alter table "public"."halls" add constraint "halls_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."halls" validate constraint "halls_instance_id_fkey";

alter table "public"."instance_features" add constraint "instance_features_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."instance_features" validate constraint "instance_features_instance_id_fkey";

alter table "public"."instance_subscriptions" add constraint "instance_subscriptions_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."instance_subscriptions" validate constraint "instance_subscriptions_instance_id_fkey";

alter table "public"."instance_subscriptions" add constraint "instance_subscriptions_instance_id_key" UNIQUE using index "instance_subscriptions_instance_id_key";

alter table "public"."instance_subscriptions" add constraint "instance_subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) not valid;

alter table "public"."instance_subscriptions" validate constraint "instance_subscriptions_plan_id_fkey";

alter table "public"."login_attempts" add constraint "login_attempts_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."login_attempts" validate constraint "login_attempts_instance_id_fkey";

alter table "public"."login_attempts" add constraint "login_attempts_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) not valid;

alter table "public"."login_attempts" validate constraint "login_attempts_profile_id_fkey";

alter table "public"."notifications" add constraint "notifications_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_instance_id_fkey";

alter table "public"."offer_history" add constraint "offer_history_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE not valid;

alter table "public"."offer_history" validate constraint "offer_history_offer_id_fkey";

alter table "public"."offer_option_items" add constraint "offer_option_items_option_id_fkey" FOREIGN KEY (option_id) REFERENCES public.offer_options(id) ON DELETE CASCADE not valid;

alter table "public"."offer_option_items" validate constraint "offer_option_items_option_id_fkey";

alter table "public"."offer_option_items" add constraint "offer_option_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.unified_services(id) not valid;

alter table "public"."offer_option_items" validate constraint "offer_option_items_product_id_fkey";

alter table "public"."offer_options" add constraint "offer_options_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE not valid;

alter table "public"."offer_options" validate constraint "offer_options_offer_id_fkey";

alter table "public"."offer_options" add constraint "offer_options_parent_option_id_fkey" FOREIGN KEY (parent_option_id) REFERENCES public.offer_options(id) not valid;

alter table "public"."offer_options" validate constraint "offer_options_parent_option_id_fkey";

alter table "public"."offer_options" add constraint "offer_options_scope_id_fkey" FOREIGN KEY (scope_id) REFERENCES public.offer_scopes(id) not valid;

alter table "public"."offer_options" validate constraint "offer_options_scope_id_fkey";

alter table "public"."offer_options" add constraint "offer_options_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.offer_variants(id) not valid;

alter table "public"."offer_options" validate constraint "offer_options_variant_id_fkey";

alter table "public"."offer_product_categories" add constraint "offer_product_categories_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_product_categories" validate constraint "offer_product_categories_instance_id_fkey";

alter table "public"."offer_reminders" add constraint "offer_reminders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."offer_reminders" validate constraint "offer_reminders_customer_id_fkey";

alter table "public"."offer_reminders" add constraint "offer_reminders_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_reminders" validate constraint "offer_reminders_instance_id_fkey";

alter table "public"."offer_reminders" add constraint "offer_reminders_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE not valid;

alter table "public"."offer_reminders" validate constraint "offer_reminders_offer_id_fkey";

alter table "public"."offer_reminders" add constraint "offer_reminders_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.unified_services(id) not valid;

alter table "public"."offer_reminders" validate constraint "offer_reminders_product_id_fkey";

alter table "public"."offer_scope_extra_products" add constraint "offer_scope_extra_products_extra_id_fkey" FOREIGN KEY (extra_id) REFERENCES public.offer_scope_extras(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_extra_products" validate constraint "offer_scope_extra_products_extra_id_fkey";

alter table "public"."offer_scope_extra_products" add constraint "offer_scope_extra_products_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_extra_products" validate constraint "offer_scope_extra_products_instance_id_fkey";

alter table "public"."offer_scope_extra_products" add constraint "offer_scope_extra_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.unified_services(id) not valid;

alter table "public"."offer_scope_extra_products" validate constraint "offer_scope_extra_products_product_id_fkey";

alter table "public"."offer_scope_extras" add constraint "offer_scope_extras_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_extras" validate constraint "offer_scope_extras_instance_id_fkey";

alter table "public"."offer_scope_extras" add constraint "offer_scope_extras_scope_id_fkey" FOREIGN KEY (scope_id) REFERENCES public.offer_scopes(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_extras" validate constraint "offer_scope_extras_scope_id_fkey";

alter table "public"."offer_scope_products" add constraint "offer_scope_products_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_products" validate constraint "offer_scope_products_instance_id_fkey";

alter table "public"."offer_scope_products" add constraint "offer_scope_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.unified_services(id) not valid;

alter table "public"."offer_scope_products" validate constraint "offer_scope_products_product_id_fkey";

alter table "public"."offer_scope_products" add constraint "offer_scope_products_scope_id_fkey" FOREIGN KEY (scope_id) REFERENCES public.offer_scopes(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_products" validate constraint "offer_scope_products_scope_id_fkey";

alter table "public"."offer_scope_variant_products" add constraint "offer_scope_variant_products_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_variant_products" validate constraint "offer_scope_variant_products_instance_id_fkey";

alter table "public"."offer_scope_variant_products" add constraint "offer_scope_variant_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.unified_services(id) not valid;

alter table "public"."offer_scope_variant_products" validate constraint "offer_scope_variant_products_product_id_fkey";

alter table "public"."offer_scope_variant_products" add constraint "offer_scope_variant_products_scope_id_fkey" FOREIGN KEY (scope_id) REFERENCES public.offer_scopes(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_variant_products" validate constraint "offer_scope_variant_products_scope_id_fkey";

alter table "public"."offer_scope_variant_products" add constraint "offer_scope_variant_products_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.offer_variants(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_variant_products" validate constraint "offer_scope_variant_products_variant_id_fkey";

alter table "public"."offer_scope_variants" add constraint "offer_scope_variants_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_variants" validate constraint "offer_scope_variants_instance_id_fkey";

alter table "public"."offer_scope_variants" add constraint "offer_scope_variants_scope_id_fkey" FOREIGN KEY (scope_id) REFERENCES public.offer_scopes(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_variants" validate constraint "offer_scope_variants_scope_id_fkey";

alter table "public"."offer_scope_variants" add constraint "offer_scope_variants_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.offer_variants(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scope_variants" validate constraint "offer_scope_variants_variant_id_fkey";

alter table "public"."offer_scopes" add constraint "offer_scopes_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_scopes" validate constraint "offer_scopes_instance_id_fkey";

alter table "public"."offer_text_blocks" add constraint "offer_text_blocks_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE not valid;

alter table "public"."offer_text_blocks" validate constraint "offer_text_blocks_offer_id_fkey";

alter table "public"."offer_variants" add constraint "offer_variants_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_variants" validate constraint "offer_variants_instance_id_fkey";

alter table "public"."offer_views" add constraint "offer_views_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offer_views" validate constraint "offer_views_instance_id_fkey";

alter table "public"."offer_views" add constraint "offer_views_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE not valid;

alter table "public"."offer_views" validate constraint "offer_views_offer_id_fkey";

alter table "public"."offers" add constraint "offers_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."offers" validate constraint "offers_instance_id_fkey";

alter table "public"."price_lists" add constraint "price_lists_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) not valid;

alter table "public"."price_lists" validate constraint "price_lists_instance_id_fkey";

alter table "public"."products_library" add constraint "products_library_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) not valid;

alter table "public"."products_library" validate constraint "products_library_instance_id_fkey";

alter table "public"."products_library" add constraint "products_library_reminder_template_id_fkey" FOREIGN KEY (reminder_template_id) REFERENCES public.reminder_templates(id) not valid;

alter table "public"."products_library" validate constraint "products_library_reminder_template_id_fkey";

alter table "public"."profiles" add constraint "profiles_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) not valid;

alter table "public"."profiles" validate constraint "profiles_instance_id_fkey";

alter table "public"."protocol_damage_points" add constraint "protocol_damage_points_protocol_id_fkey" FOREIGN KEY (protocol_id) REFERENCES public.vehicle_protocols(id) ON DELETE CASCADE not valid;

alter table "public"."protocol_damage_points" validate constraint "protocol_damage_points_protocol_id_fkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) not valid;

alter table "public"."push_subscriptions" validate constraint "push_subscriptions_instance_id_fkey";

alter table "public"."reminder_templates" add constraint "reminder_templates_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."reminder_templates" validate constraint "reminder_templates_instance_id_fkey";

alter table "public"."reservation_changes" add constraint "reservation_changes_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."reservation_changes" validate constraint "reservation_changes_instance_id_fkey";

alter table "public"."reservation_changes" add constraint "reservation_changes_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE not valid;

alter table "public"."reservation_changes" validate constraint "reservation_changes_reservation_id_fkey";

alter table "public"."reservation_events" add constraint "reservation_events_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) not valid;

alter table "public"."reservation_events" validate constraint "reservation_events_instance_id_fkey";

alter table "public"."reservation_events" add constraint "reservation_events_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE not valid;

alter table "public"."reservation_events" validate constraint "reservation_events_reservation_id_fkey";

alter table "public"."reservation_photos" add constraint "reservation_photos_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."reservation_photos" validate constraint "reservation_photos_instance_id_fkey";

alter table "public"."reservation_photos" add constraint "reservation_photos_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE not valid;

alter table "public"."reservation_photos" validate constraint "reservation_photos_reservation_id_fkey";

alter table "public"."reservations" add constraint "reservations_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."reservations" validate constraint "reservations_instance_id_fkey";

alter table "public"."reservations" add constraint "reservations_service_id_fkey" FOREIGN KEY (service_id) REFERENCES public.services(id) not valid;

alter table "public"."reservations" validate constraint "reservations_service_id_fkey";

alter table "public"."reservations" add constraint "reservations_station_id_fkey" FOREIGN KEY (station_id) REFERENCES public.stations(id) not valid;

alter table "public"."reservations" validate constraint "reservations_station_id_fkey";

alter table "public"."sales_order_items" add constraint "sales_order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.sales_orders(id) ON DELETE CASCADE not valid;

alter table "public"."sales_order_items" validate constraint "sales_order_items_order_id_fkey";

alter table "public"."sales_order_items" add constraint "sales_order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.sales_products(id) not valid;

alter table "public"."sales_order_items" validate constraint "sales_order_items_product_id_fkey";

alter table "public"."sales_orders" add constraint "sales_orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."sales_orders" validate constraint "sales_orders_customer_id_fkey";

alter table "public"."sales_orders" add constraint "sales_orders_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."sales_orders" validate constraint "sales_orders_instance_id_fkey";

alter table "public"."sales_products" add constraint "sales_products_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."sales_products" validate constraint "sales_products_instance_id_fkey";

alter table "public"."service_categories" add constraint "service_categories_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."service_categories" validate constraint "service_categories_instance_id_fkey";

alter table "public"."services" add constraint "services_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE not valid;

alter table "public"."services" validate constraint "services_category_id_fkey";

alter table "public"."services" add constraint "services_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."services" validate constraint "services_instance_id_fkey";

alter table "public"."sms_logs" add constraint "sms_logs_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."sms_logs" validate constraint "sms_logs_customer_id_fkey";

alter table "public"."sms_logs" add constraint "sms_logs_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."sms_logs" validate constraint "sms_logs_instance_id_fkey";

alter table "public"."sms_logs" add constraint "sms_logs_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) not valid;

alter table "public"."sms_logs" validate constraint "sms_logs_reservation_id_fkey";

alter table "public"."sms_message_settings" add constraint "sms_message_settings_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."sms_message_settings" validate constraint "sms_message_settings_instance_id_fkey";

alter table "public"."sms_verification_codes" add constraint "sms_verification_codes_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."sms_verification_codes" validate constraint "sms_verification_codes_instance_id_fkey";

alter table "public"."station_employees" add constraint "station_employees_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."station_employees" validate constraint "station_employees_employee_id_fkey";

alter table "public"."station_employees" add constraint "station_employees_station_id_fkey" FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE not valid;

alter table "public"."station_employees" validate constraint "station_employees_station_id_fkey";

alter table "public"."stations" add constraint "stations_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."stations" validate constraint "stations_instance_id_fkey";

alter table "public"."text_blocks_library" add constraint "text_blocks_library_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) not valid;

alter table "public"."text_blocks_library" validate constraint "text_blocks_library_instance_id_fkey";

alter table "public"."time_entries" add constraint "time_entries_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."time_entries" validate constraint "time_entries_employee_id_fkey";

alter table "public"."time_entries" add constraint "time_entries_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."time_entries" validate constraint "time_entries_instance_id_fkey";

alter table "public"."training_types" add constraint "training_types_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."training_types" validate constraint "training_types_instance_id_fkey";

alter table "public"."trainings" add constraint "trainings_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."trainings" validate constraint "trainings_instance_id_fkey";

alter table "public"."trainings" add constraint "trainings_station_id_fkey" FOREIGN KEY (station_id) REFERENCES public.stations(id) not valid;

alter table "public"."trainings" validate constraint "trainings_station_id_fkey";

alter table "public"."trainings" add constraint "trainings_training_type_id_fkey" FOREIGN KEY (training_type_id) REFERENCES public.training_types(id) not valid;

alter table "public"."trainings" validate constraint "trainings_training_type_id_fkey";

alter table "public"."unified_categories" add constraint "unified_categories_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."unified_categories" validate constraint "unified_categories_instance_id_fkey";

alter table "public"."unified_services" add constraint "unified_services_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.unified_categories(id) not valid;

alter table "public"."unified_services" validate constraint "unified_services_category_id_fkey";

alter table "public"."unified_services" add constraint "unified_services_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."unified_services" validate constraint "unified_services_instance_id_fkey";

alter table "public"."unified_services" add constraint "unified_services_reminder_template_id_fkey" FOREIGN KEY (reminder_template_id) REFERENCES public.reminder_templates(id) not valid;

alter table "public"."unified_services" validate constraint "unified_services_reminder_template_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) not valid;

alter table "public"."user_roles" validate constraint "user_roles_instance_id_fkey";

alter table "public"."vehicle_protocols" add constraint "vehicle_protocols_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."vehicle_protocols" validate constraint "vehicle_protocols_instance_id_fkey";

alter table "public"."vehicle_protocols" add constraint "vehicle_protocols_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES public.offers(id) not valid;

alter table "public"."vehicle_protocols" validate constraint "vehicle_protocols_offer_id_fkey";

alter table "public"."vehicle_protocols" add constraint "vehicle_protocols_reservation_id_fkey" FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) not valid;

alter table "public"."vehicle_protocols" validate constraint "vehicle_protocols_reservation_id_fkey";

alter table "public"."workers_settings" add constraint "workers_settings_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."workers_settings" validate constraint "workers_settings_instance_id_fkey";

alter table "public"."yard_vehicles" add constraint "yard_vehicles_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE not valid;

alter table "public"."yard_vehicles" validate constraint "yard_vehicles_instance_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_access_instance(_instance_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    public.is_super_admin() 
    OR public.has_instance_role(auth.uid(), 'admin'::app_role, _instance_id)
    OR public.has_instance_role(auth.uid(), 'employee'::app_role, _instance_id)
    OR public.has_instance_role(auth.uid(), 'hall'::app_role, _instance_id)
    OR public.has_instance_role(auth.uid(), 'sales'::app_role, _instance_id)
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_reservation_by_code(_confirmation_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _reservation record;
BEGIN
  UPDATE public.reservations SET status = 'cancelled', cancelled_at = now(), updated_at = now()
  WHERE confirmation_code = _confirmation_code AND status NOT IN ('cancelled', 'completed')
  RETURNING id, instance_id, customer_name, reservation_date, start_time, service_id INTO _reservation;
  IF _reservation.id IS NOT NULL THEN
    INSERT INTO public.notifications (instance_id, type, title, description, entity_type, entity_id)
    SELECT _reservation.instance_id, 'reservation_cancelled_by_customer', 'Klient anulował rezerwację: ' || _reservation.customer_name,
      s.name || ' - ' || to_char(_reservation.reservation_date, 'DD Mon') || ' o ' || substring(_reservation.start_time::text from 1 for 5), 'reservation', _reservation.id
    FROM public.services s WHERE s.id = _reservation.service_id;
    RETURN true;
  END IF;
  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_sms_available(_instance_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT sms_used < sms_limit FROM public.instances WHERE id = _instance_id;
$function$
;

CREATE OR REPLACE FUNCTION public.check_station_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE current_count INTEGER; max_allowed INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count FROM stations WHERE instance_id = NEW.instance_id;
  SELECT COALESCE(station_limit, 2) INTO max_allowed FROM instance_subscriptions WHERE instance_id = NEW.instance_id;
  IF max_allowed IS NULL THEN max_allowed := 2; END IF;
  IF current_count >= max_allowed THEN RAISE EXCEPTION 'Limit stanowisk osiągnięty (% z %)', current_count, max_allowed; END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_reminder_1day(p_reservation_id uuid, p_now timestamp with time zone, p_backoff_threshold timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_updated_id UUID;
BEGIN
  UPDATE public.reservations SET reminder_1day_last_attempt_at = p_now
  WHERE id = p_reservation_id AND reminder_1day_sent IS NULL AND (reminder_1day_last_attempt_at IS NULL OR reminder_1day_last_attempt_at < p_backoff_threshold)
  RETURNING id INTO v_updated_id;
  RETURN v_updated_id IS NOT NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_reminder_1hour(p_reservation_id uuid, p_now timestamp with time zone, p_backoff_threshold timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_updated_id UUID;
BEGIN
  UPDATE public.reservations SET reminder_1hour_last_attempt_at = p_now
  WHERE id = p_reservation_id AND reminder_1hour_sent IS NULL AND (reminder_1hour_last_attempt_at IS NULL OR reminder_1hour_last_attempt_at < p_backoff_threshold)
  RETURNING id INTO v_updated_id;
  RETURN v_updated_id IS NOT NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN DELETE FROM public.login_attempts WHERE created_at < now() - interval '30 days'; END;
$function$
;

CREATE OR REPLACE FUNCTION public.copy_global_scopes_to_instance(_instance_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_scope RECORD; v_new_scope_id uuid; v_product RECORD; v_count integer := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM offer_scopes WHERE instance_id = _instance_id AND active = true) THEN RETURN 0; END IF;
  FOR v_scope IN SELECT * FROM offer_scopes WHERE source = 'global' AND instance_id IS NULL AND active = true ORDER BY sort_order
  LOOP
    INSERT INTO offer_scopes (instance_id, name, short_name, description, is_extras_scope, has_coating_upsell, sort_order, default_warranty, default_payment_terms, default_notes, default_service_info, source, active)
    VALUES (_instance_id, v_scope.name, v_scope.short_name, v_scope.description, v_scope.is_extras_scope, v_scope.has_coating_upsell, v_scope.sort_order, v_scope.default_warranty, v_scope.default_payment_terms, v_scope.default_notes, v_scope.default_service_info, 'instance', true)
    RETURNING id INTO v_new_scope_id;
    FOR v_product IN SELECT * FROM offer_scope_products WHERE scope_id = v_scope.id ORDER BY sort_order
    LOOP
      INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
      VALUES (v_new_scope_id, v_product.product_id, v_product.variant_name, v_product.is_default, v_product.sort_order, _instance_id);
    END LOOP;
    v_count := v_count + 1;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM offer_scopes WHERE instance_id = _instance_id AND is_extras_scope = true AND active = true) THEN
    INSERT INTO offer_scopes (instance_id, name, short_name, is_extras_scope, source, active, sort_order) VALUES (_instance_id, 'Dodatki', 'Dodatki', true, 'instance', true, 999);
    v_count := v_count + 1;
  END IF;
  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_offer_history_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _action text; _old_data jsonb; _new_data jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'created'; _old_data := NULL; _new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN _action := 'status_changed_to_' || NEW.status;
    ELSE _action := 'updated'; END IF;
    _old_data := jsonb_build_object('status', OLD.status, 'total_net', OLD.total_net, 'total_gross', OLD.total_gross);
    _new_data := jsonb_build_object('status', NEW.status, 'total_net', NEW.total_net, 'total_gross', NEW.total_gross);
  END IF;
  INSERT INTO public.offer_history (offer_id, action, created_by, old_data, new_data)
  VALUES (NEW.id, _action, auth.uid(), _old_data, _new_data);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_offer_reminders(p_offer_id uuid, p_completed_at timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_offer RECORD; v_product RECORD; v_template RECORD; v_reminder RECORD;
  v_count INTEGER := 0; v_scheduled_date DATE; v_processed_products UUID[] := ARRAY[]::UUID[];
  v_selected_state JSONB; v_selected_option_ids UUID[] := ARRAY[]::UUID[];
  v_selected_optional_item_ids UUID[] := ARRAY[]::UUID[];
  v_variant_id TEXT; v_upsell_id TEXT; v_item_id TEXT; v_selected_item_id UUID;
  v_customer_name TEXT; v_customer_phone TEXT; v_sms_template TEXT; v_is_upsell_option BOOLEAN;
BEGIN
  SELECT o.id, o.instance_id, o.selected_state, o.customer_data INTO v_offer FROM offers o WHERE o.id = p_offer_id;
  IF v_offer.id IS NULL THEN RAISE EXCEPTION 'Offer not found'; END IF;
  v_selected_state := v_offer.selected_state;
  v_customer_name := COALESCE(v_offer.customer_data->>'name', 'Klient');
  v_customer_phone := COALESCE(v_offer.customer_data->>'phone', '');
  IF v_selected_state IS NOT NULL THEN
    IF v_selected_state ? 'selectedVariants' AND v_selected_state->'selectedVariants' IS NOT NULL THEN
      FOR v_variant_id IN SELECT jsonb_object_keys(v_selected_state->'selectedVariants') LOOP
        IF v_selected_state->'selectedVariants'->>v_variant_id IS NOT NULL THEN
          v_selected_option_ids := array_append(v_selected_option_ids, (v_selected_state->'selectedVariants'->>v_variant_id)::UUID);
        END IF;
      END LOOP;
    END IF;
    IF v_selected_state ? 'selectedUpsells' AND v_selected_state->'selectedUpsells' IS NOT NULL THEN
      FOR v_upsell_id IN SELECT jsonb_object_keys(v_selected_state->'selectedUpsells') LOOP
        IF (v_selected_state->'selectedUpsells'->>v_upsell_id)::BOOLEAN = true THEN
          v_selected_option_ids := array_append(v_selected_option_ids, v_upsell_id::UUID);
        END IF;
      END LOOP;
    END IF;
    IF v_selected_state ? 'selectedOptionalItems' AND v_selected_state->'selectedOptionalItems' IS NOT NULL THEN
      FOR v_item_id IN SELECT jsonb_object_keys(v_selected_state->'selectedOptionalItems') LOOP
        IF (v_selected_state->'selectedOptionalItems'->>v_item_id)::BOOLEAN = true THEN
          v_selected_optional_item_ids := array_append(v_selected_optional_item_ids, v_item_id::UUID);
        END IF;
      END LOOP;
    END IF;
  END IF;
  IF array_length(v_selected_option_ids, 1) IS NULL OR array_length(v_selected_option_ids, 1) = 0 THEN
    SELECT array_agg(id) INTO v_selected_option_ids FROM offer_options WHERE offer_id = p_offer_id AND is_selected = true;
  END IF;
  FOR v_product IN
    SELECT DISTINCT ON (pl.id) ooi.id as item_id, ooi.product_id, ooi.custom_name, oo.id as option_id, oo.is_upsell as is_upsell_option, pl.name as product_name, pl.reminder_template_id
    FROM offer_options oo JOIN offer_option_items ooi ON ooi.option_id = oo.id JOIN products_library pl ON pl.id = ooi.product_id
    WHERE oo.offer_id = p_offer_id AND oo.id = ANY(v_selected_option_ids) AND ooi.product_id IS NOT NULL AND pl.reminder_template_id IS NOT NULL
  LOOP
    IF v_selected_state ? 'selectedItemInOption' AND v_selected_state->'selectedItemInOption' ? v_product.option_id::TEXT THEN
      v_selected_item_id := (v_selected_state->'selectedItemInOption'->>v_product.option_id::TEXT)::UUID;
      IF v_selected_item_id IS NOT NULL AND v_selected_item_id != v_product.item_id THEN CONTINUE; END IF;
    END IF;
    IF v_product.is_upsell_option = true AND array_length(v_selected_optional_item_ids, 1) > 0 THEN
      IF NOT (v_product.item_id = ANY(v_selected_optional_item_ids)) THEN CONTINUE; END IF;
    END IF;
    IF v_product.product_id = ANY(v_processed_products) THEN CONTINUE; END IF;
    v_processed_products := array_append(v_processed_products, v_product.product_id);
    SELECT rt.id, rt.name, rt.items, rt.sms_template INTO v_template FROM reminder_templates rt WHERE rt.id = v_product.reminder_template_id;
    IF v_template.id IS NULL THEN CONTINUE; END IF;
    v_sms_template := COALESCE(v_template.sms_template, '');
    FOR v_reminder IN SELECT * FROM jsonb_to_recordset(v_template.items) AS x(months INT, is_paid BOOLEAN, service_type TEXT)
    LOOP
      v_scheduled_date := (p_completed_at + (v_reminder.months * INTERVAL '1 month'))::DATE;
      INSERT INTO offer_reminders (offer_id, instance_id, customer_name, customer_phone, product_id, service_name, scheduled_date, months_after, is_paid, service_type, sms_template, status)
      VALUES (p_offer_id, v_offer.instance_id, v_customer_name, v_customer_phone, v_product.product_id, COALESCE(v_product.custom_name, v_product.product_name), v_scheduled_date, v_reminder.months, COALESCE(v_reminder.is_paid, false), COALESCE(v_reminder.service_type, 'inspection'), v_sms_template, 'scheduled');
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_reservation_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.source = 'online' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (instance_id, type, title, message, data, is_read)
    VALUES (NEW.instance_id, 'new_reservation', 'Nowa rezerwacja online',
      'Klient ' || COALESCE(NEW.customer_name, 'Nieznany') || ' zarezerwował wizytę na ' || to_char(NEW.reservation_date, 'DD.MM.YYYY') || ' o ' || NEW.start_time::text,
      jsonb_build_object('reservation_id', NEW.id, 'customer_phone', NEW.customer_phone), false);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_reservation_reminders(p_reservation_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reservation RECORD; v_service_id UUID; v_service RECORD; v_item RECORD; v_count INTEGER := 0; v_completed_date DATE;
BEGIN
  SELECT * INTO v_reservation FROM reservations WHERE id = p_reservation_id;
  IF v_reservation IS NULL THEN RETURN 0; END IF;
  v_completed_date := COALESCE(v_reservation.completed_at::date, CURRENT_DATE);
  FOR v_service_id IN SELECT jsonb_array_elements_text(COALESCE(v_reservation.service_ids, '[]'::jsonb))::UUID
  LOOP
    SELECT us.*, rt.id as template_id, rt.items as template_items INTO v_service
    FROM unified_services us LEFT JOIN reminder_templates rt ON us.reminder_template_id = rt.id WHERE us.id = v_service_id;
    IF v_service.template_id IS NOT NULL AND v_service.template_items IS NOT NULL THEN
      FOR v_item IN SELECT * FROM jsonb_to_recordset(v_service.template_items) AS x(months INTEGER, service_type TEXT)
      LOOP
        INSERT INTO customer_reminders (instance_id, reminder_template_id, reservation_id, customer_name, customer_phone, vehicle_plate, scheduled_date, months_after, service_type)
        VALUES (v_reservation.instance_id, v_service.template_id, p_reservation_id, COALESCE(v_reservation.customer_name, 'Klient'), v_reservation.customer_phone,
          COALESCE(v_reservation.vehicle_plate, ''), (v_completed_date + (v_item.months * INTERVAL '1 month'))::date, v_item.months, COALESCE(v_item.service_type, 'serwis'))
        ON CONFLICT (instance_id, customer_phone, vehicle_plate, reminder_template_id, months_after) DO NOTHING;
        v_count := v_count + 1;
      END LOOP;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_offer_number(_instance_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _year TEXT; _month TEXT; _day TEXT; _count INTEGER; _prefix TEXT;
BEGIN
  _year := to_char(now(), 'YYYY'); _month := to_char(now(), 'MM'); _day := to_char(now(), 'DD');
  SELECT COALESCE(MAX(CASE WHEN offer_number ~ '/[0-9]+$' THEN (regexp_replace(offer_number, '.*/([0-9]+)$', '\1'))::INTEGER ELSE 0 END), 0) + 1 INTO _count
  FROM public.offers WHERE instance_id = _instance_id;
  SELECT UPPER(LEFT(slug, 3)) INTO _prefix FROM public.instances WHERE id = _instance_id;
  RETURN COALESCE(_prefix, 'OFF') || '/' || _day || '/' || _month || '/' || _year || '/' || _count::TEXT;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_protocol_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _token TEXT; _attempts INT := 0;
BEGIN
  LOOP
    _token := LEFT(gen_random_uuid()::TEXT, 8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.vehicle_protocols WHERE public_token = _token);
    _attempts := _attempts + 1;
    IF _attempts > 100 THEN RAISE EXCEPTION 'Could not generate unique protocol token'; END IF;
  END LOOP;
  RETURN _token;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_public_api_key()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.public_api_key IS NULL THEN
    NEW.public_api_key := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_short_token()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE _token TEXT; _attempts INT := 0;
BEGIN
  LOOP
    _token := LEFT(gen_random_uuid()::TEXT, 8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.offers WHERE public_token = _token);
    _attempts := _attempts + 1;
    IF _attempts > 100 THEN RAISE EXCEPTION 'Could not generate unique token'; END IF;
  END LOOP;
  RETURN _token;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_availability_blocks(_instance_id uuid, _from date, _to date)
 RETURNS TABLE(block_date date, start_time time without time zone, end_time time without time zone, station_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT r.reservation_date AS block_date, r.start_time, r.end_time, r.station_id
  FROM public.reservations r
  WHERE r.instance_id = _instance_id
    AND r.reservation_date BETWEEN _from AND _to
    AND (r.status IS NULL OR r.status NOT IN ('cancelled', 'change_requested'))
    AND EXISTS (SELECT 1 FROM public.instances i WHERE i.id = _instance_id AND i.active = true)
  UNION ALL
  SELECT b.break_date AS block_date, b.start_time, b.end_time, b.station_id
  FROM public.breaks b
  WHERE b.instance_id = _instance_id
    AND b.break_date BETWEEN _from AND _to
    AND EXISTS (SELECT 1 FROM public.instances i WHERE i.id = _instance_id AND i.active = true)
  UNION ALL
  SELECT cd.closed_date AS block_date, '00:00:00'::time AS start_time, '23:59:00'::time AS end_time, s.id AS station_id
  FROM public.closed_days cd
  CROSS JOIN public.stations s
  WHERE cd.instance_id = _instance_id
    AND cd.closed_date BETWEEN _from AND _to
    AND s.instance_id = _instance_id AND s.active = true
    AND EXISTS (SELECT 1 FROM public.instances i WHERE i.id = _instance_id AND i.active = true);
$function$
;

CREATE OR REPLACE FUNCTION public.get_offer_instance_id(p_offer_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT instance_id FROM offers WHERE id = p_offer_id
$function$
;

CREATE OR REPLACE FUNCTION public.get_option_instance_id(p_option_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT o.instance_id FROM offers o JOIN offer_options oo ON oo.offer_id = o.id WHERE oo.id = p_option_id
$function$
;

CREATE OR REPLACE FUNCTION public.get_reservation_instance_id(p_reservation_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT instance_id FROM public.reservations WHERE id = p_reservation_id
$function$
;

CREATE OR REPLACE FUNCTION public.guard_hall_reservation_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  allowed_cols text[] := ARRAY['status','started_at','completed_at','checked_service_ids','photo_urls','updated_at','service_ids','service_items'];
  disallowed_cols text[];
BEGIN
  IF has_instance_role(auth.uid(), 'hall'::app_role, NEW.instance_id) THEN
    SELECT array_agg(key) INTO disallowed_cols
    FROM (SELECT e.key FROM jsonb_each(to_jsonb(NEW)) e WHERE (to_jsonb(OLD) -> e.key) IS DISTINCT FROM e.value) changed
    WHERE NOT (changed.key = ANY(allowed_cols));
    IF disallowed_cols IS NOT NULL THEN
      RAISE EXCEPTION 'Hall role cannot update columns: %', disallowed_cols USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_reservation_completed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM create_reservation_reminders(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_employee_permission(_user_id uuid, _instance_id uuid, _feature_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_permissions
    WHERE user_id = _user_id AND instance_id = _instance_id AND feature_key = _feature_key AND enabled = true
  )
$function$
;

CREATE OR REPLACE FUNCTION public.has_instance_role(_user_id uuid, _role public.app_role, _instance_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND (instance_id = _instance_id OR instance_id IS NULL)
  )
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$
;

CREATE OR REPLACE FUNCTION public.increment_sms_usage(_instance_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE current_limit integer; current_used integer;
BEGIN
  SELECT sms_limit, sms_used INTO current_limit, current_used FROM public.instances WHERE id = _instance_id FOR UPDATE;
  IF current_used >= current_limit THEN RETURN false; END IF;
  UPDATE public.instances SET sms_used = sms_used + 1, updated_at = now() WHERE id = _instance_id;
  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'super_admin'::app_role)
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT is_blocked FROM public.profiles WHERE id = _user_id), false)
$function$
;

CREATE OR REPLACE FUNCTION public.log_reservation_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_username TEXT;
  v_batch_id UUID := gen_random_uuid();
  v_changed_by_type TEXT;
BEGIN
  SELECT username INTO v_username FROM profiles WHERE id = auth.uid();
  v_changed_by_type := CASE WHEN NEW.source IN ('customer', 'calendar', 'online') THEN 'customer' ELSE 'admin' END;
  INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
  VALUES (NEW.id, NEW.instance_id, 'created', NULL, NULL,
    jsonb_build_object('service_ids', NEW.service_ids, 'reservation_date', NEW.reservation_date, 'end_date', NEW.end_date,
      'start_time', NEW.start_time, 'end_time', NEW.end_time, 'station_id', NEW.station_id,
      'customer_name', NEW.customer_name, 'customer_phone', NEW.customer_phone, 'vehicle_plate', NEW.vehicle_plate,
      'car_size', NEW.car_size, 'price', NEW.price, 'status', NEW.status, 'admin_notes', NEW.admin_notes, 'offer_number', NEW.offer_number),
    v_batch_id, auth.uid(), COALESCE(v_username, NEW.created_by_username, NEW.customer_name, 'System'), v_changed_by_type);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_reservation_updated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_username TEXT;
  v_batch_id UUID := gen_random_uuid();
  v_changed_by_type TEXT := 'admin';
  v_has_changes BOOLEAN := FALSE;
BEGIN
  SELECT username INTO v_username FROM profiles WHERE id = auth.uid();
  IF NEW.status = 'change_requested' AND OLD.status IS DISTINCT FROM 'change_requested' THEN v_changed_by_type := 'customer'; END IF;

  IF OLD.service_ids IS DISTINCT FROM NEW.service_ids THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'service_ids', COALESCE(to_jsonb(OLD.service_ids), 'null'::jsonb), COALESCE(to_jsonb(NEW.service_ids), 'null'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.reservation_date IS DISTINCT FROM NEW.reservation_date OR OLD.end_date IS DISTINCT FROM NEW.end_date THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'dates', jsonb_build_object('reservation_date', OLD.reservation_date, 'end_date', OLD.end_date), jsonb_build_object('reservation_date', NEW.reservation_date, 'end_date', NEW.end_date), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.start_time IS DISTINCT FROM NEW.start_time OR OLD.end_time IS DISTINCT FROM NEW.end_time THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'times', jsonb_build_object('start_time', OLD.start_time, 'end_time', OLD.end_time), jsonb_build_object('start_time', NEW.start_time, 'end_time', NEW.end_time), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.station_id IS DISTINCT FROM NEW.station_id THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'station_id', COALESCE(to_jsonb(OLD.station_id), 'null'::jsonb), COALESCE(to_jsonb(NEW.station_id), 'null'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'price', COALESCE(to_jsonb(OLD.price), 'null'::jsonb), COALESCE(to_jsonb(NEW.price), 'null'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'status', COALESCE(to_jsonb(OLD.status), 'null'::jsonb), COALESCE(to_jsonb(NEW.status), 'null'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.customer_name IS DISTINCT FROM NEW.customer_name THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'customer_name', COALESCE(to_jsonb(OLD.customer_name), 'null'::jsonb), COALESCE(to_jsonb(NEW.customer_name), 'null'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.vehicle_plate IS DISTINCT FROM NEW.vehicle_plate THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'vehicle_plate', COALESCE(to_jsonb(OLD.vehicle_plate), 'null'::jsonb), COALESCE(to_jsonb(NEW.vehicle_plate), 'null'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.car_size IS DISTINCT FROM NEW.car_size THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'car_size', COALESCE(to_jsonb(OLD.car_size), 'null'::jsonb), COALESCE(to_jsonb(NEW.car_size), 'null'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.admin_notes IS DISTINCT FROM NEW.admin_notes THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'admin_notes', COALESCE(to_jsonb(OLD.admin_notes), 'null'::jsonb), COALESCE(to_jsonb(NEW.admin_notes), 'null'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF OLD.offer_number IS DISTINCT FROM NEW.offer_number THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'offer_number', COALESCE(to_jsonb(OLD.offer_number), 'null'::jsonb), COALESCE(to_jsonb(NEW.offer_number), 'null'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  IF NEW.change_request_note IS NOT NULL AND OLD.change_request_note IS DISTINCT FROM NEW.change_request_note THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'change_request_note', 'null'::jsonb, to_jsonb(NEW.change_request_note), v_batch_id, auth.uid(), COALESCE(NEW.customer_name, 'Klient'), 'customer');
  END IF;
  IF OLD.assigned_employee_ids IS DISTINCT FROM NEW.assigned_employee_ids THEN
    INSERT INTO reservation_changes (reservation_id, instance_id, change_type, field_name, old_value, new_value, batch_id, changed_by, changed_by_username, changed_by_type)
    VALUES (NEW.id, NEW.instance_id, 'updated', 'assigned_employee_ids', COALESCE(OLD.assigned_employee_ids, '[]'::jsonb), COALESCE(NEW.assigned_employee_ids, '[]'::jsonb), v_batch_id, auth.uid(), COALESCE(v_username, 'System'), v_changed_by_type);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.request_reservation_change_by_code(_original_confirmation_code text, _new_reservation_date date, _new_start_time time without time zone, _new_service_id uuid, _new_station_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, confirmation_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _orig record; _duration_minutes integer; _new_end_time time; _new_id uuid; _new_code text; _attempts int := 0; _cutoff_hours int;
BEGIN
  SELECT r.* INTO _orig FROM public.reservations r WHERE r.confirmation_code = _original_confirmation_code LIMIT 1;
  IF _orig.id IS NULL THEN RAISE EXCEPTION 'RESERVATION_NOT_FOUND'; END IF;
  IF _orig.status NOT IN ('confirmed', 'pending') THEN RAISE EXCEPTION 'RESERVATION_NOT_EDITABLE'; END IF;
  SELECT COALESCE(i.customer_edit_cutoff_hours, 1) INTO _cutoff_hours FROM public.instances i WHERE i.id = _orig.instance_id;
  IF (_orig.reservation_date::date + _orig.start_time) < (now() + make_interval(hours => _cutoff_hours)) THEN RAISE EXCEPTION 'EDIT_CUTOFF_PASSED'; END IF;
  IF EXISTS (SELECT 1 FROM public.reservations cr WHERE cr.original_reservation_id = _orig.id AND cr.status = 'change_requested') THEN RAISE EXCEPTION 'ALREADY_HAS_PENDING_CHANGE'; END IF;
  SELECT COALESCE(CASE _orig.car_size::text WHEN 'small' THEN COALESCE(s.duration_small, s.duration_minutes) WHEN 'medium' THEN COALESCE(s.duration_medium, s.duration_minutes) WHEN 'large' THEN COALESCE(s.duration_large, s.duration_minutes) ELSE s.duration_minutes END, s.duration_minutes, 60) INTO _duration_minutes
  FROM public.services s WHERE s.id = _new_service_id AND s.instance_id = _orig.instance_id LIMIT 1;
  IF _duration_minutes IS NULL THEN RAISE EXCEPTION 'SERVICE_NOT_FOUND'; END IF;
  _new_end_time := (_new_start_time + make_interval(mins => _duration_minutes))::time;
  LOOP
    _new_code := (floor(random() * 9000000) + 1000000)::bigint::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.reservations r2 WHERE r2.confirmation_code = _new_code);
    _attempts := _attempts + 1; IF _attempts > 20 THEN RAISE EXCEPTION 'CODE_GENERATION_FAILED'; END IF;
  END LOOP;
  INSERT INTO public.reservations (instance_id, reservation_date, start_time, end_time, station_id, service_id, service_ids, customer_name, customer_phone, vehicle_plate, car_size, customer_notes, confirmation_code, status, original_reservation_id, source)
  VALUES (_orig.instance_id, _new_reservation_date, _new_start_time, _new_end_time, _new_station_id, _new_service_id, jsonb_build_array(_new_service_id), _orig.customer_name, _orig.customer_phone, _orig.vehicle_plate, _orig.car_size, _orig.customer_notes, _new_code, 'change_requested', _orig.id, 'customer')
  RETURNING reservations.id, reservations.confirmation_code INTO _new_id, _new_code;
  INSERT INTO public.notifications (instance_id, type, title, description, entity_type, entity_id)
  SELECT _orig.instance_id, 'change_request', 'Prośba o zmianę terminu: ' || _orig.customer_name,
    COALESCE(s.name, 'Usługa') || ' - ' || to_char(_new_reservation_date, 'YYYY-MM-DD') || ' o ' || to_char(_new_start_time, 'HH24:MI'), 'reservation', _new_id
  FROM public.services s WHERE s.id = _new_service_id;
  RETURN QUERY SELECT _new_id, _new_code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_reminder_flags()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (OLD.reservation_date IS DISTINCT FROM NEW.reservation_date) OR (OLD.start_time IS DISTINCT FROM NEW.start_time) THEN
    NEW.reminder_1day_sent := NULL; NEW.reminder_1hour_sent := NULL;
    NEW.reminder_1day_last_attempt_at := NULL; NEW.reminder_1hour_last_attempt_at := NULL;
    NEW.reminder_failure_count := 0; NEW.reminder_permanent_failure := FALSE; NEW.reminder_failure_reason := NULL;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_offers_public_token()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.public_token is null or new.public_token = '' then
    new.public_token := gen_random_uuid()::text; -- swap in your custom generator if desired
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_time_entry_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM 1 FROM public.time_entries WHERE employee_id = NEW.employee_id AND entry_date = NEW.entry_date FOR UPDATE;
  SELECT COALESCE(MAX(entry_number), 0) + 1 INTO NEW.entry_number FROM public.time_entries WHERE employee_id = NEW.employee_id AND entry_date = NEW.entry_date;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_customer_no_show_flag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.no_show_at IS NOT NULL AND (OLD.no_show_at IS NULL) THEN
    UPDATE public.customers SET has_no_show = true WHERE phone = NEW.customer_phone AND instance_id = NEW.instance_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_instance_working_hours(_instance_id uuid, _working_hours jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  IF NOT (has_role(auth.uid(), 'super_admin'::app_role) OR has_instance_role(auth.uid(), 'admin'::app_role, _instance_id)) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE public.instances SET working_hours = _working_hours, updated_at = now() WHERE id = _instance_id RETURNING working_hours INTO _result;
  IF _result IS NULL THEN RAISE EXCEPTION 'instance not found' USING ERRCODE = 'P0002'; END IF;
  RETURN _result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_customer_vehicle(_instance_id uuid, _phone text, _model text, _plate text DEFAULT NULL::text, _customer_id uuid DEFAULT NULL::uuid, _car_size text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _vehicle_id UUID; _normalized_phone TEXT;
BEGIN
  _normalized_phone := regexp_replace(_phone, '^\+', '');
  INSERT INTO public.customer_vehicles (instance_id, phone, model, plate, customer_id, car_size, usage_count, last_used_at)
  VALUES (_instance_id, _normalized_phone, _model, _plate, _customer_id, _car_size, 1, now())
  ON CONFLICT (instance_id, phone, model) DO UPDATE SET
    usage_count = customer_vehicles.usage_count + 1, last_used_at = now(),
    plate = COALESCE(EXCLUDED.plate, customer_vehicles.plate),
    customer_id = COALESCE(EXCLUDED.customer_id, customer_vehicles.customer_id),
    car_size = COALESCE(EXCLUDED.car_size, customer_vehicles.car_size), updated_at = now()
  RETURNING id INTO _vehicle_id;
  RETURN _vehicle_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_time_entry_overlap()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM time_entries WHERE employee_id = NEW.employee_id AND entry_date = NEW.entry_date AND id != NEW.id AND start_time IS NOT NULL AND end_time IS NOT NULL AND NEW.start_time < end_time AND NEW.end_time > start_time) THEN
      RAISE EXCEPTION 'Time entry overlaps with existing entry';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."breaks" to "anon";

grant insert on table "public"."breaks" to "anon";

grant references on table "public"."breaks" to "anon";

grant select on table "public"."breaks" to "anon";

grant trigger on table "public"."breaks" to "anon";

grant truncate on table "public"."breaks" to "anon";

grant update on table "public"."breaks" to "anon";

grant delete on table "public"."breaks" to "authenticated";

grant insert on table "public"."breaks" to "authenticated";

grant references on table "public"."breaks" to "authenticated";

grant select on table "public"."breaks" to "authenticated";

grant trigger on table "public"."breaks" to "authenticated";

grant truncate on table "public"."breaks" to "authenticated";

grant update on table "public"."breaks" to "authenticated";

grant delete on table "public"."breaks" to "service_role";

grant insert on table "public"."breaks" to "service_role";

grant references on table "public"."breaks" to "service_role";

grant select on table "public"."breaks" to "service_role";

grant trigger on table "public"."breaks" to "service_role";

grant truncate on table "public"."breaks" to "service_role";

grant update on table "public"."breaks" to "service_role";

grant delete on table "public"."car_models" to "anon";

grant insert on table "public"."car_models" to "anon";

grant references on table "public"."car_models" to "anon";

grant select on table "public"."car_models" to "anon";

grant trigger on table "public"."car_models" to "anon";

grant truncate on table "public"."car_models" to "anon";

grant update on table "public"."car_models" to "anon";

grant delete on table "public"."car_models" to "authenticated";

grant insert on table "public"."car_models" to "authenticated";

grant references on table "public"."car_models" to "authenticated";

grant select on table "public"."car_models" to "authenticated";

grant trigger on table "public"."car_models" to "authenticated";

grant truncate on table "public"."car_models" to "authenticated";

grant update on table "public"."car_models" to "authenticated";

grant delete on table "public"."car_models" to "service_role";

grant insert on table "public"."car_models" to "service_role";

grant references on table "public"."car_models" to "service_role";

grant select on table "public"."car_models" to "service_role";

grant trigger on table "public"."car_models" to "service_role";

grant truncate on table "public"."car_models" to "service_role";

grant update on table "public"."car_models" to "service_role";

grant delete on table "public"."closed_days" to "anon";

grant insert on table "public"."closed_days" to "anon";

grant references on table "public"."closed_days" to "anon";

grant select on table "public"."closed_days" to "anon";

grant trigger on table "public"."closed_days" to "anon";

grant truncate on table "public"."closed_days" to "anon";

grant update on table "public"."closed_days" to "anon";

grant delete on table "public"."closed_days" to "authenticated";

grant insert on table "public"."closed_days" to "authenticated";

grant references on table "public"."closed_days" to "authenticated";

grant select on table "public"."closed_days" to "authenticated";

grant trigger on table "public"."closed_days" to "authenticated";

grant truncate on table "public"."closed_days" to "authenticated";

grant update on table "public"."closed_days" to "authenticated";

grant delete on table "public"."closed_days" to "service_role";

grant insert on table "public"."closed_days" to "service_role";

grant references on table "public"."closed_days" to "service_role";

grant select on table "public"."closed_days" to "service_role";

grant trigger on table "public"."closed_days" to "service_role";

grant truncate on table "public"."closed_days" to "service_role";

grant update on table "public"."closed_days" to "service_role";

grant delete on table "public"."customer_reminders" to "anon";

grant insert on table "public"."customer_reminders" to "anon";

grant references on table "public"."customer_reminders" to "anon";

grant select on table "public"."customer_reminders" to "anon";

grant trigger on table "public"."customer_reminders" to "anon";

grant truncate on table "public"."customer_reminders" to "anon";

grant update on table "public"."customer_reminders" to "anon";

grant delete on table "public"."customer_reminders" to "authenticated";

grant insert on table "public"."customer_reminders" to "authenticated";

grant references on table "public"."customer_reminders" to "authenticated";

grant select on table "public"."customer_reminders" to "authenticated";

grant trigger on table "public"."customer_reminders" to "authenticated";

grant truncate on table "public"."customer_reminders" to "authenticated";

grant update on table "public"."customer_reminders" to "authenticated";

grant delete on table "public"."customer_reminders" to "service_role";

grant insert on table "public"."customer_reminders" to "service_role";

grant references on table "public"."customer_reminders" to "service_role";

grant select on table "public"."customer_reminders" to "service_role";

grant trigger on table "public"."customer_reminders" to "service_role";

grant truncate on table "public"."customer_reminders" to "service_role";

grant update on table "public"."customer_reminders" to "service_role";

grant delete on table "public"."customer_vehicles" to "anon";

grant insert on table "public"."customer_vehicles" to "anon";

grant references on table "public"."customer_vehicles" to "anon";

grant select on table "public"."customer_vehicles" to "anon";

grant trigger on table "public"."customer_vehicles" to "anon";

grant truncate on table "public"."customer_vehicles" to "anon";

grant update on table "public"."customer_vehicles" to "anon";

grant delete on table "public"."customer_vehicles" to "authenticated";

grant insert on table "public"."customer_vehicles" to "authenticated";

grant references on table "public"."customer_vehicles" to "authenticated";

grant select on table "public"."customer_vehicles" to "authenticated";

grant trigger on table "public"."customer_vehicles" to "authenticated";

grant truncate on table "public"."customer_vehicles" to "authenticated";

grant update on table "public"."customer_vehicles" to "authenticated";

grant delete on table "public"."customer_vehicles" to "service_role";

grant insert on table "public"."customer_vehicles" to "service_role";

grant references on table "public"."customer_vehicles" to "service_role";

grant select on table "public"."customer_vehicles" to "service_role";

grant trigger on table "public"."customer_vehicles" to "service_role";

grant truncate on table "public"."customer_vehicles" to "service_role";

grant update on table "public"."customer_vehicles" to "service_role";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."employee_breaks" to "anon";

grant insert on table "public"."employee_breaks" to "anon";

grant references on table "public"."employee_breaks" to "anon";

grant select on table "public"."employee_breaks" to "anon";

grant trigger on table "public"."employee_breaks" to "anon";

grant truncate on table "public"."employee_breaks" to "anon";

grant update on table "public"."employee_breaks" to "anon";

grant delete on table "public"."employee_breaks" to "authenticated";

grant insert on table "public"."employee_breaks" to "authenticated";

grant references on table "public"."employee_breaks" to "authenticated";

grant select on table "public"."employee_breaks" to "authenticated";

grant trigger on table "public"."employee_breaks" to "authenticated";

grant truncate on table "public"."employee_breaks" to "authenticated";

grant update on table "public"."employee_breaks" to "authenticated";

grant delete on table "public"."employee_breaks" to "service_role";

grant insert on table "public"."employee_breaks" to "service_role";

grant references on table "public"."employee_breaks" to "service_role";

grant select on table "public"."employee_breaks" to "service_role";

grant trigger on table "public"."employee_breaks" to "service_role";

grant truncate on table "public"."employee_breaks" to "service_role";

grant update on table "public"."employee_breaks" to "service_role";

grant delete on table "public"."employee_days_off" to "anon";

grant insert on table "public"."employee_days_off" to "anon";

grant references on table "public"."employee_days_off" to "anon";

grant select on table "public"."employee_days_off" to "anon";

grant trigger on table "public"."employee_days_off" to "anon";

grant truncate on table "public"."employee_days_off" to "anon";

grant update on table "public"."employee_days_off" to "anon";

grant delete on table "public"."employee_days_off" to "authenticated";

grant insert on table "public"."employee_days_off" to "authenticated";

grant references on table "public"."employee_days_off" to "authenticated";

grant select on table "public"."employee_days_off" to "authenticated";

grant trigger on table "public"."employee_days_off" to "authenticated";

grant truncate on table "public"."employee_days_off" to "authenticated";

grant update on table "public"."employee_days_off" to "authenticated";

grant delete on table "public"."employee_days_off" to "service_role";

grant insert on table "public"."employee_days_off" to "service_role";

grant references on table "public"."employee_days_off" to "service_role";

grant select on table "public"."employee_days_off" to "service_role";

grant trigger on table "public"."employee_days_off" to "service_role";

grant truncate on table "public"."employee_days_off" to "service_role";

grant update on table "public"."employee_days_off" to "service_role";

grant delete on table "public"."employee_edit_logs" to "anon";

grant insert on table "public"."employee_edit_logs" to "anon";

grant references on table "public"."employee_edit_logs" to "anon";

grant select on table "public"."employee_edit_logs" to "anon";

grant trigger on table "public"."employee_edit_logs" to "anon";

grant truncate on table "public"."employee_edit_logs" to "anon";

grant update on table "public"."employee_edit_logs" to "anon";

grant delete on table "public"."employee_edit_logs" to "authenticated";

grant insert on table "public"."employee_edit_logs" to "authenticated";

grant references on table "public"."employee_edit_logs" to "authenticated";

grant select on table "public"."employee_edit_logs" to "authenticated";

grant trigger on table "public"."employee_edit_logs" to "authenticated";

grant truncate on table "public"."employee_edit_logs" to "authenticated";

grant update on table "public"."employee_edit_logs" to "authenticated";

grant delete on table "public"."employee_edit_logs" to "service_role";

grant insert on table "public"."employee_edit_logs" to "service_role";

grant references on table "public"."employee_edit_logs" to "service_role";

grant select on table "public"."employee_edit_logs" to "service_role";

grant trigger on table "public"."employee_edit_logs" to "service_role";

grant truncate on table "public"."employee_edit_logs" to "service_role";

grant update on table "public"."employee_edit_logs" to "service_role";

grant delete on table "public"."employee_permissions" to "anon";

grant insert on table "public"."employee_permissions" to "anon";

grant references on table "public"."employee_permissions" to "anon";

grant select on table "public"."employee_permissions" to "anon";

grant trigger on table "public"."employee_permissions" to "anon";

grant truncate on table "public"."employee_permissions" to "anon";

grant update on table "public"."employee_permissions" to "anon";

grant delete on table "public"."employee_permissions" to "authenticated";

grant insert on table "public"."employee_permissions" to "authenticated";

grant references on table "public"."employee_permissions" to "authenticated";

grant select on table "public"."employee_permissions" to "authenticated";

grant trigger on table "public"."employee_permissions" to "authenticated";

grant truncate on table "public"."employee_permissions" to "authenticated";

grant update on table "public"."employee_permissions" to "authenticated";

grant delete on table "public"."employee_permissions" to "service_role";

grant insert on table "public"."employee_permissions" to "service_role";

grant references on table "public"."employee_permissions" to "service_role";

grant select on table "public"."employee_permissions" to "service_role";

grant trigger on table "public"."employee_permissions" to "service_role";

grant truncate on table "public"."employee_permissions" to "service_role";

grant update on table "public"."employee_permissions" to "service_role";

grant delete on table "public"."employees" to "anon";

grant insert on table "public"."employees" to "anon";

grant references on table "public"."employees" to "anon";

grant select on table "public"."employees" to "anon";

grant trigger on table "public"."employees" to "anon";

grant truncate on table "public"."employees" to "anon";

grant update on table "public"."employees" to "anon";

grant delete on table "public"."employees" to "authenticated";

grant insert on table "public"."employees" to "authenticated";

grant references on table "public"."employees" to "authenticated";

grant select on table "public"."employees" to "authenticated";

grant trigger on table "public"."employees" to "authenticated";

grant truncate on table "public"."employees" to "authenticated";

grant update on table "public"."employees" to "authenticated";

grant delete on table "public"."employees" to "service_role";

grant insert on table "public"."employees" to "service_role";

grant references on table "public"."employees" to "service_role";

grant select on table "public"."employees" to "service_role";

grant trigger on table "public"."employees" to "service_role";

grant truncate on table "public"."employees" to "service_role";

grant update on table "public"."employees" to "service_role";

grant delete on table "public"."followup_events" to "anon";

grant insert on table "public"."followup_events" to "anon";

grant references on table "public"."followup_events" to "anon";

grant select on table "public"."followup_events" to "anon";

grant trigger on table "public"."followup_events" to "anon";

grant truncate on table "public"."followup_events" to "anon";

grant update on table "public"."followup_events" to "anon";

grant delete on table "public"."followup_events" to "authenticated";

grant insert on table "public"."followup_events" to "authenticated";

grant references on table "public"."followup_events" to "authenticated";

grant select on table "public"."followup_events" to "authenticated";

grant trigger on table "public"."followup_events" to "authenticated";

grant truncate on table "public"."followup_events" to "authenticated";

grant update on table "public"."followup_events" to "authenticated";

grant delete on table "public"."followup_events" to "service_role";

grant insert on table "public"."followup_events" to "service_role";

grant references on table "public"."followup_events" to "service_role";

grant select on table "public"."followup_events" to "service_role";

grant trigger on table "public"."followup_events" to "service_role";

grant truncate on table "public"."followup_events" to "service_role";

grant update on table "public"."followup_events" to "service_role";

grant delete on table "public"."followup_services" to "anon";

grant insert on table "public"."followup_services" to "anon";

grant references on table "public"."followup_services" to "anon";

grant select on table "public"."followup_services" to "anon";

grant trigger on table "public"."followup_services" to "anon";

grant truncate on table "public"."followup_services" to "anon";

grant update on table "public"."followup_services" to "anon";

grant delete on table "public"."followup_services" to "authenticated";

grant insert on table "public"."followup_services" to "authenticated";

grant references on table "public"."followup_services" to "authenticated";

grant select on table "public"."followup_services" to "authenticated";

grant trigger on table "public"."followup_services" to "authenticated";

grant truncate on table "public"."followup_services" to "authenticated";

grant update on table "public"."followup_services" to "authenticated";

grant delete on table "public"."followup_services" to "service_role";

grant insert on table "public"."followup_services" to "service_role";

grant references on table "public"."followup_services" to "service_role";

grant select on table "public"."followup_services" to "service_role";

grant trigger on table "public"."followup_services" to "service_role";

grant truncate on table "public"."followup_services" to "service_role";

grant update on table "public"."followup_services" to "service_role";

grant delete on table "public"."followup_tasks" to "anon";

grant insert on table "public"."followup_tasks" to "anon";

grant references on table "public"."followup_tasks" to "anon";

grant select on table "public"."followup_tasks" to "anon";

grant trigger on table "public"."followup_tasks" to "anon";

grant truncate on table "public"."followup_tasks" to "anon";

grant update on table "public"."followup_tasks" to "anon";

grant delete on table "public"."followup_tasks" to "authenticated";

grant insert on table "public"."followup_tasks" to "authenticated";

grant references on table "public"."followup_tasks" to "authenticated";

grant select on table "public"."followup_tasks" to "authenticated";

grant trigger on table "public"."followup_tasks" to "authenticated";

grant truncate on table "public"."followup_tasks" to "authenticated";

grant update on table "public"."followup_tasks" to "authenticated";

grant delete on table "public"."followup_tasks" to "service_role";

grant insert on table "public"."followup_tasks" to "service_role";

grant references on table "public"."followup_tasks" to "service_role";

grant select on table "public"."followup_tasks" to "service_role";

grant trigger on table "public"."followup_tasks" to "service_role";

grant truncate on table "public"."followup_tasks" to "service_role";

grant update on table "public"."followup_tasks" to "service_role";

grant delete on table "public"."halls" to "anon";

grant insert on table "public"."halls" to "anon";

grant references on table "public"."halls" to "anon";

grant select on table "public"."halls" to "anon";

grant trigger on table "public"."halls" to "anon";

grant truncate on table "public"."halls" to "anon";

grant update on table "public"."halls" to "anon";

grant delete on table "public"."halls" to "authenticated";

grant insert on table "public"."halls" to "authenticated";

grant references on table "public"."halls" to "authenticated";

grant select on table "public"."halls" to "authenticated";

grant trigger on table "public"."halls" to "authenticated";

grant truncate on table "public"."halls" to "authenticated";

grant update on table "public"."halls" to "authenticated";

grant delete on table "public"."halls" to "service_role";

grant insert on table "public"."halls" to "service_role";

grant references on table "public"."halls" to "service_role";

grant select on table "public"."halls" to "service_role";

grant trigger on table "public"."halls" to "service_role";

grant truncate on table "public"."halls" to "service_role";

grant update on table "public"."halls" to "service_role";

grant delete on table "public"."instance_features" to "anon";

grant insert on table "public"."instance_features" to "anon";

grant references on table "public"."instance_features" to "anon";

grant select on table "public"."instance_features" to "anon";

grant trigger on table "public"."instance_features" to "anon";

grant truncate on table "public"."instance_features" to "anon";

grant update on table "public"."instance_features" to "anon";

grant delete on table "public"."instance_features" to "authenticated";

grant insert on table "public"."instance_features" to "authenticated";

grant references on table "public"."instance_features" to "authenticated";

grant select on table "public"."instance_features" to "authenticated";

grant trigger on table "public"."instance_features" to "authenticated";

grant truncate on table "public"."instance_features" to "authenticated";

grant update on table "public"."instance_features" to "authenticated";

grant delete on table "public"."instance_features" to "service_role";

grant insert on table "public"."instance_features" to "service_role";

grant references on table "public"."instance_features" to "service_role";

grant select on table "public"."instance_features" to "service_role";

grant trigger on table "public"."instance_features" to "service_role";

grant truncate on table "public"."instance_features" to "service_role";

grant update on table "public"."instance_features" to "service_role";

grant delete on table "public"."instance_subscriptions" to "anon";

grant insert on table "public"."instance_subscriptions" to "anon";

grant references on table "public"."instance_subscriptions" to "anon";

grant select on table "public"."instance_subscriptions" to "anon";

grant trigger on table "public"."instance_subscriptions" to "anon";

grant truncate on table "public"."instance_subscriptions" to "anon";

grant update on table "public"."instance_subscriptions" to "anon";

grant delete on table "public"."instance_subscriptions" to "authenticated";

grant insert on table "public"."instance_subscriptions" to "authenticated";

grant references on table "public"."instance_subscriptions" to "authenticated";

grant select on table "public"."instance_subscriptions" to "authenticated";

grant trigger on table "public"."instance_subscriptions" to "authenticated";

grant truncate on table "public"."instance_subscriptions" to "authenticated";

grant update on table "public"."instance_subscriptions" to "authenticated";

grant delete on table "public"."instance_subscriptions" to "service_role";

grant insert on table "public"."instance_subscriptions" to "service_role";

grant references on table "public"."instance_subscriptions" to "service_role";

grant select on table "public"."instance_subscriptions" to "service_role";

grant trigger on table "public"."instance_subscriptions" to "service_role";

grant truncate on table "public"."instance_subscriptions" to "service_role";

grant update on table "public"."instance_subscriptions" to "service_role";

grant delete on table "public"."instances" to "anon";

grant insert on table "public"."instances" to "anon";

grant references on table "public"."instances" to "anon";

grant select on table "public"."instances" to "anon";

grant trigger on table "public"."instances" to "anon";

grant truncate on table "public"."instances" to "anon";

grant update on table "public"."instances" to "anon";

grant delete on table "public"."instances" to "authenticated";

grant insert on table "public"."instances" to "authenticated";

grant references on table "public"."instances" to "authenticated";

grant select on table "public"."instances" to "authenticated";

grant trigger on table "public"."instances" to "authenticated";

grant truncate on table "public"."instances" to "authenticated";

grant update on table "public"."instances" to "authenticated";

grant delete on table "public"."instances" to "service_role";

grant insert on table "public"."instances" to "service_role";

grant references on table "public"."instances" to "service_role";

grant select on table "public"."instances" to "service_role";

grant trigger on table "public"."instances" to "service_role";

grant truncate on table "public"."instances" to "service_role";

grant update on table "public"."instances" to "service_role";

grant delete on table "public"."login_attempts" to "anon";

grant insert on table "public"."login_attempts" to "anon";

grant references on table "public"."login_attempts" to "anon";

grant select on table "public"."login_attempts" to "anon";

grant trigger on table "public"."login_attempts" to "anon";

grant truncate on table "public"."login_attempts" to "anon";

grant update on table "public"."login_attempts" to "anon";

grant delete on table "public"."login_attempts" to "authenticated";

grant insert on table "public"."login_attempts" to "authenticated";

grant references on table "public"."login_attempts" to "authenticated";

grant select on table "public"."login_attempts" to "authenticated";

grant trigger on table "public"."login_attempts" to "authenticated";

grant truncate on table "public"."login_attempts" to "authenticated";

grant update on table "public"."login_attempts" to "authenticated";

grant delete on table "public"."login_attempts" to "service_role";

grant insert on table "public"."login_attempts" to "service_role";

grant references on table "public"."login_attempts" to "service_role";

grant select on table "public"."login_attempts" to "service_role";

grant trigger on table "public"."login_attempts" to "service_role";

grant truncate on table "public"."login_attempts" to "service_role";

grant update on table "public"."login_attempts" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."offer_history" to "anon";

grant insert on table "public"."offer_history" to "anon";

grant references on table "public"."offer_history" to "anon";

grant select on table "public"."offer_history" to "anon";

grant trigger on table "public"."offer_history" to "anon";

grant truncate on table "public"."offer_history" to "anon";

grant update on table "public"."offer_history" to "anon";

grant delete on table "public"."offer_history" to "authenticated";

grant insert on table "public"."offer_history" to "authenticated";

grant references on table "public"."offer_history" to "authenticated";

grant select on table "public"."offer_history" to "authenticated";

grant trigger on table "public"."offer_history" to "authenticated";

grant truncate on table "public"."offer_history" to "authenticated";

grant update on table "public"."offer_history" to "authenticated";

grant delete on table "public"."offer_history" to "service_role";

grant insert on table "public"."offer_history" to "service_role";

grant references on table "public"."offer_history" to "service_role";

grant select on table "public"."offer_history" to "service_role";

grant trigger on table "public"."offer_history" to "service_role";

grant truncate on table "public"."offer_history" to "service_role";

grant update on table "public"."offer_history" to "service_role";

grant delete on table "public"."offer_option_items" to "anon";

grant insert on table "public"."offer_option_items" to "anon";

grant references on table "public"."offer_option_items" to "anon";

grant select on table "public"."offer_option_items" to "anon";

grant trigger on table "public"."offer_option_items" to "anon";

grant truncate on table "public"."offer_option_items" to "anon";

grant update on table "public"."offer_option_items" to "anon";

grant delete on table "public"."offer_option_items" to "authenticated";

grant insert on table "public"."offer_option_items" to "authenticated";

grant references on table "public"."offer_option_items" to "authenticated";

grant select on table "public"."offer_option_items" to "authenticated";

grant trigger on table "public"."offer_option_items" to "authenticated";

grant truncate on table "public"."offer_option_items" to "authenticated";

grant update on table "public"."offer_option_items" to "authenticated";

grant delete on table "public"."offer_option_items" to "service_role";

grant insert on table "public"."offer_option_items" to "service_role";

grant references on table "public"."offer_option_items" to "service_role";

grant select on table "public"."offer_option_items" to "service_role";

grant trigger on table "public"."offer_option_items" to "service_role";

grant truncate on table "public"."offer_option_items" to "service_role";

grant update on table "public"."offer_option_items" to "service_role";

grant delete on table "public"."offer_options" to "anon";

grant insert on table "public"."offer_options" to "anon";

grant references on table "public"."offer_options" to "anon";

grant select on table "public"."offer_options" to "anon";

grant trigger on table "public"."offer_options" to "anon";

grant truncate on table "public"."offer_options" to "anon";

grant update on table "public"."offer_options" to "anon";

grant delete on table "public"."offer_options" to "authenticated";

grant insert on table "public"."offer_options" to "authenticated";

grant references on table "public"."offer_options" to "authenticated";

grant select on table "public"."offer_options" to "authenticated";

grant trigger on table "public"."offer_options" to "authenticated";

grant truncate on table "public"."offer_options" to "authenticated";

grant update on table "public"."offer_options" to "authenticated";

grant delete on table "public"."offer_options" to "service_role";

grant insert on table "public"."offer_options" to "service_role";

grant references on table "public"."offer_options" to "service_role";

grant select on table "public"."offer_options" to "service_role";

grant trigger on table "public"."offer_options" to "service_role";

grant truncate on table "public"."offer_options" to "service_role";

grant update on table "public"."offer_options" to "service_role";

grant delete on table "public"."offer_product_categories" to "anon";

grant insert on table "public"."offer_product_categories" to "anon";

grant references on table "public"."offer_product_categories" to "anon";

grant select on table "public"."offer_product_categories" to "anon";

grant trigger on table "public"."offer_product_categories" to "anon";

grant truncate on table "public"."offer_product_categories" to "anon";

grant update on table "public"."offer_product_categories" to "anon";

grant delete on table "public"."offer_product_categories" to "authenticated";

grant insert on table "public"."offer_product_categories" to "authenticated";

grant references on table "public"."offer_product_categories" to "authenticated";

grant select on table "public"."offer_product_categories" to "authenticated";

grant trigger on table "public"."offer_product_categories" to "authenticated";

grant truncate on table "public"."offer_product_categories" to "authenticated";

grant update on table "public"."offer_product_categories" to "authenticated";

grant delete on table "public"."offer_product_categories" to "service_role";

grant insert on table "public"."offer_product_categories" to "service_role";

grant references on table "public"."offer_product_categories" to "service_role";

grant select on table "public"."offer_product_categories" to "service_role";

grant trigger on table "public"."offer_product_categories" to "service_role";

grant truncate on table "public"."offer_product_categories" to "service_role";

grant update on table "public"."offer_product_categories" to "service_role";

grant delete on table "public"."offer_reminders" to "anon";

grant insert on table "public"."offer_reminders" to "anon";

grant references on table "public"."offer_reminders" to "anon";

grant select on table "public"."offer_reminders" to "anon";

grant trigger on table "public"."offer_reminders" to "anon";

grant truncate on table "public"."offer_reminders" to "anon";

grant update on table "public"."offer_reminders" to "anon";

grant delete on table "public"."offer_reminders" to "authenticated";

grant insert on table "public"."offer_reminders" to "authenticated";

grant references on table "public"."offer_reminders" to "authenticated";

grant select on table "public"."offer_reminders" to "authenticated";

grant trigger on table "public"."offer_reminders" to "authenticated";

grant truncate on table "public"."offer_reminders" to "authenticated";

grant update on table "public"."offer_reminders" to "authenticated";

grant delete on table "public"."offer_reminders" to "service_role";

grant insert on table "public"."offer_reminders" to "service_role";

grant references on table "public"."offer_reminders" to "service_role";

grant select on table "public"."offer_reminders" to "service_role";

grant trigger on table "public"."offer_reminders" to "service_role";

grant truncate on table "public"."offer_reminders" to "service_role";

grant update on table "public"."offer_reminders" to "service_role";

grant delete on table "public"."offer_scope_extra_products" to "anon";

grant insert on table "public"."offer_scope_extra_products" to "anon";

grant references on table "public"."offer_scope_extra_products" to "anon";

grant select on table "public"."offer_scope_extra_products" to "anon";

grant trigger on table "public"."offer_scope_extra_products" to "anon";

grant truncate on table "public"."offer_scope_extra_products" to "anon";

grant update on table "public"."offer_scope_extra_products" to "anon";

grant delete on table "public"."offer_scope_extra_products" to "authenticated";

grant insert on table "public"."offer_scope_extra_products" to "authenticated";

grant references on table "public"."offer_scope_extra_products" to "authenticated";

grant select on table "public"."offer_scope_extra_products" to "authenticated";

grant trigger on table "public"."offer_scope_extra_products" to "authenticated";

grant truncate on table "public"."offer_scope_extra_products" to "authenticated";

grant update on table "public"."offer_scope_extra_products" to "authenticated";

grant delete on table "public"."offer_scope_extra_products" to "service_role";

grant insert on table "public"."offer_scope_extra_products" to "service_role";

grant references on table "public"."offer_scope_extra_products" to "service_role";

grant select on table "public"."offer_scope_extra_products" to "service_role";

grant trigger on table "public"."offer_scope_extra_products" to "service_role";

grant truncate on table "public"."offer_scope_extra_products" to "service_role";

grant update on table "public"."offer_scope_extra_products" to "service_role";

grant delete on table "public"."offer_scope_extras" to "anon";

grant insert on table "public"."offer_scope_extras" to "anon";

grant references on table "public"."offer_scope_extras" to "anon";

grant select on table "public"."offer_scope_extras" to "anon";

grant trigger on table "public"."offer_scope_extras" to "anon";

grant truncate on table "public"."offer_scope_extras" to "anon";

grant update on table "public"."offer_scope_extras" to "anon";

grant delete on table "public"."offer_scope_extras" to "authenticated";

grant insert on table "public"."offer_scope_extras" to "authenticated";

grant references on table "public"."offer_scope_extras" to "authenticated";

grant select on table "public"."offer_scope_extras" to "authenticated";

grant trigger on table "public"."offer_scope_extras" to "authenticated";

grant truncate on table "public"."offer_scope_extras" to "authenticated";

grant update on table "public"."offer_scope_extras" to "authenticated";

grant delete on table "public"."offer_scope_extras" to "service_role";

grant insert on table "public"."offer_scope_extras" to "service_role";

grant references on table "public"."offer_scope_extras" to "service_role";

grant select on table "public"."offer_scope_extras" to "service_role";

grant trigger on table "public"."offer_scope_extras" to "service_role";

grant truncate on table "public"."offer_scope_extras" to "service_role";

grant update on table "public"."offer_scope_extras" to "service_role";

grant delete on table "public"."offer_scope_products" to "anon";

grant insert on table "public"."offer_scope_products" to "anon";

grant references on table "public"."offer_scope_products" to "anon";

grant select on table "public"."offer_scope_products" to "anon";

grant trigger on table "public"."offer_scope_products" to "anon";

grant truncate on table "public"."offer_scope_products" to "anon";

grant update on table "public"."offer_scope_products" to "anon";

grant delete on table "public"."offer_scope_products" to "authenticated";

grant insert on table "public"."offer_scope_products" to "authenticated";

grant references on table "public"."offer_scope_products" to "authenticated";

grant select on table "public"."offer_scope_products" to "authenticated";

grant trigger on table "public"."offer_scope_products" to "authenticated";

grant truncate on table "public"."offer_scope_products" to "authenticated";

grant update on table "public"."offer_scope_products" to "authenticated";

grant delete on table "public"."offer_scope_products" to "service_role";

grant insert on table "public"."offer_scope_products" to "service_role";

grant references on table "public"."offer_scope_products" to "service_role";

grant select on table "public"."offer_scope_products" to "service_role";

grant trigger on table "public"."offer_scope_products" to "service_role";

grant truncate on table "public"."offer_scope_products" to "service_role";

grant update on table "public"."offer_scope_products" to "service_role";

grant delete on table "public"."offer_scope_variant_products" to "anon";

grant insert on table "public"."offer_scope_variant_products" to "anon";

grant references on table "public"."offer_scope_variant_products" to "anon";

grant select on table "public"."offer_scope_variant_products" to "anon";

grant trigger on table "public"."offer_scope_variant_products" to "anon";

grant truncate on table "public"."offer_scope_variant_products" to "anon";

grant update on table "public"."offer_scope_variant_products" to "anon";

grant delete on table "public"."offer_scope_variant_products" to "authenticated";

grant insert on table "public"."offer_scope_variant_products" to "authenticated";

grant references on table "public"."offer_scope_variant_products" to "authenticated";

grant select on table "public"."offer_scope_variant_products" to "authenticated";

grant trigger on table "public"."offer_scope_variant_products" to "authenticated";

grant truncate on table "public"."offer_scope_variant_products" to "authenticated";

grant update on table "public"."offer_scope_variant_products" to "authenticated";

grant delete on table "public"."offer_scope_variant_products" to "service_role";

grant insert on table "public"."offer_scope_variant_products" to "service_role";

grant references on table "public"."offer_scope_variant_products" to "service_role";

grant select on table "public"."offer_scope_variant_products" to "service_role";

grant trigger on table "public"."offer_scope_variant_products" to "service_role";

grant truncate on table "public"."offer_scope_variant_products" to "service_role";

grant update on table "public"."offer_scope_variant_products" to "service_role";

grant delete on table "public"."offer_scope_variants" to "anon";

grant insert on table "public"."offer_scope_variants" to "anon";

grant references on table "public"."offer_scope_variants" to "anon";

grant select on table "public"."offer_scope_variants" to "anon";

grant trigger on table "public"."offer_scope_variants" to "anon";

grant truncate on table "public"."offer_scope_variants" to "anon";

grant update on table "public"."offer_scope_variants" to "anon";

grant delete on table "public"."offer_scope_variants" to "authenticated";

grant insert on table "public"."offer_scope_variants" to "authenticated";

grant references on table "public"."offer_scope_variants" to "authenticated";

grant select on table "public"."offer_scope_variants" to "authenticated";

grant trigger on table "public"."offer_scope_variants" to "authenticated";

grant truncate on table "public"."offer_scope_variants" to "authenticated";

grant update on table "public"."offer_scope_variants" to "authenticated";

grant delete on table "public"."offer_scope_variants" to "service_role";

grant insert on table "public"."offer_scope_variants" to "service_role";

grant references on table "public"."offer_scope_variants" to "service_role";

grant select on table "public"."offer_scope_variants" to "service_role";

grant trigger on table "public"."offer_scope_variants" to "service_role";

grant truncate on table "public"."offer_scope_variants" to "service_role";

grant update on table "public"."offer_scope_variants" to "service_role";

grant delete on table "public"."offer_scopes" to "anon";

grant insert on table "public"."offer_scopes" to "anon";

grant references on table "public"."offer_scopes" to "anon";

grant select on table "public"."offer_scopes" to "anon";

grant trigger on table "public"."offer_scopes" to "anon";

grant truncate on table "public"."offer_scopes" to "anon";

grant update on table "public"."offer_scopes" to "anon";

grant delete on table "public"."offer_scopes" to "authenticated";

grant insert on table "public"."offer_scopes" to "authenticated";

grant references on table "public"."offer_scopes" to "authenticated";

grant select on table "public"."offer_scopes" to "authenticated";

grant trigger on table "public"."offer_scopes" to "authenticated";

grant truncate on table "public"."offer_scopes" to "authenticated";

grant update on table "public"."offer_scopes" to "authenticated";

grant delete on table "public"."offer_scopes" to "service_role";

grant insert on table "public"."offer_scopes" to "service_role";

grant references on table "public"."offer_scopes" to "service_role";

grant select on table "public"."offer_scopes" to "service_role";

grant trigger on table "public"."offer_scopes" to "service_role";

grant truncate on table "public"."offer_scopes" to "service_role";

grant update on table "public"."offer_scopes" to "service_role";

grant delete on table "public"."offer_text_blocks" to "anon";

grant insert on table "public"."offer_text_blocks" to "anon";

grant references on table "public"."offer_text_blocks" to "anon";

grant select on table "public"."offer_text_blocks" to "anon";

grant trigger on table "public"."offer_text_blocks" to "anon";

grant truncate on table "public"."offer_text_blocks" to "anon";

grant update on table "public"."offer_text_blocks" to "anon";

grant delete on table "public"."offer_text_blocks" to "authenticated";

grant insert on table "public"."offer_text_blocks" to "authenticated";

grant references on table "public"."offer_text_blocks" to "authenticated";

grant select on table "public"."offer_text_blocks" to "authenticated";

grant trigger on table "public"."offer_text_blocks" to "authenticated";

grant truncate on table "public"."offer_text_blocks" to "authenticated";

grant update on table "public"."offer_text_blocks" to "authenticated";

grant delete on table "public"."offer_text_blocks" to "service_role";

grant insert on table "public"."offer_text_blocks" to "service_role";

grant references on table "public"."offer_text_blocks" to "service_role";

grant select on table "public"."offer_text_blocks" to "service_role";

grant trigger on table "public"."offer_text_blocks" to "service_role";

grant truncate on table "public"."offer_text_blocks" to "service_role";

grant update on table "public"."offer_text_blocks" to "service_role";

grant delete on table "public"."offer_variants" to "anon";

grant insert on table "public"."offer_variants" to "anon";

grant references on table "public"."offer_variants" to "anon";

grant select on table "public"."offer_variants" to "anon";

grant trigger on table "public"."offer_variants" to "anon";

grant truncate on table "public"."offer_variants" to "anon";

grant update on table "public"."offer_variants" to "anon";

grant delete on table "public"."offer_variants" to "authenticated";

grant insert on table "public"."offer_variants" to "authenticated";

grant references on table "public"."offer_variants" to "authenticated";

grant select on table "public"."offer_variants" to "authenticated";

grant trigger on table "public"."offer_variants" to "authenticated";

grant truncate on table "public"."offer_variants" to "authenticated";

grant update on table "public"."offer_variants" to "authenticated";

grant delete on table "public"."offer_variants" to "service_role";

grant insert on table "public"."offer_variants" to "service_role";

grant references on table "public"."offer_variants" to "service_role";

grant select on table "public"."offer_variants" to "service_role";

grant trigger on table "public"."offer_variants" to "service_role";

grant truncate on table "public"."offer_variants" to "service_role";

grant update on table "public"."offer_variants" to "service_role";

grant delete on table "public"."offer_views" to "anon";

grant insert on table "public"."offer_views" to "anon";

grant references on table "public"."offer_views" to "anon";

grant select on table "public"."offer_views" to "anon";

grant trigger on table "public"."offer_views" to "anon";

grant truncate on table "public"."offer_views" to "anon";

grant update on table "public"."offer_views" to "anon";

grant delete on table "public"."offer_views" to "authenticated";

grant insert on table "public"."offer_views" to "authenticated";

grant references on table "public"."offer_views" to "authenticated";

grant select on table "public"."offer_views" to "authenticated";

grant trigger on table "public"."offer_views" to "authenticated";

grant truncate on table "public"."offer_views" to "authenticated";

grant update on table "public"."offer_views" to "authenticated";

grant delete on table "public"."offer_views" to "service_role";

grant insert on table "public"."offer_views" to "service_role";

grant references on table "public"."offer_views" to "service_role";

grant select on table "public"."offer_views" to "service_role";

grant trigger on table "public"."offer_views" to "service_role";

grant truncate on table "public"."offer_views" to "service_role";

grant update on table "public"."offer_views" to "service_role";

grant delete on table "public"."offers" to "anon";

grant insert on table "public"."offers" to "anon";

grant references on table "public"."offers" to "anon";

grant select on table "public"."offers" to "anon";

grant trigger on table "public"."offers" to "anon";

grant truncate on table "public"."offers" to "anon";

grant update on table "public"."offers" to "anon";

grant delete on table "public"."offers" to "authenticated";

grant insert on table "public"."offers" to "authenticated";

grant references on table "public"."offers" to "authenticated";

grant select on table "public"."offers" to "authenticated";

grant trigger on table "public"."offers" to "authenticated";

grant truncate on table "public"."offers" to "authenticated";

grant update on table "public"."offers" to "authenticated";

grant delete on table "public"."offers" to "service_role";

grant insert on table "public"."offers" to "service_role";

grant references on table "public"."offers" to "service_role";

grant select on table "public"."offers" to "service_role";

grant trigger on table "public"."offers" to "service_role";

grant truncate on table "public"."offers" to "service_role";

grant update on table "public"."offers" to "service_role";

grant delete on table "public"."paint_colors" to "anon";

grant insert on table "public"."paint_colors" to "anon";

grant references on table "public"."paint_colors" to "anon";

grant select on table "public"."paint_colors" to "anon";

grant trigger on table "public"."paint_colors" to "anon";

grant truncate on table "public"."paint_colors" to "anon";

grant update on table "public"."paint_colors" to "anon";

grant delete on table "public"."paint_colors" to "authenticated";

grant insert on table "public"."paint_colors" to "authenticated";

grant references on table "public"."paint_colors" to "authenticated";

grant select on table "public"."paint_colors" to "authenticated";

grant trigger on table "public"."paint_colors" to "authenticated";

grant truncate on table "public"."paint_colors" to "authenticated";

grant update on table "public"."paint_colors" to "authenticated";

grant delete on table "public"."paint_colors" to "service_role";

grant insert on table "public"."paint_colors" to "service_role";

grant references on table "public"."paint_colors" to "service_role";

grant select on table "public"."paint_colors" to "service_role";

grant trigger on table "public"."paint_colors" to "service_role";

grant truncate on table "public"."paint_colors" to "service_role";

grant update on table "public"."paint_colors" to "service_role";

grant delete on table "public"."price_lists" to "anon";

grant insert on table "public"."price_lists" to "anon";

grant references on table "public"."price_lists" to "anon";

grant select on table "public"."price_lists" to "anon";

grant trigger on table "public"."price_lists" to "anon";

grant truncate on table "public"."price_lists" to "anon";

grant update on table "public"."price_lists" to "anon";

grant delete on table "public"."price_lists" to "authenticated";

grant insert on table "public"."price_lists" to "authenticated";

grant references on table "public"."price_lists" to "authenticated";

grant select on table "public"."price_lists" to "authenticated";

grant trigger on table "public"."price_lists" to "authenticated";

grant truncate on table "public"."price_lists" to "authenticated";

grant update on table "public"."price_lists" to "authenticated";

grant delete on table "public"."price_lists" to "service_role";

grant insert on table "public"."price_lists" to "service_role";

grant references on table "public"."price_lists" to "service_role";

grant select on table "public"."price_lists" to "service_role";

grant trigger on table "public"."price_lists" to "service_role";

grant truncate on table "public"."price_lists" to "service_role";

grant update on table "public"."price_lists" to "service_role";

grant delete on table "public"."products_library" to "anon";

grant insert on table "public"."products_library" to "anon";

grant references on table "public"."products_library" to "anon";

grant select on table "public"."products_library" to "anon";

grant trigger on table "public"."products_library" to "anon";

grant truncate on table "public"."products_library" to "anon";

grant update on table "public"."products_library" to "anon";

grant delete on table "public"."products_library" to "authenticated";

grant insert on table "public"."products_library" to "authenticated";

grant references on table "public"."products_library" to "authenticated";

grant select on table "public"."products_library" to "authenticated";

grant trigger on table "public"."products_library" to "authenticated";

grant truncate on table "public"."products_library" to "authenticated";

grant update on table "public"."products_library" to "authenticated";

grant delete on table "public"."products_library" to "service_role";

grant insert on table "public"."products_library" to "service_role";

grant references on table "public"."products_library" to "service_role";

grant select on table "public"."products_library" to "service_role";

grant trigger on table "public"."products_library" to "service_role";

grant truncate on table "public"."products_library" to "service_role";

grant update on table "public"."products_library" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."protocol_damage_points" to "anon";

grant insert on table "public"."protocol_damage_points" to "anon";

grant references on table "public"."protocol_damage_points" to "anon";

grant select on table "public"."protocol_damage_points" to "anon";

grant trigger on table "public"."protocol_damage_points" to "anon";

grant truncate on table "public"."protocol_damage_points" to "anon";

grant update on table "public"."protocol_damage_points" to "anon";

grant delete on table "public"."protocol_damage_points" to "authenticated";

grant insert on table "public"."protocol_damage_points" to "authenticated";

grant references on table "public"."protocol_damage_points" to "authenticated";

grant select on table "public"."protocol_damage_points" to "authenticated";

grant trigger on table "public"."protocol_damage_points" to "authenticated";

grant truncate on table "public"."protocol_damage_points" to "authenticated";

grant update on table "public"."protocol_damage_points" to "authenticated";

grant delete on table "public"."protocol_damage_points" to "service_role";

grant insert on table "public"."protocol_damage_points" to "service_role";

grant references on table "public"."protocol_damage_points" to "service_role";

grant select on table "public"."protocol_damage_points" to "service_role";

grant trigger on table "public"."protocol_damage_points" to "service_role";

grant truncate on table "public"."protocol_damage_points" to "service_role";

grant update on table "public"."protocol_damage_points" to "service_role";

grant delete on table "public"."push_subscriptions" to "anon";

grant insert on table "public"."push_subscriptions" to "anon";

grant references on table "public"."push_subscriptions" to "anon";

grant select on table "public"."push_subscriptions" to "anon";

grant trigger on table "public"."push_subscriptions" to "anon";

grant truncate on table "public"."push_subscriptions" to "anon";

grant update on table "public"."push_subscriptions" to "anon";

grant delete on table "public"."push_subscriptions" to "authenticated";

grant insert on table "public"."push_subscriptions" to "authenticated";

grant references on table "public"."push_subscriptions" to "authenticated";

grant select on table "public"."push_subscriptions" to "authenticated";

grant trigger on table "public"."push_subscriptions" to "authenticated";

grant truncate on table "public"."push_subscriptions" to "authenticated";

grant update on table "public"."push_subscriptions" to "authenticated";

grant delete on table "public"."push_subscriptions" to "service_role";

grant insert on table "public"."push_subscriptions" to "service_role";

grant references on table "public"."push_subscriptions" to "service_role";

grant select on table "public"."push_subscriptions" to "service_role";

grant trigger on table "public"."push_subscriptions" to "service_role";

grant truncate on table "public"."push_subscriptions" to "service_role";

grant update on table "public"."push_subscriptions" to "service_role";

grant delete on table "public"."reminder_templates" to "anon";

grant insert on table "public"."reminder_templates" to "anon";

grant references on table "public"."reminder_templates" to "anon";

grant select on table "public"."reminder_templates" to "anon";

grant trigger on table "public"."reminder_templates" to "anon";

grant truncate on table "public"."reminder_templates" to "anon";

grant update on table "public"."reminder_templates" to "anon";

grant delete on table "public"."reminder_templates" to "authenticated";

grant insert on table "public"."reminder_templates" to "authenticated";

grant references on table "public"."reminder_templates" to "authenticated";

grant select on table "public"."reminder_templates" to "authenticated";

grant trigger on table "public"."reminder_templates" to "authenticated";

grant truncate on table "public"."reminder_templates" to "authenticated";

grant update on table "public"."reminder_templates" to "authenticated";

grant delete on table "public"."reminder_templates" to "service_role";

grant insert on table "public"."reminder_templates" to "service_role";

grant references on table "public"."reminder_templates" to "service_role";

grant select on table "public"."reminder_templates" to "service_role";

grant trigger on table "public"."reminder_templates" to "service_role";

grant truncate on table "public"."reminder_templates" to "service_role";

grant update on table "public"."reminder_templates" to "service_role";

grant delete on table "public"."reservation_changes" to "anon";

grant insert on table "public"."reservation_changes" to "anon";

grant references on table "public"."reservation_changes" to "anon";

grant select on table "public"."reservation_changes" to "anon";

grant trigger on table "public"."reservation_changes" to "anon";

grant truncate on table "public"."reservation_changes" to "anon";

grant update on table "public"."reservation_changes" to "anon";

grant delete on table "public"."reservation_changes" to "authenticated";

grant insert on table "public"."reservation_changes" to "authenticated";

grant references on table "public"."reservation_changes" to "authenticated";

grant select on table "public"."reservation_changes" to "authenticated";

grant trigger on table "public"."reservation_changes" to "authenticated";

grant truncate on table "public"."reservation_changes" to "authenticated";

grant update on table "public"."reservation_changes" to "authenticated";

grant delete on table "public"."reservation_changes" to "service_role";

grant insert on table "public"."reservation_changes" to "service_role";

grant references on table "public"."reservation_changes" to "service_role";

grant select on table "public"."reservation_changes" to "service_role";

grant trigger on table "public"."reservation_changes" to "service_role";

grant truncate on table "public"."reservation_changes" to "service_role";

grant update on table "public"."reservation_changes" to "service_role";

grant delete on table "public"."reservation_events" to "anon";

grant insert on table "public"."reservation_events" to "anon";

grant references on table "public"."reservation_events" to "anon";

grant select on table "public"."reservation_events" to "anon";

grant trigger on table "public"."reservation_events" to "anon";

grant truncate on table "public"."reservation_events" to "anon";

grant update on table "public"."reservation_events" to "anon";

grant delete on table "public"."reservation_events" to "authenticated";

grant insert on table "public"."reservation_events" to "authenticated";

grant references on table "public"."reservation_events" to "authenticated";

grant select on table "public"."reservation_events" to "authenticated";

grant trigger on table "public"."reservation_events" to "authenticated";

grant truncate on table "public"."reservation_events" to "authenticated";

grant update on table "public"."reservation_events" to "authenticated";

grant delete on table "public"."reservation_events" to "service_role";

grant insert on table "public"."reservation_events" to "service_role";

grant references on table "public"."reservation_events" to "service_role";

grant select on table "public"."reservation_events" to "service_role";

grant trigger on table "public"."reservation_events" to "service_role";

grant truncate on table "public"."reservation_events" to "service_role";

grant update on table "public"."reservation_events" to "service_role";

grant delete on table "public"."reservation_photos" to "anon";

grant insert on table "public"."reservation_photos" to "anon";

grant references on table "public"."reservation_photos" to "anon";

grant select on table "public"."reservation_photos" to "anon";

grant trigger on table "public"."reservation_photos" to "anon";

grant truncate on table "public"."reservation_photos" to "anon";

grant update on table "public"."reservation_photos" to "anon";

grant delete on table "public"."reservation_photos" to "authenticated";

grant insert on table "public"."reservation_photos" to "authenticated";

grant references on table "public"."reservation_photos" to "authenticated";

grant select on table "public"."reservation_photos" to "authenticated";

grant trigger on table "public"."reservation_photos" to "authenticated";

grant truncate on table "public"."reservation_photos" to "authenticated";

grant update on table "public"."reservation_photos" to "authenticated";

grant delete on table "public"."reservation_photos" to "service_role";

grant insert on table "public"."reservation_photos" to "service_role";

grant references on table "public"."reservation_photos" to "service_role";

grant select on table "public"."reservation_photos" to "service_role";

grant trigger on table "public"."reservation_photos" to "service_role";

grant truncate on table "public"."reservation_photos" to "service_role";

grant update on table "public"."reservation_photos" to "service_role";

grant delete on table "public"."reservations" to "anon";

grant insert on table "public"."reservations" to "anon";

grant references on table "public"."reservations" to "anon";

grant select on table "public"."reservations" to "anon";

grant trigger on table "public"."reservations" to "anon";

grant truncate on table "public"."reservations" to "anon";

grant update on table "public"."reservations" to "anon";

grant delete on table "public"."reservations" to "authenticated";

grant insert on table "public"."reservations" to "authenticated";

grant references on table "public"."reservations" to "authenticated";

grant select on table "public"."reservations" to "authenticated";

grant trigger on table "public"."reservations" to "authenticated";

grant truncate on table "public"."reservations" to "authenticated";

grant update on table "public"."reservations" to "authenticated";

grant delete on table "public"."reservations" to "service_role";

grant insert on table "public"."reservations" to "service_role";

grant references on table "public"."reservations" to "service_role";

grant select on table "public"."reservations" to "service_role";

grant trigger on table "public"."reservations" to "service_role";

grant truncate on table "public"."reservations" to "service_role";

grant update on table "public"."reservations" to "service_role";

grant delete on table "public"."sales_order_items" to "anon";

grant insert on table "public"."sales_order_items" to "anon";

grant references on table "public"."sales_order_items" to "anon";

grant select on table "public"."sales_order_items" to "anon";

grant trigger on table "public"."sales_order_items" to "anon";

grant truncate on table "public"."sales_order_items" to "anon";

grant update on table "public"."sales_order_items" to "anon";

grant delete on table "public"."sales_order_items" to "authenticated";

grant insert on table "public"."sales_order_items" to "authenticated";

grant references on table "public"."sales_order_items" to "authenticated";

grant select on table "public"."sales_order_items" to "authenticated";

grant trigger on table "public"."sales_order_items" to "authenticated";

grant truncate on table "public"."sales_order_items" to "authenticated";

grant update on table "public"."sales_order_items" to "authenticated";

grant delete on table "public"."sales_order_items" to "service_role";

grant insert on table "public"."sales_order_items" to "service_role";

grant references on table "public"."sales_order_items" to "service_role";

grant select on table "public"."sales_order_items" to "service_role";

grant trigger on table "public"."sales_order_items" to "service_role";

grant truncate on table "public"."sales_order_items" to "service_role";

grant update on table "public"."sales_order_items" to "service_role";

grant delete on table "public"."sales_orders" to "anon";

grant insert on table "public"."sales_orders" to "anon";

grant references on table "public"."sales_orders" to "anon";

grant select on table "public"."sales_orders" to "anon";

grant trigger on table "public"."sales_orders" to "anon";

grant truncate on table "public"."sales_orders" to "anon";

grant update on table "public"."sales_orders" to "anon";

grant delete on table "public"."sales_orders" to "authenticated";

grant insert on table "public"."sales_orders" to "authenticated";

grant references on table "public"."sales_orders" to "authenticated";

grant select on table "public"."sales_orders" to "authenticated";

grant trigger on table "public"."sales_orders" to "authenticated";

grant truncate on table "public"."sales_orders" to "authenticated";

grant update on table "public"."sales_orders" to "authenticated";

grant delete on table "public"."sales_orders" to "service_role";

grant insert on table "public"."sales_orders" to "service_role";

grant references on table "public"."sales_orders" to "service_role";

grant select on table "public"."sales_orders" to "service_role";

grant trigger on table "public"."sales_orders" to "service_role";

grant truncate on table "public"."sales_orders" to "service_role";

grant update on table "public"."sales_orders" to "service_role";

grant delete on table "public"."sales_products" to "anon";

grant insert on table "public"."sales_products" to "anon";

grant references on table "public"."sales_products" to "anon";

grant select on table "public"."sales_products" to "anon";

grant trigger on table "public"."sales_products" to "anon";

grant truncate on table "public"."sales_products" to "anon";

grant update on table "public"."sales_products" to "anon";

grant delete on table "public"."sales_products" to "authenticated";

grant insert on table "public"."sales_products" to "authenticated";

grant references on table "public"."sales_products" to "authenticated";

grant select on table "public"."sales_products" to "authenticated";

grant trigger on table "public"."sales_products" to "authenticated";

grant truncate on table "public"."sales_products" to "authenticated";

grant update on table "public"."sales_products" to "authenticated";

grant delete on table "public"."sales_products" to "service_role";

grant insert on table "public"."sales_products" to "service_role";

grant references on table "public"."sales_products" to "service_role";

grant select on table "public"."sales_products" to "service_role";

grant trigger on table "public"."sales_products" to "service_role";

grant truncate on table "public"."sales_products" to "service_role";

grant update on table "public"."sales_products" to "service_role";

grant delete on table "public"."service_categories" to "anon";

grant insert on table "public"."service_categories" to "anon";

grant references on table "public"."service_categories" to "anon";

grant select on table "public"."service_categories" to "anon";

grant trigger on table "public"."service_categories" to "anon";

grant truncate on table "public"."service_categories" to "anon";

grant update on table "public"."service_categories" to "anon";

grant delete on table "public"."service_categories" to "authenticated";

grant insert on table "public"."service_categories" to "authenticated";

grant references on table "public"."service_categories" to "authenticated";

grant select on table "public"."service_categories" to "authenticated";

grant trigger on table "public"."service_categories" to "authenticated";

grant truncate on table "public"."service_categories" to "authenticated";

grant update on table "public"."service_categories" to "authenticated";

grant delete on table "public"."service_categories" to "service_role";

grant insert on table "public"."service_categories" to "service_role";

grant references on table "public"."service_categories" to "service_role";

grant select on table "public"."service_categories" to "service_role";

grant trigger on table "public"."service_categories" to "service_role";

grant truncate on table "public"."service_categories" to "service_role";

grant update on table "public"."service_categories" to "service_role";

grant delete on table "public"."services" to "anon";

grant insert on table "public"."services" to "anon";

grant references on table "public"."services" to "anon";

grant select on table "public"."services" to "anon";

grant trigger on table "public"."services" to "anon";

grant truncate on table "public"."services" to "anon";

grant update on table "public"."services" to "anon";

grant delete on table "public"."services" to "authenticated";

grant insert on table "public"."services" to "authenticated";

grant references on table "public"."services" to "authenticated";

grant select on table "public"."services" to "authenticated";

grant trigger on table "public"."services" to "authenticated";

grant truncate on table "public"."services" to "authenticated";

grant update on table "public"."services" to "authenticated";

grant delete on table "public"."services" to "service_role";

grant insert on table "public"."services" to "service_role";

grant references on table "public"."services" to "service_role";

grant select on table "public"."services" to "service_role";

grant trigger on table "public"."services" to "service_role";

grant truncate on table "public"."services" to "service_role";

grant update on table "public"."services" to "service_role";

grant delete on table "public"."sms_logs" to "anon";

grant insert on table "public"."sms_logs" to "anon";

grant references on table "public"."sms_logs" to "anon";

grant select on table "public"."sms_logs" to "anon";

grant trigger on table "public"."sms_logs" to "anon";

grant truncate on table "public"."sms_logs" to "anon";

grant update on table "public"."sms_logs" to "anon";

grant delete on table "public"."sms_logs" to "authenticated";

grant insert on table "public"."sms_logs" to "authenticated";

grant references on table "public"."sms_logs" to "authenticated";

grant select on table "public"."sms_logs" to "authenticated";

grant trigger on table "public"."sms_logs" to "authenticated";

grant truncate on table "public"."sms_logs" to "authenticated";

grant update on table "public"."sms_logs" to "authenticated";

grant delete on table "public"."sms_logs" to "service_role";

grant insert on table "public"."sms_logs" to "service_role";

grant references on table "public"."sms_logs" to "service_role";

grant select on table "public"."sms_logs" to "service_role";

grant trigger on table "public"."sms_logs" to "service_role";

grant truncate on table "public"."sms_logs" to "service_role";

grant update on table "public"."sms_logs" to "service_role";

grant delete on table "public"."sms_message_settings" to "anon";

grant insert on table "public"."sms_message_settings" to "anon";

grant references on table "public"."sms_message_settings" to "anon";

grant select on table "public"."sms_message_settings" to "anon";

grant trigger on table "public"."sms_message_settings" to "anon";

grant truncate on table "public"."sms_message_settings" to "anon";

grant update on table "public"."sms_message_settings" to "anon";

grant delete on table "public"."sms_message_settings" to "authenticated";

grant insert on table "public"."sms_message_settings" to "authenticated";

grant references on table "public"."sms_message_settings" to "authenticated";

grant select on table "public"."sms_message_settings" to "authenticated";

grant trigger on table "public"."sms_message_settings" to "authenticated";

grant truncate on table "public"."sms_message_settings" to "authenticated";

grant update on table "public"."sms_message_settings" to "authenticated";

grant delete on table "public"."sms_message_settings" to "service_role";

grant insert on table "public"."sms_message_settings" to "service_role";

grant references on table "public"."sms_message_settings" to "service_role";

grant select on table "public"."sms_message_settings" to "service_role";

grant trigger on table "public"."sms_message_settings" to "service_role";

grant truncate on table "public"."sms_message_settings" to "service_role";

grant update on table "public"."sms_message_settings" to "service_role";

grant delete on table "public"."sms_verification_codes" to "anon";

grant insert on table "public"."sms_verification_codes" to "anon";

grant references on table "public"."sms_verification_codes" to "anon";

grant select on table "public"."sms_verification_codes" to "anon";

grant trigger on table "public"."sms_verification_codes" to "anon";

grant truncate on table "public"."sms_verification_codes" to "anon";

grant update on table "public"."sms_verification_codes" to "anon";

grant delete on table "public"."sms_verification_codes" to "authenticated";

grant insert on table "public"."sms_verification_codes" to "authenticated";

grant references on table "public"."sms_verification_codes" to "authenticated";

grant select on table "public"."sms_verification_codes" to "authenticated";

grant trigger on table "public"."sms_verification_codes" to "authenticated";

grant truncate on table "public"."sms_verification_codes" to "authenticated";

grant update on table "public"."sms_verification_codes" to "authenticated";

grant delete on table "public"."sms_verification_codes" to "service_role";

grant insert on table "public"."sms_verification_codes" to "service_role";

grant references on table "public"."sms_verification_codes" to "service_role";

grant select on table "public"."sms_verification_codes" to "service_role";

grant trigger on table "public"."sms_verification_codes" to "service_role";

grant truncate on table "public"."sms_verification_codes" to "service_role";

grant update on table "public"."sms_verification_codes" to "service_role";

grant delete on table "public"."station_employees" to "anon";

grant insert on table "public"."station_employees" to "anon";

grant references on table "public"."station_employees" to "anon";

grant select on table "public"."station_employees" to "anon";

grant trigger on table "public"."station_employees" to "anon";

grant truncate on table "public"."station_employees" to "anon";

grant update on table "public"."station_employees" to "anon";

grant delete on table "public"."station_employees" to "authenticated";

grant insert on table "public"."station_employees" to "authenticated";

grant references on table "public"."station_employees" to "authenticated";

grant select on table "public"."station_employees" to "authenticated";

grant trigger on table "public"."station_employees" to "authenticated";

grant truncate on table "public"."station_employees" to "authenticated";

grant update on table "public"."station_employees" to "authenticated";

grant delete on table "public"."station_employees" to "service_role";

grant insert on table "public"."station_employees" to "service_role";

grant references on table "public"."station_employees" to "service_role";

grant select on table "public"."station_employees" to "service_role";

grant trigger on table "public"."station_employees" to "service_role";

grant truncate on table "public"."station_employees" to "service_role";

grant update on table "public"."station_employees" to "service_role";

grant delete on table "public"."stations" to "anon";

grant insert on table "public"."stations" to "anon";

grant references on table "public"."stations" to "anon";

grant select on table "public"."stations" to "anon";

grant trigger on table "public"."stations" to "anon";

grant truncate on table "public"."stations" to "anon";

grant update on table "public"."stations" to "anon";

grant delete on table "public"."stations" to "authenticated";

grant insert on table "public"."stations" to "authenticated";

grant references on table "public"."stations" to "authenticated";

grant select on table "public"."stations" to "authenticated";

grant trigger on table "public"."stations" to "authenticated";

grant truncate on table "public"."stations" to "authenticated";

grant update on table "public"."stations" to "authenticated";

grant delete on table "public"."stations" to "service_role";

grant insert on table "public"."stations" to "service_role";

grant references on table "public"."stations" to "service_role";

grant select on table "public"."stations" to "service_role";

grant trigger on table "public"."stations" to "service_role";

grant truncate on table "public"."stations" to "service_role";

grant update on table "public"."stations" to "service_role";

grant delete on table "public"."subscription_plans" to "anon";

grant insert on table "public"."subscription_plans" to "anon";

grant references on table "public"."subscription_plans" to "anon";

grant select on table "public"."subscription_plans" to "anon";

grant trigger on table "public"."subscription_plans" to "anon";

grant truncate on table "public"."subscription_plans" to "anon";

grant update on table "public"."subscription_plans" to "anon";

grant delete on table "public"."subscription_plans" to "authenticated";

grant insert on table "public"."subscription_plans" to "authenticated";

grant references on table "public"."subscription_plans" to "authenticated";

grant select on table "public"."subscription_plans" to "authenticated";

grant trigger on table "public"."subscription_plans" to "authenticated";

grant truncate on table "public"."subscription_plans" to "authenticated";

grant update on table "public"."subscription_plans" to "authenticated";

grant delete on table "public"."subscription_plans" to "service_role";

grant insert on table "public"."subscription_plans" to "service_role";

grant references on table "public"."subscription_plans" to "service_role";

grant select on table "public"."subscription_plans" to "service_role";

grant trigger on table "public"."subscription_plans" to "service_role";

grant truncate on table "public"."subscription_plans" to "service_role";

grant update on table "public"."subscription_plans" to "service_role";

grant delete on table "public"."text_blocks_library" to "anon";

grant insert on table "public"."text_blocks_library" to "anon";

grant references on table "public"."text_blocks_library" to "anon";

grant select on table "public"."text_blocks_library" to "anon";

grant trigger on table "public"."text_blocks_library" to "anon";

grant truncate on table "public"."text_blocks_library" to "anon";

grant update on table "public"."text_blocks_library" to "anon";

grant delete on table "public"."text_blocks_library" to "authenticated";

grant insert on table "public"."text_blocks_library" to "authenticated";

grant references on table "public"."text_blocks_library" to "authenticated";

grant select on table "public"."text_blocks_library" to "authenticated";

grant trigger on table "public"."text_blocks_library" to "authenticated";

grant truncate on table "public"."text_blocks_library" to "authenticated";

grant update on table "public"."text_blocks_library" to "authenticated";

grant delete on table "public"."text_blocks_library" to "service_role";

grant insert on table "public"."text_blocks_library" to "service_role";

grant references on table "public"."text_blocks_library" to "service_role";

grant select on table "public"."text_blocks_library" to "service_role";

grant trigger on table "public"."text_blocks_library" to "service_role";

grant truncate on table "public"."text_blocks_library" to "service_role";

grant update on table "public"."text_blocks_library" to "service_role";

grant delete on table "public"."time_entries" to "anon";

grant insert on table "public"."time_entries" to "anon";

grant references on table "public"."time_entries" to "anon";

grant select on table "public"."time_entries" to "anon";

grant trigger on table "public"."time_entries" to "anon";

grant truncate on table "public"."time_entries" to "anon";

grant update on table "public"."time_entries" to "anon";

grant delete on table "public"."time_entries" to "authenticated";

grant insert on table "public"."time_entries" to "authenticated";

grant references on table "public"."time_entries" to "authenticated";

grant select on table "public"."time_entries" to "authenticated";

grant trigger on table "public"."time_entries" to "authenticated";

grant truncate on table "public"."time_entries" to "authenticated";

grant update on table "public"."time_entries" to "authenticated";

grant delete on table "public"."time_entries" to "service_role";

grant insert on table "public"."time_entries" to "service_role";

grant references on table "public"."time_entries" to "service_role";

grant select on table "public"."time_entries" to "service_role";

grant trigger on table "public"."time_entries" to "service_role";

grant truncate on table "public"."time_entries" to "service_role";

grant update on table "public"."time_entries" to "service_role";

grant delete on table "public"."training_types" to "anon";

grant insert on table "public"."training_types" to "anon";

grant references on table "public"."training_types" to "anon";

grant select on table "public"."training_types" to "anon";

grant trigger on table "public"."training_types" to "anon";

grant truncate on table "public"."training_types" to "anon";

grant update on table "public"."training_types" to "anon";

grant delete on table "public"."training_types" to "authenticated";

grant insert on table "public"."training_types" to "authenticated";

grant references on table "public"."training_types" to "authenticated";

grant select on table "public"."training_types" to "authenticated";

grant trigger on table "public"."training_types" to "authenticated";

grant truncate on table "public"."training_types" to "authenticated";

grant update on table "public"."training_types" to "authenticated";

grant delete on table "public"."training_types" to "service_role";

grant insert on table "public"."training_types" to "service_role";

grant references on table "public"."training_types" to "service_role";

grant select on table "public"."training_types" to "service_role";

grant trigger on table "public"."training_types" to "service_role";

grant truncate on table "public"."training_types" to "service_role";

grant update on table "public"."training_types" to "service_role";

grant delete on table "public"."trainings" to "anon";

grant insert on table "public"."trainings" to "anon";

grant references on table "public"."trainings" to "anon";

grant select on table "public"."trainings" to "anon";

grant trigger on table "public"."trainings" to "anon";

grant truncate on table "public"."trainings" to "anon";

grant update on table "public"."trainings" to "anon";

grant delete on table "public"."trainings" to "authenticated";

grant insert on table "public"."trainings" to "authenticated";

grant references on table "public"."trainings" to "authenticated";

grant select on table "public"."trainings" to "authenticated";

grant trigger on table "public"."trainings" to "authenticated";

grant truncate on table "public"."trainings" to "authenticated";

grant update on table "public"."trainings" to "authenticated";

grant delete on table "public"."trainings" to "service_role";

grant insert on table "public"."trainings" to "service_role";

grant references on table "public"."trainings" to "service_role";

grant select on table "public"."trainings" to "service_role";

grant trigger on table "public"."trainings" to "service_role";

grant truncate on table "public"."trainings" to "service_role";

grant update on table "public"."trainings" to "service_role";

grant delete on table "public"."unified_categories" to "anon";

grant insert on table "public"."unified_categories" to "anon";

grant references on table "public"."unified_categories" to "anon";

grant select on table "public"."unified_categories" to "anon";

grant trigger on table "public"."unified_categories" to "anon";

grant truncate on table "public"."unified_categories" to "anon";

grant update on table "public"."unified_categories" to "anon";

grant delete on table "public"."unified_categories" to "authenticated";

grant insert on table "public"."unified_categories" to "authenticated";

grant references on table "public"."unified_categories" to "authenticated";

grant select on table "public"."unified_categories" to "authenticated";

grant trigger on table "public"."unified_categories" to "authenticated";

grant truncate on table "public"."unified_categories" to "authenticated";

grant update on table "public"."unified_categories" to "authenticated";

grant delete on table "public"."unified_categories" to "service_role";

grant insert on table "public"."unified_categories" to "service_role";

grant references on table "public"."unified_categories" to "service_role";

grant select on table "public"."unified_categories" to "service_role";

grant trigger on table "public"."unified_categories" to "service_role";

grant truncate on table "public"."unified_categories" to "service_role";

grant update on table "public"."unified_categories" to "service_role";

grant delete on table "public"."unified_services" to "anon";

grant insert on table "public"."unified_services" to "anon";

grant references on table "public"."unified_services" to "anon";

grant select on table "public"."unified_services" to "anon";

grant trigger on table "public"."unified_services" to "anon";

grant truncate on table "public"."unified_services" to "anon";

grant update on table "public"."unified_services" to "anon";

grant delete on table "public"."unified_services" to "authenticated";

grant insert on table "public"."unified_services" to "authenticated";

grant references on table "public"."unified_services" to "authenticated";

grant select on table "public"."unified_services" to "authenticated";

grant trigger on table "public"."unified_services" to "authenticated";

grant truncate on table "public"."unified_services" to "authenticated";

grant update on table "public"."unified_services" to "authenticated";

grant delete on table "public"."unified_services" to "service_role";

grant insert on table "public"."unified_services" to "service_role";

grant references on table "public"."unified_services" to "service_role";

grant select on table "public"."unified_services" to "service_role";

grant trigger on table "public"."unified_services" to "service_role";

grant truncate on table "public"."unified_services" to "service_role";

grant update on table "public"."unified_services" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

grant delete on table "public"."vehicle_protocols" to "anon";

grant insert on table "public"."vehicle_protocols" to "anon";

grant references on table "public"."vehicle_protocols" to "anon";

grant select on table "public"."vehicle_protocols" to "anon";

grant trigger on table "public"."vehicle_protocols" to "anon";

grant truncate on table "public"."vehicle_protocols" to "anon";

grant update on table "public"."vehicle_protocols" to "anon";

grant delete on table "public"."vehicle_protocols" to "authenticated";

grant insert on table "public"."vehicle_protocols" to "authenticated";

grant references on table "public"."vehicle_protocols" to "authenticated";

grant select on table "public"."vehicle_protocols" to "authenticated";

grant trigger on table "public"."vehicle_protocols" to "authenticated";

grant truncate on table "public"."vehicle_protocols" to "authenticated";

grant update on table "public"."vehicle_protocols" to "authenticated";

grant delete on table "public"."vehicle_protocols" to "service_role";

grant insert on table "public"."vehicle_protocols" to "service_role";

grant references on table "public"."vehicle_protocols" to "service_role";

grant select on table "public"."vehicle_protocols" to "service_role";

grant trigger on table "public"."vehicle_protocols" to "service_role";

grant truncate on table "public"."vehicle_protocols" to "service_role";

grant update on table "public"."vehicle_protocols" to "service_role";

grant delete on table "public"."workers_settings" to "anon";

grant insert on table "public"."workers_settings" to "anon";

grant references on table "public"."workers_settings" to "anon";

grant select on table "public"."workers_settings" to "anon";

grant trigger on table "public"."workers_settings" to "anon";

grant truncate on table "public"."workers_settings" to "anon";

grant update on table "public"."workers_settings" to "anon";

grant delete on table "public"."workers_settings" to "authenticated";

grant insert on table "public"."workers_settings" to "authenticated";

grant references on table "public"."workers_settings" to "authenticated";

grant select on table "public"."workers_settings" to "authenticated";

grant trigger on table "public"."workers_settings" to "authenticated";

grant truncate on table "public"."workers_settings" to "authenticated";

grant update on table "public"."workers_settings" to "authenticated";

grant delete on table "public"."workers_settings" to "service_role";

grant insert on table "public"."workers_settings" to "service_role";

grant references on table "public"."workers_settings" to "service_role";

grant select on table "public"."workers_settings" to "service_role";

grant trigger on table "public"."workers_settings" to "service_role";

grant truncate on table "public"."workers_settings" to "service_role";

grant update on table "public"."workers_settings" to "service_role";

grant delete on table "public"."yard_vehicles" to "anon";

grant insert on table "public"."yard_vehicles" to "anon";

grant references on table "public"."yard_vehicles" to "anon";

grant select on table "public"."yard_vehicles" to "anon";

grant trigger on table "public"."yard_vehicles" to "anon";

grant truncate on table "public"."yard_vehicles" to "anon";

grant update on table "public"."yard_vehicles" to "anon";

grant delete on table "public"."yard_vehicles" to "authenticated";

grant insert on table "public"."yard_vehicles" to "authenticated";

grant references on table "public"."yard_vehicles" to "authenticated";

grant select on table "public"."yard_vehicles" to "authenticated";

grant trigger on table "public"."yard_vehicles" to "authenticated";

grant truncate on table "public"."yard_vehicles" to "authenticated";

grant update on table "public"."yard_vehicles" to "authenticated";

grant delete on table "public"."yard_vehicles" to "service_role";

grant insert on table "public"."yard_vehicles" to "service_role";

grant references on table "public"."yard_vehicles" to "service_role";

grant select on table "public"."yard_vehicles" to "service_role";

grant trigger on table "public"."yard_vehicles" to "service_role";

grant truncate on table "public"."yard_vehicles" to "service_role";

grant update on table "public"."yard_vehicles" to "service_role";


  create policy "Admins can manage breaks"
  on "public"."breaks"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Breaks viewable by admins"
  on "public"."breaks"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can delete breaks"
  on "public"."breaks"
  as permissive
  for delete
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can insert breaks"
  on "public"."breaks"
  as permissive
  for insert
  to public
with check (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can update breaks"
  on "public"."breaks"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can view breaks"
  on "public"."breaks"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Active car models are viewable by everyone"
  on "public"."car_models"
  as permissive
  for select
  to public
using (((active = true) AND ((status = 'active'::text) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role)))))));



  create policy "Anyone can insert car model proposals"
  on "public"."car_models"
  as permissive
  for insert
  to public
with check (((status = 'proposal'::text) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "Anyone can view active car models"
  on "public"."car_models"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Super admins can manage car models"
  on "public"."car_models"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'super_admin'::public.app_role));



  create policy "Admins can manage closed days"
  on "public"."closed_days"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can view closed_days"
  on "public"."closed_days"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Public can view closed days for calendar"
  on "public"."closed_days"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.instances i
  WHERE ((i.id = closed_days.instance_id) AND (i.active = true)))));



  create policy "Users can manage customer reminders for their instance"
  on "public"."customer_reminders"
  as permissive
  for all
  to authenticated
using (public.can_access_instance(instance_id))
with check (public.can_access_instance(instance_id));



  create policy "Admins can manage vehicles"
  on "public"."customer_vehicles"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can insert customer_vehicles"
  on "public"."customer_vehicles"
  as permissive
  for insert
  to public
with check (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can update customer_vehicles"
  on "public"."customer_vehicles"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can view customer_vehicles"
  on "public"."customer_vehicles"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Admins can manage customers"
  on "public"."customers"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Customers viewable by admins"
  on "public"."customers"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can insert customers"
  on "public"."customers"
  as permissive
  for insert
  to public
with check (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can update customers"
  on "public"."customers"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can view customers"
  on "public"."customers"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Admin can manage breaks"
  on "public"."employee_breaks"
  as permissive
  for all
  to public
using (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))
with check (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id));



  create policy "Hall can insert breaks"
  on "public"."employee_breaks"
  as permissive
  for insert
  to public
with check (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Hall can view breaks"
  on "public"."employee_breaks"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Admin can manage days off"
  on "public"."employee_days_off"
  as permissive
  for all
  to public
using (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))
with check (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id));



  create policy "Hall can create days off"
  on "public"."employee_days_off"
  as permissive
  for insert
  to public
with check (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Hall can delete days off"
  on "public"."employee_days_off"
  as permissive
  for delete
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Hall can view days off"
  on "public"."employee_days_off"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Admin can manage edit logs"
  on "public"."employee_edit_logs"
  as permissive
  for all
  to public
using (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))
with check (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id));



  create policy "Admins can manage employee permissions"
  on "public"."employee_permissions"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Users can view own permissions"
  on "public"."employee_permissions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admin can manage employees"
  on "public"."employees"
  as permissive
  for all
  to public
using (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))
with check (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id));



  create policy "Hall can create employees"
  on "public"."employees"
  as permissive
  for insert
  to public
with check (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Hall can update employees"
  on "public"."employees"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id))
with check (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Hall can view employees"
  on "public"."employees"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Admins can manage followup events"
  on "public"."followup_events"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Followup events viewable by admins"
  on "public"."followup_events"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Admins can manage followup services"
  on "public"."followup_services"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Followup services viewable by admins"
  on "public"."followup_services"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Admins can manage followup tasks"
  on "public"."followup_tasks"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Followup tasks viewable by admins"
  on "public"."followup_tasks"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Admins can manage halls"
  on "public"."halls"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role = 'super_admin'::public.app_role) OR ((user_roles.role = 'admin'::public.app_role) AND (user_roles.instance_id = halls.instance_id)))))));



  create policy "Employees and hall users can view halls"
  on "public"."halls"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role = 'super_admin'::public.app_role) OR ((user_roles.role = ANY (ARRAY['admin'::public.app_role, 'employee'::public.app_role, 'hall'::public.app_role])) AND (user_roles.instance_id = halls.instance_id)))))));



  create policy "Admins can manage instance features"
  on "public"."instance_features"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Anyone can read enabled features"
  on "public"."instance_features"
  as permissive
  for select
  to public
using ((enabled = true));



  create policy "Instance admins can view their subscription"
  on "public"."instance_subscriptions"
  as permissive
  for select
  to public
using ((instance_id IN ( SELECT profiles.instance_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));



  create policy "Super admins can manage all subscriptions"
  on "public"."instance_subscriptions"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role)))));



  create policy "Admins can read own instance"
  on "public"."instances"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'admin'::public.app_role, id));



  create policy "Admins can update own instance"
  on "public"."instances"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'admin'::public.app_role, id))
with check (public.has_instance_role(auth.uid(), 'admin'::public.app_role, id));



  create policy "Employees can view their instance"
  on "public"."instances"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, id));



  create policy "Instances are viewable by everyone"
  on "public"."instances"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Super admins can manage instances"
  on "public"."instances"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'super_admin'::public.app_role));



  create policy "instances_public_via_offers"
  on "public"."instances"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM public.offers o
  WHERE ((o.instance_id = instances.id) AND (o.public_token IS NOT NULL)))));



  create policy "Admins can view login attempts for their instance"
  on "public"."login_attempts"
  as permissive
  for select
  to authenticated
using (public.can_access_instance(instance_id));



  create policy "Admins can create notifications"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check (public.can_access_instance(instance_id));



  create policy "Admins can delete notifications for their instance"
  on "public"."notifications"
  as permissive
  for delete
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Admins can update notifications for their instance"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Admins can view notifications for their instance"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can update notifications"
  on "public"."notifications"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can view notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Offer history follows offer access"
  on "public"."offer_history"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.offers o
  WHERE ((o.id = offer_history.offer_id) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, o.instance_id))))));



  create policy "System can create offer history via trigger"
  on "public"."offer_history"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.offers o
  WHERE ((o.id = offer_history.offer_id) AND public.can_access_instance(o.instance_id)))));



  create policy "offer_history_insert"
  on "public"."offer_history"
  as permissive
  for insert
  to public
with check (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_history_select"
  on "public"."offer_history"
  as permissive
  for select
  to public
using (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "Offer items follow option access"
  on "public"."offer_option_items"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.offer_options oo
     JOIN public.offers o ON ((o.id = oo.offer_id)))
  WHERE ((oo.id = offer_option_items.option_id) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, o.instance_id))))));



  create policy "Public can view offer option items via valid offer"
  on "public"."offer_option_items"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM (public.offer_options oo
     JOIN public.offers o ON ((o.id = oo.offer_id)))
  WHERE ((oo.id = offer_option_items.option_id) AND (o.public_token IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid())))));



  create policy "offer_option_items_delete"
  on "public"."offer_option_items"
  as permissive
  for delete
  to public
using (((public.get_option_instance_id(option_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_option_items_insert"
  on "public"."offer_option_items"
  as permissive
  for insert
  to public
with check (((public.get_option_instance_id(option_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_option_items_public"
  on "public"."offer_option_items"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM (public.offer_options oo
     JOIN public.offers o ON ((o.id = oo.offer_id)))
  WHERE ((oo.id = offer_option_items.option_id) AND (o.public_token IS NOT NULL)))));



  create policy "offer_option_items_select"
  on "public"."offer_option_items"
  as permissive
  for select
  to public
using (((public.get_option_instance_id(option_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_option_items_update"
  on "public"."offer_option_items"
  as permissive
  for update
  to public
using (((public.get_option_instance_id(option_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "Offer options follow offer access"
  on "public"."offer_options"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.offers o
  WHERE ((o.id = offer_options.offer_id) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, o.instance_id))))));



  create policy "Public can view offer options via valid offer"
  on "public"."offer_options"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.offers
  WHERE ((offers.id = offer_options.offer_id) AND (offers.public_token IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid())))));



  create policy "offer_options_delete"
  on "public"."offer_options"
  as permissive
  for delete
  to public
using (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_options_insert"
  on "public"."offer_options"
  as permissive
  for insert
  to public
with check (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_options_public"
  on "public"."offer_options"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM public.offers o
  WHERE ((o.id = offer_options.offer_id) AND (o.public_token IS NOT NULL)))));



  create policy "offer_options_select"
  on "public"."offer_options"
  as permissive
  for select
  to public
using (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_options_update"
  on "public"."offer_options"
  as permissive
  for update
  to public
using (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "Admins can manage product categories"
  on "public"."offer_product_categories"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Anyone can view active categories"
  on "public"."offer_product_categories"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Users can update offer reminders of their instance"
  on "public"."offer_reminders"
  as permissive
  for update
  to public
using ((public.is_super_admin() OR public.can_access_instance(instance_id)));



  create policy "Users can view offer reminders of their instance"
  on "public"."offer_reminders"
  as permissive
  for select
  to public
using ((public.is_super_admin() OR public.can_access_instance(instance_id)));



  create policy "Admins can manage scope extra products"
  on "public"."offer_scope_extra_products"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Anyone can view scope extra products"
  on "public"."offer_scope_extra_products"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can manage scope extras"
  on "public"."offer_scope_extras"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Anyone can view scope extras"
  on "public"."offer_scope_extras"
  as permissive
  for select
  to public
using (true);



  create policy "Users can manage offer scope products for their instance"
  on "public"."offer_scope_products"
  as permissive
  for all
  to public
using (public.can_access_instance(instance_id))
with check (public.can_access_instance(instance_id));



  create policy "Users can view offer scope products for their instance"
  on "public"."offer_scope_products"
  as permissive
  for select
  to public
using (public.can_access_instance(instance_id));



  create policy "Admins can manage scope variant products"
  on "public"."offer_scope_variant_products"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Anyone can view scope variant products"
  on "public"."offer_scope_variant_products"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can manage scope variants"
  on "public"."offer_scope_variants"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Anyone can view scope variants"
  on "public"."offer_scope_variants"
  as permissive
  for select
  to public
using (true);



  create policy "Anyone can view active scopes"
  on "public"."offer_scopes"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Instance admins can manage their scopes"
  on "public"."offer_scopes"
  as permissive
  for all
  to public
using (((instance_id IS NOT NULL) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))));



  create policy "Super admins can manage global scopes"
  on "public"."offer_scopes"
  as permissive
  for all
  to public
using (((source = 'global'::text) AND (instance_id IS NULL) AND public.has_role(auth.uid(), 'super_admin'::public.app_role)));



  create policy "offer_scopes_via_offers"
  on "public"."offer_scopes"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM (public.offer_options oo
     JOIN public.offers o ON ((o.id = oo.offer_id)))
  WHERE ((oo.scope_id = offer_scopes.id) AND (o.public_token IS NOT NULL)))));



  create policy "Offer text blocks follow offer access"
  on "public"."offer_text_blocks"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.offers o
  WHERE ((o.id = offer_text_blocks.offer_id) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, o.instance_id))))));



  create policy "Public can view offer text blocks via valid offer"
  on "public"."offer_text_blocks"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.offers
  WHERE ((offers.id = offer_text_blocks.offer_id) AND (offers.public_token IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid())))));



  create policy "offer_text_blocks_delete"
  on "public"."offer_text_blocks"
  as permissive
  for delete
  to public
using (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_text_blocks_insert"
  on "public"."offer_text_blocks"
  as permissive
  for insert
  to public
with check (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_text_blocks_select"
  on "public"."offer_text_blocks"
  as permissive
  for select
  to public
using (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "offer_text_blocks_update"
  on "public"."offer_text_blocks"
  as permissive
  for update
  to public
using (((public.get_offer_instance_id(offer_id) IN ( SELECT user_roles.instance_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.instance_id IS NOT NULL)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));



  create policy "Admins can manage offer variants"
  on "public"."offer_variants"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Anyone can view active variants"
  on "public"."offer_variants"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Admins can view offer views"
  on "public"."offer_views"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Public can insert offer views"
  on "public"."offer_views"
  as permissive
  for insert
  to public
with check (true);



  create policy "Public can update own offer views"
  on "public"."offer_views"
  as permissive
  for update
  to public
using (true);



  create policy "Admins can manage offers"
  on "public"."offers"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Public update offer via token"
  on "public"."offers"
  as permissive
  for update
  to public
using ((public_token IS NOT NULL))
with check ((public_token IS NOT NULL));



  create policy "Public view offers with token"
  on "public"."offers"
  as permissive
  for select
  to public
using (((public_token IS NOT NULL) OR public.can_access_instance(instance_id)));



  create policy "offers_public_by_token"
  on "public"."offers"
  as permissive
  for select
  to anon
using ((public_token IS NOT NULL));



  create policy "Anyone can view paint colors"
  on "public"."paint_colors"
  as permissive
  for select
  to public
using (true);



  create policy "Super admins can manage paint colors"
  on "public"."paint_colors"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'super_admin'::public.app_role));



  create policy "Instance admins can delete own price_lists"
  on "public"."price_lists"
  as permissive
  for delete
  to public
using (((instance_id IS NOT NULL) AND public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id) AND (is_global = false)));



  create policy "Instance admins can insert own price_lists"
  on "public"."price_lists"
  as permissive
  for insert
  to public
with check (((instance_id IS NOT NULL) AND public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id) AND (is_global = false)));



  create policy "Instance admins can update own price_lists"
  on "public"."price_lists"
  as permissive
  for update
  to public
using (((instance_id IS NOT NULL) AND public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id) AND (is_global = false)));



  create policy "Instance admins can view global price_lists"
  on "public"."price_lists"
  as permissive
  for select
  to public
using ((is_global = true));



  create policy "Instance admins can view own price_lists"
  on "public"."price_lists"
  as permissive
  for select
  to public
using (((instance_id IS NOT NULL) AND public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Super admins full access on price_lists"
  on "public"."price_lists"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'super_admin'::public.app_role));



  create policy "Admins can manage instance products"
  on "public"."products_library"
  as permissive
  for all
  to public
using (((instance_id IS NOT NULL) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))));



  create policy "Global products readable by everyone"
  on "public"."products_library"
  as permissive
  for select
  to public
using (((source = 'global'::text) AND (instance_id IS NULL) AND (active = true)));



  create policy "Instance products readable by admins"
  on "public"."products_library"
  as permissive
  for select
  to public
using (((instance_id IS NOT NULL) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))));



  create policy "Public can read products via offer items"
  on "public"."products_library"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.offer_option_items ooi
  WHERE (ooi.product_id = products_library.id))));



  create policy "Super admins can manage global products"
  on "public"."products_library"
  as permissive
  for all
  to public
using (((source = 'global'::text) AND (instance_id IS NULL) AND public.has_role(auth.uid(), 'super_admin'::public.app_role)));



  create policy "Anyone can lookup profile by username"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((username IS NOT NULL));



  create policy "Instance admins can update instance profiles"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR ((instance_id IS NOT NULL) AND public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))));



  create policy "Instance admins can view instance profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR ((instance_id IS NOT NULL) AND public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))));



  create policy "Super admins can view all profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (public.has_role(auth.uid(), 'super_admin'::public.app_role));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Public read access to damage points"
  on "public"."protocol_damage_points"
  as permissive
  for select
  to public
using (true);



  create policy "Users can create damage points for their protocols"
  on "public"."protocol_damage_points"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.vehicle_protocols vp
  WHERE ((vp.id = protocol_damage_points.protocol_id) AND public.can_access_instance(vp.instance_id)))));



  create policy "Users can delete damage points of their protocols"
  on "public"."protocol_damage_points"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.vehicle_protocols vp
  WHERE ((vp.id = protocol_damage_points.protocol_id) AND public.can_access_instance(vp.instance_id)))));



  create policy "Users can update damage points of their protocols"
  on "public"."protocol_damage_points"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.vehicle_protocols vp
  WHERE ((vp.id = protocol_damage_points.protocol_id) AND public.can_access_instance(vp.instance_id)))));



  create policy "Users can view damage points of their protocols"
  on "public"."protocol_damage_points"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.vehicle_protocols vp
  WHERE ((vp.id = protocol_damage_points.protocol_id) AND public.can_access_instance(vp.instance_id)))));



  create policy "Users can delete own subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view own subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can create reminder templates for their instance"
  on "public"."reminder_templates"
  as permissive
  for insert
  to public
with check ((public.is_super_admin() OR public.can_access_instance(instance_id)));



  create policy "Users can delete reminder templates of their instance"
  on "public"."reminder_templates"
  as permissive
  for delete
  to public
using ((public.is_super_admin() OR public.can_access_instance(instance_id)));



  create policy "Users can update reminder templates of their instance"
  on "public"."reminder_templates"
  as permissive
  for update
  to public
using ((public.is_super_admin() OR public.can_access_instance(instance_id)));



  create policy "Users can view reminder templates of their instance"
  on "public"."reminder_templates"
  as permissive
  for select
  to public
using ((public.is_super_admin() OR public.can_access_instance(instance_id)));



  create policy "Admins can read own instance changes"
  on "public"."reservation_changes"
  as permissive
  for select
  to public
using (public.can_access_instance(instance_id));



  create policy "Public can insert reservation_events"
  on "public"."reservation_events"
  as permissive
  for insert
  to public
with check (((reservation_id IS NOT NULL) AND (instance_id IS NOT NULL) AND (instance_id = public.get_reservation_instance_id(reservation_id)) AND (event_type = ANY (ARRAY['viewed'::text, 'cancelled'::text]))));



  create policy "Super admin can read reservation_events"
  on "public"."reservation_events"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role)))));



  create policy "Admins can manage reservations"
  on "public"."reservations"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can insert reservations"
  on "public"."reservations"
  as permissive
  for insert
  to public
with check (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can update reservations"
  on "public"."reservations"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can view reservations"
  on "public"."reservations"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Hall can update reservation workflow fields"
  on "public"."reservations"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id))
with check (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Hall can view reservations"
  on "public"."reservations"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Public can create change request"
  on "public"."reservations"
  as permissive
  for insert
  to public
with check (((status = 'change_requested'::public.reservation_status) AND (original_reservation_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.reservations r
  WHERE (r.id = r.original_reservation_id)))));



  create policy "Public can view reservation by confirmation_code"
  on "public"."reservations"
  as permissive
  for select
  to public
using (true);



  create policy "Reservations viewable by admins"
  on "public"."reservations"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Admins can manage sales order items"
  on "public"."sales_order_items"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.sales_orders so
  WHERE ((so.id = sales_order_items.order_id) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, so.instance_id))))));



  create policy "Admins can manage sales orders"
  on "public"."sales_orders"
  as permissive
  for all
  to authenticated
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Users can manage sales products for their instance"
  on "public"."sales_products"
  as permissive
  for all
  to authenticated
using (public.can_access_instance(instance_id))
with check (public.can_access_instance(instance_id));



  create policy "Admins can manage categories"
  on "public"."service_categories"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Categories are viewable by everyone"
  on "public"."service_categories"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Employees can view service_categories"
  on "public"."service_categories"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Admins can manage services"
  on "public"."services"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can view services"
  on "public"."services"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Services are viewable by everyone"
  on "public"."services"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Admins can view SMS logs"
  on "public"."sms_logs"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Admins can manage SMS settings"
  on "public"."sms_message_settings"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "SMS settings viewable by admins"
  on "public"."sms_message_settings"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Admins can view verification codes"
  on "public"."sms_verification_codes"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))));



  create policy "station_employees_access"
  on "public"."station_employees"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.stations s
  WHERE ((s.id = station_employees.station_id) AND public.can_access_instance(s.instance_id)))));



  create policy "Admins can manage stations"
  on "public"."stations"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can view stations"
  on "public"."stations"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Stations are viewable by everyone"
  on "public"."stations"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Anyone can view active subscription plans"
  on "public"."subscription_plans"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Super admins can manage subscription plans"
  on "public"."subscription_plans"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role)))));



  create policy "Admins can manage instance text blocks"
  on "public"."text_blocks_library"
  as permissive
  for all
  to public
using (((instance_id IS NOT NULL) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))));



  create policy "Global text blocks readable by everyone"
  on "public"."text_blocks_library"
  as permissive
  for select
  to public
using (((source = 'global'::text) AND (instance_id IS NULL) AND (active = true)));



  create policy "Instance text blocks readable by admins"
  on "public"."text_blocks_library"
  as permissive
  for select
  to public
using (((instance_id IS NOT NULL) AND (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))));



  create policy "Super admins can manage global text blocks"
  on "public"."text_blocks_library"
  as permissive
  for all
  to public
using (((source = 'global'::text) AND (instance_id IS NULL) AND public.has_role(auth.uid(), 'super_admin'::public.app_role)));



  create policy "Admin can manage time entries"
  on "public"."time_entries"
  as permissive
  for all
  to public
using (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))
with check (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id));



  create policy "Hall can insert time entries"
  on "public"."time_entries"
  as permissive
  for insert
  to public
with check (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Hall can update time entries"
  on "public"."time_entries"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Hall can view time entries"
  on "public"."time_entries"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Admins can manage training types"
  on "public"."training_types"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can view training types"
  on "public"."training_types"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Hall can view training types"
  on "public"."training_types"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Admins can manage trainings"
  on "public"."trainings"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can view trainings"
  on "public"."trainings"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Hall can view trainings"
  on "public"."trainings"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Admins can manage categories"
  on "public"."unified_categories"
  as permissive
  for all
  to public
using (public.can_access_instance(instance_id));



  create policy "Users can view categories for their instance"
  on "public"."unified_categories"
  as permissive
  for select
  to public
using (public.can_access_instance(instance_id));



  create policy "Admins can manage services"
  on "public"."unified_services"
  as permissive
  for all
  to public
using (public.can_access_instance(instance_id));



  create policy "Public can read service descriptions"
  on "public"."unified_services"
  as permissive
  for select
  to anon
using (true);



  create policy "Users can view services for their instance"
  on "public"."unified_services"
  as permissive
  for select
  to public
using (public.can_access_instance(instance_id));



  create policy "Super admins can manage roles"
  on "public"."user_roles"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'super_admin'::public.app_role));



  create policy "Users can view own roles"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Public read access to protocols via token"
  on "public"."vehicle_protocols"
  as permissive
  for select
  to public
using (true);



  create policy "Users can create protocols for their instance"
  on "public"."vehicle_protocols"
  as permissive
  for insert
  to public
with check (public.can_access_instance(instance_id));



  create policy "Users can delete protocols of their instance"
  on "public"."vehicle_protocols"
  as permissive
  for delete
  to public
using (public.can_access_instance(instance_id));



  create policy "Users can update protocols of their instance"
  on "public"."vehicle_protocols"
  as permissive
  for update
  to public
using (public.can_access_instance(instance_id));



  create policy "Users can view protocols of their instance"
  on "public"."vehicle_protocols"
  as permissive
  for select
  to public
using (public.can_access_instance(instance_id));



  create policy "Admin can manage workers settings"
  on "public"."workers_settings"
  as permissive
  for all
  to public
using (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id))
with check (public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id));



  create policy "Hall can view workers settings"
  on "public"."workers_settings"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'hall'::public.app_role, instance_id));



  create policy "Admins can manage yard vehicles"
  on "public"."yard_vehicles"
  as permissive
  for all
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));



  create policy "Employees can delete yard_vehicles"
  on "public"."yard_vehicles"
  as permissive
  for delete
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can insert yard_vehicles"
  on "public"."yard_vehicles"
  as permissive
  for insert
  to public
with check (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can update yard_vehicles"
  on "public"."yard_vehicles"
  as permissive
  for update
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Employees can view yard_vehicles"
  on "public"."yard_vehicles"
  as permissive
  for select
  to public
using (public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id));



  create policy "Yard vehicles viewable by admins"
  on "public"."yard_vehicles"
  as permissive
  for select
  to public
using ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)));


CREATE TRIGGER update_breaks_updated_at BEFORE UPDATE ON public.breaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_models_updated_at BEFORE UPDATE ON public.car_models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_vehicles_updated_at BEFORE UPDATE ON public.customer_vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_permissions_updated_at BEFORE UPDATE ON public.employee_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_followup_events_updated_at BEFORE UPDATE ON public.followup_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_followup_services_updated_at BEFORE UPDATE ON public.followup_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_followup_tasks_updated_at BEFORE UPDATE ON public.followup_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_halls_updated_at BEFORE UPDATE ON public.halls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instance_features_updated_at BEFORE UPDATE ON public.instance_features FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_generate_public_api_key BEFORE INSERT ON public.instances FOR EACH ROW EXECUTE FUNCTION public.generate_public_api_key();

CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON public.instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_option_items_updated_at BEFORE UPDATE ON public.offer_option_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_options_updated_at BEFORE UPDATE ON public.offer_options FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_product_categories_updated_at BEFORE UPDATE ON public.offer_product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_scope_extra_products_updated_at BEFORE UPDATE ON public.offer_scope_extra_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_scope_extras_updated_at BEFORE UPDATE ON public.offer_scope_extras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_scope_products_updated_at BEFORE UPDATE ON public.offer_scope_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_scope_variant_products_updated_at BEFORE UPDATE ON public.offer_scope_variant_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_scopes_updated_at BEFORE UPDATE ON public.offer_scopes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_variants_updated_at BEFORE UPDATE ON public.offer_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER t_set_offers_public_token BEFORE INSERT ON public.offers FOR EACH ROW EXECUTE FUNCTION public.set_offers_public_token();

CREATE TRIGGER trigger_offer_history AFTER INSERT OR UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.create_offer_history_entry();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at BEFORE UPDATE ON public.price_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_library_updated_at BEFORE UPDATE ON public.products_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminder_templates_updated_at BEFORE UPDATE ON public.reminder_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_reservation_completed AFTER UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.handle_reservation_completed();

CREATE TRIGGER trg_guard_hall_reservation_update BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.guard_hall_reservation_update();

CREATE TRIGGER trg_reservation_created AFTER INSERT ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.log_reservation_created();

CREATE TRIGGER trg_reservation_no_show AFTER UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_customer_no_show_flag();

CREATE TRIGGER trg_reservation_updated AFTER UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.log_reservation_updated();

CREATE TRIGGER trigger_reservation_notification AFTER INSERT ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.create_reservation_notification();

CREATE TRIGGER trigger_reset_reminder_flags BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.reset_reminder_flags();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sms_message_settings_updated_at BEFORE UPDATE ON public.sms_message_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER enforce_station_limit BEFORE INSERT ON public.stations FOR EACH ROW EXECUTE FUNCTION public.check_station_limit();

CREATE TRIGGER update_text_blocks_library_updated_at BEFORE UPDATE ON public.text_blocks_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_time_entry_number BEFORE INSERT ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.set_time_entry_number();

CREATE TRIGGER validate_time_entry_overlap BEFORE INSERT OR UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.validate_time_entry_overlap();

CREATE TRIGGER update_unified_categories_updated_at BEFORE UPDATE ON public.unified_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unified_services_updated_at BEFORE UPDATE ON public.unified_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_protocols_updated_at BEFORE UPDATE ON public.vehicle_protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yard_vehicles_updated_at BEFORE UPDATE ON public.yard_vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



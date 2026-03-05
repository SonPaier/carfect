
ALTER TABLE public.sales_order_items ADD COLUMN vehicle text;
ALTER TABLE public.sales_orders ADD COLUMN delivery_type text DEFAULT 'shipping';

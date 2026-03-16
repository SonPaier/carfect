-- Prevent duplicate order numbers within an instance
CREATE UNIQUE INDEX IF NOT EXISTS sales_orders_instance_order_number_uniq
  ON sales_orders (instance_id, order_number);

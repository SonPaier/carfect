-- Extend sales_orders payment_status to support collective (bulk) invoicing
DO $$ BEGIN
  ALTER TABLE sales_orders
    DROP CONSTRAINT IF EXISTS sales_orders_payment_status_check;

  ALTER TABLE sales_orders
    ADD CONSTRAINT sales_orders_payment_status_check
    CHECK (payment_status IN ('unpaid', 'paid', 'collective', 'collective_paid'));
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

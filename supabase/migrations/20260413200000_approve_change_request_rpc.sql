-- Atomic RPC for approving a reservation change request.
-- Swaps confirmation codes between original and change-request reservations,
-- confirms the change request, and cancels the original — all in one transaction.

CREATE OR REPLACE FUNCTION approve_change_request(
  p_change_request_id uuid,
  p_original_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_original_code text;
  v_new_code text;
  v_temp_code text;
BEGIN
  -- Lock both rows to prevent concurrent modifications
  SELECT confirmation_code INTO v_original_code
    FROM reservations WHERE id = p_original_id FOR UPDATE;

  SELECT confirmation_code INTO v_new_code
    FROM reservations WHERE id = p_change_request_id FOR UPDATE;

  IF v_original_code IS NULL OR v_new_code IS NULL THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  -- Use temp code to avoid unique constraint conflict during swap
  v_temp_code := 'TEMP_' || extract(epoch from now())::text;

  -- Step 1: Set original's code to temp
  UPDATE reservations
    SET confirmation_code = v_temp_code
    WHERE id = p_original_id;

  -- Step 2: Confirm change request with original's code
  UPDATE reservations
    SET confirmation_code = v_original_code,
        original_reservation_id = NULL,
        status = 'confirmed',
        confirmed_at = now()
    WHERE id = p_change_request_id;

  -- Step 3: Cancel original with new code
  UPDATE reservations
    SET status = 'cancelled',
        cancelled_at = now(),
        confirmation_code = v_new_code
    WHERE id = p_original_id;
END;
$$;

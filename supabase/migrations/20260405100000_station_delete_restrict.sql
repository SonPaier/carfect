-- Enforce RESTRICT on station deletion when reservations or trainings exist
-- reservations.station_id already has NO ACTION (default), make it explicit RESTRICT
-- trainings.station_id already has NO ACTION (default), make it explicit RESTRICT

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_station_id_fkey,
  ADD CONSTRAINT reservations_station_id_fkey
    FOREIGN KEY (station_id) REFERENCES public.stations(id)
    ON DELETE RESTRICT;

ALTER TABLE public.trainings
  DROP CONSTRAINT IF EXISTS trainings_station_id_fkey,
  ADD CONSTRAINT trainings_station_id_fkey
    FOREIGN KEY (station_id) REFERENCES public.stations(id)
    ON DELETE RESTRICT;

USE campus_share;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS quantity INT UNSIGNED NOT NULL DEFAULT 1 AFTER location,
  ADD COLUMN IF NOT EXISTS location_x DECIMAL(5,2) NULL AFTER quantity,
  ADD COLUMN IF NOT EXISTS location_y DECIMAL(5,2) NULL AFTER location_x;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS location_x DECIMAL(5,2) NULL AFTER location,
  ADD COLUMN IF NOT EXISTS location_y DECIMAL(5,2) NULL AFTER location_x;

UPDATE items SET status = 'hidden' WHERE status = 'reserved';

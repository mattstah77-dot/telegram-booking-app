-- Create partial unique index to prevent double booking
-- Only applies to active bookings (pending or confirmed status)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
ON bookings (business_id, date, start_time) 
WHERE status IN ('pending', 'confirmed');

-- Migration: Add reg_hours, ot1_hours, and department to shifts table
-- Run this if you already have the shifts table created

-- Add new columns if they don't exist
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS reg_hours FLOAT8,
ADD COLUMN IF NOT EXISTS ot1_hours FLOAT8,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Update existing shifts to set reg_hours = hours if reg_hours is null
UPDATE shifts 
SET reg_hours = hours 
WHERE reg_hours IS NULL;

-- Set ot1_hours to 0 for existing shifts where it's null
UPDATE shifts 
SET ot1_hours = 0 
WHERE ot1_hours IS NULL;


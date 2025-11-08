-- PayLog Database Schema
-- Run this in your Supabase SQL Editor

-- Disable RLS for all tables (since we're using service role key)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Settings table (singleton)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  hourly_rate FLOAT8 DEFAULT 15.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (id, hourly_rate) 
VALUES ('singleton', 15.0)
ON CONFLICT (id) DO NOTHING;

-- Pay periods table
CREATE TABLE IF NOT EXISTS pay_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_hours FLOAT8 NOT NULL DEFAULT 0,
  expected_pay FLOAT8 NOT NULL DEFAULT 0,
  actual_pay FLOAT8,
  difference FLOAT8,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_period_id UUID NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_in TEXT NOT NULL,
  time_out TEXT NOT NULL,
  hours FLOAT8 NOT NULL,
  reg_hours FLOAT8,
  ot1_hours FLOAT8,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deductions table
CREATE TABLE IF NOT EXISTS deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_period_id UUID NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount FLOAT8 NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shifts_pay_period_id ON shifts(pay_period_id);
CREATE INDEX IF NOT EXISTS idx_pay_periods_start_date ON pay_periods(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_pay_periods_end_date ON pay_periods(end_date DESC);
CREATE INDEX IF NOT EXISTS idx_deductions_pay_period_id ON deductions(pay_period_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


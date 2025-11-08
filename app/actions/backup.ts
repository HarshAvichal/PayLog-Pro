'use server';

import { createServerClient } from '@/lib/supabase/server';

export interface BackupData {
  payPeriods: any[];
  shifts: any[];
  settings: any;
}

export async function exportBackup(): Promise<BackupData | null> {
  try {
    const supabase = createServerClient();

    // Fetch all data
    const [payPeriodsResult, shiftsResult, settingsResult] = await Promise.all([
      supabase.from('pay_periods').select('*').order('start_date', { ascending: false }),
      supabase.from('shifts').select('*').order('date', { ascending: true }),
      supabase.from('settings').select('*').eq('id', 'singleton').single(),
    ]);

    if (payPeriodsResult.error) {
      throw new Error(`Failed to fetch pay periods: ${payPeriodsResult.error.message}`);
    }
    if (shiftsResult.error) {
      throw new Error(`Failed to fetch shifts: ${shiftsResult.error.message}`);
    }

    return {
      payPeriods: payPeriodsResult.data || [],
      shifts: shiftsResult.data || [],
      settings: settingsResult.data || { id: 'singleton', hourly_rate: 15.0 },
    };
  } catch (error) {
    console.error('Error exporting backup:', error);
    return null;
  }
}

export async function importBackup(backupData: BackupData) {
  try {
    const supabase = createServerClient();

    // Start transaction-like operations
    const errors: string[] = [];

    // Update settings
    if (backupData.settings) {
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert(backupData.settings);

      if (settingsError) {
        errors.push(`Settings: ${settingsError.message}`);
      }
    }

    // Delete existing data (optional - you might want to merge instead)
    // For now, we'll just insert/update

    // Insert pay periods
    if (backupData.payPeriods && backupData.payPeriods.length > 0) {
      // First, delete existing pay periods to avoid duplicates
      // Or you could check for existing IDs and update instead
      const { error: deleteError } = await supabase
        .from('pay_periods')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        errors.push(`Delete pay periods: ${deleteError.message}`);
      } else {
        const { error: periodsError } = await supabase
          .from('pay_periods')
          .insert(backupData.payPeriods);

        if (periodsError) {
          errors.push(`Pay periods: ${periodsError.message}`);
        }
      }
    }

    // Insert shifts
    if (backupData.shifts && backupData.shifts.length > 0) {
      const { error: deleteShiftsError } = await supabase
        .from('shifts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteShiftsError) {
        errors.push(`Delete shifts: ${deleteShiftsError.message}`);
      } else {
        const { error: shiftsError } = await supabase
          .from('shifts')
          .insert(backupData.shifts);

        if (shiftsError) {
          errors.push(`Shifts: ${shiftsError.message}`);
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join('; '),
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error importing backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


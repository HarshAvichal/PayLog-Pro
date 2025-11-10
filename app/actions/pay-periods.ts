'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath, unstable_noStore } from 'next/cache';
import { z } from 'zod';

const payPeriodSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  totalHours: z.number(),
  expectedPay: z.number(),
  actualPay: z.number().optional(),
  notes: z.string().optional(),
});

const shiftSchema = z.object({
  date: z.string(),
  timeIn: z.string(),
  timeOut: z.string(),
  hours: z.number(),
  regHours: z.number().optional(),
  ot1Hours: z.number().optional(),
  department: z.string().optional(),
});

export async function checkPayPeriodExists(startDate: string, endDate: string) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('pay_periods')
      .select('id')
      .eq('start_date', startDate)
      .eq('end_date', endDate)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check pay period: ${error.message}`);
    }

    return { exists: !!data, data };
  } catch (error) {
    return { exists: false, data: null };
  }
}

export async function createPayPeriod(data: {
  startDate: string;
  endDate: string;
  totalHours: number;
  expectedPay: number;
  actualPay?: number;
  notes?: string;
  shifts: Array<{
    date: string;
    timeIn: string;
    timeOut: string;
    hours: number;
    regHours?: number;
    ot1Hours?: number;
    department?: string;
  }>;
}) {
  try {
    const supabase = createServerClient();
    
    const existsCheck = await checkPayPeriodExists(data.startDate, data.endDate);
    if (existsCheck.exists) {
      return {
        success: false,
        error: 'A pay period with this date range already exists.',
        duplicate: true,
      };
    }
    
    const payPeriodData = payPeriodSchema.parse({
      startDate: data.startDate,
      endDate: data.endDate,
      totalHours: data.totalHours,
      expectedPay: data.expectedPay,
      actualPay: data.actualPay,
      notes: data.notes,
    });

    const difference = payPeriodData.actualPay
      ? payPeriodData.actualPay - payPeriodData.expectedPay
      : null;

    const { data: payPeriod, error: periodError } = await supabase
      .from('pay_periods')
      .insert({
        start_date: payPeriodData.startDate,
        end_date: payPeriodData.endDate,
        total_hours: payPeriodData.totalHours,
        expected_pay: payPeriodData.expectedPay,
        actual_pay: payPeriodData.actualPay || null,
        difference: difference,
        notes: payPeriodData.notes || null,
      })
      .select()
      .single();

    if (periodError) {
      throw new Error(`Failed to create pay period: ${periodError.message}`);
    }

    if (data.shifts.length > 0) {
      const shiftsData = data.shifts.map((shift) => {
        const validated = shiftSchema.parse(shift);
        return {
          pay_period_id: payPeriod.id,
          date: validated.date,
          time_in: validated.timeIn,
          time_out: validated.timeOut,
          hours: validated.hours,
          reg_hours: validated.regHours ?? null,
          ot1_hours: validated.ot1Hours ?? null,
          department: validated.department ?? null,
        };
      });

      const { error: shiftsError } = await supabase
        .from('shifts')
        .insert(shiftsData);

      if (shiftsError) {
        await supabase.from('pay_periods').delete().eq('id', payPeriod.id);
        throw new Error(`Failed to create shifts: ${shiftsError.message}`);
      }
    }

    revalidatePath('/');
    return { success: true, data: payPeriod };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
      return {
        success: false,
        error: 'Database tables not found. Please run the SQL schema in your Supabase dashboard (supabase/schema.sql)',
      };
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
      return {
        success: false,
        error: 'Database connection failed. Please check your Supabase configuration.',
      };
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function updatePayPeriod(
  id: string,
  data: {
    startDate?: string;
    endDate?: string;
    totalHours?: number;
    expectedPay?: number;
    actualPay?: number;
    notes?: string;
  }
) {
  try {
    const supabase = createServerClient();

    const updateData: any = {};
    if (data.startDate) updateData.start_date = data.startDate;
    if (data.endDate) updateData.end_date = data.endDate;
    if (data.totalHours !== undefined) updateData.total_hours = data.totalHours;
    if (data.expectedPay !== undefined) updateData.expected_pay = data.expectedPay;
    if (data.actualPay !== undefined) {
      updateData.actual_pay = data.actualPay;
      updateData.difference = data.actualPay - (data.expectedPay || 0);
    }
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: payPeriod, error } = await supabase
      .from('pay_periods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update pay period: ${error.message}`);
    }

    revalidatePath('/');
    return { success: true, data: payPeriod };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deletePayPeriod(id: string) {
  try {
    const supabase = createServerClient();

    const { error } = await supabase
      .from('pay_periods')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete pay period: ${error.message}`);
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getAllPayPeriods() {
  unstable_noStore();
  
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('pay_periods')
      .select(`
        *,
        deductions (id, amount, reason)
      `)
      .order('start_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pay periods: ${error.message}`);
    }

    const payPeriodsWithDeductions = (data || []).map((pp: any) => {
      const deductionsTotal = (pp.deductions || []).reduce(
        (sum: number, d: any) => sum + Math.abs(d.amount),
        0
      );
      const deductionReasons = (pp.deductions || []).map((d: any) => d.reason).filter(Boolean);
      return {
        ...pp,
        deductions_count: pp.deductions?.length || 0,
        deductions_total: deductionsTotal,
        deduction_reasons: deductionReasons,
      };
    });

    return { success: true, data: payPeriodsWithDeductions };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

export async function getPayPeriod(id: string) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch pay period: ${error.message}`);
    }

    if (!data) {
      return {
        success: false,
        error: 'Pay period not found',
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getShiftsForPayPeriod(payPeriodId: string) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('pay_period_id', payPeriodId)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch shifts: ${error.message}`);
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}


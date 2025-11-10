'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const deductionSchema = z.object({
  date: z.string(),
  amount: z.number(),
  reason: z.string().min(1, 'Reason is required'),
});

export async function createDeduction(
  payPeriodId: string,
  data: {
    date: string;
    amount: number;
    reason: string;
  }
) {
  try {
    const supabase = createServerClient();
    
    const validated = deductionSchema.parse(data);

    const { data: deduction, error } = await supabase
      .from('deductions')
      .insert({
        pay_period_id: payPeriodId,
        date: validated.date,
        amount: validated.amount,
        reason: validated.reason,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create deduction: ${error.message}`);
    }

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true, data: deduction };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateDeduction(
  id: string,
  data: {
    date?: string;
    amount?: number;
    reason?: string;
  }
) {
  try {
    const supabase = createServerClient();

    const updateData: any = {};
    if (data.date) updateData.date = data.date;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.reason) updateData.reason = data.reason;

    const { data: deduction, error } = await supabase
      .from('deductions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update deduction: ${error.message}`);
    }

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true, data: deduction };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteDeduction(id: string) {
  try {
    const supabase = createServerClient();

    const { error } = await supabase
      .from('deductions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete deduction: ${error.message}`);
    }

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getDeductionsForPayPeriod(payPeriodId: string) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('deductions')
      .select('*')
      .eq('pay_period_id', payPeriodId)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch deductions: ${error.message}`);
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

export async function getAllDeductions() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('deductions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch deductions: ${error.message}`);
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


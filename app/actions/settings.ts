'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

export const getSettings = cache(async () => {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'singleton')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: {
            id: 'singleton',
            hourly_rate: 15.0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };
      }
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

export async function updateHourlyRate(hourlyRate: number) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('settings')
      .upsert({
        id: 'singleton',
        hourly_rate: hourlyRate,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update hourly rate: ${error.message}`);
    }

    revalidatePath('/');
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


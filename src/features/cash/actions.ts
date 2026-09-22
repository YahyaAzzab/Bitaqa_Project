'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSellerSession } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const handoverSchema = z.object({
  sellerId: z.string().uuid(),
  amountMad: z.coerce.number().positive().max(1_000_000),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CashHandoverState = {
  ok?: boolean;
  error?: 'forbidden' | 'invalid' | 'generic';
};

export async function recordCashHandover(
  _prev: CashHandoverState,
  formData: FormData,
): Promise<CashHandoverState> {
  const session = await getSellerSession();
  if (!session || session.seller.role !== 'admin') {
    return { error: 'forbidden' };
  }

  const parsed = handoverSchema.safeParse({
    sellerId: formData.get('sellerId'),
    amountMad: formData.get('amountMad'),
    note: formData.get('note') ?? undefined,
  });

  if (!parsed.success) {
    return { error: 'invalid' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('cash_handovers').insert({
    seller_id: parsed.data.sellerId,
    amount_mad: parsed.data.amountMad,
    note: parsed.data.note,
  });

  if (error) {
    return { error: 'generic' };
  }

  revalidatePath('/fr/dashboard/cash');
  revalidatePath('/ar/dashboard/cash');
  return { ok: true };
}

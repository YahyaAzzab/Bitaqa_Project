'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSellerSession } from '@/lib/auth/session';
import {
  ORDER_FLOW,
  flowIndex,
  isAdjacentAdvance,
  isForwardSkip,
  type FlowStatus,
} from '@/lib/dashboard/orders';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const advanceSchema = z.object({
  orderId: z.string().uuid(),
  targetStatus: z.enum(ORDER_FLOW),
  confirmSkip: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

export type AdvanceOrderState = {
  ok?: boolean;
  error?: 'forbidden' | 'invalid' | 'skip_required' | 'not_found' | 'generic';
};

export async function advanceOrderStatus(
  _prev: AdvanceOrderState,
  formData: FormData,
): Promise<AdvanceOrderState> {
  const session = await getSellerSession();
  if (!session) {
    return { error: 'forbidden' };
  }

  const parsed = advanceSchema.safeParse({
    orderId: formData.get('orderId'),
    targetStatus: formData.get('targetStatus'),
    confirmSkip: formData.get('confirmSkip') ?? false,
  });

  if (!parsed.success) {
    return { error: 'invalid' };
  }

  const { orderId, targetStatus, confirmSkip } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data: order, error: fetchError } = await supabase
    .from('custom_orders')
    .select('id, status, ready_at')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchError) {
    return { error: 'generic' };
  }
  if (!order) {
    return { error: 'not_found' };
  }

  const current = order.status;
  if (current === 'cancelled' || current === 'swapped') {
    return { error: 'invalid' };
  }

  const fromIdx = flowIndex(current);
  const toIdx = flowIndex(targetStatus);
  if (fromIdx < 0 || toIdx <= fromIdx) {
    return { error: 'invalid' };
  }

  if (isForwardSkip(current, targetStatus) && !confirmSkip) {
    return { error: 'skip_required' };
  }

  if (!isAdjacentAdvance(current, targetStatus) && !isForwardSkip(current, targetStatus)) {
    return { error: 'invalid' };
  }

  const nowIso = new Date().toISOString();
  const readyIdx = flowIndex('ready');
  const patch: {
    status: FlowStatus;
    ready_at?: string;
    swapped_at?: string;
    swapped_by?: string;
  } = { status: targetStatus };

  if (toIdx >= readyIdx && !order.ready_at) {
    patch.ready_at = nowIso;
  }
  if (targetStatus === 'swapped') {
    patch.swapped_at = nowIso;
    patch.swapped_by = session.userId;
  }

  const { error: updateError } = await supabase
    .from('custom_orders')
    .update(patch)
    .eq('id', orderId);

  if (updateError) {
    return { error: 'generic' };
  }

  revalidatePath('/fr/dashboard/orders');
  revalidatePath('/ar/dashboard/orders');
  revalidatePath('/fr/dashboard');
  revalidatePath('/ar/dashboard');
  return { ok: true };
}

import type { OrderStatus } from '@/lib/supabase/database.types';

/** Parcours nominal — les sauts exigent une confirmation. */
export const ORDER_FLOW = [
  'ordered',
  'in_production',
  'ready',
  'swapped',
] as const satisfies readonly OrderStatus[];

export type FlowStatus = (typeof ORDER_FLOW)[number];

export function flowIndex(status: OrderStatus): number {
  return ORDER_FLOW.indexOf(status as FlowStatus);
}

export function isAdjacentAdvance(from: OrderStatus, to: FlowStatus): boolean {
  const a = flowIndex(from);
  const b = flowIndex(to);
  return a >= 0 && b === a + 1;
}

export function isForwardSkip(from: OrderStatus, to: FlowStatus): boolean {
  const a = flowIndex(from);
  const b = flowIndex(to);
  return a >= 0 && b > a + 1;
}

export function nextFlowStatus(from: OrderStatus): FlowStatus | null {
  const i = flowIndex(from);
  if (i < 0 || i >= ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[i + 1] ?? null;
}

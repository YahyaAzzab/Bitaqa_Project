import { describe, expect, it } from 'vitest';
import {
  computePeriodTotals,
  dateKeyInTz,
  groupSalesByDay,
} from '@/lib/dashboard/cash';
import { isAdjacentAdvance, isForwardSkip, nextFlowStatus } from '@/lib/dashboard/orders';

describe('cash period totals', () => {
  it('sums today / week / month from collected_at', () => {
    const now = new Date('2026-09-22T15:00:00+01:00');
    const sales = [
      { amount_mad: 100, collected_at: '2026-09-22T10:00:00+01:00' },
      { amount_mad: 50, collected_at: '2026-09-21T10:00:00+01:00' },
      { amount_mad: 25, collected_at: '2026-09-01T10:00:00+01:00' },
      { amount_mad: 10, collected_at: '2026-08-01T10:00:00+01:00' },
    ];
    const totals = computePeriodTotals(sales, now);
    expect(totals.today).toBe(100);
    expect(totals.week).toBe(150);
    expect(totals.month).toBe(175);
  });

  it('groups last days including zeros', () => {
    const now = new Date('2026-09-22T12:00:00+01:00');
    const series = groupSalesByDay(
      [{ amount_mad: 40, collected_at: '2026-09-22T08:00:00+01:00' }],
      3,
      now,
    );
    expect(series).toHaveLength(3);
    expect(series[2]?.date).toBe(dateKeyInTz(now));
    expect(series[2]?.total).toBe(40);
    expect(series[0]?.total).toBe(0);
  });
});

describe('order status transitions', () => {
  it('allows adjacent advances and detects skips', () => {
    expect(isAdjacentAdvance('ordered', 'in_production')).toBe(true);
    expect(isForwardSkip('ordered', 'ready')).toBe(true);
    expect(nextFlowStatus('ready')).toBe('swapped');
    expect(nextFlowStatus('swapped')).toBeNull();
  });
});

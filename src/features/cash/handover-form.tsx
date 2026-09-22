'use client';

import { useActionState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { recordCashHandover, type CashHandoverState } from '@/features/cash/actions';

type SellerOption = { id: string; full_name: string };

const initial: CashHandoverState = {};

type Props = {
  sellers: SellerOption[];
};

export function HandoverForm({ sellers }: Props) {
  const t = useTranslations('dashboard.cash');
  const tSettings = useTranslations('dashboard.settings');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [state, action, pending] = useActionState(recordCashHandover, initial);

  useEffect(() => {
    if (state.ok) {
      toast({ title: t('handoverSubmit'), variant: 'success' });
    } else if (state.error) {
      toast({ title: tCommon('error'), variant: 'error' });
    }
  }, [state, toast, t, tCommon]);

  return (
    <form action={action} className="border-border bg-surface mt-4 space-y-3 rounded-lg border p-4">
      <h3 className="text-[15px] font-semibold">{t('handover')}</h3>
      <Select
        name="sellerId"
        label={tSettings('profile')}
        required
        defaultValue={sellers[0]?.id}
        options={sellers.map((s) => ({ value: s.id, label: s.full_name }))}
      />
      <Input
        name="amountMad"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        required
        label={t('handoverAmount')}
        className="tabular"
      />
      <Input name="note" type="text" label={t('handoverNote')} autoComplete="off" />
      <Button type="submit" loading={pending} className="w-full">
        {t('handoverSubmit')}
      </Button>
    </form>
  );
}

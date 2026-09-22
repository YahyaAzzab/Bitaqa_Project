import { del, get, set } from 'idb-keyval';
import { wizardDefaults, type WizardFormValues } from '@/lib/profile/schema';

const DRAFT_KEY = 'bitaqa:profile-wizard-draft:v1';

export type WizardDraft = {
  values: WizardFormValues;
  step: number;
  updatedAt: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function mergeDraft(raw: unknown): WizardDraft | null {
  if (!isRecord(raw) || !isRecord(raw.values)) return null;
  const step = typeof raw.step === 'number' && raw.step >= 0 && raw.step <= 4 ? raw.step : 0;
  const values: WizardFormValues = {
    ...wizardDefaults,
    ...(raw.values as Partial<WizardFormValues>),
    links: Array.isArray(raw.values.links)
      ? (raw.values.links as WizardFormValues['links'])
      : [],
    cashConfirmed: true,
  };
  return {
    values,
    step,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export async function loadWizardDraft(): Promise<WizardDraft | null> {
  try {
    const raw = await get(DRAFT_KEY);
    return mergeDraft(raw);
  } catch {
    return null;
  }
}

export async function saveWizardDraft(values: WizardFormValues, step: number): Promise<void> {
  const payload: WizardDraft = {
    values,
    step,
    updatedAt: new Date().toISOString(),
  };
  try {
    await set(DRAFT_KEY, payload);
  } catch {
    /* IndexedDB indisponible (mode privé strict) */
  }
}

export async function clearWizardDraft(): Promise<void> {
  try {
    await del(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

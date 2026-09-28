'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { LinkIcon } from '@/components/ui/link-icon';
import { Sheet } from '@/components/ui/sheet';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { OwnerLink } from '@/lib/profile/schema';
import { buildSocialUrl, isSafeProfileUrl } from '@/lib/profile/urls';
import { cn } from '@/lib/utils';

const MAX_LINKS = 12;

const ADDABLE = [
  'instagram',
  'whatsapp',
  'facebook',
  'tiktok',
  'linkedin',
  'website',
  'custom',
] as const;
type AddableType = (typeof ADDABLE)[number];

type Props = {
  links: OwnerLink[];
  onChange: (links: OwnerLink[]) => void;
  disabled: boolean;
  errorKeys: Set<string>;
};

function displayUrl(value: string): string {
  return value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

export function LinksPanel({ links, onChange, disabled, errorKeys }: Props) {
  const t = useTranslations('account.links');
  const tType = useTranslations('profile.linkType');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const full = links.length >= MAX_LINKS;

  const update = (key: string, patch: Partial<OwnerLink>) =>
    onChange(links.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const removeLink = (key: string) => {
    setEditing(null);
    onChange(links.filter((l) => l.key !== key));
  };

  return (
    <div>
      <Button className="w-full" disabled={disabled || full} onClick={() => setAddOpen(true)}>
        <Plus className="size-5" strokeWidth={1.75} aria-hidden />
        {t('add')}
      </Button>
      <p className="text-text-muted mt-2 text-center text-[12px]">
        {full ? t('full', { max: MAX_LINKS }) : t('hint')}
      </p>

      {links.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Link2 className="size-6" strokeWidth={1.5} />}
          title={t('emptyTitle')}
          description={t('emptyBody')}
        />
      ) : (
        <Reorder.Group
          axis="y"
          values={links}
          onReorder={onChange}
          className="mt-5 space-y-2"
          as="ul"
        >
          {links.map((link) => (
            <LinkCard
              key={link.key}
              link={link}
              label={link.labelFr || tType(link.type)}
              expanded={editing === link.key}
              invalid={errorKeys.has(link.key)}
              disabled={disabled}
              onToggle={() => setEditing((cur) => (cur === link.key ? null : link.key))}
              onUpdate={(patch) => update(link.key, patch)}
              onRemove={() => removeLink(link.key)}
            />
          ))}
        </Reorder.Group>
      )}

      <AddLinkSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(link) => {
          onChange([link, ...links]);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

type CardProps = {
  link: OwnerLink;
  label: string;
  expanded: boolean;
  invalid: boolean;
  disabled: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<OwnerLink>) => void;
  onRemove: () => void;
};

function LinkCard({
  link,
  label,
  expanded,
  invalid,
  disabled,
  onToggle,
  onUpdate,
  onRemove,
}: CardProps) {
  const t = useTranslations('account.links');
  const controls = useDragControls();
  const reduced = useReducedMotion();
  const urlInvalid = !isSafeProfileUrl(link.value);

  return (
    <Reorder.Item
      value={link}
      dragListener={false}
      dragControls={controls}
      as="li"
      className={cn(
        'border-border bg-surface relative rounded-lg border',
        (invalid || urlInvalid) && 'border-error',
      )}
      whileDrag={reduced ? undefined : { scale: 1.02, zIndex: 10 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex min-h-16 items-center gap-1 pe-1">
        <button
          type="button"
          aria-label={t('reorder', { name: label })}
          disabled={disabled}
          onPointerDown={(e) => {
            if (!disabled) controls.start(e);
          }}
          className="focus-ring text-text-muted flex h-16 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-s-lg active:cursor-grabbing"
        >
          <GripVertical className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
        <LinkIcon type={link.type} />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="focus-ring min-w-0 flex-1 rounded-md px-3 py-2 text-start"
        >
          <span className="text-text block truncate text-[15px] font-medium">{label}</span>
          <span className="text-text-muted block truncate text-[13px]">
            <bdi dir="ltr">{displayUrl(link.value)}</bdi>
          </span>
        </button>
        <IconButton
          label={t('edit', { name: label })}
          onClick={onToggle}
          className="text-text-secondary"
        >
          <Pencil className="size-[18px]" strokeWidth={1.75} />
        </IconButton>
      </div>

      {expanded ? (
        <div className="border-border space-y-3 border-t p-3">
          <Input
            name={`label-fr-${link.key}`}
            label={t('titleFr')}
            placeholder={label}
            maxLength={60}
            className="text-[16px]"
            value={link.labelFr ?? ''}
            disabled={disabled}
            onChange={(e) => onUpdate({ labelFr: e.target.value })}
          />
          <Input
            name={`label-ar-${link.key}`}
            label={t('titleAr')}
            dir="rtl"
            maxLength={60}
            className="text-[16px]"
            value={link.labelAr ?? ''}
            disabled={disabled}
            onChange={(e) => onUpdate({ labelAr: e.target.value })}
          />
          <Input
            name={`url-${link.key}`}
            label={t('url')}
            dir="ltr"
            inputMode="url"
            type="url"
            className="text-[16px]"
            value={link.value}
            disabled={disabled}
            error={urlInvalid ? t('urlInvalid') : undefined}
            onChange={(e) => onUpdate({ value: e.target.value.trim() })}
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-error flex-1"
              disabled={disabled}
              onClick={onRemove}
            >
              <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
              {t('remove')}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onToggle}>
              {t('done')}
            </Button>
          </div>
        </div>
      ) : null}
    </Reorder.Item>
  );
}

type AddProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (link: OwnerLink) => void;
};

function AddLinkSheet({ open, onClose, onAdd }: AddProps) {
  const t = useTranslations('account.links');
  const tType = useTranslations('profile.linkType');
  const [type, setType] = useState<AddableType>('instagram');
  const [input, setInput] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState(false);

  const close = () => {
    setInput('');
    setTitle('');
    setError(false);
    onClose();
  };

  const submit = () => {
    const url = buildSocialUrl(type, input);
    if (!url) {
      setError(true);
      return;
    }
    onAdd({ key: crypto.randomUUID(), type, value: url, labelFr: title.trim(), labelAr: '' });
    setInput('');
    setTitle('');
    setError(false);
  };

  const social = type === 'instagram' || type === 'tiktok' || type === 'facebook';
  const whatsapp = type === 'whatsapp';

  return (
    <Sheet
      open={open}
      onClose={close}
      title={t('addTitle')}
      closeLabel={t('cancel')}
      footer={
        <Button className="w-full" disabled={!input.trim()} onClick={submit}>
          {t('addConfirm')}
        </Button>
      }
    >
      <div role="radiogroup" aria-label={t('typeLabel')} className="grid grid-cols-3 gap-2">
        {ADDABLE.map((item) => {
          const selected = item === type;
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setType(item);
                setError(false);
              }}
              className={cn(
                'pressable focus-ring flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-md border text-[13px] font-medium transition-colors duration-150',
                selected
                  ? 'border-accent bg-accent/10 text-text'
                  : 'border-border bg-surface text-text-secondary',
              )}
            >
              <LinkIcon type={item} size="sm" />
              {tType(item)}
            </button>
          );
        })}
      </div>
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          name="new-link"
          label={whatsapp ? t('whatsappLabel') : social ? t('handleLabel') : t('url')}
          placeholder={whatsapp ? '06 12 34 56 78' : social ? '@pseudo' : 'https://'}
          hint={whatsapp ? t('whatsappHint') : undefined}
          dir="ltr"
          inputMode={whatsapp ? 'tel' : social ? 'text' : 'url'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          className="text-[16px]"
          value={input}
          error={error ? t('urlInvalid') : undefined}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
        />
        <Input
          name="new-link-title"
          label={t('titleOptional')}
          placeholder={tType(type)}
          maxLength={60}
          className="text-[16px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </form>
    </Sheet>
  );
}

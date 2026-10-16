'use client';

import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { uploadOwnGalleryPhoto } from '@/features/account/actions';
import { compressLogoImage } from '@/lib/profile/logo-image';
import { GALLERY_MAX, type OwnerGalleryItem } from '@/lib/profile/schema';
import { cn } from '@/lib/utils';

type Props = {
  items: OwnerGalleryItem[];
  disabled?: boolean;
  onChange: (next: OwnerGalleryItem[]) => void;
};

export function GalleryPanel({ items, disabled = false, onChange }: Props) {
  const t = useTranslations('account.gallery');
  const { toast } = useToast();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const full = items.length >= GALLERY_MAX;

  async function handleFile(file: File | undefined) {
    if (!file || uploading || disabled || full) return;
    if (!file.type.startsWith('image/') && file.type !== '') {
      toast({ title: t('errorType'), variant: 'error' });
      return;
    }

    setUploading(true);
    try {
      const { blob, mime, ext } = await compressLogoImage(file, 280_000);
      const fd = new FormData();
      fd.append('file', new File([blob], `gallery.${ext}`, { type: mime }));
      const res = await uploadOwnGalleryPhoto(fd);
      if (!res.ok) {
        toast({
          title:
            res.error === 'unauthorized'
              ? t('errorAuth')
              : res.error === 'file_too_large' || res.error === 'upload_failed'
                ? t('errorUpload')
                : t('errorGeneric'),
          variant: 'error',
        });
        return;
      }
      onChange([...items, { key: `new-${crypto.randomUUID()}`, url: res.data.url, caption: '' }]);
      toast({ title: t('added'), variant: 'success' });
    } catch {
      toast({ title: t('errorGeneric'), variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-text-muted text-[12px] font-medium tracking-[0.14em] uppercase">
          {t('title')}
        </h3>
        <p className="text-text-muted mt-1 text-[13px] leading-relaxed">{t('lede')}</p>
        <p className="text-text-muted mt-1 text-[12px]">
          {t('count', { count: items.length, max: GALLERY_MAX })}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ImagePlus className="size-6" strokeWidth={1.5} aria-hidden />}
          title={t('emptyTitle')}
          description={t('emptyBody')}
        />
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {items.map((item, index) => (
            <li
              key={item.key}
              className="border-border bg-surface group relative aspect-square overflow-hidden rounded-md border"
            >
              <Image
                src={item.url}
                alt={item.caption || t('photoAlt', { n: index + 1 })}
                fill
                sizes="120px"
                className="object-cover"
              />
              <button
                type="button"
                disabled={disabled || uploading}
                aria-label={t('remove', { n: index + 1 })}
                onClick={() => onChange(items.filter((g) => g.key !== item.key))}
                className="pressable focus-ring bg-bg/85 text-text absolute end-1 top-1 inline-flex size-9 items-center justify-center rounded-full backdrop-blur-sm"
              >
                <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*,image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || uploading || full}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          void handleFile(file);
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || uploading || full}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          void handleFile(file);
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || uploading || full}
          onClick={() => galleryRef.current?.click()}
          className={cn(
            'pressable focus-ring border-border bg-surface flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border text-[13px] font-medium',
            (disabled || uploading || full) && 'opacity-50',
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" strokeWidth={1.75} />
          ) : (
            <ImagePlus className="size-5" strokeWidth={1.75} aria-hidden />
          )}
          {t('fromGallery')}
        </button>
        <button
          type="button"
          disabled={disabled || uploading || full}
          onClick={() => cameraRef.current?.click()}
          className={cn(
            'pressable focus-ring border-border bg-surface flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border text-[13px] font-medium',
            (disabled || uploading || full) && 'opacity-50',
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" strokeWidth={1.75} />
          ) : (
            <Camera className="size-5" strokeWidth={1.75} aria-hidden />
          )}
          {t('fromCamera')}
        </button>
      </div>

      {full ? <p className="text-text-muted text-center text-[12px]">{t('full')}</p> : null}
    </div>
  );
}

'use client';

import { Camera, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { uploadOwnBackground } from '@/features/account/actions';
import { compressCoverImage } from '@/lib/profile/logo-image';
import { cn } from '@/lib/utils';

type Props = {
  backgroundUrl?: string | null;
  onChange: (url: string | null) => void;
};

export function BackgroundPicker({ backgroundUrl, onChange }: Props) {
  const t = useTranslations('account.design');
  const { toast } = useToast();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    if (!file.type.startsWith('image/') && file.type !== '') {
      toast({ title: t('bgErrorType'), variant: 'error' });
      return;
    }

    setUploading(true);
    try {
      const { blob, mime, ext } = await compressCoverImage(file);
      const fd = new FormData();
      fd.append('file', new File([blob], `background.${ext}`, { type: mime }));
      const res = await uploadOwnBackground(fd);
      if (!res.ok) {
        toast({
          title:
            res.error === 'unauthorized'
              ? t('bgErrorAuth')
              : res.error === 'file_too_large' || res.error === 'upload_failed'
                ? t('bgErrorUpload')
                : t('bgErrorGeneric'),
          variant: 'error',
        });
        return;
      }
      onChange(res.data.url);
      toast({ title: t('bgSuccess'), variant: 'success' });
    } catch {
      toast({ title: t('bgErrorGeneric'), variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="text-text-secondary mb-1.5 text-[13px] font-medium">{t('background')}</p>
      <p className="text-text-muted mb-3 text-[12px]">{t('backgroundHint')}</p>

      <div className="border-border bg-surface relative mb-3 overflow-hidden rounded-lg border">
        <div className="relative aspect-[3/2] w-full">
          {backgroundUrl ? (
            <Image
              src={backgroundUrl}
              alt=""
              fill
              sizes="(max-width: 430px) 100vw, 360px"
              className="object-cover"
            />
          ) : (
            <div className="text-text-muted flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
              <ImageIcon className="size-6 opacity-60" strokeWidth={1.5} aria-hidden />
              <span className="text-[13px]">{t('backgroundEmpty')}</span>
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--bg)] to-transparent opacity-80"
          />
        </div>
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*,image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        tabIndex={-1}
        disabled={uploading}
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
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          void handleFile(file);
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => galleryRef.current?.click()}
          className={cn(
            'pressable focus-ring border-border bg-surface flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border text-[13px] font-medium',
            uploading && 'opacity-50',
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" strokeWidth={1.75} />
          ) : (
            <ImageIcon className="size-5" strokeWidth={1.75} aria-hidden />
          )}
          {t('bgGallery')}
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => cameraRef.current?.click()}
          className={cn(
            'pressable focus-ring border-border bg-surface flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border text-[13px] font-medium',
            uploading && 'opacity-50',
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" strokeWidth={1.75} />
          ) : (
            <Camera className="size-5" strokeWidth={1.75} aria-hidden />
          )}
          {t('bgCamera')}
        </button>
      </div>

      {backgroundUrl ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => onChange(null)}
          className="pressable focus-ring text-text-secondary hover:text-error mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md text-[13px] font-medium"
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
          {t('bgRemove')}
        </button>
      ) : null}
    </div>
  );
}

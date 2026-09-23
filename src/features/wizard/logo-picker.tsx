'use client';

import { Camera, ImageIcon, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { uploadLogo } from '@/features/wizard/actions';
import { compressLogoImage, sampleAccentFromBlob } from '@/lib/profile/logo-image';
import { cn } from '@/lib/utils';

type Props = {
  logoUrl?: string | null;
  businessName: string;
  onUploaded: (url: string, accentHex?: string | null) => void;
};

export function LogoPicker({ logoUrl, businessName, onUploaded }: Props) {
  const t = useTranslations('dashboard.wizard');
  const { toast } = useToast();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    if (!file.type.startsWith('image/') && file.type !== '') {
      toast({ title: t('logoErrorType'), variant: 'error' });
      return;
    }

    setUploading(true);
    try {
      const { blob, mime, ext } = await compressLogoImage(file);
      const fd = new FormData();
      fd.append('file', new File([blob], `logo.${ext}`, { type: mime }));
      const res = await uploadLogo(fd);
      if (!res.ok) {
        toast({
          title:
            res.error === 'unauthorized'
              ? t('logoErrorAuth')
              : res.error === 'upload_failed'
                ? t('logoErrorUpload')
                : t('logoErrorGeneric'),
          variant: 'error',
        });
        return;
      }
      const accent = await sampleAccentFromBlob(blob);
      onUploaded(res.data.url, accent);
      toast({ title: t('logoSuccess'), variant: 'success' });
    } catch {
      toast({ title: t('logoErrorGeneric'), variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="text-text-secondary mb-1.5 text-[13px] font-medium">{t('logo')}</p>
      <p className="text-text-muted mb-3 text-[12px]">{t('logoHint')}</p>

      <div className="mb-3 flex justify-center">
        <Avatar name={businessName || 'B'} src={logoUrl} size={88} className="rounded-xl" />
      </div>

      {/* Galerie : sans capture — ouvre photos / fichiers */}
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

      {/* Caméra : capture arrière */}
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
          {t('logoGallery')}
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
          {t('logoCamera')}
        </button>
      </div>
    </div>
  );
}

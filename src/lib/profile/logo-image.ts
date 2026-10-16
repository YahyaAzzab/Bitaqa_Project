/**
 * Recadre en carré et compresse pour upload logo (≤ maxBytes).
 * WebP si supporté, sinon JPEG — gère aussi les photos iPhone (HEIC via <img>).
 */
export async function compressLogoImage(
  file: File,
  maxBytes = 200_000,
): Promise<{ blob: Blob; mime: 'image/webp' | 'image/jpeg'; ext: 'webp' | 'jpg' }> {
  const source = await loadImageSource(file);
  const side = Math.min(source.width, source.height);
  const sx = (source.width - side) / 2;
  const sy = (source.height - side) / 2;

  let target = Math.min(side, 960);
  let quality = 0.86;
  let blob: Blob | null = null;
  let mime: 'image/webp' | 'image/jpeg' = 'image/webp';

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(source.drawable, sx, sy, side, side, 0, 0, target, target);

    blob = await canvasToBlob(canvas, 'image/webp', quality);
    mime = 'image/webp';
    if (!blob) {
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      mime = 'image/jpeg';
    }

    if (blob && blob.size <= maxBytes) break;
    if (quality > 0.45) quality -= 0.1;
    else target = Math.max(240, Math.round(target * 0.8));
  }

  source.close();
  if (!blob) throw new Error('compress');
  return { blob, mime, ext: mime === 'image/webp' ? 'webp' : 'jpg' };
}

/**
 * Fond de page : conserve le ratio, max ~1200 px de large, ≤ maxBytes.
 * Recadre légèrement en 3:2 centré si la photo est très haute (portrait).
 */
export async function compressCoverImage(
  file: File,
  maxBytes = 400_000,
): Promise<{ blob: Blob; mime: 'image/webp' | 'image/jpeg'; ext: 'webp' | 'jpg' }> {
  const source = await loadImageSource(file);
  const ratio = source.width / source.height;
  const targetRatio = 3 / 2;

  const sx = 0;
  let sy = 0;
  const sw = source.width;
  let sh = source.height;

  // Portraits trop étroits : cadre 3:2 centré pour un vrai fond, pas une bande.
  if (ratio < targetRatio * 0.85) {
    sh = Math.round(source.width / targetRatio);
    sy = Math.max(0, Math.round((source.height - sh) / 2));
  }

  let outW = Math.min(sw, 1200);
  let outH = Math.round((outW * sh) / sw);
  let quality = 0.84;
  let blob: Blob | null = null;
  let mime: 'image/webp' | 'image/jpeg' = 'image/webp';

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(source.drawable, sx, sy, sw, sh, 0, 0, outW, outH);

    blob = await canvasToBlob(canvas, 'image/webp', quality);
    mime = 'image/webp';
    if (!blob) {
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      mime = 'image/jpeg';
    }

    if (blob && blob.size <= maxBytes) break;
    if (quality > 0.45) quality -= 0.1;
    else {
      outW = Math.max(480, Math.round(outW * 0.85));
      outH = Math.round((outW * sh) / sw);
    }
  }

  source.close();
  if (!blob) throw new Error('compress');
  return { blob, mime, ext: mime === 'image/webp' ? 'webp' : 'jpg' };
}

type ImageSource = {
  drawable: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

async function loadImageSource(file: File): Promise<ImageSource> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        drawable: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      /* HEIC / codecs non supportés → fallback <img> */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(url);
    return {
      drawable: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image_load'));
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

/** Couleur d’accent approximative depuis le centre de l’image. */
export async function sampleAccentFromBlob(blob: Blob): Promise<string | null> {
  try {
    const source = await loadImageSource(new File([blob], 'x', { type: blob.type }));
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      source.close();
      return null;
    }
    ctx.drawImage(source.drawable, 0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
    source.close();
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return null;
  }
}

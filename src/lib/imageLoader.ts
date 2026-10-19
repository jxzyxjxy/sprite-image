import type { SpriteImage, TrimRect } from '../types/sprite';
import { ACCEPTED_MIME_TYPES } from '../types/sprite';

/**
 * SVG 可能缺少 width/height 固有尺寸，导致 drawImage 行为不一致。
 * 缺少时从 viewBox 推导补齐；都没有则给定默认 256x256。
 */
async function ensureSvgIntrinsicSize(file: File): Promise<Blob> {
  const text = await file.text();
  const svgTagMatch = text.match(/<svg[^>]*>/i);
  if (!svgTagMatch) return file;

  const svgTag = svgTagMatch[0];
  const hasWidth = /\bwidth\s*=\s*["'][\d.]+/.test(svgTag);
  const hasHeight = /\bheight\s*=\s*["'][\d.]+/.test(svgTag);
  if (hasWidth && hasHeight) return file;

  let w = 256;
  let h = 256;
  const viewBoxMatch = svgTag.match(/viewBox\s*=\s*["']\s*([-\d.]+)[ ,]+([-\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)\s*["']/i);
  if (viewBoxMatch) {
    w = Math.max(1, Math.round(parseFloat(viewBoxMatch[3])));
    h = Math.max(1, Math.round(parseFloat(viewBoxMatch[4])));
  }

  const patchedTag = svgTag.replace(
    /<svg/i,
    `<svg width="${hasWidth ? '' : w}" height="${hasHeight ? '' : h}"`,
  ).replace(/width=""\s*/, '').replace(/height=""\s*/, '');
  const patched = text.replace(svgTag, patchedTag);
  return new Blob([patched], { type: 'image/svg+xml' });
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片解码失败'));
    img.src = url;
  });
}

/** 扫描 alpha 通道，计算非透明像素包围盒；全透明图返回原尺寸 */
export function computeTrimRect(img: HTMLImageElement, alphaThreshold = 1): TrimRect {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const fallback: TrimRect = { x: 0, y: 0, w, h };
  if (w === 0 || h === 0) return { x: 0, y: 0, w: Math.max(1, w), h: Math.max(1, h) };

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return fallback;

  ctx.drawImage(img, 0, 0);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return fallback;
  }

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    const rowOffset = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[rowOffset + x * 4 + 3] >= alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return fallback; // 完全透明，保留原尺寸避免零尺寸帧
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];

/** 从 File 列表中筛出受支持的图片文件（MIME 优先，扩展名兜底） */
export function filterImageFiles(files: Iterable<File>): File[] {
  const result: File[] = [];
  for (const file of files) {
    const byMime = ACCEPTED_MIME_TYPES.includes(file.type);
    const byExt = ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (byMime || byExt) {
      result.push(file);
    }
  }
  return result;
}

/** 加载单个图片文件为 SpriteImage（含裁剪信息） */
export async function loadSpriteImage(file: File): Promise<SpriteImage> {
  const source: Blob = file.type === 'image/svg+xml' ? await ensureSvgIntrinsicSize(file) : file;
  const url = URL.createObjectURL(source);
  try {
    const element = await loadImageElement(url);
    const width = element.naturalWidth || 1;
    const height = element.naturalHeight || 1;
    return {
      id: crypto.randomUUID(),
      name: file.name,
      originalName: file.name,
      url,
      width,
      height,
      bytes: file.size,
      element,
      trim: computeTrimRect(element),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/** 为重复文件名生成唯一键：a.png, a (1).png, a (2).png ... */
export function dedupeName(name: string, taken: ReadonlySet<string>): string {
  if (!taken.has(name)) return name;
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let i = 1; ; i++) {
    const candidate = `${stem} (${i})${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

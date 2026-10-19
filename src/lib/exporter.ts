import type { PackResult, SpriteImage } from '../types/sprite';

/** TexturePacker JSON Hash 兼容格式（Phaser / PixiJS / Cocos 可直接加载） */
export interface TexturePackerJson {
  frames: Record<
    string,
    {
      frame: { x: number; y: number; w: number; h: number };
      rotated: boolean;
      trimmed: boolean;
      spriteSourceSize: { x: number; y: number; w: number; h: number };
      sourceSize: { w: number; h: number };
    }
  >;
  meta: {
    app: string;
    version: string;
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: string;
  };
}

/** 将排布结果按 1:1 渲染为雪碧图画布 */
export function renderSheetToCanvas(
  result: PackResult,
  imageById: ReadonlyMap<string, SpriteImage>,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = result.width;
  canvas.height = result.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布上下文');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (const packed of result.frames) {
    const image = imageById.get(packed.imageId);
    if (!image) continue;
    const src = packed.spriteSourceSize;
    ctx.drawImage(
      image.element,
      src.x,
      src.y,
      src.w,
      src.h,
      packed.frame.x,
      packed.frame.y,
      packed.frame.w,
      packed.frame.h,
    );
  }
  return canvas;
}

export function buildTexturePackerJson(result: PackResult, imageFileName: string): TexturePackerJson {
  const frames: TexturePackerJson['frames'] = {};
  for (const packed of result.frames) {
    frames[packed.name] = {
      frame: packed.frame,
      rotated: false,
      trimmed: packed.trimmed,
      spriteSourceSize: packed.spriteSourceSize,
      sourceSize: packed.sourceSize,
    };
  }
  return {
    frames,
    meta: {
      app: 'SpriteForge - Sprite Sheet Generator',
      version: '1.0.0',
      image: imageFileName,
      format: 'RGBA8888',
      size: { w: result.width, h: result.height },
      scale: '1',
    },
  };
}

/** 触发浏览器下载（同源 Blob URL，安全使用 download 属性） */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportPng(
  result: PackResult,
  imageById: ReadonlyMap<string, SpriteImage>,
  fileName: string,
): Promise<void> {
  const canvas = renderSheetToCanvas(result, imageById);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('PNG 编码失败');
  downloadBlob(blob, `${fileName}.png`);
}

export function exportJson(result: PackResult, fileName: string): void {
  const json = buildTexturePackerJson(result, `${fileName}.png`);
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${fileName}.json`);
}

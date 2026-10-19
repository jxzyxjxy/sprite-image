import type { PackResult, PackSettings, PackedFrame, SpriteImage } from '../types/sprite';

function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(1, n))));
}

interface PackItem {
  image: SpriteImage;
  /** 参与排版的有效尺寸（启用裁剪时为裁剪后尺寸） */
  w: number;
  h: number;
}

function toPackItems(images: SpriteImage[], trimAlpha: boolean): PackItem[] {
  return images.map((image) => {
    const rect = trimAlpha ? image.trim : { x: 0, y: 0, w: image.width, h: image.height };
    return { image, w: Math.max(1, rect.w), h: Math.max(1, rect.h) };
  });
}

function buildFrame(
  item: PackItem,
  x: number,
  y: number,
  trimAlpha: boolean,
): PackedFrame {
  const { image } = item;
  const trimmed = trimAlpha && (image.trim.w !== image.width || image.trim.h !== image.height);
  const src = trimAlpha ? image.trim : { x: 0, y: 0, w: image.width, h: image.height };
  return {
    imageId: image.id,
    name: image.name,
    frame: { x, y, w: item.w, h: item.h },
    sourceSize: { w: image.width, h: image.height },
    spriteSourceSize: { x: src.x, y: src.y, w: src.w, h: src.h },
    trimmed,
  };
}

/**
 * Shelf Packing：按高度降序后放入货架行，当前行放不下即开新行。
 * 目标宽度取 sqrt(总面积)（2 幂模式下取下一个 2 幂），趋向方形利用。
 */
function packShelf(items: PackItem[], settings: PackSettings): PackResult {
  const { spacing, edgePadding, trimAlpha, powerOfTwo } = settings;

  const sorted = [...items].sort((a, b) => b.h - a.h || b.w - a.w || a.image.name.localeCompare(b.image.name));

  const totalArea = sorted.reduce((sum, it) => sum + (it.w + spacing) * (it.h + spacing), 0);
  const maxItemW = Math.max(...sorted.map((it) => it.w));
  let targetW = Math.max(maxItemW, Math.ceil(Math.sqrt(totalArea)));
  if (powerOfTwo) targetW = Math.max(nextPow2(targetW), maxItemW);

  const frames: PackedFrame[] = [];
  let x = edgePadding;
  let y = edgePadding;
  let shelfHeight = 0;
  let usedW = 0;

  for (const item of sorted) {
    const wouldOverflow = x > edgePadding && x + item.w + edgePadding > targetW;
    if (wouldOverflow) {
      y += shelfHeight + spacing;
      x = edgePadding;
      shelfHeight = 0;
    }
    frames.push(buildFrame(item, x, y, trimAlpha));
    x += item.w + spacing;
    shelfHeight = Math.max(shelfHeight, item.h);
    usedW = Math.max(usedW, x - spacing);
  }

  const usedWidth = usedW + edgePadding;
  const usedHeight = y + shelfHeight + edgePadding;

  return {
    frames,
    usedWidth,
    usedHeight,
    width: powerOfTwo ? nextPow2(usedWidth) : usedWidth,
    height: powerOfTwo ? nextPow2(usedHeight) : usedHeight,
  };
}

/**
 * 网格排列：以最大图块尺寸为单元格，固定列数逐行排布，图块在单元格内居中。
 */
function packGrid(items: PackItem[], settings: PackSettings): PackResult {
  const { spacing, edgePadding, trimAlpha, powerOfTwo } = settings;

  const columns = Math.max(1, Math.min(settings.columns, items.length));
  const rows = Math.ceil(items.length / columns);
  const cellW = Math.max(...items.map((it) => it.w));
  const cellH = Math.max(...items.map((it) => it.h));

  const frames: PackedFrame[] = items.map((item, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const cellX = edgePadding + col * (cellW + spacing);
    const cellY = edgePadding + row * (cellH + spacing);
    // 图块在单元格内居中
    const x = cellX + Math.floor((cellW - item.w) / 2);
    const y = cellY + Math.floor((cellH - item.h) / 2);
    return buildFrame(item, x, y, trimAlpha);
  });

  const usedWidth = edgePadding * 2 + columns * cellW + (columns - 1) * spacing;
  const usedHeight = edgePadding * 2 + rows * cellH + (rows - 1) * spacing;

  return {
    frames,
    usedWidth,
    usedHeight,
    width: powerOfTwo ? nextPow2(usedWidth) : usedWidth,
    height: powerOfTwo ? nextPow2(usedHeight) : usedHeight,
  };
}

export function packSpriteSheet(images: SpriteImage[], settings: PackSettings): PackResult | null {
  if (images.length === 0) return null;
  const items = toPackItems(images, settings.trimAlpha);
  return settings.mode === 'grid' ? packGrid(items, settings) : packShelf(items, settings);
}

/** 内容面积 / 画布面积 利用率，用于面板展示 */
export function computeEfficiency(result: PackResult): number {
  const content = result.frames.reduce((sum, f) => sum + f.frame.w * f.frame.h, 0);
  const total = result.width * result.height;
  return total > 0 ? content / total : 0;
}

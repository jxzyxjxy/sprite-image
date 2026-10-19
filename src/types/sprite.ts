/** 透明边缘裁剪结果（相对于原图左上角的矩形） */
export interface TrimRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 一张已加载的素材图片 */
export interface SpriteImage {
  id: string;
  /** 文件名（已在导入时去重） */
  name: string;
  /** 原始文件名 */
  originalName: string;
  /** Object URL，用于缩略图与绘制 */
  url: string;
  /** 原始像素尺寸 */
  width: number;
  height: number;
  /** 文件字节数 */
  bytes: number;
  /** 可绘制元素 */
  element: HTMLImageElement;
  /** 透明边缘裁剪结果（导入时计算） */
  trim: TrimRect;
}

export type LayoutMode = 'shelf' | 'grid';

/** 排版与导出设置 */
export interface PackSettings {
  mode: LayoutMode;
  /** 网格模式列数 */
  columns: number;
  /** 图块间距 px */
  spacing: number;
  /** 画布边缘留白 px */
  edgePadding: number;
  /** 裁剪透明边缘 */
  trimAlpha: boolean;
  /** 画布尺寸取 2 的幂 */
  powerOfTwo: boolean;
  /** 导出文件基础名（不含扩展名） */
  fileName: string;
}

/** 单个图块在雪碧图中的排布结果 */
export interface PackedFrame {
  imageId: string;
  name: string;
  /** 图块在雪碧图中的矩形（存放裁剪后的像素数据） */
  frame: { x: number; y: number; w: number; h: number };
  /** 原图完整尺寸 */
  sourceSize: { w: number; h: number };
  /** 裁剪区域在原图中的位置与尺寸 */
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  trimmed: boolean;
}

export interface PackResult {
  frames: PackedFrame[];
  width: number;
  height: number;
  /** 内容实际占用尺寸（未做 2 幂对齐前） */
  usedWidth: number;
  usedHeight: number;
}

export const DEFAULT_SETTINGS: PackSettings = {
  mode: 'shelf',
  columns: 4,
  spacing: 2,
  edgePadding: 4,
  trimAlpha: true,
  powerOfTwo: false,
  fileName: 'spritesheet',
};

export const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp,.gif,.svg,image/png,image/jpeg,image/webp,image/gif,image/svg+xml';

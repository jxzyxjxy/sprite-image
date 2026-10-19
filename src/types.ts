/** 用户上传的一张图片 */
export interface ImageItem {
  id: string
  name: string
  /** 预览用 objectURL */
  url: string
  img: HTMLImageElement
  width: number
  height: number
}

/** 排版后的一帧在雪碧图中的位置与尺寸 */
export interface PlacedFrame {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
}

/** 每帧的源图元信息，用于导出 JSON（透明裁剪偏移、原始尺寸） */
export interface FrameMeta {
  id: string
  name: string
  offsetX: number
  offsetY: number
  srcW: number
  srcH: number
}

export type LayoutMode = 'grid' | 'compact'

export interface SheetSettings {
  /** 图块间距 px */
  padding: number
  layout: LayoutMode
  /** 网格列数，0 = 自动 */
  columns: number
  /** 裁剪图片四周的透明边缘 */
  trimTransparent: boolean
  /** 画布尺寸向上取 2 的幂 */
  powerOfTwo: boolean
}

export interface SheetResult {
  canvas: HTMLCanvasElement
  frames: PlacedFrame[]
  entries: FrameMeta[]
  width: number
  height: number
}

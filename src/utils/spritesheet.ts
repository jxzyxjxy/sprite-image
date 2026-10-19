import type { FrameMeta, ImageItem, SheetResult, SheetSettings } from '../types'
import { pack, type PackEntry } from './packer'

interface PreparedEntry extends PackEntry {
  /** 绘制来源（可能是裁剪后的临时 canvas） */
  source: HTMLImageElement | HTMLCanvasElement
  offsetX: number
  offsetY: number
  srcW: number
  srcH: number
}

interface TrimResult {
  source: HTMLCanvasElement
  width: number
  height: number
  offsetX: number
  offsetY: number
}

/** 扫描 alpha 通道，裁掉四周的完全透明像素；失败时返回 null 退回原图 */
function trimTransparentEdges(img: HTMLImageElement): TrimResult | null {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return null

  const full = document.createElement('canvas')
  full.width = w
  full.height = h
  const fctx = full.getContext('2d', { willReadFrequently: true })
  if (!fctx) return null
  fctx.drawImage(img, 0, 0)

  let data: ImageData
  try {
    data = fctx.getImageData(0, 0, w, h)
  } catch {
    return null // 画布被跨域内容污染等异常，退回原图
  }

  const px = data.data
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    const row = y * w * 4
    for (let x = 0; x < w; x++) {
      if (px[row + x * 4 + 3] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null // 整图全透明

  const tw = maxX - minX + 1
  const th = maxY - minY + 1
  const trimmed = document.createElement('canvas')
  trimmed.width = tw
  trimmed.height = th
  const tctx = trimmed.getContext('2d')
  if (!tctx) return null
  tctx.drawImage(full, minX, minY, tw, th, 0, 0, tw, th)

  return { source: trimmed, width: tw, height: th, offsetX: minX, offsetY: minY }
}

function prepareEntries(items: ImageItem[], trim: boolean): PreparedEntry[] {
  return items.map((it) => {
    const t = trim ? trimTransparentEdges(it.img) : null
    if (t) {
      return {
        id: it.id,
        name: it.name,
        source: t.source,
        width: t.width,
        height: t.height,
        offsetX: t.offsetX,
        offsetY: t.offsetY,
        srcW: it.width || t.width,
        srcH: it.height || t.height,
      }
    }
    return {
      id: it.id,
      name: it.name,
      source: it.img,
      width: it.width,
      height: it.height,
      offsetX: 0,
      offsetY: 0,
      srcW: it.width,
      srcH: it.height,
    }
  })
}

/** 合成雪碧图：准备图块 → 排版 → 绘制画布 */
export function generateSheet(items: ImageItem[], settings: SheetSettings): SheetResult {
  const entries = prepareEntries(items, settings.trimTransparent)
  const packed = pack(entries, settings)

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, packed.width)
  canvas.height = Math.max(1, packed.height)
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingEnabled = false
    const map = new Map(entries.map((e) => [e.id, e]))
    for (const f of packed.frames) {
      const e = map.get(f.id)
      if (e && f.width > 0 && f.height > 0) {
        ctx.drawImage(e.source, f.x, f.y)
      }
    }
  }

  const entriesMeta: FrameMeta[] = entries.map((e) => ({
    id: e.id,
    name: e.name,
    offsetX: e.offsetX,
    offsetY: e.offsetY,
    srcW: e.srcW,
    srcH: e.srcH,
  }))

  return {
    canvas,
    frames: packed.frames,
    entries: entriesMeta,
    width: canvas.width,
    height: canvas.height,
  }
}

function uniqueFrameKey(name: string, used: Record<string, unknown>): string {
  if (!(name in used)) return name
  const m = name.match(/\.[^./\\]*$/)
  const ext = m ? m[0] : ''
  const stem = ext ? name.slice(0, name.length - ext.length) : name
  let n = 1
  while (`${stem}-${n}${ext}` in used) n += 1
  return `${stem}-${n}${ext}`
}

/**
 * 导出 TexturePacker JSON（Hash 格式），Phaser / PixiJS / Cocos 等引擎可直接加载：
 * {
 *   frames: { [文件名]: { frame, rotated, trimmed, spriteSourceSize, sourceSize } },
 *   meta: { app, version, image, format, size, scale }
 * }
 */
export function buildAtlasJSON(result: SheetResult, imageName: string): string {
  const metaMap = new Map(result.entries.map((e) => [e.id, e]))
  const framesObj: Record<string, unknown> = {}

  for (const f of result.frames) {
    const m = metaMap.get(f.id)
    const srcW = m ? m.srcW : f.width
    const srcH = m ? m.srcH : f.height
    const offX = m ? m.offsetX : 0
    const offY = m ? m.offsetY : 0

    framesObj[uniqueFrameKey(f.name, framesObj)] = {
      frame: { x: f.x, y: f.y, w: f.width, h: f.height },
      rotated: false,
      trimmed: srcW !== f.width || srcH !== f.height,
      spriteSourceSize: { x: offX, y: offY, w: f.width, h: f.height },
      sourceSize: { w: srcW, h: srcH },
    }
  }

  const atlas = {
    frames: framesObj,
    meta: {
      app: 'Sprite Sheet Tool',
      version: '1.0.0',
      image: imageName,
      format: 'RGBA8888',
      size: { w: result.width, h: result.height },
      scale: '1',
    },
  }

  return JSON.stringify(atlas, null, 2)
}

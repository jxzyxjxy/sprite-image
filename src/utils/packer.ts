import type { PlacedFrame, SheetSettings } from '../types'

/** 参与排版的图块描述 */
export interface PackEntry {
  id: string
  name: string
  width: number
  height: number
}

export interface PackResult {
  frames: PlacedFrame[]
  width: number
  height: number
}

function nextPowerOfTwo(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

/**
 * 紧凑排列（Shelf Packing）：
 * 按高度降序逐行放置，目标宽度按总面积估算（近似正方形），
 * 最大化空间利用率，适合尺寸不一的图块。
 */
function packShelf(entries: PackEntry[], padding: number): PackResult {
  if (entries.length === 0) return { frames: [], width: 0, height: 0 }

  const sorted = [...entries].sort(
    (a, b) => b.height - a.height || a.name.localeCompare(b.name),
  )
  const totalArea = sorted.reduce((s, e) => s + e.width * e.height, 0)
  const maxW = Math.max(...sorted.map((e) => e.width))
  const targetW = Math.max(Math.ceil(Math.sqrt(totalArea)) + padding * 2, maxW + padding * 2)

  const frames: PlacedFrame[] = []
  let x = padding
  let y = padding
  let rowH = 0
  let maxRowW = 0

  for (const e of sorted) {
    // 当前行放不下则换行（行内至少已有一个元素）
    if (x > padding && x + e.width > targetW) {
      y += rowH + padding
      x = padding
      rowH = 0
    }
    frames.push({ id: e.id, name: e.name, x, y, width: e.width, height: e.height })
    x += e.width + padding
    rowH = Math.max(rowH, e.height)
    maxRowW = Math.max(maxRowW, x - padding)
  }

  return {
    frames,
    width: maxRowW + padding,
    height: y + rowH + padding,
  }
}

/**
 * 网格排列：等距网格，图块在单元格内左上对齐。
 * columns <= 0 时按 sqrt(n) 自动取列数。
 */
function packGrid(entries: PackEntry[], padding: number, columns: number): PackResult {
  if (entries.length === 0) return { frames: [], width: 0, height: 0 }

  const cols =
    columns > 0
      ? Math.max(1, Math.min(columns, entries.length))
      : Math.max(1, Math.ceil(Math.sqrt(entries.length)))
  const rows = Math.ceil(entries.length / cols)
  const cellW = Math.max(...entries.map((e) => e.width))
  const cellH = Math.max(...entries.map((e) => e.height))

  const frames: PlacedFrame[] = entries.map((e, i) => ({
    id: e.id,
    name: e.name,
    x: padding + (i % cols) * (cellW + padding),
    y: padding + Math.floor(i / cols) * (cellH + padding),
    width: e.width,
    height: e.height,
  }))

  return {
    frames,
    width: padding + cols * (cellW + padding),
    height: padding + rows * (cellH + padding),
  }
}

export function pack(entries: PackEntry[], settings: SheetSettings): PackResult {
  const result =
    settings.layout === 'grid'
      ? packGrid(entries, settings.padding, settings.columns)
      : packShelf(entries, settings.padding)

  if (settings.powerOfTwo && result.width > 0 && result.height > 0) {
    return {
      ...result,
      width: nextPowerOfTwo(result.width),
      height: nextPowerOfTwo(result.height),
    }
  }
  return result
}

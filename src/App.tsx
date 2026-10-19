import { useCallback, useEffect, useState } from 'react'
import type { ImageItem, SheetResult, SheetSettings } from './types'
import { buildAtlasJSON, generateSheet } from './utils/spritesheet'
import { downloadCanvasPNG, downloadText } from './utils/download'
import DropZone from './components/DropZone'
import ImageList from './components/ImageList'
import SettingsPanel from './components/SettingsPanel'
import PreviewPanel from './components/PreviewPanel'
import './App.css'

let uidCounter = 0
function nextId(): string {
  uidCounter += 1
  return `img-${Date.now().toString(36)}-${uidCounter}`
}

const DEFAULT_SETTINGS: SheetSettings = {
  padding: 2,
  layout: 'compact',
  columns: 0,
  trimTransparent: false,
  powerOfTwo: false,
}

/** 与已有文件重名时自动追加序号：a.png → a-1.png */
function dedupeName(name: string, used: Set<string>): string {
  if (!used.has(name)) return name
  const m = name.match(/\.[^./\\]*$/)
  const ext = m ? m[0] : ''
  const stem = ext ? name.slice(0, name.length - ext.length) : name
  let n = 1
  while (used.has(`${stem}-${n}${ext}`)) n += 1
  return `${stem}-${n}${ext}`
}

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [settings, setSettings] = useState<SheetSettings>(DEFAULT_SETTINGS)
  const [sheetName, setSheetName] = useState('spritesheet')
  const [result, setResult] = useState<SheetResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (images.length === 0) return

      const usedNames = new Set(items.map((i) => i.name))
      const added: ImageItem[] = []

      for (const file of images) {
        const name = dedupeName(file.name, usedNames)
        usedNames.add(name)

        const url = URL.createObjectURL(file)
        const img = new Image()
        const item: ImageItem = { id: nextId(), name, url, img, width: 0, height: 0 }

        img.onload = () => {
          setItems((cur) =>
            cur.map((it) =>
              it.id === item.id
                ? { ...it, width: it.img.naturalWidth || 128, height: it.img.naturalHeight || 128 }
                : it,
            ),
          )
        }
        img.src = url
        added.push(item)
      }

      setItems((cur) => [...cur, ...added])
    },
    [items],
  )

  const removeItem = useCallback((id: string) => {
    setItems((cur) => {
      const target = cur.find((i) => i.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return cur.filter((i) => i.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    setItems((cur) => {
      cur.forEach((i) => URL.revokeObjectURL(i.url))
      return []
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<SheetSettings>) => {
    setSettings((cur) => ({ ...cur, ...patch }))
  }, [])

  // 图片或设置变化后自动重新生成（防抖）
  useEffect(() => {
    if (items.length === 0) {
      setResult(null)
      setError(null)
      return
    }
    const timer = window.setTimeout(() => {
      try {
        setResult(generateSheet(items, settings))
        setError(null)
      } catch (e) {
        setResult(null)
        setError(e instanceof Error ? e.message : '生成失败，请重试')
      }
    }, 120)
    return () => window.clearTimeout(timer)
  }, [items, settings])

  const baseName = sheetName.trim() || 'spritesheet'

  const handleDownloadPNG = useCallback(() => {
    if (!result) return
    downloadCanvasPNG(result.canvas, `${baseName}.png`)
  }, [result, baseName])

  const handleDownloadJSON = useCallback(() => {
    if (!result) return
    downloadText(buildAtlasJSON(result, `${baseName}.png`), `${baseName}.json`)
  }, [result, baseName])

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">🧩</div>
        <div>
          <h1>雪碧图生成工具</h1>
          <p>上传多张图片，自动合并为一张雪碧图（Sprite Sheet），并导出对应的 JSON 数据文件</p>
        </div>
      </header>

      <main className="layout">
        <section className="col-left">
          <DropZone onFiles={addFiles} />
          <ImageList items={items} onRemove={removeItem} onClear={clearAll} />
          <SettingsPanel
            settings={settings}
            onChange={updateSettings}
            sheetName={sheetName}
            onNameChange={setSheetName}
          />
        </section>

        <section className="col-right">
          <PreviewPanel result={result} error={error} />
          <div className="actions">
            <button className="btn primary" disabled={!result} onClick={handleDownloadPNG}>
              ⬇ 下载 PNG
            </button>
            <button className="btn ghost" disabled={!result} onClick={handleDownloadJSON}>
              ⬇ 下载 JSON
            </button>
          </div>
          <p className="tip">
            修改图片或设置后会自动重新生成；JSON 采用 TexturePacker 兼容（Hash）格式，
            可直接用于 Phaser / PixiJS / Cocos 等游戏引擎。所有处理均在浏览器本地完成，图片不会上传服务器。
          </p>
        </section>
      </main>
    </div>
  )
}

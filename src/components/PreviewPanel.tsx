import { useEffect, useRef } from 'react'
import type { SheetResult } from '../types'

interface PreviewPanelProps {
  result: SheetResult | null
  error: string | null
}

export default function PreviewPanel({ result, error }: PreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 将生成的离屏画布同步到可见画布
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !result) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    cv.width = result.width
    cv.height = result.height
    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.drawImage(result.canvas, 0, 0)
  }, [result])

  return (
    <div className="card">
      <div className="preview-head">
        <h3>雪碧图预览</h3>
        {result && (
          <span className="preview-meta">
            {result.width} × {result.height} px · {result.frames.length} 帧
          </span>
        )}
      </div>
      <div className="preview-box checkerboard">
        {result ? (
          <canvas ref={canvasRef} />
        ) : (
          <p className="preview-empty">
            {error ?? (
              <>
                添加图片后，雪碧图会在这里实时预览
                <br />
                支持调整间距、排版方式与透明裁剪
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

import { useRef, useState, type DragEvent } from 'react'

interface DropZoneProps {
  onFiles: (files: FileList | File[]) => void
}

export default function DropZone({ onFiles }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files)
  }

  return (
    <div
      className={`dropzone ${dragOver ? 'over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="dz-icon">🧩</div>
      <p className="dz-main">拖拽图片到这里，或点击选择文件</p>
      <p className="dz-sub">支持 PNG / JPG / WebP / GIF / SVG，可一次多选</p>
    </div>
  )
}

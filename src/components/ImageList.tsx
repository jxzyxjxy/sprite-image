import type { ImageItem } from '../types'

interface ImageListProps {
  items: ImageItem[]
  onRemove: (id: string) => void
  onClear: () => void
}

export default function ImageList({ items, onRemove, onClear }: ImageListProps) {
  if (items.length === 0) return null

  return (
    <div className="card image-list">
      <div className="il-head">
        <span>
          已添加 <b>{items.length}</b> 张图片
        </span>
        <button className="btn-link" onClick={onClear}>
          全部清空
        </button>
      </div>
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <img src={it.url} alt={it.name} draggable={false} />
            <div className="il-info">
              <span className="il-name" title={it.name}>
                {it.name}
              </span>
              <span className="il-size">
                {it.width > 0 ? `${it.width} × ${it.height}` : '读取中…'}
              </span>
            </div>
            <button
              className="il-remove"
              onClick={() => onRemove(it.id)}
              title="移除"
              aria-label={`移除 ${it.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

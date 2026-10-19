import { ImagePlus, Images, Loader2, Trash2, X } from 'lucide-react';
import type { SpriteImage } from '../types/sprite';
import { formatBytes } from '../lib/imageLoader';
import { IconButton } from './controls';

interface ImageListPanelProps {
  images: SpriteImage[];
  importing: boolean;
  highlightId: string | null;
  onHighlight: (id: string | null) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onPickClick: () => void;
}

export default function ImageListPanel({
  images,
  importing,
  highlightId,
  onHighlight,
  onRemove,
  onClear,
  onPickClick,
}: ImageListPanelProps) {
  const totalBytes = images.reduce((sum, img) => sum + img.bytes, 0);

  return (
    <aside className="order-2 flex min-h-0 w-full flex-col border-t border-zinc-800 bg-zinc-950 lg:order-1 lg:w-[272px] lg:shrink-0 lg:border-r lg:border-t-0">
      {/* 面板头 */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-800 px-3">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
          <Images size={13} />
          素材
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-zinc-300">
            {images.length}
          </span>
          {importing && <Loader2 size={12} className="animate-spin text-amber-400" />}
        </div>
        <div className="flex items-center gap-1">
          <IconButton title="添加图片" onClick={onPickClick}>
            <ImagePlus size={14} />
          </IconButton>
          <IconButton title="清空全部" onClick={onClear} disabled={images.length === 0} danger>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      {/* 列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {images.length === 0 ? (
          <button
            type="button"
            onClick={onPickClick}
            className="group flex h-full min-h-[160px] w-full flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-zinc-800 px-4 py-8 transition-colors duration-150 hover:border-amber-400/50 hover:bg-zinc-900/50"
          >
            <ImagePlus size={20} className="text-zinc-600 transition-colors duration-150 group-hover:text-amber-400" />
            <span className="text-xs text-zinc-400">点击选择或拖拽图片</span>
            <span className="font-mono text-[10px] text-zinc-600">PNG · JPG · WebP · GIF · SVG</span>
          </button>
        ) : (
          <ul className="space-y-0.5">
            {images.map((img) => {
              const highlighted = img.id === highlightId;
              return (
                <li key={img.id}>
                  <div
                    onMouseEnter={() => onHighlight(img.id)}
                    onMouseLeave={() => onHighlight(null)}
                    className={`group flex items-center gap-2.5 rounded-md border px-2 py-1.5 transition-colors duration-150 ${
                      highlighted ? 'border-amber-400/40 bg-amber-400/5' : 'border-transparent hover:border-zinc-800 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="checkerboard flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded">
                      <img src={img.url} alt={img.name} className="max-h-full max-w-full object-contain" draggable={false} />
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-xs text-zinc-200" title={img.name}>
                        {img.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] tabular-nums text-zinc-500">
                        {img.width}×{img.height} · {formatBytes(img.bytes)}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="移除"
                      aria-label={`移除 ${img.name}`}
                      onClick={() => onRemove(img.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-600 opacity-0 transition-all duration-150 hover:bg-red-400/10 hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 面板脚 */}
      <div className="shrink-0 border-t border-zinc-800 px-3 py-2.5 leading-relaxed">
        <p className="font-mono text-[10px] tabular-nums text-zinc-500">
          共 {images.length} 张 · {formatBytes(totalBytes)}
        </p>
        <p className="mt-1 text-[10px] text-zinc-600">GIF 取首帧，SVG 按固有尺寸渲染</p>
      </div>
    </aside>
  );
}

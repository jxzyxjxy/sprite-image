import { Download, FileJson, LayoutGrid, Loader2, Lock, Package } from 'lucide-react';
import type { PackResult } from '../types/sprite';

export type ExportKind = 'png' | 'json' | 'all';

interface ToolbarProps {
  imageCount: number;
  result: PackResult | null;
  efficiency: number;
  exporting: ExportKind | null;
  onExport: (kind: ExportKind) => void;
}

export default function Toolbar({ imageCount, result, efficiency, exporting, onExport }: ToolbarProps) {
  const hasResult = result !== null && imageCount > 0;
  const busy = exporting !== null;

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-4">
      {/* 品牌 */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-400 text-zinc-950">
          <LayoutGrid size={15} strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-wide text-zinc-100">SpriteForge</h1>
          <p className="text-[10px] text-zinc-500">雪碧图生成器</p>
        </div>
      </div>

      {/* 中部统计（工程标注） */}
      <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
        <p className="truncate font-mono text-[11px] tabular-nums text-zinc-500">
          {hasResult ? (
            <>
              <span className="text-zinc-300">{imageCount}</span> 图块
              <span className="mx-2 text-zinc-700">/</span>
              <span className="text-zinc-300">
                {result.width} × {result.height}
              </span>{' '}
              px
              <span className="mx-2 text-zinc-700">/</span>
              利用率 <span className="text-amber-300">{Math.round(efficiency * 100)}%</span>
            </>
          ) : (
            '等待图片素材…'
          )}
        </p>
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-2">
        <span className="mr-1 hidden items-center gap-1.5 text-[11px] text-zinc-500 lg:flex">
          <Lock size={11} className="text-emerald-400/80" />
          纯本地处理，不上传服务器
        </span>
        <button
          type="button"
          disabled={!hasResult || busy}
          onClick={() => onExport('png')}
          className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-200 transition-colors duration-150 hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
        >
          {exporting === 'png' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          <span className="hidden sm:inline">PNG</span>
        </button>
        <button
          type="button"
          disabled={!hasResult || busy}
          onClick={() => onExport('json')}
          className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-200 transition-colors duration-150 hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
        >
          {exporting === 'json' ? <Loader2 size={13} className="animate-spin" /> : <FileJson size={13} />}
          <span className="hidden sm:inline">JSON</span>
        </button>
        <button
          type="button"
          disabled={!hasResult || busy}
          onClick={() => onExport('all')}
          className="flex h-8 items-center gap-1.5 rounded-md bg-amber-400 px-2.5 text-xs font-medium text-zinc-950 transition-colors duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5"
        >
          {exporting === 'all' ? <Loader2 size={13} className="animate-spin" /> : <Package size={13} />}
          全部导出
        </button>
      </div>
    </header>
  );
}

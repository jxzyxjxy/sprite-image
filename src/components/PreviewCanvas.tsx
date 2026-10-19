import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ImagePlus, Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import type { PackResult, SpriteImage } from '../types/sprite';

const MIN_SCALE = 0.05;
const MAX_SCALE = 32;
const CHECKER_SIZE = 12;

interface ViewState {
  scale: number;
  ox: number;
  oy: number;
}

interface PreviewCanvasProps {
  result: PackResult | null;
  imageById: ReadonlyMap<string, SpriteImage>;
  highlightId: string | null;
  onPickClick: () => void;
}

function clampScale(scale: number): number {
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}

/** 屏幕空间棋盘格（不随缩放变形），模拟透明底 */
function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#151619';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1e2024';
  const cols = Math.ceil(w / CHECKER_SIZE);
  const rows = Math.ceil(h / CHECKER_SIZE);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if ((x + y) % 2 === 1) {
        ctx.fillRect(x * CHECKER_SIZE, y * CHECKER_SIZE, CHECKER_SIZE, CHECKER_SIZE);
      }
    }
  }
}

export default function PreviewCanvas({ result, imageById, highlightId, onPickClick }: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<ViewState>({ scale: 1, ox: 0, oy: 0 });
  const viewRef = useRef(view);
  const panRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  /* 容器尺寸监听 */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setSize({ w: rect.width, h: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fitView = useCallback(() => {
    if (!result || size.w === 0 || size.h === 0) return;
    const pad = 48;
    const scale = clampScale(Math.min((size.w - pad) / result.width, (size.h - pad) / result.height, 1));
    setView({
      scale,
      ox: (size.w - result.width * scale) / 2,
      oy: (size.h - result.height * scale) / 2,
    });
  }, [result, size.w, size.h]);

  const resultWidth = result?.width ?? 0;
  const resultHeight = result?.height ?? 0;

  /* 雪碧图尺寸变化时自动适应窗口（用户手动缩放/平移后不打断） */
  const fittedRef = useRef(false);
  useEffect(() => {
    fittedRef.current = false;
  }, [resultWidth, resultHeight]);
  useEffect(() => {
    if (!fittedRef.current && result && size.w > 0 && size.h > 0) {
      fitView();
      fittedRef.current = true;
    }
  }, [result, size, fitView]);

  const applyZoom = useCallback(
    (factor: number, pivotX?: number, pivotY?: number) => {
      setView((prev) => {
        const next = clampScale(prev.scale * factor);
        const actual = next / prev.scale;
        const px = pivotX ?? size.w / 2;
        const py = pivotY ?? size.h / 2;
        return {
          scale: next,
          ox: px - (px - prev.ox) * actual,
          oy: py - (py - prev.oy) * actual,
        };
      });
    },
    [size.w, size.h],
  );

  const zoomToActual = useCallback(() => {
    if (!result) return;
    setView({
      scale: 1,
      ox: (size.w - result.width) / 2,
      oy: (size.h - result.height) / 2,
    });
  }, [result, size.w, size.h]);

  /* 滚轮缩放（以光标为中心），需要非 passive 监听以阻止页面滚动 */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      applyZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  /* 拖拽平移 */
  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !result) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panRef.current = { startX: e.clientX, startY: e.clientY, ox: viewRef.current.ox, oy: viewRef.current.oy };
    setIsPanning(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const pan = panRef.current;
    if (!pan) return;
    setView((prev) => ({
      ...prev,
      ox: pan.ox + (e.clientX - pan.startX),
      oy: pan.oy + (e.clientY - pan.startY),
    }));
  };
  const endPan = () => {
    panRef.current = null;
    setIsPanning(false);
  };

  /* 渲染 */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const pixelW = Math.round(size.w * dpr);
    const pixelH = Math.round(size.h * dpr);
    if (canvas.width !== pixelW) canvas.width = pixelW;
    if (canvas.height !== pixelH) canvas.height = pixelH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCheckerboard(ctx, size.w, size.h);
    if (!result) return;

    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    // 画布边界
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1 / view.scale;
    ctx.strokeRect(0, 0, result.width, result.height);

    // 图块（放大时关闭平滑，保留像素感）
    ctx.imageSmoothingEnabled = view.scale <= 1;
    ctx.imageSmoothingQuality = 'high';
    for (const packed of result.frames) {
      const img = imageById.get(packed.imageId);
      if (!img) continue;
      const src = packed.spriteSourceSize;
      ctx.drawImage(
        img.element,
        src.x,
        src.y,
        src.w,
        src.h,
        packed.frame.x,
        packed.frame.y,
        packed.frame.w,
        packed.frame.h,
      );
    }

    // 全部图块的细发丝框
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.13)';
    ctx.lineWidth = 1 / view.scale;
    for (const packed of result.frames) {
      ctx.strokeRect(packed.frame.x, packed.frame.y, packed.frame.w, packed.frame.h);
    }

    // 高亮帧：压暗其他帧 + 琥珀框 + 名称标注
    if (highlightId) {
      const target = result.frames.find((f) => f.imageId === highlightId);
      if (target) {
        ctx.fillStyle = 'rgba(9, 9, 11, 0.55)';
        for (const packed of result.frames) {
          if (packed.imageId !== highlightId) {
            ctx.fillRect(packed.frame.x, packed.frame.y, packed.frame.w, packed.frame.h);
          }
        }
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2 / view.scale;
        ctx.strokeRect(target.frame.x, target.frame.y, target.frame.w, target.frame.h);

        const unit = 1 / view.scale;
        const fontSize = 11 * unit;
        ctx.font = `${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
        const padX = 5 * unit;
        const textW = ctx.measureText(target.name).width;
        const tagW = textW + padX * 2;
        const tagH = fontSize + 8 * unit;
        const tagX = target.frame.x;
        let tagY = target.frame.y - tagH - 4 * unit;
        if (tagY < 0) tagY = target.frame.y + target.frame.h + 4 * unit;
        ctx.fillStyle = 'rgba(9, 9, 11, 0.92)';
        ctx.fillRect(tagX, tagY, tagW, tagH);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = unit;
        ctx.strokeRect(tagX, tagY, tagW, tagH);
        ctx.fillStyle = '#fbbf24';
        ctx.textBaseline = 'middle';
        ctx.fillText(target.name, tagX + padX, tagY + tagH / 2);
      }
    }
    ctx.restore();
  }, [result, imageById, view, highlightId, size]);

  const cursor = !result ? 'default' : isPanning ? 'grabbing' : 'grab';

  return (
    <div ref={containerRef} className="relative h-full min-h-[320px] w-full overflow-hidden bg-zinc-950">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h, cursor }}
        className="block touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onPointerLeave={endPan}
      />

      {/* 空状态：上传引导 */}
      {!result && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <button
            type="button"
            onClick={onPickClick}
            className="group flex max-w-sm flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-700 px-12 py-10 text-center transition-colors duration-150 hover:border-amber-400/60 hover:bg-zinc-900/60"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 transition-colors duration-150 group-hover:border-amber-400/40 group-hover:text-amber-400">
              <ImagePlus size={20} />
            </span>
            <span className="text-sm text-zinc-300">拖拽图片到窗口任意位置，或点击选择</span>
            <span className="font-mono text-[11px] leading-relaxed text-zinc-600">
              PNG · JPG · WebP · GIF(首帧) · SVG
              <br />
              支持多选，全部在浏览器本地完成
            </span>
          </button>
        </div>
      )}

      {/* 图纸信息角标 */}
      {result && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-zinc-800 bg-zinc-900/85 px-2.5 py-1.5 font-mono text-[11px] tabular-nums text-zinc-400 backdrop-blur-sm">
          {result.width} × {result.height} px · {result.frames.length} 帧
        </div>
      )}

      {/* 缩放控制条 */}
      {result && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900/90 p-1 backdrop-blur-sm">
          <button
            type="button"
            title="缩小"
            aria-label="缩小"
            onClick={() => applyZoom(1 / 1.25)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            title="实际大小"
            onClick={zoomToActual}
            className="w-14 rounded-md py-1 text-center font-mono text-[11px] tabular-nums text-zinc-300 transition-colors duration-150 hover:bg-zinc-800 hover:text-amber-300"
          >
            {Math.round(view.scale * 100)}%
          </button>
          <button
            type="button"
            title="放大"
            aria-label="放大"
            onClick={() => applyZoom(1.25)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ZoomIn size={14} />
          </button>
          <div className="mx-0.5 h-4 w-px bg-zinc-800" />
          <button
            type="button"
            title="适应窗口"
            aria-label="适应窗口"
            onClick={fitView}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Maximize size={14} />
          </button>
          <button
            type="button"
            title="实际大小 (100%)"
            onClick={zoomToActual}
            className="flex h-7 items-center rounded-md px-1.5 font-mono text-[11px] text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-100"
          >
            1:1
          </button>
        </div>
      )}
    </div>
  );
}

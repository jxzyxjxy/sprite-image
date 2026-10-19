import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { PackSettings, SpriteImage } from './types/sprite';
import { ACCEPT_ATTR, DEFAULT_SETTINGS } from './types/sprite';
import { dedupeName, filterImageFiles, loadSpriteImage } from './lib/imageLoader';
import { computeEfficiency, packSpriteSheet } from './lib/packing';
import { exportJson, exportPng } from './lib/exporter';
import Toolbar from './components/Toolbar';
import type { ExportKind } from './components/Toolbar';
import ImageListPanel from './components/ImageListPanel';
import SettingsPanel from './components/SettingsPanel';
import PreviewCanvas from './components/PreviewCanvas';

function isFileDrag(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files');
}

export default function App() {
  const [images, setImages] = useState<SpriteImage[]>([]);
  const [settings, setSettings] = useState<PackSettings>(DEFAULT_SETTINGS);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3200);
  }, []);

  /* 图片管理 */
  const addFiles = useCallback(
    async (incoming: File[]) => {
      const accepted = filterImageFiles(incoming);
      const ignored = incoming.length - accepted.length;
      if (ignored > 0) showNotice(`已忽略 ${ignored} 个不支持的文件`);
      if (accepted.length === 0) return;

      setImporting(true);
      const taken = new Set(images.map((img) => img.name));
      const loaded: SpriteImage[] = [];
      let failed = 0;
      for (const file of accepted) {
        try {
          const sprite = await loadSpriteImage(file);
          sprite.name = dedupeName(sprite.name, taken);
          taken.add(sprite.name);
          loaded.push(sprite);
        } catch {
          failed++;
        }
      }
      if (failed > 0) showNotice(`${failed} 个文件加载失败`);
      if (loaded.length > 0) setImages((prev) => [...prev, ...loaded]);
      setImporting(false);
    },
    [images, showNotice],
  );

  const addFilesRef = useRef(addFiles);
  useEffect(() => {
    addFilesRef.current = addFiles;
  }, [addFiles]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
    setHighlightId((prev) => (prev === id ? null : prev));
  }, []);

  const clearImages = useCallback(() => {
    setImages((prev) => {
      for (const img of prev) URL.revokeObjectURL(img.url);
      return [];
    });
    setHighlightId(null);
  }, []);

  /* 全窗口拖拽上传 */
  useEffect(() => {
    let depth = 0;
    const onDragEnter = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      depth++;
      setIsDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (isFileDrag(e)) e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      depth = 0;
      setIsDragging(false);
      addFilesRef.current(Array.from(e.dataTransfer?.files ?? []));
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  /* 排版计算 */
  const imageById = useMemo(() => new Map(images.map((img) => [img.id, img])), [images]);
  const packResult = useMemo(() => packSpriteSheet(images, settings), [images, settings]);
  const efficiency = useMemo(() => (packResult ? computeEfficiency(packResult) : 0), [packResult]);

  /* 导出 */
  const handleExport = useCallback(
    async (kind: ExportKind) => {
      if (!packResult) return;
      const safeName = settings.fileName.trim() || 'spritesheet';
      setExporting(kind);
      try {
        if (kind === 'png' || kind === 'all') {
          await exportPng(packResult, imageById, safeName);
        }
        if (kind === 'json' || kind === 'all') {
          exportJson(packResult, safeName);
        }
      } catch {
        showNotice('导出失败，请重试');
      } finally {
        setExporting(null);
      }
    },
    [packResult, imageById, settings.fileName, showNotice],
  );

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

  const updateSettings = useCallback((patch: Partial<PackSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <Toolbar
        imageCount={images.length}
        result={packResult}
        efficiency={efficiency}
        exporting={exporting}
        onExport={handleExport}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* 预览区：窄屏优先展示 */}
        <main className="order-1 h-[56vh] shrink-0 lg:order-2 lg:h-auto lg:min-h-0 lg:flex-1">
          <PreviewCanvas
            result={packResult}
            imageById={imageById}
            highlightId={highlightId}
            onPickClick={openFilePicker}
          />
        </main>

        <ImageListPanel
          images={images}
          importing={importing}
          highlightId={highlightId}
          onHighlight={setHighlightId}
          onRemove={removeImage}
          onClear={clearImages}
          onPickClick={openFilePicker}
        />

        <SettingsPanel
          settings={settings}
          imageCount={images.length}
          result={packResult}
          efficiency={efficiency}
          onChange={updateSettings}
        />
      </div>

      {/* 隐藏文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) void addFiles(files);
          e.target.value = '';
        }}
      />

      {/* 全窗口拖拽遮罩 */}
      {isDragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80">
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-amber-400/70 bg-zinc-900/70 px-14 py-10">
            <Upload size={26} className="text-amber-400" />
            <p className="text-sm text-zinc-100">释放以添加图片</p>
            <p className="font-mono text-[11px] text-zinc-500">支持多选 · 纯本地处理</p>
          </div>
        </div>
      )}

      {/* 轻提示 */}
      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-200 shadow-lg shadow-black/40">
          {notice}
        </div>
      )}
    </div>
  );
}

import { FileOutput, Grid2x2, LayoutGrid, Move, Rows, Scissors, Settings2, SquareDashed } from 'lucide-react';
import type { PackResult, PackSettings } from '../types/sprite';
import { SectionHeader, SegmentedControl, SliderRow, SwitchRow } from './controls';

interface SettingsPanelProps {
  settings: PackSettings;
  imageCount: number;
  result: PackResult | null;
  efficiency: number;
  onChange: (patch: Partial<PackSettings>) => void;
}

function sanitizeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function SettingsPanel({ settings, imageCount, result, efficiency, onChange }: SettingsPanelProps) {
  const isGrid = settings.mode === 'grid';

  return (
    <aside className="order-3 flex min-h-0 w-full flex-col border-t border-zinc-800 bg-zinc-950 lg:w-[272px] lg:shrink-0 lg:border-l lg:border-t-0">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 排版 */}
        <section className="space-y-4 border-b border-zinc-800 p-4">
          <SectionHeader icon={Settings2}>排版</SectionHeader>
          <SegmentedControl
            ariaLabel="排版方式"
            value={settings.mode}
            onChange={(mode) => onChange({ mode })}
            options={[
              { value: 'shelf', label: '紧凑排列', icon: Rows },
              { value: 'grid', label: '网格排列', icon: LayoutGrid },
            ]}
          />
          <SliderRow
            icon={Grid2x2}
            label="列数"
            value={settings.columns}
            min={1}
            max={32}
            suffix=" 列"
            disabled={!isGrid}
            onChange={(columns) => onChange({ columns })}
          />
          <SliderRow
            icon={Move}
            label="图块间距"
            value={settings.spacing}
            min={0}
            max={32}
            onChange={(spacing) => onChange({ spacing })}
          />
          <SliderRow
            icon={SquareDashed}
            label="画布边距"
            value={settings.edgePadding}
            min={0}
            max={64}
            onChange={(edgePadding) => onChange({ edgePadding })}
          />
        </section>

        {/* 优化 */}
        <section className="space-y-4 border-b border-zinc-800 p-4">
          <SectionHeader icon={Scissors}>优化</SectionHeader>
          <SwitchRow
            icon={Scissors}
            label="裁剪透明边缘"
            description="去除图块四周的透明像素，减小画布面积"
            checked={settings.trimAlpha}
            onChange={(trimAlpha) => onChange({ trimAlpha })}
          />
          <SwitchRow
            icon={Grid2x2}
            label="画布取 2 的幂"
            description="输出尺寸对齐 2ⁿ，兼容旧版渲染引擎"
            checked={settings.powerOfTwo}
            onChange={(powerOfTwo) => onChange({ powerOfTwo })}
          />
        </section>

        {/* 输出 */}
        <section className="space-y-4 p-4">
          <SectionHeader icon={FileOutput}>输出</SectionHeader>
          <div>
            <label htmlFor="file-name" className="text-xs text-zinc-200">
              文件名
            </label>
            <input
              id="file-name"
              type="text"
              value={settings.fileName}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => onChange({ fileName: sanitizeFileName(e.target.value) })}
              placeholder="spritesheet"
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-zinc-200 outline-none transition-colors duration-150 placeholder:text-zinc-600 focus:border-amber-400/60"
            />
          </div>

          <dl className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-3 font-mono text-[11px] tabular-nums">
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">输出尺寸</dt>
              <dd className="text-zinc-200">{result ? `${result.width} × ${result.height} px` : '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">图块数量</dt>
              <dd className="text-zinc-200">{imageCount}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">空间利用率</dt>
              <dd className={result ? 'text-amber-300' : 'text-zinc-200'}>{result ? `${Math.round(efficiency * 100)}%` : '—'}</dd>
            </div>
          </dl>

          <p className="rounded-md border border-zinc-800/70 bg-zinc-900/40 p-3 text-[11px] leading-relaxed text-zinc-500">
            JSON 采用 <span className="text-zinc-300">TexturePacker JSON Hash</span> 格式（含 frames 与 meta），
            可直接用于 Phaser / PixiJS / Cocos Creator 等引擎。
          </p>
        </section>
      </div>
    </aside>
  );
}

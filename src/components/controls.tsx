import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** 面板分区标题：图纸标注风格 */
export function SectionHeader({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
      <Icon size={12} strokeWidth={2} />
      {children}
    </div>
  );
}

interface IconButtonProps {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}

/** 面板角落的小图标按钮 */
export function IconButton({ title, onClick, disabled = false, danger = false, children }: IconButtonProps) {
  const hover = danger
    ? 'hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-400'
    : 'hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100';
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-zinc-400 transition-colors duration-150 ${hover} disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent disabled:hover:text-zinc-400`}
    >
      {children}
    </button>
  );
}

interface SwitchRowProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SwitchRow({ icon: Icon, label, description, checked, onChange }: SwitchRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-zinc-200">
          <Icon size={13} className="shrink-0 text-zinc-500" />
          {label}
        </div>
        {description ? <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 flex h-[18px] w-8 shrink-0 items-center rounded-full px-0.5 transition-colors duration-150 focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber-400 ${
          checked ? 'bg-amber-400' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full transition-transform duration-150 ${
            checked ? 'translate-x-[14px] bg-zinc-950' : 'translate-x-0 bg-zinc-300'
          }`}
        />
      </button>
    </div>
  );
}

interface SliderRowProps {
  icon: LucideIcon;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function SliderRow({ icon: Icon, label, value, min, max, step = 1, suffix = 'px', disabled = false, onChange }: SliderRowProps) {
  return (
    <div className={disabled ? 'pointer-events-none opacity-40' : ''}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zinc-200">
          <Icon size={13} className="shrink-0 text-zinc-500" />
          {label}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-zinc-400">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider mt-2.5 w-full"
      />
    </div>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  ariaLabel: string;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, ariaLabel, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="grid grid-cols-2 gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs transition-colors duration-150 ${
              active
                ? 'bg-zinc-700/60 font-medium text-amber-300 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.3)]'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            <opt.icon size={13} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

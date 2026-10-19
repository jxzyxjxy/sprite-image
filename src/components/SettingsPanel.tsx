import type { SheetSettings } from '../types'

interface SettingsPanelProps {
  settings: SheetSettings
  onChange: (patch: Partial<SheetSettings>) => void
  sheetName: string
  onNameChange: (name: string) => void
}

export default function SettingsPanel({
  settings,
  onChange,
  sheetName,
  onNameChange,
}: SettingsPanelProps) {
  const { layout, columns, padding, trimTransparent, powerOfTwo } = settings

  return (
    <div className="card">
      <h3 className="card-title">导出设置</h3>

      <div className="field">
        <span>排版方式</span>
        <div className="seg">
          <button
            className={layout === 'compact' ? 'active' : ''}
            onClick={() => onChange({ layout: 'compact' })}
          >
            紧凑排列
          </button>
          <button
            className={layout === 'grid' ? 'active' : ''}
            onClick={() => onChange({ layout: 'grid' })}
          >
            网格排列
          </button>
        </div>
      </div>

      {layout === 'grid' && (
        <label className="field">
          <span>列数（留空为自动）</span>
          <input
            type="number"
            min={1}
            max={64}
            value={columns > 0 ? columns : ''}
            placeholder="自动"
            onChange={(e) =>
              onChange({ columns: Math.max(0, Math.min(64, Number(e.target.value) || 0)) })
            }
          />
        </label>
      )}

      <label className="field">
        <span>图块间距（px）</span>
        <input
          type="number"
          min={0}
          max={64}
          value={padding}
          onChange={(e) =>
            onChange({ padding: Math.max(0, Math.min(64, Math.floor(Number(e.target.value) || 0))) })
          }
        />
      </label>

      <label className="field">
        <span>导出文件名（不含扩展名）</span>
        <input
          type="text"
          value={sheetName}
          placeholder="spritesheet"
          onChange={(e) => onNameChange(e.target.value)}
        />
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={trimTransparent}
          onChange={(e) => onChange({ trimTransparent: e.target.checked })}
        />
        裁剪图片四周的透明边缘
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={powerOfTwo}
          onChange={(e) => onChange({ powerOfTwo: e.target.checked })}
        />
        画布尺寸向上取 2 的幂（利于 GPU 纹理）
      </label>
    </div>
  )
}

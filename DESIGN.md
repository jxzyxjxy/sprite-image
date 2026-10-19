# DESIGN.md

> 本文件沉淀当前实现（sprite-sheet-tool 压缩包代码）的设计规范，UI 改动前先阅读。

## 气质与意象

- 现代深色工具风：克制、专业、信息密度适中，强调「上传 → 预览 → 导出」的单页工作流。
- 视觉重心在中央预览区的棋盘格画布；其余元素退后为深色面板容器。

## 配色方案（深色主题，CSS 变量定义于 `src/index.css`）

| 变量 | 取值 | 用途 |
| --- | --- | --- |
| `--bg` | `#0f1115` | 页面背景 |
| `--bg-panel` | `#171a21` | 卡片/面板背景 |
| `--bg-hover` | `#1e222b` | 悬停态背景 |
| `--border` | `#2a2f3a` | 发丝边框 |
| `--text` | `#e8eaf0` | 主文字 |
| `--text-dim` | `#9aa3b2` | 次要文字 |
| `--accent` | `#4f8cff` | 主强调色（聚焦、选中、主按钮） |
| `--accent-2` | `#22c1a4` | 辅助强调色（与 accent 组成渐变） |
| `--danger` | `#ff5c5c` | 清空/删除等危险操作 |
| `--radius` | `12px` | 卡片圆角（控件 8–10px） |

- Logo 与主按钮使用 `linear-gradient(135deg, var(--accent), var(--accent-2))` 渐变。
- 透明背景棋盘格：`linear-gradient` 四向拼接，16px 格（`#22262f` / 透明），缩略图为 12px `repeating-conic-gradient`。

## 字体排版

- 系统中文栈：`'PingFang SC', 'Microsoft YaHei', -apple-system, ... , sans-serif`，不引入 Web 字体。
- 标题 22px/700；面板标题 15px；正文 13–14px；辅助说明 11–12px。

## 布局

- 页面容器：max-width 1200px 居中，左右两栏网格 `380px + 1fr`（gap 20px）。
- 左栏：上传区 → 图片列表（max-height 280px 滚动）→ 导出设置；右栏：预览 → 下载按钮 → 提示文案。
- 响应式：`max-width: 920px` 时折叠为单列。

## 动效与交互

- 过渡统一 `all 0.15s–0.2s ease`，仅颜色/边框/透明度/transform 变化。
- 拖拽上传区：hover/dragover 时边框变 accent 色、背景提亮、`scale(1.01)`。
- 按钮禁用态：`opacity: 0.4` + `cursor: not-allowed`。
- 图标使用 emoji（🧩 ⬇ ✕），为本项目的既定风格，新增 UI 保持一致即可。

## 设计禁忌

- 禁止浅色主题。
- 禁止引入与现有变量体系冲突的第二套强调色。

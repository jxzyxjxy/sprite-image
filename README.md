# 雪碧图生成工具（Sprite Sheet Tool）

基于 **React + TypeScript + Vite** 的网页版雪碧图生成工具：上传多张图片，自动合并为一张雪碧图（Sprite Sheet），并导出对应的 JSON 数据文件。

## 功能特性

- 🖼️ **多图上传**：拖拽或点击选择，支持 PNG / JPG / WebP / GIF / SVG，可一次多选
- 👁️ **实时预览**：图片或设置变化后自动重新生成，棋盘格背景展示透明区域
- 📐 **两种排版**：
  - **紧凑排列**（Shelf Packing）：按高度分行、近似正方形排布，空间利用率高
  - **网格排列**：等距网格，可自定义列数（留空自动）
- ⚙️ **可调参数**：图块间距、透明边缘裁剪（Trim）、画布尺寸取 2 的幂、导出文件名
- 💾 **一键下载**：PNG 雪碧图 + JSON 数据文件
- 🔒 **纯前端实现**：所有处理在浏览器本地完成，图片不会上传服务器

## 快速开始

```bash
# 安装依赖（Node.js >= 18）
npm install

# 启动开发服务器，默认 http://localhost:5173
npm run dev

# 生产构建，输出到 dist/
npm run build

# 本地预览构建产物
npm run preview
```

## JSON 格式说明

导出的 JSON 采用 **TexturePacker JSON（Hash）兼容格式**，Phaser、PixiJS、Cocos 等主流游戏引擎可直接加载：

```json
{
  "frames": {
    "hero-run-0.png": {
      "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "rotated": false,
      "trimmed": false,
      "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "sourceSize": { "w": 64, "h": 64 }
    }
  },
  "meta": {
    "app": "Sprite Sheet Tool",
    "version": "1.0.0",
    "image": "spritesheet.png",
    "format": "RGBA8888",
    "size": { "w": 512, "h": 128 },
    "scale": "1"
  }
}
```

| 字段 | 含义 |
| --- | --- |
| `frame` | 该帧在雪碧图中的位置与尺寸 |
| `spriteSourceSize` | 开启透明裁剪时，帧内容在原始图片中的偏移 |
| `sourceSize` | 原始图片尺寸 |
| `meta.size` | 整张雪碧图尺寸 |

## 使用建议

- **序列帧动画**：按文件名顺序上传，配合「网格排列 + 固定列数」，帧序与网格顺序一致
- **UI 图集**：使用「紧凑排列」最省空间；开启「裁剪透明边缘」可进一步压缩
- **GPU 纹理**：目标平台不支持 NPOT 纹理时，勾选「画布尺寸取 2 的幂」
- **间距**：需要避免纹理渗色（bleeding）时，适当增大间距（如 2–4px）

## 目录结构

```
├── index.html                    # 入口 HTML
├── package.json
├── vite.config.ts                # Vite 配置（base: './'，构建产物可直接静态打开）
├── tsconfig.json / tsconfig.node.json
└── src/
    ├── main.tsx                  # 应用入口
    ├── App.tsx                   # 主界面：状态管理与自动生成流程
    ├── App.css / index.css       # 样式（深色主题）
    ├── types.ts                  # 领域类型定义
    ├── components/
    │   ├── DropZone.tsx          # 拖拽/点击上传区
    │   ├── ImageList.tsx         # 已上传图片列表
    │   ├── SettingsPanel.tsx     # 导出设置面板
    │   └── PreviewPanel.tsx      # 雪碧图实时预览
    └── utils/
        ├── packer.ts             # 排版算法（Shelf / Grid）
        ├── spritesheet.ts        # 雪碧图合成 + JSON 导出
        └── download.ts           # 文件下载工具
```

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

> 本项目使用 **pnpm**（`package.json` 已通过 `preinstall` 限定包管理器，npm/yarn 会被拒绝）。Node.js 建议 20+（沙箱使用 Node 24）。

```bash
# 安装依赖
pnpm install

# 启动开发服务器（Express + Vite 中间件 + HMR，默认 http://localhost:5000）
pnpm run dev

# 生产构建：Vite 构建前端到 dist/，tsup 打包服务端到 dist-server/
pnpm run build

# 本地以生产模式运行构建产物
COZE_PROJECT_ENV=PROD PORT=3000 node dist-server/server.js
```

## 服务器部署（PM2 / 一键脚本）

服务端是一个极简 Express 进程：生产模式下（环境变量 `COZE_PROJECT_ENV=PROD`）托管 `dist/` 静态文件，图片处理仍全部在浏览器完成。监听端口取 `PORT`（deploy.sh / PM2 配置默认 3000），监听地址取 `HOST`（默认 `0.0.0.0`）。

### 方式一：一键部署脚本（推荐）

服务器首次需要安装 Node.js 与 pnpm（`corepack enable && corepack prepare pnpm@latest --activate`），之后：

```bash
git clone https://github.com/jxzyxjxy/sprite-image.git
cd sprite-image
bash deploy.sh                 # 安装依赖 -> 构建 -> PM2 启动（首次会自动全局安装 pm2）

# 后续更新
git pull && bash deploy.sh
# 或一步到位（脚本内置 git pull）
PULL=1 bash deploy.sh

# 常用变体
PORT=8080 bash deploy.sh       # 指定端口
PM2=0 bash deploy.sh           # 不用 PM2，前台运行（排查问题用）
SKIP_BUILD=1 bash deploy.sh    # 跳过构建，仅用已有产物重启
```

脚本会自动执行 `pm2 save`，并打印 `pm2 startup` 的开机自启命令（按提示把那条 `sudo ...` 命令执行一次即可实现服务器重启后自动拉起）。

### 方式二：手动使用 PM2

```bash
pnpm install
pnpm run build
pm2 start ecosystem.config.cjs          # 启动（名称 sprite-sheet-tool）
pm2 logs sprite-sheet-tool              # 查看日志
pm2 restart ecosystem.config.cjs --update-env   # 更新代码重新 build 后重启
PORT=8080 pm2 restart ecosystem.config.cjs --update-env  # 改端口
```

### 方式三：不用 PM2（systemd / 裸 node）

```bash
pnpm install && pnpm run build
COZE_PROJECT_ENV=PROD PORT=3000 HOST=0.0.0.0 node dist-server/server.js
```

建议前置 Nginx 反向代理并配置 HTTPS：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50m;   # 本工具图片不上传服务器，仅为常规保险

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
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

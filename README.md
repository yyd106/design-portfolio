# 个人作品集主页 — 上线指南

一个数字 lookbook 形式的作品集主页。**零外部依赖**（无 Google Fonts、无 CDN 脚本），
专为中国大陆可访问性设计。当前带 6 页占位图，可直接本地预览。

## 目录结构

```
portfolio-site/
├── site/                    ← 部署目录（整个站点都在这里）
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js
│   ├── site.config.json     ← ★ 唯一需要你编辑的内容文件
│   └── assets/
│       ├── manifest.json    ← 脚本自动生成
│       └── pages/*.webp     ← 脚本自动生成
├── build_assets.py          ← PDF → 网页资产，一条命令
├── requirements.txt
└── README.md
```

## 三步上线

### ① 生成资产（本地，约 1–3 分钟）

从 Google Drive 下载你的 `moschino-project1 -2.pdf`，然后：

```bash
pip install -r requirements.txt
python build_assets.py "moschino-project1 -2.pdf"
```

209MB 的 PDF 会被压成约 5–20MB 的 WebP 逐页图（这一步必须做——
原体积在大陆跨境带宽下没人打得开）。若想更小：`--width 1280 --quality 70`。

### ② 填内容（2 分钟）

编辑 `site/site.config.json`：名字、项目简介、About、联系方式。
本地预览：

```bash
cd site && python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

### ③ 部署到 EdgeOne Pages（免费、大陆可访问、免备案）

1. 把整个项目推到 GitHub（私有仓库即可）：
   ```bash
   git init && git add . && git commit -m "portfolio v1"
   git remote add origin <你的仓库地址> && git push -u origin main
   ```
2. 打开 https://edgeone.ai → 用邮箱或 GitHub 登录（免费，无需信用卡）
3. Pages → Create Project → 关联该 GitHub 仓库
   - **Root directory / 输出目录填 `site`**，无构建命令（纯静态）
4. 部署完成后获得 `xxx.edgeone.app` 域名，大陆可直接访问

此后**每次 `git push` 自动重新部署** —— 改内容只需改 config、push，完事。

## 更新作品集

换了新 PDF？只需：

```bash
python build_assets.py 新作品集.pdf && git add -A && git commit -m "update" && git push
```

## 常见问题

- **图片顺序**就是 PDF 页序；要调整顺序，直接在原 PPT/PDF 里调整后重新导出。
- **自定义域名**：EdgeOne 国际版支持绑定自有域名（免备案，境外解析）；
  如果未来要追求大陆最优速度，再考虑国内版 + ICP 备案（需 1–2 周）。
- **隐私提醒**：你的 Google Drive 链接目前是"知道链接即可查看"，
  上线后建议关闭该分享或改为受限。

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_assets.py — 把作品集 PDF 一条命令转成网页资产
====================================================
用途：
    将 PDF 每一页渲染为压缩后的 WebP 图片，写入 site/assets/pages/，
    并生成 site/assets/manifest.json 供前端读取。
    （209MB 的原始 PDF 处理后通常在 5–20MB，否则大陆访客根本打不开）

用法：
    python build_assets.py <你的作品集.pdf>

可选参数：
    --width    输出图片最大宽度，默认 1600px（兼顾清晰度与体积）
    --quality  WebP 质量 1-100，默认 80
    --out      输出目录，默认 ./site/assets

依赖（仅两个，均为纯 pip 安装、无系统级依赖）：
    pip install pymupdf pillow
"""

import argparse
import io
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import fitz  # PyMuPDF：直接按目标分辨率渲染页面，内存友好，适合超大 PDF
    from PIL import Image
except ImportError:
    sys.exit("缺少依赖，请先运行：pip install pymupdf pillow")


def build(pdf_path: Path, out_dir: Path, max_width: int, quality: int) -> None:
    if not pdf_path.exists():
        sys.exit(f"找不到文件：{pdf_path}")

    pages_dir = out_dir / "pages"
    # 清空旧资产，保证 manifest 与图片一致
    if pages_dir.exists():
        shutil.rmtree(pages_dir)
    pages_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    n = doc.page_count
    print(f"打开 {pdf_path.name}：共 {n} 页，开始渲染（目标宽度 {max_width}px，WebP q={quality}）\n")

    manifest = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": pdf_path.name,
        "pages": [],
    }
    total_bytes = 0

    for i, page in enumerate(doc, start=1):
        # 按目标宽度计算缩放系数：逐页渲染，不会因原 PDF 巨大而爆内存
        zoom = max_width / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)

        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        buf = io.BytesIO()
        # method=6：WebP 最高压缩努力度，体积更小（编码稍慢，一次性任务无所谓）
        img.save(buf, "WEBP", quality=quality, method=6)

        fname = f"page-{i:03d}.webp"
        (pages_dir / fname).write_bytes(buf.getvalue())

        size = len(buf.getvalue())
        total_bytes += size
        manifest["pages"].append({"file": fname, "w": pix.width, "h": pix.height})
        print(f"  ✓ 第 {i:>3}/{n} 页 → {fname}  ({size/1024:,.0f} KB)")

    doc.close()

    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\n完成：{n} 页，总计 {total_bytes/1024/1024:.1f} MB → {pages_dir}")
    print(f"manifest 已写入 {out_dir/'manifest.json'}")
    if total_bytes > 40 * 1024 * 1024:
        print("提示：总体积超过 40MB，建议降低 --width（如 1280）或 --quality（如 70）后重跑。")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="作品集 PDF → 网页资产")
    ap.add_argument("pdf", type=Path, help="作品集 PDF 路径")
    ap.add_argument("--width", type=int, default=1600, help="输出最大宽度 px（默认 1600）")
    ap.add_argument("--quality", type=int, default=80, help="WebP 质量 1-100（默认 80）")
    ap.add_argument("--out", type=Path, default=Path(__file__).parent / "site" / "assets",
                    help="输出目录（默认 ./site/assets）")
    args = ap.parse_args()
    build(args.pdf, args.out, args.width, args.quality)

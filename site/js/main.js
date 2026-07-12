/* ============================================================
   Digital Lookbook — main.js
   职责：
   1. 读取 site.config.json → 注入文案（改内容不用碰代码）
   2. 读取 assets/manifest.json → 生成逐页画廊（懒加载）
   3. 书脊页码轨随滚动更新（当前浏览到第几页）
   4. 灯箱：点击放大 / ← → 翻页 / Esc 关闭
   无任何外部依赖。
   ============================================================ */

(async function () {
  const $ = (id) => document.getElementById(id);

  /* ---------- 1. 注入站点文案 ---------- */
  let cfg = {};
  try {
    cfg = await (await fetch("site.config.json", { cache: "no-store" })).json();
  } catch (e) {
    console.error("site.config.json 加载失败", e);
  }

  const name = cfg.name || "PORTFOLIO";
  document.title = `${name} — ${cfg.tagline || "Portfolio"}`;

  $("eyebrow").textContent = cfg.eyebrow || "";
  $("tagline").textContent = cfg.tagline || "";
  $("projectTitle").textContent = (cfg.project && cfg.project.title) || "";
  $("projectYear").textContent = (cfg.project && cfg.project.year) || "";
  $("projectSubtitle").textContent = (cfg.project && cfg.project.subtitle) || "";
  $("projectDesc").textContent = (cfg.project && cfg.project.description) || "";
  $("aboutText").textContent = cfg.about || "";
  $("footerNote").textContent = cfg.footer_note || "";

  // 报头逐字符入场动画（尊重 prefers-reduced-motion，CSS 侧已处理回退）
  const mast = $("mastheadName");
  mast.setAttribute("aria-label", name);
  name.split("").forEach((c, i) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.style.animationDelay = `${i * 0.035}s`;
    s.textContent = c === " " ? "\u00A0" : c;
    s.setAttribute("aria-hidden", "true");
    mast.appendChild(s);
  });

  // 联系方式：只渲染填写了的项
  const contactMap = {
    email: (v) => `<a href="mailto:${v}">${v}</a>`,
    instagram: (v) => `<a href="https://instagram.com/${v.replace(/^@/, "")}" target="_blank" rel="noopener">@${v.replace(/^@/, "")}</a>`,
    xiaohongshu: (v) => `<span>${v}</span>`,
    wechat: (v) => `<span>${v}</span>`,
    linkedin: (v) => `<a href="${v}" target="_blank" rel="noopener">LinkedIn</a>`,
  };
  const labels = { email: "Email", instagram: "Instagram", xiaohongshu: "小红书", wechat: "WeChat", linkedin: "LinkedIn" };
  const list = $("contactList");
  Object.entries(cfg.contact || {}).forEach(([k, v]) => {
    if (!v || !contactMap[k]) return;
    const li = document.createElement("li");
    li.innerHTML = `<span class="k">${labels[k] || k}</span>${contactMap[k](v)}`;
    list.appendChild(li);
  });

  /* ---------- 2. 生成画廊 ---------- */
  let manifest = { pages: [] };
  try {
    manifest = await (await fetch("assets/manifest.json", { cache: "no-store" })).json();
  } catch (e) {
    console.error("assets/manifest.json 加载失败 —— 请先运行 build_assets.py", e);
  }

  const pages = manifest.pages || [];
  const total = pages.length;
  $("spineTotal").textContent = `/ ${String(total).padStart(2, "0")}`;

  const plates = $("plates");
  pages.forEach((p, i) => {
    const fig = document.createElement("figure");
    fig.className = "plate";
    fig.dataset.index = i;
    // 用真实宽高比预留空间，避免懒加载时页面跳动
    fig.innerHTML = `
      <button type="button" aria-label="放大第 ${i + 1} 页">
        <img loading="lazy" decoding="async"
             src="assets/pages/${p.file}"
             width="${p.w}" height="${p.h}"
             alt="Portfolio page ${i + 1}">
      </button>
      <figcaption><span class="no">P.${String(i + 1).padStart(2, "0")}</span><span>${name}</span></figcaption>`;
    fig.querySelector("button").addEventListener("click", () => openLightbox(i));
    plates.appendChild(fig);
  });

  /* ---------- 3. 滚动观察：入场动画 + 书脊页码 ---------- */
  const spinePage = $("spinePage");
  spinePage.textContent = total ? "P.01" : "P.00";

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          spinePage.textContent = `P.${String(+en.target.dataset.index + 1).padStart(2, "0")}`;
        }
      });
    },
    { threshold: 0.35 }
  );
  document.querySelectorAll(".plate").forEach((el) => io.observe(el));

  /* ---------- 4. 灯箱 ---------- */
  const lb = $("lightbox");
  const lbImg = $("lbImg");
  const lbCap = $("lbCaption");
  let cur = 0;
  let lastFocus = null;

  function show(i) {
    cur = (i + total) % total;
    const p = pages[cur];
    lbImg.src = `assets/pages/${p.file}`;
    lbImg.alt = `Portfolio page ${cur + 1}`;
    lbCap.textContent = `P.${String(cur + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  }
  function openLightbox(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("lbClose").focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  $("lbClose").addEventListener("click", closeLightbox);
  $("lbPrev").addEventListener("click", () => show(cur - 1));
  $("lbNext").addEventListener("click", () => show(cur + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
})();

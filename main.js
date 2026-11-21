(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const theme = () => (root.dataset.theme === "dark" ? "dark" : "light");

  // ---------- 主题：截图跟着换成同一屏的日间 / 夜间版 ----------
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  // 截图换过就把这个号加一：同名文件浏览器会用缓存。
  const SHOTS_VERSION = "12";
  const applyShots = () => {
    const t = theme();
    document.querySelectorAll("img[data-shot]").forEach((img) => {
      const src = `assets/shots/${img.dataset.shot}-${t}.webp?v=${SHOTS_VERSION}`;
      if (!img.src.endsWith(src)) img.src = src;
    });
    if (themeMeta) themeMeta.content = t === "dark" ? "#07070d" : "#fbfbfd";
  };
  // 可选截图（真机拍的远程桌面 / 窗口模式）：文件在才显示，缺图时整块退回纯文字排版。
  document.querySelectorAll("img[data-optional]").forEach((img) => {
    const box = img.closest(".phone");
    const sync = () => {
      const row = box.closest("#remotePhones");
      if (row) row.hidden = ![...row.querySelectorAll(".phone")].some((p) => !p.hidden);
      box.closest(".winmode")?.classList.toggle("has-shot", !box.hidden);
    };
    const show = () => { box.hidden = false; sync(); };
    img.addEventListener("load", show);
    img.addEventListener("error", () => { box.hidden = true; sync(); });
    if (img.complete && img.naturalWidth) show();
  });
  applyShots();
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const next = theme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("uterm-theme", next); } catch (e) {}
    applyShots();
  });

  // ---------- 导航：滚动后加底；高亮当前段落 ----------
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 12);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const links = new Map([...document.querySelectorAll(".nav-links a")].map((a) => [a.getAttribute("href").slice(1), a]));
  const sectionIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.classList.remove("is-current"));
      links.get(e.target.id)?.classList.add("is-current");
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((_, id) => { const el = document.getElementById(id); if (el) sectionIO.observe(el); });

  // ---------- 出场：同一组里的卡片依次进来 ----------
  for (const group of document.querySelectorAll(".bento, .trust, .paths, .feature-list, .all-features")) {
    [...group.children].forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--i", i % 6);
    });
    group.classList.remove("reveal");
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // ---------- 首屏：手机随滚动比 Mac 窗口走得快一点（很轻的视差） ----------
  const phone = document.querySelector(".stage .phone");
  if (phone && !reduceMotion) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = Math.min(scrollY, 900);
      phone.style.transform = `translate3d(0, ${(-y * 0.08).toFixed(1)}px, 0)`;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

})();

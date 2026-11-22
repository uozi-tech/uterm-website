(() => {
  const root = document.documentElement;
  const theme = () => (root.dataset.theme === "dark" ? "dark" : "light");
  // 语言页在子目录里（en/、ja/ …，build-i18n.py 生成），资源在上一级。
  const base = root.dataset.base || "";

  // ---------- 主题：截图跟着换成同一屏的日间 / 夜间版 ----------
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  // 截图换过就把这个号加一：同名文件浏览器会用缓存。
  const SHOTS_VERSION = "13";
  const applyShots = () => {
    const t = theme();
    document.querySelectorAll("img[data-shot]").forEach((img) => {
      const src = `${base}assets/shots/${img.dataset.shot}-${t}.webp?v=${SHOTS_VERSION}`;
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

  // ---------- 语言：选了就记住，中文首页不再按浏览器语言跳转 ----------
  document.getElementById("langSelect")?.addEventListener("change", (e) => {
    const lang = e.target.value;
    try { localStorage.setItem("uterm-lang", lang); } catch (err) {}
    location.href = `${base}${lang === "zh" ? "" : lang + "/"}${location.hash}`;
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

})();

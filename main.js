(() => {
  const root = document.documentElement;
  const theme = () => (root.dataset.theme === "dark" ? "dark" : "light");
  // 语言页在子目录里（en/、ja/ …，build-i18n.py 生成），资源在上一级。
  const base = root.dataset.base || "";

  // ---------- 主题：截图跟着换成同一屏的日间 / 夜间版 ----------
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  // 截图换过就把这个号加一：同名文件浏览器会用缓存。
  const SHOTS_VERSION = "14";
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

  // ---------- 语言菜单：菜单项是指向各语言页的链接；选了就记住，中文首页不再按浏览器语言跳转 ----------
  const langSwitch = document.getElementById("langSwitch");
  if (langSwitch) {
    const button = langSwitch.querySelector(".lang-btn");
    const items = [...langSwitch.querySelectorAll(".lang-menu a")];
    const isOpen = () => langSwitch.classList.contains("is-open");
    const setOpen = (open) => {
      langSwitch.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    };
    button.addEventListener("click", () => setOpen(!isOpen()));
    // 点菜单外面、焦点离开（Tab 走了）都收起。
    document.addEventListener("pointerdown", (e) => { if (isOpen() && !langSwitch.contains(e.target)) setOpen(false); });
    langSwitch.addEventListener("focusout", (e) => { if (isOpen() && e.relatedTarget && !langSwitch.contains(e.relatedTarget)) setOpen(false); });
    langSwitch.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (isOpen()) { setOpen(false); button.focus(); }
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      setOpen(true);
      const at = items.indexOf(document.activeElement);
      const current = Math.max(0, items.findIndex((a) => a.hasAttribute("aria-current")));
      const next = e.key === "Home" ? 0
        : e.key === "End" ? items.length - 1
        : at < 0 ? current   // 从按钮按方向键：先落在当前语言上
        : (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    });
    for (const a of items) {
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;   // 新标签页打开的不算换语言
        try { localStorage.setItem("uterm-lang", a.dataset.lang); } catch (err) {}
        e.preventDefault();
        if (a.hasAttribute("aria-current")) { setOpen(false); return; }
        location.href = a.href + location.hash;
      });
    }
  }

  // ---------- 导航：滚动后加底；高亮当前段落 ----------
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 12);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  // 导航链接一行放不下时，多出来的会换到第二行并被裁掉（见 styles.css）；看不见的标成 inert，不进 Tab 顺序。
  const navLinks = document.querySelector(".nav-links");
  if (navLinks && "ResizeObserver" in window) {
    const syncNavLinks = () => {
      const firstRow = navLinks.firstElementChild.offsetTop;
      for (const a of navLinks.children) a.inert = a.offsetTop > firstRow;
    };
    new ResizeObserver(syncNavLinks).observe(navLinks);
    document.fonts?.ready.then(syncNavLinks);
  }
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

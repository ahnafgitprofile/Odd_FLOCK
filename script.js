/* =====================================================================
   ODDFLOCK — script.js
   ===================================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  /* ------------------------------------------------------------------
     TOUCH RIPPLE — fires on touchstart for coarse / touch pointers.
     This covers mobile browsers AND Chrome's "desktop mode" on mobile,
     because both report pointer:coarse / hover:none so finePointer=false.
     ------------------------------------------------------------------ */
  if (!finePointer && !reduceMotion) {
    document.addEventListener("touchstart", (e) => {
      Array.from(e.changedTouches).forEach((t) => {
        const el = document.createElement("div");
        el.className = "touch-ripple";
        el.style.left = t.clientX + "px";
        el.style.top  = t.clientY + "px";
        document.body.appendChild(el);
        el.addEventListener("animationend", () => el.remove(), { once: true });
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     1. CUSTOM CURSOR — inner dot tracks instantly, outer ring lags.
        Only active on true fine-pointer (mouse) devices.
     ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    const dot  = document.querySelector("[data-cursor-dot]");
    const ring = document.querySelector("[data-cursor-ring]");
    document.body.classList.add("cursor-active");

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }, { passive: true });

    function loop() {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    document.querySelectorAll("[data-cursor]").forEach((el) => {
      const type = el.getAttribute("data-cursor");
      el.addEventListener("mouseenter", () => {
        ring.classList.add(type === "view" ? "is-view" : "is-hover");
        dot.classList.add("is-hover");
      });
      el.addEventListener("mouseleave", () => {
        ring.classList.remove("is-hover", "is-view");
        dot.classList.remove("is-hover");
      });
    });

    document.addEventListener("mouseleave", () => { dot.style.opacity = ring.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { dot.style.opacity = ring.style.opacity = "1"; });
  }

  /* ------------------------------------------------------------------
     2. INTRO LOADER — emblem spins center, wordmark types, the whole
        lockup flies to the nav position, then the page reveals
     ------------------------------------------------------------------ */
  const loader    = document.querySelector("[data-loader]");
  const heroTitle = document.querySelector(".hero__title");

  function revealPage() {
    if (loader) loader.classList.add("is-done");
    if (heroTitle) heroTitle.classList.add("is-revealed");
    document.body.style.overflow = "";
  }

  function runIntro() {
    const lockup   = document.querySelector("[data-loader-lockup]");
    const mark     = document.querySelector("[data-loader-mark]");
    const word     = document.querySelector("[data-loader-word]");
    const navBrand = document.querySelector(".nav .brand");

    if (!loader || !lockup || !mark || !word || !navBrand || reduceMotion) {
      setTimeout(revealPage, reduceMotion ? 120 : 0);
      return;
    }

    document.body.style.overflow = "hidden";

    const vw = window.innerWidth, vh = window.innerHeight;
    const START      = vw < 600 ? 58 : 80;
    const END_MARK   = 30;
    const START_WORD = vw < 600 ? 22 : 30;
    const END_WORD   = 18;
    const GAP        = 14;

    lockup.style.transition = "none";
    mark.style.width = mark.style.height = START + "px";
    word.style.color = "var(--ghost)";
    word.style.width = "0"; word.style.opacity = "0";
    word.style.fontSize = START_WORD + "px"; word.style.marginLeft = "0";
    lockup.style.left = (vw / 2 - START / 2) + "px";
    lockup.style.top  = (vh / 2 - START / 2) + "px";
    lockup.getBoundingClientRect();

    mark.style.animation = "spin 1.05s cubic-bezier(0.4,0,0.2,1) 1";

    setTimeout(() => {
      word.style.transition = "none"; word.style.width = "auto";
      word.style.fontSize = START_WORD + "px"; const wStart = word.offsetWidth || START_WORD * 6;
      word.style.fontSize = END_WORD + "px";   const wEnd   = word.offsetWidth || END_WORD * 6;
      word.style.fontSize = START_WORD + "px"; word.style.width = "0";
      word.getBoundingClientRect();

      mark.style.animation = "none";
      lockup.style.transition = "left .55s " + EASE + ", top .55s " + EASE;
      lockup.style.left = (vw / 2 - START / 2 - (wStart + GAP) / 2) + "px";

      setTimeout(() => {
        word.style.transition = "width .5s " + EASE + ", opacity .35s ease, margin-left .45s " + EASE;
        word.style.width = wStart + "px";
        word.style.opacity = "1";
        word.style.marginLeft = GAP + "px";

        setTimeout(() => {
          const r = navBrand.getBoundingClientRect();
          lockup.style.transition = "left .8s " + EASE + ", top .8s " + EASE;
          mark.style.transition   = "width .8s " + EASE + ", height .8s " + EASE;
          word.style.transition   = "font-size .8s " + EASE + ", width .8s " + EASE + ", margin-left .8s " + EASE + ", color .7s ease";
          lockup.style.left = r.left + "px";
          lockup.style.top  = r.top + "px";
          mark.style.width = mark.style.height = END_MARK + "px";
          word.style.fontSize = END_WORD + "px";
          word.style.width = wEnd + "px";
          word.style.marginLeft = "12px";
          word.style.color = "var(--emerald)";

          setTimeout(revealPage, 720);
        }, 720);
      }, 320);
    }, 1050);
  }

  runIntro();

  window.addEventListener("load", () => {
    setTimeout(() => {
      if (loader && !loader.classList.contains("is-done")) revealPage();
    }, 5600);
  });

  /* ------------------------------------------------------------------
     3. NAV — condense on scroll, hide on scroll-down / show on scroll-up
     ------------------------------------------------------------------ */
  const nav = document.querySelector("[data-nav]");
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle("is-scrolled", y > 40);
      if (y > lastY && y > 320) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
    }
    lastY = y;
  }, { passive: true });

  /* ------------------------------------------------------------------
     4. SCROLL REVEALS — IntersectionObserver
     ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
        setTimeout(() => {
          el.classList.add("is-visible");
          if (el.querySelector && el.querySelector(".word")) el.classList.add("is-revealed");
        }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible", "is-revealed"));
  }

  document.querySelectorAll(".contact__title").forEach((el) => {
    if ("IntersectionObserver" in window) {
      const io2 = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { el.classList.add("is-revealed"); io2.unobserve(el); } });
      }, { threshold: 0.4 });
      io2.observe(el);
    } else { el.classList.add("is-revealed"); }
  });

  /* ------------------------------------------------------------------
     5. THE FLOCK — draw emerald connector lines between members on hover.
        Uses measured card centres relative to the SVG overlay.
     ------------------------------------------------------------------ */
  const net  = document.querySelector("[data-net]");
  const grid = document.querySelector("[data-flock]");
  if (net && grid && finePointer) {
    const members = Array.from(grid.querySelectorAll("[data-member]"));
    let centers = [];

    function measure() {
      const sec = net.parentElement.getBoundingClientRect();
      net.setAttribute("viewBox", `0 0 ${sec.width} ${sec.height}`);
      net.setAttribute("preserveAspectRatio", "none");
      centers = members.map((m) => {
        const r = m.getBoundingClientRect();
        return { x: r.left - sec.left + r.width / 2, y: r.top - sec.top + r.height / 2 };
      });
    }
    measure();
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("load", measure);

    members.forEach((m, i) => {
      m.addEventListener("mouseenter", () => {
        measure();
        const from = centers[i];
        let svg = "";
        centers.forEach((c, j) => {
          if (j === i) return;
          svg += `<line x1="${from.x}" y1="${from.y}" x2="${c.x}" y2="${c.y}" />`;
          svg += `<circle cx="${c.x}" cy="${c.y}" r="3" />`;
        });
        svg += `<circle cx="${from.x}" cy="${from.y}" r="4.5" />`;
        net.innerHTML = svg;
        requestAnimationFrame(() => {
          net.querySelectorAll("line, circle").forEach((node) => (node.style.opacity = "0.85"));
        });
      });
      m.addEventListener("mouseleave", () => {
        net.querySelectorAll("line, circle").forEach((node) => (node.style.opacity = "0"));
        setTimeout(() => { net.innerHTML = ""; }, 400);
      });
    });
  }

  /* ------------------------------------------------------------------
     5b. MOBILE MENU (hamburger) + body scroll lock
     ------------------------------------------------------------------ */
  const burger = document.querySelector("[data-burger]");
  const menu   = document.querySelector("[data-menu]");
  if (burger && menu) {
    const setMenu = (open) => {
      burger.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 960 && menu.classList.contains("is-open")) setMenu(false);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     5c. TEAM CARDS — tap to reveal bio (touch); hover handles desktop
     ------------------------------------------------------------------ */
  const memberCards = document.querySelectorAll("[data-member]");
  memberCards.forEach((card) => {
    card.addEventListener("click", () => {
      const wasOpen = card.classList.contains("is-open");
      memberCards.forEach((c) => c.classList.remove("is-open"));
      if (!wasOpen) card.classList.add("is-open");
    });
  });

  /* ------------------------------------------------------------------
     5d. THE VAULT — "Learn more" slides the case detail open
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-case-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-case]");
      if (!card) return;
      const open = card.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      const label = btn.querySelector(".case__more-label");
      if (label) label.textContent = open ? "Show less" : "Learn more";
    });
  });

  /* ------------------------------------------------------------------
     6. HERO AMBIENT FIELD — flocking nodes + connector lines (canvas)
     ------------------------------------------------------------------ */
  const canvas = document.querySelector("[data-bg-field]");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, nodes, raf;
    const COUNT = window.innerWidth < 700 ? 38 : 84;
    const LINK = 150;
    const MOUSE_R = 240;
    let mx = -9999, my = -9999;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      nodes = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        ph: Math.random() * Math.PI * 2,
        bird: Math.random() < 0.24
      }));
    }

    /* Mouse tracking — desktop only (fine pointer).
       On touch we skip mouse tracking so the canvas stays purely ambient. */
    if (finePointer) {
      window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
      window.addEventListener("mouseout", (e) => { if (!e.relatedTarget) { mx = my = -9999; } });
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = "rgba(52,168,102," + ((1 - d / LINK) * 0.15) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      if (mx > -9999) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, MOUSE_R);
        g.addColorStop(0, "rgba(52,168,102,0.05)");
        g.addColorStop(1, "rgba(52,168,102,0)");
        ctx.fillStyle = g; ctx.fillRect(mx - MOUSE_R, my - MOUSE_R, MOUSE_R * 2, MOUSE_R * 2);
      }

      nodes.forEach((n) => {
        const ddx = mx - n.x, ddy = my - n.y;
        const dm = Math.hypot(ddx, ddy);
        let near = false;
        if (dm < MOUSE_R) {
          near = true;
          n.vx += (ddx / dm) * 0.014;
          n.vy += (ddy / dm) * 0.014;
          ctx.strokeStyle = "rgba(76,208,136," + ((1 - dm / MOUSE_R) * 0.55) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mx, my); ctx.stroke();
        }
        n.vx *= 0.99; n.vy *= 0.99;
        const sp = Math.hypot(n.vx, n.vy);
        if (sp > 0.7) { n.vx = (n.vx / sp) * 0.7; n.vy = (n.vy / sp) * 0.7; }

        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        if (n.bird) {
          const ang = Math.atan2(n.vy, n.vx);
          ctx.save();
          ctx.translate(n.x, n.y); ctx.rotate(ang);
          ctx.strokeStyle = near ? "rgba(76,208,136,0.85)" : "rgba(76,208,136,0.55)"; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(0, 0); ctx.lineTo(-4, 3); ctx.stroke();
          ctx.restore();
        } else {
          const tw = 0.38 + 0.34 * Math.sin(t * 0.001 + n.ph);
          ctx.fillStyle = "rgba(52,168,102," + (near ? Math.min(0.9, tw + 0.4) : tw) + ")";
          ctx.beginPath(); ctx.arc(n.x, n.y, near ? 2.1 : 1.5, 0, Math.PI * 2); ctx.fill();
        }
      });

      raf = requestAnimationFrame(draw);
    }

    function start() { cancelAnimationFrame(raf); resize(); seed(); raf = requestAnimationFrame(draw); }
    start();
    window.addEventListener("resize", () => { resize(); seed(); }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(draw);
    });
  }

  /* ------------------------------------------------------------------
     7. SCROLL PROGRESS BAR
     ------------------------------------------------------------------ */
  const scrollbar = document.querySelector("[data-scrollbar]");
  if (scrollbar) {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollbar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------
     8. MAGNETIC BUTTONS + 3D CARD TILT (fine pointers only)
     ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.3 + "px," + y * 0.45 + "px)";
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });

    document.querySelectorAll(".member, .case").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(800px) rotateX(" + (-py * 5).toFixed(2) + "deg) rotateY(" +
          (px * 5).toFixed(2) + "deg) translateY(-5px)";
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

})();

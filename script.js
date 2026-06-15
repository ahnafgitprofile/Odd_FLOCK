/* =====================================================================
   ODDFLOCK — script.js
   ===================================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ------------------------------------------------------------------
     1. CUSTOM CURSOR — inner dot tracks instantly, outer ring lags
     ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    const dot  = document.querySelector("[data-cursor-dot]");
    const ring = document.querySelector("[data-cursor-ring]");
    document.body.classList.add("cursor-active");

    let mx = window.innerWidth / 2, my = window.innerHeight / 2; // target (mouse)
    let rx = mx, ry = my;                                        // ring (eased)

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      // inner dot is instant
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }, { passive: true });

    function loop() {
      // outer ring eases toward the mouse (the "slow" second layer)
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    // hover intent — grows the ring, tags "view" targets differently
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

    // hide when leaving the window
    document.addEventListener("mouseleave", () => { dot.style.opacity = ring.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { dot.style.opacity = ring.style.opacity = "1"; });
  }

  /* ------------------------------------------------------------------
     2. LOADER — fill the bar, then reveal the hero headline
     ------------------------------------------------------------------ */
  const loader = document.querySelector("[data-loader]");
  const fill   = document.querySelector("[data-loader-fill]");
  const heroTitle = document.querySelector(".hero__title");

  let p = 0;
  const tick = setInterval(() => {
    p = Math.min(100, p + Math.random() * 18 + 6);
    if (fill) fill.style.width = p + "%";
    if (p >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        if (loader) loader.classList.add("is-done");
        if (heroTitle) heroTitle.classList.add("is-revealed"); // triggers word-rise
      }, 320);
    }
  }, reduceMotion ? 60 : 140);

  // safety: never let the loader trap the page
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (loader && !loader.classList.contains("is-done")) {
        loader.classList.add("is-done");
        if (heroTitle) heroTitle.classList.add("is-revealed");
      }
    }, 2600);
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
          // any sub-headline with word-rise inside
          if (el.querySelector && el.querySelector(".word")) el.classList.add("is-revealed");
        }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible", "is-revealed"));
  }

  // reveal word-rise on section headings (contact / others) when they enter
  document.querySelectorAll(".contact__title").forEach((el) => {
    if ("IntersectionObserver" in window) {
      const io2 = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { el.classList.add("is-revealed"); io2.unobserve(el); } });
      }, { threshold: 0.4 });
      io2.observe(el);
    } else { el.classList.add("is-revealed"); }
  });

  /* ------------------------------------------------------------------
     5. THE FLOCK — draw emerald connector lines between members on hover
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
        // force reflow then fade in
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
    // if resized up to desktop while open, reset
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
     6. HERO AMBIENT FIELD — flocking nodes + connector lines (canvas)
     ------------------------------------------------------------------ */
  const canvas = document.querySelector("[data-field]");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, nodes, raf;
    const COUNT = window.innerWidth < 700 ? 22 : 40;
    const LINK = 150;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      nodes = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
        bird: Math.random() < 0.28           // a fraction render as little "birds"
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(52,168,102,${(1 - d / LINK) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      // nodes
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        if (n.bird) {
          // tiny chevron / bird
          const ang = Math.atan2(n.vy, n.vx);
          ctx.save();
          ctx.translate(n.x, n.y); ctx.rotate(ang);
          ctx.strokeStyle = "rgba(76,208,136,0.55)"; ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-4, -3); ctx.lineTo(0, 0); ctx.lineTo(-4, 3);
          ctx.stroke(); ctx.restore();
        } else {
          ctx.fillStyle = "rgba(52,168,102,0.5)";
          ctx.beginPath(); ctx.arc(n.x, n.y, 1.4, 0, Math.PI * 2); ctx.fill();
        }
      });

      raf = requestAnimationFrame(draw);
    }

    function start() { cancelAnimationFrame(raf); resize(); seed(); draw(); }
    start();
    window.addEventListener("resize", () => { resize(); seed(); }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    });
  }

})();

/* ===================================================
   animations.js — NeuroLearn Scroll & Motion Engine
   =================================================== */

(function () {
  "use strict";

  /* ============================================================
     1. SCROLL REVEAL
     ============================================================ */
  const revealElements = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          /* Don't unobserve — allow re-trigger on tab focus */
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  /* ============================================================
     2. SCROLL PROGRESS BAR
     ============================================================ */
  const progressBar = document.createElement("div");
  progressBar.id = "scroll-progress";
  document.body.appendChild(progressBar);

  function updateScrollProgress() {
    const scrollTop    = window.scrollY;
    const docH         = document.documentElement.scrollHeight - window.innerHeight;
    const pct          = docH > 0 ? (scrollTop / docH) * 100 : 0;
    progressBar.style.width = pct + "%";
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });

  /* ============================================================
     3. ANIMATED STAT COUNTERS
     ============================================================ */
  function animateCounter(el, target, duration = 1800) {
    const isDecimal = String(target).includes(".");
    const decimals  = isDecimal ? 1 : 0;
    const start     = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      /* ease-out expo */
      const eased    = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current  = eased * target;

      el.textContent = current.toFixed(decimals);

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseFloat(el.dataset.target);
        if (!isNaN(target)) {
          animateCounter(el, target);
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll(".stat-num[data-target]").forEach((el) => {
    counterObserver.observe(el);
  });

  /* ============================================================
     4. FEATURE BAR FILL (width animation on scroll)
     ============================================================ */
  const barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const fill  = entry.target;
        const width = fill.dataset.width || "0";
        fill.style.width = width + "%";
        barObserver.unobserve(fill);
      });
    },
    { threshold: 0.6 }
  );

  document.querySelectorAll(".feat-bar-fill").forEach((el) => {
    barObserver.observe(el);
  });

  /* ============================================================
     5. NAVBAR SCROLL STATE
     ============================================================ */
  const navbar = document.getElementById("navbar");

  function updateNavbar() {
    if (window.scrollY > 20) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", updateNavbar, { passive: true });
  updateNavbar();

  /* ============================================================
     6. ACTIVE NAV LINK BASED ON SCROLL SECTION
     ============================================================ */
  const sections    = document.querySelectorAll("section[id]");
  const navAnchors  = document.querySelectorAll(".nav-links a");

  function updateActiveLink() {
    let currentId = "";

    sections.forEach((section) => {
      const top    = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      if (window.scrollY >= top && window.scrollY < bottom) {
        currentId = section.id;
      }
    });

    navAnchors.forEach((a) => {
      const href = a.getAttribute("href").replace("#", "");
      if (href === currentId) {
        a.style.color = "var(--primary-light)";
      } else {
        a.style.color = "";
      }
    });
  }

  window.addEventListener("scroll", updateActiveLink, { passive: true });

  /* ============================================================
     7. PARALLAX — hero orbs subtle move on mouse
     ============================================================ */
  const orbs = document.querySelectorAll(".orb");

  document.addEventListener("mousemove", (e) => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx; // -1 to 1
    const dy = (e.clientY - cy) / cy;

    orbs.forEach((orb, i) => {
      const depth = (i + 1) * 10;
      orb.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
    });
  });

  /* ============================================================
     8. STAGGER FEATURE CARDS on scroll
     ============================================================ */
  const featureCards = document.querySelectorAll(".feature-card");

  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const card  = entry.target;
        const index = parseInt(card.dataset.index || "0");
        setTimeout(() => {
          card.classList.add("visible");
        }, index * 100);
        cardObserver.unobserve(card);
      });
    },
    { threshold: 0.15 }
  );

  featureCards.forEach((card) => {
    card.classList.remove("visible"); // ensure hidden first
    cardObserver.observe(card);
  });

  /* ============================================================
     9. SMOOTH ANCHOR SCROLL (override default)
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "68"
      );
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* ============================================================
     10. INTERACTIVE PROGRESS BARS (dashboard weak-areas)
        Animate in on visibility
     ============================================================ */
  const weakObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".weak-fill").forEach((fill) => {
          const w = fill.style.width;
          fill.style.width = "0%";
          requestAnimationFrame(() => {
            setTimeout(() => {
              fill.style.transition = "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)";
              fill.style.width      = w;
            }, 100);
          });
        });
        weakObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  const weakContainer = document.querySelector(".weak-areas");
  if (weakContainer) weakObserver.observe(weakContainer);

  /* ============================================================
     11. CHART TAB CLICK — ripple effect
     ============================================================ */
  document.querySelectorAll(".ct").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const ripple   = document.createElement("span");
      const rect     = this.getBoundingClientRect();
      const size     = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute; width:${size}px; height:${size}px;
        border-radius:50%;
        background:rgba(108,99,255,0.25);
        transform:translate(-50%,-50%) scale(0);
        animation:ripple 0.5s ease forwards;
        left:${e.clientX - rect.left}px;
        top:${e.clientY - rect.top}px;
        pointer-events:none;
      `;
      this.style.position = "relative";
      this.style.overflow = "hidden";
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });

  /* Inject ripple keyframe */
  const style = document.createElement("style");
  style.textContent = `
    @keyframes ripple {
      from { transform: translate(-50%,-50%) scale(0); opacity:1; }
      to   { transform: translate(-50%,-50%) scale(2.5); opacity:0; }
    }
  `;
  document.head.appendChild(style);

  /* ============================================================
     12. TYPING EFFECT — hero badge text
     ============================================================ */
  const badge = document.querySelector(".hero-badge");
  if (badge) {
    const originalText = badge.textContent.trim();
    const dot          = badge.querySelector(".badge-dot");
    const textNode     = document.createTextNode("");
    badge.innerHTML    = "";
    if (dot) badge.appendChild(dot);
    badge.appendChild(textNode);

    let i = 0;
    const baseText = " " + originalText.replace(/^[^\s]+\s/, " ");

    function typeNext() {
      if (i < baseText.length) {
        textNode.textContent += baseText[i++];
        setTimeout(typeNext, 40 + Math.random() * 30);
      }
    }
    setTimeout(typeNext, 600);
  }

  /* ============================================================
     13. RECOMMENDATION CARD HOVER — XP badge pop
     ============================================================ */
  document.querySelectorAll(".rec-item").forEach((item, i) => {
    item.style.opacity    = "0";
    item.style.transform  = "translateX(20px)";
    item.style.transition = `opacity 0.4s ${i * 0.1}s ease, transform 0.4s ${i * 0.1}s ease`;

    const recObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          item.style.opacity   = "1";
          item.style.transform = "translateX(0)";
          recObserver.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (item.closest(".recommendations")) recObserver.observe(item.closest(".recommendations"));
  });

  /* ============================================================
     14. CURSOR SPOTLIGHT — subtle radial follow
     ============================================================ */
  const spotlight = document.createElement("div");
  spotlight.style.cssText = `
    position:fixed; pointer-events:none; z-index:9998;
    width:300px; height:300px; border-radius:50%;
    background:radial-gradient(circle, rgba(108,99,255,0.06) 0%, transparent 70%);
    transform:translate(-50%,-50%);
    transition:left 0.12s ease, top 0.12s ease;
    left:-200px; top:-200px;
  `;
  document.body.appendChild(spotlight);

  document.addEventListener("mousemove", (e) => {
    spotlight.style.left = e.clientX + "px";
    spotlight.style.top  = e.clientY + "px";
  });

  /* ============================================================
     Done!
     ============================================================ */
  console.log("%c NeuroLearn ✦ Animations ready", "color:#A78BFA;font-family:monospace;font-size:14px;");
})();

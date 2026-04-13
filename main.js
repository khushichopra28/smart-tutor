/* ===================================================
   main.js — NeuroLearn Core Interactions
   =================================================== */

(function () {
  "use strict";

  /* ============================================================
     1. HAMBURGER / MOBILE NAV
     ============================================================ */
  const hamburger = document.getElementById("hamburger");
  const body      = document.body;
  const navLinks  = document.querySelector(".nav-links");
  const navCta    = document.querySelector(".nav-cta");

  let mobileOpen = false;

  function toggleMobileNav() {
    mobileOpen = !mobileOpen;
    hamburger.classList.toggle("open", mobileOpen);
    body.classList.toggle("mobile-nav-open", mobileOpen);

    if (mobileOpen) {
      /* Lock scroll */
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
    }
  }

  if (hamburger) {
    hamburger.addEventListener("click", toggleMobileNav);
  }

  /* Close on outside click */
  document.addEventListener("click", (e) => {
    if (!mobileOpen) return;
    const nav = document.getElementById("navbar");
    if (!nav.contains(e.target)) {
      toggleMobileNav();
    }
  });

  /* Close on ESC */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileOpen) toggleMobileNav();
  });

  /* ============================================================
     2. DASHBOARD SIDEBAR NAVIGATION
        Active state cycling (demo purposes)
     ============================================================ */
  const dashNavItems = document.querySelectorAll(".dash-nav-item");

  dashNavItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      dashNavItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      /* Simulate a tiny XP notification */
      showToast("Switching view…", "info");
    });
  });

  /* ============================================================
     3. RECOMMENDATION BUTTONS — simulated lesson start
     ============================================================ */
  const recBtns = document.querySelectorAll(".rec-btn");

  recBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const title = this.closest(".rec-item")
        ?.querySelector(".rec-title")?.textContent || "Lesson";

      this.textContent = "✓ Added";
      this.style.background    = "rgba(52,211,153,0.2)";
      this.style.borderColor   = "rgba(52,211,153,0.4)";
      this.style.color         = "#34D399";

      showToast(`"${title}" added to your queue!`, "success");

      setTimeout(() => {
        this.textContent         = "Start";
        this.style.background    = "";
        this.style.borderColor   = "";
        this.style.color         = "";
      }, 2500);
    });
  });

  /* ============================================================
     4. TOAST NOTIFICATION SYSTEM
     ============================================================ */
  function showToast(message, type = "info") {
    const existing = document.querySelectorAll(".neuro-toast");
    existing.forEach((t) => t.remove());

    const toast = document.createElement("div");
    toast.className = "neuro-toast";

    const colors = {
      success: { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)", icon: "✓" },
      info:    { bg: "rgba(108,99,255,0.12)", border: "rgba(108,99,255,0.3)", icon: "ℹ" },
      warn:    { bg: "rgba(255,217,61,0.12)", border: "rgba(255,217,61,0.3)", icon: "⚠" },
    };
    const c = colors[type] || colors.info;

    toast.style.cssText = `
      position:fixed; bottom:28px; right:28px; z-index:9999;
      background:${c.bg};
      border:1px solid ${c.border};
      backdrop-filter:blur(16px);
      -webkit-backdrop-filter:blur(16px);
      padding:12px 20px;
      border-radius:50px;
      font-family:'DM Sans',sans-serif;
      font-size:0.85rem;
      color:#F0F2FF;
      display:flex; align-items:center; gap:10px;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
      transform:translateY(20px); opacity:0;
      transition:transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease;
    `;
    toast.innerHTML = `<span style="font-size:1rem">${c.icon}</span>${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.transform = "translateY(0)";
        toast.style.opacity   = "1";
      });
    });

    setTimeout(() => {
      toast.style.transform = "translateY(20px)";
      toast.style.opacity   = "0";
      setTimeout(() => toast.remove(), 350);
    }, 2800);
  }

  /* ============================================================
     5. HERO CTA BUTTON — scroll to features on "Start Learning"
     ============================================================ */
  const heroBtns = document.querySelectorAll(".hero-btns .btn-primary");

  heroBtns.forEach((btn) => {
    if (btn.textContent.trim().includes("Start")) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const features = document.getElementById("features");
        if (features) {
          const navH  = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "68"
          );
          window.scrollTo({
            top:      features.offsetTop - navH,
            behavior: "smooth",
          });
        }
      });
    }

    if (btn.textContent.trim().includes("Demo")) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const dash = document.getElementById("dashboard");
        if (dash) {
          const navH = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "68"
          );
          window.scrollTo({ top: dash.offsetTop - navH, behavior: "smooth" });
        }
      });
    }
  });

  /* ============================================================
     6. FEATURE CARD hover — subtle tilt
     ============================================================ */
  const featureCards = document.querySelectorAll(".feature-card");

  featureCards.forEach((card) => {
    card.addEventListener("mousemove", function (e) {
      const rect  = this.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width  / 2);
      const dy    = (e.clientY - cy) / (rect.height / 2);
      const tiltX = dy * -5;
      const tiltY = dx *  5;
      this.style.transform = `translateY(-6px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      this.style.transition = "transform 0.1s ease";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform  = "";
      this.style.transition = "all 0.35s ease";
    });
  });

  /* ============================================================
     7. TESTIMONIAL CARDS — auto-cycle on mobile
     ============================================================ */
  const testiGrid  = document.querySelector(".testimonials-grid");
  const testiCards = document.querySelectorAll(".testi-card");

  if (testiGrid && window.innerWidth < 600 && testiCards.length > 1) {
    let current = 0;

    function highlightCard(idx) {
      testiCards.forEach((c, i) => {
        c.style.opacity = i === idx ? "1" : "0.5";
        c.style.transform = i === idx ? "scale(1.02)" : "scale(0.97)";
      });
    }

    highlightCard(0);
    setInterval(() => {
      current = (current + 1) % testiCards.length;
      highlightCard(current);
    }, 3000);
  }

  /* ============================================================
     8. PROGRESS CHART interactive tooltip
     ============================================================ */
  const canvas = document.getElementById("progressChart");

  if (canvas) {
    canvas.addEventListener("mousemove", function (e) {
      const rect = this.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      /* Tooltip position hint — full impl needs data coupling with chart.js */
      this.style.cursor = "crosshair";
    });
    canvas.addEventListener("mouseleave", function () {
      this.style.cursor = "";
    });
  }

  /* ============================================================
     9. FOOTER EMAIL SUBSCRIBE (cosmetic demo)
     ============================================================ */
  const footerLinks = document.querySelectorAll(".footer-col a");
  footerLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("Coming soon — stay tuned!", "info");
    });
  });

  /* ============================================================
     10. KEYBOARD ACCESSIBILITY — focus trap in mobile nav
     ============================================================ */
  document.addEventListener("keydown", (e) => {
    if (!mobileOpen || e.key !== "Tab") return;

    const focusable = document.querySelectorAll(
      ".nav-links a, .nav-cta a, .nav-cta button, #hamburger"
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ============================================================
     11. PERFORMANCE — reduce motion for accessibility
     ============================================================ */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }

  /* ============================================================
     12. STARTUP LOG
     ============================================================ */
  console.log(
    "%c🧠 NeuroLearn%c v1.0 — intelligent learning platform",
    "font-family:Syne,monospace;font-size:16px;font-weight:800;color:#A78BFA;",
    "font-family:DM Sans,sans-serif;font-size:13px;color:#8B93B8;"
  );

  /* Expose showToast globally for debugging */
  window.NeuroLearn = window.NeuroLearn || {};
  window.NeuroLearn.toast = showToast;
})();

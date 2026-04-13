/* ===================================================
   chart.js — NeuroLearn Dashboard Charts
   Vanilla Canvas API (no external dependency)
   =================================================== */

(function () {
  "use strict";

  /* -------- Color palette (mirrors CSS vars) -------- */
  const COLORS = {
    primary:  "#6C63FF",
    primaryL: "#A78BFA",
    cyan:     "#4FC3F7",
    yellow:   "#FFD93D",
    green:    "#34D399",
    pink:     "#FF6B9D",
    muted:    "#4A5280",
    border:   "rgba(255,255,255,0.08)",
    text:     "#8B93B8",
    bg:       "#131929",
  };

  /* -------- Dataset definitions -------- */
  const DATASETS = {
    "7D": {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      xp:     [120,  280,  200,  340,  290,  410,  340],
      acc:    [ 72,   78,   75,   82,   80,   88,   89],
    },
    "30D": {
      labels: ["W1","W2","W3","W4"],
      xp:     [820, 1040, 960, 1340],
      acc:    [74,   79,  83,   89],
    },
    "All": {
      labels: ["Jan","Feb","Mar","Apr","May","Jun"],
      xp:     [400, 650, 820, 1100, 1340, 1680],
      acc:    [62,   68,  74,   80,   85,   89],
    },
  };

  let activeKey = "7D";
  let animFrame = null;
  let animProgress = 0; // 0→1

  /* -------- Main draw function -------- */
  function drawChart(canvas, key, progress) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const data = DATASETS[key];
    const N    = data.labels.length;

    const PAD  = { top: 12, right: 20, bottom: 32, left: 42 };
    const cW   = W - PAD.left - PAD.right;
    const cH   = H - PAD.top  - PAD.bottom;

    const maxXP  = Math.max(...data.xp)  * 1.15;
    const maxAcc = 100;

    /* ---- grid lines ---- */
    ctx.save();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth   = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD.top + cH - (cH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + cW, y);
      ctx.stroke();

      /* y-axis labels (XP scale) */
      ctx.fillStyle = COLORS.text;
      ctx.font      = "10px 'DM Sans', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(
        Math.round((maxXP / gridLines) * i),
        PAD.left - 8,
        y + 4
      );
    }
    ctx.restore();

    /* ---- XP bars ---- */
    const barGroup = cW / N;
    const barW     = barGroup * 0.45;

    data.xp.forEach((val, i) => {
      const barH    = (val / maxXP) * cH * progress;
      const x       = PAD.left + i * barGroup + (barGroup - barW) / 2;
      const y       = PAD.top  + cH - barH;

      /* gradient fill */
      const grad = ctx.createLinearGradient(0, y, 0, PAD.top + cH);
      grad.addColorStop(0,   COLORS.primary);
      grad.addColorStop(1,   "rgba(108,99,255,0.1)");

      ctx.save();
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barW, barH, 4);
      ctx.fill();
      ctx.restore();

      /* label */
      ctx.save();
      ctx.fillStyle = COLORS.text;
      ctx.font      = "9px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(data.labels[i], x + barW / 2, PAD.top + cH + 18);
      ctx.restore();
    });

    /* ---- Accuracy line ---- */
    ctx.save();
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = "round";
    ctx.lineCap     = "round";

    /* glow shadow */
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur  = 8;

    ctx.beginPath();
    const visibleN = Math.ceil(N * progress);
    for (let i = 0; i < visibleN; i++) {
      const pct = i < visibleN - 1 ? 1 : (N * progress) % 1 || 1;
      const x   = PAD.left + i * barGroup + barGroup / 2;
      const y   = PAD.top  + cH - (data.acc[i] / maxAcc) * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    /* dot on last point */
    if (visibleN > 0) {
      const li = Math.min(visibleN - 1, N - 1);
      const x  = PAD.left + li * barGroup + barGroup / 2;
      const y  = PAD.top  + cH - (data.acc[li] / maxAcc) * cH;
      ctx.save();
      ctx.fillStyle    = COLORS.cyan;
      ctx.shadowColor  = COLORS.cyan;
      ctx.shadowBlur   = 14;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ---- Legend ---- */
    drawLegend(ctx, W, PAD.top);
  }

  function drawLegend(ctx, W, top) {
    const items = [
      { label: "XP Earned", color: COLORS.primary },
      { label: "Accuracy %", color: COLORS.cyan },
    ];
    let x = W - 10;
    ctx.font = "9px 'DM Sans', sans-serif";
    items.reverse().forEach(({ label, color }) => {
      const tw = ctx.measureText(label).width;
      x -= tw + 20;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x - 6, top + 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.text;
      ctx.fillText(label, x, top + 9);
    });
  }

  /* -------- Helper: rounded rect -------- */
  function roundRect(ctx, x, y, w, h, r) {
    if (h <= 0) return;
    r = Math.min(r, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* -------- Animate chart entry -------- */
  function animateChart(canvas, key) {
    cancelAnimationFrame(animFrame);
    animProgress = 0;
    const startTime = performance.now();
    const DURATION  = 900;

    function tick(now) {
      animProgress = Math.min((now - startTime) / DURATION, 1);
      /* ease-out cubic */
      const eased = 1 - Math.pow(1 - animProgress, 3);
      drawChart(canvas, key, eased);
      if (animProgress < 1) animFrame = requestAnimationFrame(tick);
    }
    animFrame = requestAnimationFrame(tick);
  }

  /* -------- Resize handler -------- */
  function resizeCanvas(canvas) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = canvas.height * dpr; // keep declared height
    canvas.style.width  = rect.width + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
  }

  /* -------- Init -------- */
  function init() {
    const canvas = document.getElementById("progressChart");
    if (!canvas) return;

    /* Set physical dimensions */
    const dpr = window.devicePixelRatio || 1;
    const pW  = canvas.parentElement.getBoundingClientRect().width || 500;
    const pH  = 130;
    canvas.style.width  = "100%";
    canvas.style.height = pH + "px";
    canvas.width  = pW * dpr;
    canvas.height = pH * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    /* Initial draw */
    animateChart(canvas, activeKey);

    /* Tab switching */
    document.querySelectorAll(".ct").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".ct").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeKey = btn.textContent.trim();
        animateChart(canvas, activeKey);
      });
    });

    /* Window resize */
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newW = canvas.parentElement.getBoundingClientRect().width;
        canvas.width  = newW * dpr;
        canvas.height = pH  * dpr;
        ctx.scale(dpr, dpr);
        drawChart(canvas, activeKey, 1);
      }, 200);
    });
  }

  /* -------- Mini doughnut for streak (bonus) -------- */
  function drawStreakRing(canvas, pct) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx  = canvas.width  / 2;
    const cy  = canvas.height / 2;
    const r   = Math.min(cx, cy) - 4;
    const start = -Math.PI / 2;
    const end   = start + Math.PI * 2 * pct;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* track */
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    /* fill */
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, COLORS.yellow);
    grad.addColorStop(1, COLORS.pink);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 6;
    ctx.lineCap     = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.stroke();
  }

  /* Wait for DOM */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Export for external use */
  window.NeuroChart = { drawChart, animateChart, drawStreakRing };
})();

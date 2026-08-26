(() => {
  "use strict";

  const STORAGE_KEY = "jmeysel-experience-completed";
  const IDLE_DELAY = 15000;
  const LEAVE_MS = 300;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchQuery = window.matchMedia("(pointer: coarse)");
  let reducedMotion = reducedMotionQuery.matches;
  const isTouch = touchQuery.matches;

  const PHASE_TINTS = ["#eee7f6", "#e5d9f2", "#e8dcf4", "#e7ddf3", "#dac8ec"];

  const BG = [
    "#f8f6fa", "#f7f4fa", "#f5f1fa", "#f2ebf9", "#efe5f8", "#ecdff7",
    "#e7d5f5", "#e3ccf3", "#dfc3f1", "#dab9ee", "#d6b0ec", "#d2a7e9",
    "#ce9fe7", "#d2aee8", "#dec5ed",
  ];

  const TITLES = [
    "Hier gibt es noch nichts.", "Hier gibt es noch nichts.",
    "Immer noch nichts.", "Immer noch nichts.", "Immer noch nichts.", "Immer noch nichts.", "Immer noch nichts.", "Immer noch nichts.",
    "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.",
    "Schön, dass du da warst.",
  ];

  const FIELD_CONFIG = {
    f0: { phase: 0, min: 0.16, max: 0.34 },
    f1a: { phase: 1, min: 0.3, max: 0.52 },
    f1b: { phase: 1, min: 0.26, max: 0.46 },
    f2a: { phase: 2, min: 0.42, max: 0.64 },
    f2b: { phase: 2, min: 0.38, max: 0.58 },
    f2c: { phase: 2, min: 0.3, max: 0.48 },
    f3a: { phase: 3, min: 0.46, max: 0.68 },
    f3b: { phase: 3, min: 0.42, max: 0.62 },
    f3c: { phase: 3, min: 0.32, max: 0.5 },
    f3d: { phase: 3, min: 0.1, max: 0.24 },
    f4a: { phase: 4, min: 0.5, max: 0.72 },
    f4b: { phase: 4, min: 0.46, max: 0.68 },
    f4c: { phase: 4, min: 0.36, max: 0.56 },
    f4d: { phase: 4, min: 0.28, max: 0.44 },
    f4e: { phase: 4, min: 0, max: 0.26, curve: 3 },
  };

  const STEPS = [
    { headline: "Hier gibt es noch nichts.", subline: "Du kannst trotzdem ein bisschen bleiben.", button: "Okay." },
    { headline: "Du bist noch da.", subline: "Schön.", button: "Ja." },
    { headline: "Ich sollte vielleicht erwähnen:", subline: "Hier kommt wirklich noch nichts.", button: "Macht nichts." },
    { headline: "Gut.", subline: "Dann haben wir das geklärt.", button: "Gut." },
    { headline: "Eigentlich ganz angenehm hier.", subline: "So ohne alles.", button: "Stimmt." },
    { headline: "Kein Newsletter.", subline: "Kein Pop-up. Kein „Jetzt entdecken“.", button: "Herrlich." },
    { headline: "Nicht mal Cookies.", subline: "Also … vermutlich schon irgendwann. Aber heute nicht.", button: "Sehr gut." },
    { headline: "Wir könnten es einfach dabei belassen.", subline: "Eine leere Seite. Ein bisschen Flieder.", button: "Reicht doch." },
    { headline: "Finde ich auch.", subline: "Wobei das hier inzwischen verdächtig nach Inhalt aussieht.", button: "Ein bisschen." },
    { headline: "Mist.", subline: "So war das nicht geplant.", button: "Zu spät." },
    { headline: "Na gut.", subline: "Dann machen wir eben eine Website daraus.", button: "Irgendwann." },
    { headline: "Irgendwann klingt gut.", subline: "Heute haben wir schließlich schon genug geschafft.", button: "Absolut." },
    { headline: "Dann wäre das geklärt.", subline: "Ich bleibe hier. Du kannst machen, was du willst.", button: "Klingt fair." },
    { headline: "Eine Sache noch.", subline: "", button: "Ja?", calm: true },
    { headline: "Schön, dass du dageblieben bist.", subline: "Wirklich.", button: null, final: true, finalBoost: true },
  ].map((step, i) => {
    const phase = Math.floor(i / 3);
    const t = (i % 3) / 2;
    return { ...step, phase, t, bg: BG[i], title: TITLES[i] };
  });

  const RETURN_STEPS = [
    { headline: "Hey.", subline: "Schön, dich wiederzusehen.", button: "Hallo.", phase: 0, t: 1, bg: BG[2], title: "Willkommen zurück." },
    { headline: "Es gibt übrigens immer noch nichts.", subline: "Aber das hat uns letztes Mal ja auch nicht gestört.", button: "Stimmt.", phase: 0, t: 1, bg: BG[2], title: "Willkommen zurück." },
  ];

  const els = {
    headline: document.getElementById("headline"),
    subline: document.getElementById("subline"),
    action: document.getElementById("action"),
    actionBtn: document.getElementById("actionBtn"),
    actionLabel: document.getElementById("actionLabel"),
    actionLine: document.getElementById("actionLine"),
    idleHint: document.getElementById("idleHint"),
    epilogue: document.getElementById("epilogue"),
    epilogueLine1: document.getElementById("epilogueLine1"),
    epilogueLine2: document.getElementById("epilogueLine2"),
    epilogueLine3: document.getElementById("epilogueLine3"),
    cursorLight: document.getElementById("cursorLight"),
    touchLight: document.getElementById("touchLight"),
  };

  const fieldEls = {};
  Object.keys(FIELD_CONFIG).forEach((key) => {
    fieldEls[key] = document.querySelector(`.field-${key}`);
  });

  const root = document.documentElement;

  let sequence = [];
  let stepIndex = 0;
  let isAnimating = false;
  let idleTimer = null;
  let epilogueTimers = [];

  function applyVisual(step) {
    Object.keys(FIELD_CONFIG).forEach((key) => {
      const cfg = FIELD_CONFIG[key];
      const el = fieldEls[key];
      if (!el) return;
      if (cfg.phase === step.phase) {
        let t = step.t;
        if (cfg.curve) t = Math.pow(t, cfg.curve);
        let op = cfg.min + (cfg.max - cfg.min) * t;
        if (step.finalBoost) op = Math.min(0.92, op + 0.06);
        el.style.opacity = String(op);
      } else {
        el.style.opacity = "0";
      }
    });

    document.body.style.backgroundColor = step.bg;
    root.style.setProperty("--tint", PHASE_TINTS[step.phase]);
    root.style.setProperty("--motion-scale", step.calm ? "1.7" : "1");
    document.title = step.title;
  }

  function clearIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    els.idleHint.classList.remove("is-visible");
  }

  function scheduleIdleTimer() {
    clearIdleTimer();
    idleTimer = setTimeout(() => {
      els.idleHint.classList.add("is-visible");
    }, IDLE_DELAY);
  }

  function clearEpilogueTimers() {
    epilogueTimers.forEach((id) => clearTimeout(id));
    epilogueTimers = [];
    els.epilogueLine1.textContent = "";
    els.epilogueLine2.textContent = "";
    els.epilogueLine3.textContent = "";
    els.epilogueLine1.classList.remove("is-visible");
    els.epilogueLine2.classList.remove("is-visible");
    els.epilogueLine3.classList.remove("is-visible");
  }

  function scheduleFinal() {
    clearEpilogueTimers();
    epilogueTimers.push(
      setTimeout(() => {
        els.epilogueLine1.textContent = "Komm gern wieder.";
        els.epilogueLine1.classList.add("is-visible");
      }, 1800)
    );
    epilogueTimers.push(
      setTimeout(() => {
        els.epilogueLine2.textContent = "Vielleicht gibt es dann schon was.";
        els.epilogueLine2.classList.add("is-visible");
      }, 3300)
    );
    epilogueTimers.push(
      setTimeout(() => {
        els.epilogueLine3.textContent = "Keine Garantie.";
        els.epilogueLine3.classList.add("is-visible");
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch (e) {
          /* localStorage unavailable — experience still works, just won't be remembered */
        }
      }, 4800)
    );
  }

  function renderStep(index, initial) {
    const step = sequence[index];
    els.headline.textContent = step.headline;
    els.subline.textContent = step.subline;

    applyVisual(step);

    if (step.button) {
      els.actionLabel.textContent = step.button;
      els.action.style.display = "";
    } else {
      els.action.style.display = "none";
    }

    if (initial) {
      isAnimating = false;
      if (step.button) {
        scheduleIdleTimer();
      }
      if (step.final) {
        scheduleFinal();
      }
      return;
    }

    const enterClasses = reducedMotion ? [] : ["is-entering"];
    els.headline.classList.add(...enterClasses);
    els.subline.classList.add(...enterClasses);
    if (step.button) {
      els.action.classList.add("is-entering");
    }

    requestAnimationFrame(() => {
      els.headline.classList.remove("is-leaving", "is-entering");
      els.subline.classList.remove("is-leaving", "is-entering");
      els.action.classList.remove("is-leaving", "is-entering");
    });

    // Decoupled from rAF on purpose: idle/epilogue timers must fire on a real
    // wall-clock schedule even if the compositor throttles animation frames
    // (backgrounded tab, low-power mode, etc).
    const settleDelay = reducedMotion ? 420 : 700;
    setTimeout(() => {
      isAnimating = false;
      if (step.button) {
        scheduleIdleTimer();
      }
      if (step.final) {
        scheduleFinal();
      }
    }, settleDelay);
  }

  function goNext() {
    if (isAnimating) return;
    const current = sequence[stepIndex];
    if (!current.button) return;

    isAnimating = true;
    clearIdleTimer();

    els.actionLine.classList.remove("is-pulsing");
    // eslint-disable-next-line no-unused-expressions
    els.actionLine.offsetWidth;
    els.actionLine.classList.add("is-pulsing");

    els.headline.classList.add("is-leaving");
    els.subline.classList.add("is-leaving");
    els.action.classList.add("is-leaving");

    const delay = reducedMotion ? 150 : LEAVE_MS;
    setTimeout(() => {
      stepIndex += 1;
      renderStep(stepIndex, false);
    }, delay);
  }

  function initCursorLight() {
    if (isTouch || reducedMotion) return;

    let anchorX = window.innerWidth / 2;
    let anchorY = window.innerHeight / 2;
    let x = anchorX;
    let y = anchorY;
    let raf = null;
    let hovering = false;

    window.addEventListener(
      "mousemove",
      (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        anchorX = cx + (e.clientX - cx) * 0.18;
        anchorY = cy + (e.clientY - cy) * 0.18;
      },
      { passive: true }
    );

    els.actionBtn.addEventListener("mouseenter", () => {
      hovering = true;
    });
    els.actionBtn.addEventListener("mouseleave", () => {
      hovering = false;
    });

    function tick() {
      x += (anchorX - x) * 0.035;
      y += (anchorY - y) * 0.035;
      els.cursorLight.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      els.cursorLight.style.opacity = hovering ? "0.34" : "0.22";
      raf = requestAnimationFrame(tick);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      } else if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    });

    raf = requestAnimationFrame(tick);
  }

  function initTouchLight() {
    if (!isTouch || reducedMotion) return;
    window.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        if (!t) return;
        els.touchLight.style.left = `${t.clientX}px`;
        els.touchLight.style.top = `${t.clientY}px`;
        els.touchLight.classList.remove("is-active");
        // eslint-disable-next-line no-unused-expressions
        els.touchLight.offsetWidth;
        els.touchLight.classList.add("is-active");
      },
      { passive: true }
    );
  }

  function start() {
    let returning = false;
    try {
      returning = localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      returning = false;
    }

    sequence = returning ? RETURN_STEPS.concat(STEPS) : STEPS.slice();

    els.actionBtn.addEventListener("click", goNext);
    els.actionBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
    });

    reducedMotionQuery.addEventListener("change", (e) => {
      reducedMotion = e.matches;
    });

    initCursorLight();
    initTouchLight();

    renderStep(0, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

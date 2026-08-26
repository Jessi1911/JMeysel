(() => {
  "use strict";

  const STORAGE_KEY = "jmeysel-experience-completed";
  const IDLE_DELAY = 15000;
  const LEAVE_MS = 300;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchQuery = window.matchMedia("(pointer: coarse)");
  let reducedMotion = reducedMotionQuery.matches;
  const isTouch = touchQuery.matches;

  const TITLES = [
    "Hier gibt es noch nichts.", "Hier gibt es noch nichts.",
    "Immer noch nichts.", "Immer noch nichts.", "Immer noch nichts.", "Immer noch nichts.", "Immer noch nichts.", "Immer noch nichts.",
    "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.", "Okay, vielleicht ein bisschen.",
    "Schön, dass du da warst.",
  ];

  // Each "room" is a fixed spatial zone (see styles.css .room-a..e). Opacity is a
  // function of overall progress p (0 = screen 1, 1 = final screen) and layers
  // cumulatively — rooms fade in and stay, so the finale reads as a spatial mix
  // of every color rather than one flat tint replacing the last.
  const ROOMS = {
    a: (p) => 0.55 - 0.27 * p,
    b: (p) => 0.05 + 0.6 * Math.pow(p, 0.75),
    c: (p) => 0.58 * Math.max(0, (p - 0.12) / 0.88),
    d: (p) => 0.44 * Math.max(0, (p - 0.42) / 0.58),
    e: (p) => 0.36 * Math.pow(Math.max(0, (p - 0.68) / 0.32), 1.4),
  };

  const STEPS = [
    { headline: "Hier gibt es<br>noch nichts.", subline: "Du kannst trotzdem ein bisschen bleiben.", button: "Okay." },
    { headline: "Du bist noch da.", subline: "Schön.", button: "Ja." },
    { headline: "Ich sollte vielleicht<br>erwähnen:", subline: "Hier kommt wirklich noch nichts.", button: "Macht nichts." },
    { headline: "Gut.", subline: "Dann haben wir das geklärt.", button: "Gut." },
    { headline: "Eigentlich ganz<br>angenehm hier.", subline: "So ohne alles.", button: "Stimmt." },
    { headline: "Kein Newsletter.", subline: "Kein Pop-up. Kein „Jetzt entdecken“.", button: "Herrlich." },
    { headline: "Nicht mal Cookies.", subline: "Also … vermutlich schon irgendwann. Aber heute nicht.", button: "Sehr gut." },
    { headline: "Wir könnten es einfach<br>dabei belassen.", subline: "Eine leere Seite. Ein bisschen Flieder.", button: "Reicht doch." },
    { headline: "Finde ich auch.", subline: "Wobei das hier inzwischen verdächtig nach Inhalt aussieht.", button: "Ein bisschen." },
    { headline: "Mist.", subline: "So war das nicht geplant.", button: "Zu spät." },
    { headline: "Na gut.", subline: "Dann machen wir eben eine Website daraus.", button: "Irgendwann." },
    { headline: "Irgendwann<br>klingt gut.", subline: "Heute haben wir schließlich schon genug geschafft.", button: "Absolut." },
    { headline: "Dann wäre<br>das geklärt.", subline: "Ich bleibe hier. Du kannst machen, was du willst.", button: "Klingt fair." },
    { headline: "Eine Sache noch.", subline: "", button: "Ja?", calm: true },
    { headline: "Schön, dass du<br>dageblieben bist.", subline: "Wirklich.", button: null, final: true },
  ].map((step, i, arr) => ({ ...step, p: i / (arr.length - 1), title: TITLES[i] }));

  const RETURN_STEPS = [
    { headline: "Hey.", subline: "Schön, dich wiederzusehen.", button: "Hallo.", p: 0.22, title: "Willkommen zurück." },
    { headline: "Es gibt übrigens<br>immer noch nichts.", subline: "Aber das hat uns letztes Mal ja auch nicht gestört.", button: "Stimmt.", p: 0.22, title: "Willkommen zurück." },
  ];

  const els = {
    headline: document.getElementById("headline"),
    subline: document.getElementById("subline"),
    action: document.getElementById("action"),
    actionBtn: document.getElementById("actionBtn"),
    actionLabel: document.getElementById("actionLabel"),
    idleHint: document.getElementById("idleHint"),
    epilogue: document.getElementById("epilogue"),
    epilogueLine1: document.getElementById("epilogueLine1"),
    epilogueLine2: document.getElementById("epilogueLine2"),
    epilogueLine3: document.getElementById("epilogueLine3"),
    cursorLight: document.getElementById("cursorLight"),
    touchLight: document.getElementById("touchLight"),
  };

  const roomEls = {};
  Object.keys(ROOMS).forEach((key) => {
    roomEls[key] = document.querySelector(`.room-${key}`);
  });

  const root = document.documentElement;

  let sequence = [];
  let stepIndex = 0;
  let isAnimating = false;
  let idleTimer = null;
  let epilogueTimers = [];

  function tintFor(p) {
    if (p >= 0.75) return "#a77bcc";
    if (p >= 0.4) return "#e5d5f4";
    return "#eee8f6";
  }

  function applyVisual(step) {
    Object.keys(ROOMS).forEach((key) => {
      const el = roomEls[key];
      if (!el) return;
      el.style.opacity = String(ROOMS[key](step.p));
    });

    root.style.setProperty("--tint", tintFor(step.p));
    root.style.setProperty("--motion-scale", step.calm ? "1.7" : "1");
    document.body.classList.toggle("is-final", !!step.final);
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
    els.headline.innerHTML = step.headline;
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

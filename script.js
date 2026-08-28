(() => {
  "use strict";

  const STORAGE_KEY = "jmeysel-experience-completed";
  const IDLE_DELAY = 15000;
  const LEAVE_MS = 320;

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

  // A deliberate, non-random position per screen — a quiet choreography through
  // the viewport rather than a fixed layout. Values are vw/vh so they scale
  // down naturally (and are additionally damped, see styles.css) on mobile.
  const POSITIONS = [
    { x: "0vw", y: "0vh" }, // 1 — central
    { x: "-6vw", y: "-3.5vh" }, // 2 — leicht links, etwas höher
    { x: "5vw", y: "0vh" }, // 3 — leicht rechts
    { x: "2vw", y: "-1vh" }, // 4 — wieder näher zur Mitte
    { x: "-5vw", y: "3.5vh" }, // 5 — links unten
    { x: "4vw", y: "0vh" }, // 6 — etwas rechts der Mitte
    { x: "0vw", y: "0vh" }, // 7 — zentral, ruhig
    { x: "-4vw", y: "0vh" }, // 8 — leicht links
    { x: "6vw", y: "0vh" }, // 9 — rechts
    { x: "0vw", y: "0vh" }, // 10 — zentral
    { x: "-4vw", y: "-2.5vh" }, // 11 — etwas links und höher
    { x: "4vw", y: "2.5vh" }, // 12 — leicht rechts und tiefer
    { x: "2vw", y: "-1vh" }, // 13 — zurück Richtung Mitte
    { x: "0vw", y: "0vh" }, // 14 — zentral, sehr ruhig
    { x: "0vw", y: "0vh" }, // 15 — klar zentriert
  ];

  const STEPS = [
    { headline: "Hier gibt es<br>noch nichts.", subline: "Du kannst trotzdem ein bisschen bleiben.", button: "Okay.", scale: 1, greeting: "Oh, hi." },
    { headline: "Du bist noch da.", subline: "Schön.", button: "Ja.", scale: 1.1 },
    { headline: "Ich sollte vielleicht<br>erwähnen:", subline: "Hier kommt wirklich noch nichts.", button: "Macht nichts.", scale: 0.92 },
    { headline: "Gut.", subline: "Dann haben wir das geklärt.", button: "Gut.", scale: 1.55 },
    { headline: "Eigentlich ganz<br>angenehm hier.", subline: "So ohne alles.", button: "Stimmt.", scale: 0.95 },
    { headline: "Kein Newsletter.", subline: "Kein Pop-up. Kein „Jetzt entdecken“.", button: "Herrlich.", scale: 1.15, newsletter: true },
    { headline: "Nicht mal Cookies.", subline: "Also … vermutlich schon irgendwann. Aber heute nicht.", button: "Sehr gut.", scale: 1.05 },
    { headline: "Wir könnten es einfach<br>dabei belassen.", subline: "Eine leere Seite. Ein bisschen Flieder.", button: "Reicht doch.", scale: 0.82, entranceDelay: 1100 },
    { headline: "Finde ich auch.", subline: "Wobei das hier inzwischen verdächtig nach Inhalt aussieht.", button: "Ein bisschen.", scale: 1.05 },
    { headline: "Mist.", subline: "So war das nicht geplant.", button: "Zu spät.", scale: 1.6, pauseMotion: true, noEntrance: true },
    { headline: "Na gut.", subline: "Dann machen wir eben eine Website daraus.", button: "Irgendwann.", scale: 1.15 },
    { headline: "Irgendwann<br>klingt gut.", subline: "Heute haben wir schließlich schon genug geschafft.", button: "Absolut.", scale: 0.95 },
    { headline: "Dann wäre<br>das geklärt.", subline: "Ich bleibe hier. Du kannst machen, was du willst.", button: "Klingt fair.", scale: 0.92 },
    { headline: "Eine Sache noch.", subline: "", button: "Ja?", scale: 1, calm: true, lightDip: 0.82 },
    { headline: "Schön, dass du<br>dageblieben bist.", subline: "Wirklich.", button: null, scale: 1.1, final: true },
  ].map((step, i, arr) => ({ ...step, p: i / (arr.length - 1), title: TITLES[i], pos: POSITIONS[i] }));

  const RETURN_STEPS = [
    { headline: "Hey.", subline: "Schön, dich wiederzusehen.", button: "Hallo.", p: 0.22, title: "Willkommen zurück.", pos: { x: "0vw", y: "0vh" }, scale: 1.4 },
    { headline: "Es gibt übrigens<br>immer noch nichts.", subline: "Aber das hat uns letztes Mal ja auch nicht gestört.", button: "Stimmt.", p: 0.22, title: "Willkommen zurück.", pos: { x: "0vw", y: "0vh" }, scale: 1 },
  ];

  const els = {
    greeting: document.getElementById("greeting"),
    headline: document.getElementById("headline"),
    subline: document.getElementById("subline"),
    action: document.getElementById("action"),
    actionBtn: document.getElementById("actionBtn"),
    actionLabel: document.getElementById("actionLabel"),
    idleHint: document.getElementById("idleHint"),
    epilogue: document.getElementById("epilogue"),
    epilogueLine1: document.getElementById("epilogueLine1"),
    epilogueLine2: document.getElementById("epilogueLine2"),
    scene: document.getElementById("scene"),
    sculpture: document.getElementById("sculpture"),
    sculptureLayers: Array.from(document.querySelectorAll(".sculpture-layer")),
    ambientEls: Array.from(document.querySelectorAll(".ambient")),
    storyLight: document.getElementById("storyLight"),
    spark: document.getElementById("spark"),
    ghostOutline: document.getElementById("ghostOutline"),
    ghostFill: document.getElementById("ghostFill"),
    cursorLight: document.getElementById("cursorLight"),
    touchLight: document.getElementById("touchLight"),
    brand: document.getElementById("brand"),
    scrollHint: document.getElementById("scrollHint"),
  };

  const root = document.documentElement;

  let sequence = [];
  let stepIndex = 0;
  let isAnimating = false;
  let idleTimer = null;
  let epilogueTimers = [];
  let pauseMotionTimer = null;
  let stepTimer = null;

  function storyTintFor(p) {
    if (p >= 0.75) return "#8d5bc5";
    if (p >= 0.4) return "#b88bea";
    return "#c7a4f4";
  }

  function applyVisual(step) {
    const p = step.p;
    // A quiet dip before the finale (see STEPS[13].lightDip) — the room gets
    // a touch darker and calmer right before it warms back up. 1 everywhere
    // else, so this never changes the existing per-screen curve.
    const dip = step.lightDip || 1;

    els.sculptureLayers.forEach((el, i) => {
      const curves = [0.06 + 0.4 * p, 0.36 * Math.max(0, (p - 0.12) / 0.88), 0.32 * Math.max(0, (p - 0.3) / 0.7)];
      el.style.opacity = String((curves[i] || 0) * dip);
    });
    root.style.setProperty("--sculpture-rot", `${(p * 16).toFixed(1)}deg`);

    els.ambientEls.forEach((el, i) => {
      const curves = [0.15 + 0.35 * p, 0.1 + 0.4 * Math.max(0, (p - 0.2) / 0.8)];
      el.style.opacity = String((curves[i] || 0) * dip);
    });

    els.storyLight.style.opacity = String((0.05 + 0.42 * p) * dip);
    const size = 38 + p * 30;
    els.storyLight.style.width = `${size}vw`;
    els.storyLight.style.height = `${size}vw`;
    root.style.setProperty("--story-tint", storyTintFor(p));

    root.style.setProperty("--pos-x", step.pos.x);
    root.style.setProperty("--pos-y", step.pos.y);
    root.style.setProperty("--h-scale", String(step.scale || 1));
    root.style.setProperty("--motion-scale", step.calm ? "1.7" : "1");

    document.title = step.title;
  }

  function triggerGhostRects() {
    if (reducedMotion) return;
    [els.ghostOutline, els.ghostFill].forEach((el) => {
      el.classList.remove("is-active");
      // eslint-disable-next-line no-unused-expressions
      el.offsetWidth;
      el.classList.add("is-active");
    });
  }

  function triggerMotionPause() {
    if (reducedMotion) return;
    if (pauseMotionTimer) clearTimeout(pauseMotionTimer);
    els.scene.classList.add("is-paused");
    pauseMotionTimer = setTimeout(() => {
      els.scene.classList.remove("is-paused");
      pauseMotionTimer = null;
    }, 420);
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
    els.epilogueLine1.classList.remove("is-visible");
    els.epilogueLine2.classList.remove("is-visible");
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
        els.epilogueLine2.textContent = "Vielleicht gibt es dann schon etwas.";
        els.epilogueLine2.classList.add("is-visible");
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch (e) {
          /* localStorage unavailable — experience still works, just won't be remembered */
        }
      }, 3300)
    );
  }

  function renderStep(index, initial) {
    const step = sequence[index];
    els.headline.innerHTML = step.headline;
    els.subline.textContent = step.subline;
    els.greeting.textContent = step.greeting || "";

    applyVisual(step);

    if (step.newsletter) triggerGhostRects();
    if (step.pauseMotion) triggerMotionPause();

    if (step.button) {
      els.actionLabel.textContent = step.button;
      els.action.style.display = "";
    } else {
      els.action.style.display = "none";
    }

    if (step.greeting && !reducedMotion) {
      els.greeting.classList.add("is-entering");
      requestAnimationFrame(() => {
        els.greeting.classList.remove("is-entering");
      });
    } else {
      els.greeting.classList.remove("is-entering");
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

    // Surprise: "Mist." skips the entrance treatment entirely — it just
    // lands, blunt and instant, instead of fading/blurring in like every
    // other headline.
    if (step.noEntrance) {
      els.headline.classList.add("no-transition");
      els.headline.classList.remove("is-leaving", "is-entering");
      // eslint-disable-next-line no-unused-expressions
      els.headline.offsetWidth;
      requestAnimationFrame(() => els.headline.classList.remove("no-transition"));
    } else if (!reducedMotion) {
      els.headline.classList.add("is-entering");
    }

    if (!reducedMotion) {
      els.subline.classList.add("is-entering");
    }
    if (step.button) {
      els.action.classList.add("is-entering");
    }

    requestAnimationFrame(() => {
      if (!step.noEntrance) {
        els.headline.classList.remove("is-leaving", "is-entering");
      }
      els.subline.classList.remove("is-leaving", "is-entering");
      els.action.classList.remove("is-leaving", "is-entering");
    });

    // Decoupled from rAF on purpose: idle/epilogue timers must fire on a real
    // wall-clock schedule even if the compositor throttles animation frames
    // (backgrounded tab, low-power mode, etc).
    const settleDelay = reducedMotion ? 420 : 850;
    stepTimer = setTimeout(() => {
      stepTimer = null;
      isAnimating = false;
      if (step.button) {
        scheduleIdleTimer();
      }
      if (step.final) {
        scheduleFinal();
      }
    }, settleDelay);
  }

  function triggerSpark() {
    if (reducedMotion) return;
    els.spark.classList.remove("is-active");
    // eslint-disable-next-line no-unused-expressions
    els.spark.offsetWidth;
    els.spark.classList.add("is-active");
  }

  function goNext() {
    if (isAnimating) return;
    const current = sequence[stepIndex];
    if (!current.button) return;

    isAnimating = true;
    clearIdleTimer();
    triggerSpark();

    els.headline.classList.add("is-leaving");
    els.subline.classList.add("is-leaving");
    els.action.classList.add("is-leaving");

    // Surprise: a couple of screens hold an extra beat of nothing-but-light
    // before their text lands — see STEPS[].entranceDelay.
    const upcoming = sequence[stepIndex + 1];
    const extraDelay = (upcoming && upcoming.entranceDelay) || 0;
    const delay = (reducedMotion ? 150 : LEAVE_MS) + extraDelay;
    stepTimer = setTimeout(() => {
      stepTimer = null;
      stepIndex += 1;
      renderStep(stepIndex, false);
    }, delay);
  }

  function resetToStart() {
    if (stepTimer) {
      clearTimeout(stepTimer);
      stepTimer = null;
    }
    clearIdleTimer();
    clearEpilogueTimers();
    if (pauseMotionTimer) {
      clearTimeout(pauseMotionTimer);
      pauseMotionTimer = null;
      els.scene.classList.remove("is-paused");
    }

    sequence = STEPS.slice();
    isAnimating = true;

    els.headline.classList.add("is-leaving");
    els.subline.classList.add("is-leaving");
    els.action.classList.add("is-leaving");

    const delay = reducedMotion ? 150 : LEAVE_MS;
    stepTimer = setTimeout(() => {
      stepTimer = null;
      stepIndex = 0;
      renderStep(stepIndex, false);
    }, delay);
  }

  function initPointerEffects() {
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
      els.cursorLight.style.opacity = hovering ? "0.22" : "0.13";

      // The sculpture leans away from the cursor — a slow, inverted, subtle
      // parallax rather than something visibly "following" the pointer.
      const offsetX = x - window.innerWidth / 2;
      const offsetY = y - window.innerHeight / 2;
      root.style.setProperty("--parallax-x", `${(-offsetX * 0.02).toFixed(1)}px`);
      root.style.setProperty("--parallax-y", `${(-offsetY * 0.02).toFixed(1)}px`);

      raf = requestAnimationFrame(tick);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        els.scene.classList.add("is-paused");
      } else {
        els.scene.classList.remove("is-paused");
        if (!raf) raf = requestAnimationFrame(tick);
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

    document.addEventListener("visibilitychange", () => {
      els.scene.classList.toggle("is-paused", document.hidden);
    });
  }

  function initScrollHint() {
    // Surprise 3, desktop only: a reliable "deliberate swipe" signal doesn't
    // exist on touch (ordinary scroll gestures look identical), so per spec
    // this is skipped entirely on touch devices rather than guessed at.
    if (isTouch) return;

    let shown = false;
    window.addEventListener(
      "wheel",
      (e) => {
        if (shown || e.deltaY <= 15) return;
        shown = true;
        els.scrollHint.textContent = "Da unten ist auch nichts.";
        els.scrollHint.classList.add("is-visible");
        setTimeout(() => {
          els.scrollHint.classList.remove("is-visible");
        }, 2500);
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
    els.brand.addEventListener("click", resetToStart);
    els.actionBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
    });

    reducedMotionQuery.addEventListener("change", (e) => {
      reducedMotion = e.matches;
    });

    initPointerEffects();
    initTouchLight();
    initScrollHint();

    renderStep(0, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

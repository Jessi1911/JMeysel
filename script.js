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
    { x: "0vw", y: "5vh" }, // 15 — klar zentriert, etwas tiefer für optische Mitte
  ];

  const STEPS = [
    { headline: "Hier gibt es<br>noch nichts.", subline: "Du kannst trotzdem ein bisschen bleiben.", button: "Okay.", scale: 1, greeting: "Oh, hi." },
    { headline: "Du bist noch da.", subline: "Schön.", button: "Ja.", scale: 1.1 },
    { headline: "Ich sollte vielleicht<br>erwähnen:", subline: "Hier kommt wirklich noch nichts.", button: "Macht nichts.", scale: 0.92 },
    { headline: "Gut.", subline: "Dann haben wir das geklärt.", button: "Gut.", scale: 1.55 },
    { headline: "Eigentlich ganz<br>angenehm hier.", subline: "So ohne alles.", button: "Stimmt.", scale: 0.95 },
    { headline: "Kein Newsletter.", subline: "Kein Pop-up. Kein „Jetzt entdecken“.", button: "Herrlich.", scale: 1.15, newsletter: true },
    { headline: "Nicht mal Cookies.", subline: "Also … vermutlich schon irgendwann. Aber heute nicht.", button: "Sehr gut.", scale: 1.05 },
    { headline: "Wir könnten es einfach<br>dabei belassen.", subline: "Eine leere Seite. Ein bisschen Flieder.", button: "Reicht doch.", scale: 0.82 },
    { headline: "Finde ich auch.", subline: "Wobei das hier inzwischen verdächtig nach Inhalt aussieht.", button: "Ein bisschen.", scale: 1.05, entranceDelay: 1100 },
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
    stage: document.querySelector(".stage"),
    menuTrigger: document.getElementById("menuTrigger"),
    siteMenu: document.getElementById("siteMenu"),
    siteMenuScrim: document.getElementById("siteMenuScrim"),
    siteMenuPanel: document.getElementById("siteMenuPanel"),
    siteMenuEmpty: document.getElementById("siteMenuEmpty"),
    siteMenuMore: document.getElementById("siteMenuMore"),
    siteMenuTapGlow: document.getElementById("siteMenuTapGlow"),
    siteMenuTaps: [
      document.getElementById("siteMenuTap1"),
      document.getElementById("siteMenuTap2"),
      document.getElementById("siteMenuTap3"),
    ],
  };

  const root = document.documentElement;

  let sequence = [];
  let stepIndex = 0;
  let isAnimating = false;
  let idleTimer = null;
  let epilogueTimers = [];
  let pauseMotionTimer = null;
  let stepTimer = null;

  let menuOpen = false;
  let menuOpenCount = 0;
  let menuMoreShown = false;
  let menuMoreTimer = null;
  let menuTextTimers = [];
  let menuTapIndex = 0;
  let menuTapHideTimers = [null, null, null];
  let menuTapOrder = [];
  let menuLastTapText = null;
  let menuTapsShown = new Set();
  let menuTapGlowTimer = null;
  let menuLastTapAt = 0;

  const MENU_TAP_MAX = 3;
  const MENU_TAP_COOLDOWN_MS = 260;

  const MENU_TAP_TEXTS = [
    "Hier ist auch nichts.",
    "Da auch nicht.",
    "Nope.",
    "Nichts.",
    "Leider nein.",
    "Auch leer.",
    "Netter Versuch.",
    "Du kannst weitersuchen.",
    "Wirklich nichts.",
    "Ich hab nachgesehen.",
  ];
  const MENU_TAP_RARE_TEXT = "Was genau suchst du eigentlich?";
  const MENU_TAP_SHORT_TEXTS = new Set(["Nope.", "Nichts."]);

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

  // ---------- site menu ----------
  // A second, self-contained interaction layered on top of the main
  // experience: a deliberately serious-looking nav that, true to the
  // site, has nothing behind it. Opening/closing never touches stepIndex,
  // timers, or localStorage — the main experience is just paused (via
  // inert) underneath, not reset.

  function clearMenuTextTimers() {
    menuTextTimers.forEach((id) => clearTimeout(id));
    menuTextTimers = [];
  }

  function currentMotionBase() {
    const step = sequence[stepIndex];
    return step && step.calm ? 1.7 : 1;
  }

  // Real per-session open count, not just a first/second toggle — the
  // site's patience visibly runs out by the fourth attempt.
  function menuReactionFor(count) {
    if (count <= 1) return "Hier gibt es auch nichts.";
    if (count === 2) return "Immer noch nichts.";
    if (count === 3) return "Du prüfst wirklich gründlich.";
    return "Nein.";
  }

  // Without a "Menü" label to hold a beat, the delay before the reaction
  // now runs straight off the open — still long enough on the first
  // couple of opens to let the room register, shortening each time.
  function menuReactionDelayFor(count) {
    if (reducedMotion) {
      if (count <= 1) return 320;
      if (count === 2) return 260;
      if (count === 3) return 200;
      return 120;
    }
    if (count <= 1) return 1400;
    if (count === 2) return 1250;
    if (count === 3) return 1120;
    return 920;
  }

  function menuReactionTierFor(count) {
    return count >= 4 ? "4plus" : String(count);
  }

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menuOpenCount += 1;

    els.menuTrigger.classList.add("is-open");
    els.menuTrigger.setAttribute("aria-expanded", "true");
    els.menuTrigger.setAttribute("aria-label", "Menü schließen");
    els.siteMenu.classList.add("is-open");
    els.siteMenu.removeAttribute("inert");
    els.siteMenu.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");

    els.brand.inert = true;
    els.stage.inert = true;

    root.style.setProperty("--motion-scale", String(currentMotionBase() * 1.6));

    clearMenuTextTimers();
    els.siteMenuEmpty.className = "site-menu-reaction site-menu-reaction--" + menuReactionTierFor(menuOpenCount);
    els.siteMenuEmpty.textContent = menuReactionFor(menuOpenCount);

    const reactionDelay = menuReactionDelayFor(menuOpenCount);
    menuTextTimers.push(setTimeout(() => els.siteMenuEmpty.classList.add("is-visible"), reactionDelay));

    if (!menuMoreShown) {
      if (menuMoreTimer) clearTimeout(menuMoreTimer);
      menuMoreTimer = setTimeout(() => {
        if (!menuOpen || menuMoreShown) return;
        menuMoreShown = true;
        els.siteMenuMore.textContent = "Mehr kommt nicht.";
        els.siteMenuMore.classList.add("is-visible");
      }, 5000);
    }

    requestAnimationFrame(() => {
      els.siteMenuPanel.focus({ preventScroll: true });
    });
  }

  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;

    if (menuMoreTimer) {
      clearTimeout(menuMoreTimer);
      menuMoreTimer = null;
    }
    clearMenuTextTimers();

    if (menuTapGlowTimer) {
      clearTimeout(menuTapGlowTimer);
      menuTapGlowTimer = null;
    }
    els.siteMenuTapGlow.classList.remove("is-active");

    menuTapHideTimers.forEach((id) => {
      if (id) clearTimeout(id);
    });
    menuTapHideTimers = [null, null, null];
    menuTapOrder = [];
    els.siteMenuTaps.forEach((el) => el.classList.remove("is-visible"));

    els.menuTrigger.classList.remove("is-open");
    els.menuTrigger.setAttribute("aria-expanded", "false");
    els.menuTrigger.setAttribute("aria-label", "Menü öffnen");
    els.siteMenu.classList.remove("is-open");
    els.siteMenu.setAttribute("aria-hidden", "true");
    els.siteMenu.setAttribute("inert", "");
    document.body.classList.remove("menu-open");

    els.siteMenuEmpty.classList.remove("is-visible");
    els.siteMenuMore.classList.remove("is-visible");

    els.brand.inert = false;
    els.stage.inert = false;

    root.style.setProperty("--motion-scale", String(currentMotionBase()));

    els.menuTrigger.focus();
  }

  // Never the same line shown twice at once, never the same line picked
  // twice in a row, the rare line stays rare, short lines get picked
  // slightly more often, and unseen lines are preferred while the
  // session still has fresh ones left.
  function pickMenuTapText(excludeSet) {
    if (Math.random() < 0.08 && !excludeSet.has(MENU_TAP_RARE_TEXT)) {
      return MENU_TAP_RARE_TEXT;
    }
    const pool = [];
    MENU_TAP_TEXTS.forEach((t) => {
      pool.push(t);
      if (MENU_TAP_SHORT_TEXTS.has(t)) pool.push(t);
    });
    let candidates = pool.filter((t) => !excludeSet.has(t));
    if (!candidates.length) candidates = pool.filter((t) => t !== menuLastTapText);
    const unseen = candidates.filter((t) => !menuTapsShown.has(t));
    if (unseen.length) candidates = unseen;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function overlapAreaOf(a, b) {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w <= 0 || h <= 0) return 0;
    return w * h;
  }

  function padRect(r, pad) {
    return { left: r.left - pad, top: r.top - pad, right: r.right + pad, bottom: r.bottom + pad };
  }

  // The main reaction's real, currently-rendered bounding box (never
  // hardcoded coordinates) plus a margin — tap reactions must stay clear
  // of this entirely, whatever tier/position it currently has.
  function getMainTextSafeRect(panelRect) {
    const r = els.siteMenuEmpty.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return padRect(
      {
        left: r.left - panelRect.left,
        top: r.top - panelRect.top,
        right: r.right - panelRect.left,
        bottom: r.bottom - panelRect.top,
      },
      56
    );
  }

  // Keep clear of the × trigger, the JM mark's footprint, and "Mehr kommt
  // nicht." (if it's currently showing) too — any real, currently visible
  // text in the room is off-limits for a tap reaction to land on.
  function getFixedExclusionRects(panelRect) {
    const els_ = [els.menuTrigger, els.brand];
    if (els.siteMenuMore.classList.contains("is-visible")) els_.push(els.siteMenuMore);
    return els_.map((el) => {
      const r = el.getBoundingClientRect();
      return padRect(
        {
          left: r.left - panelRect.left,
          top: r.top - panelRect.top,
          right: r.right - panelRect.left,
          bottom: r.bottom - panelRect.top,
        },
        14
      );
    });
  }

  function findTapPosition(localX, localY, w, h, panelRect) {
    const margin = 28;
    const minX = margin;
    const minY = margin;
    const maxX = Math.max(minX, panelRect.width - margin - w);
    const maxY = Math.max(minY, panelRect.height - margin - h);

    const occupied = [];
    const safeRect = getMainTextSafeRect(panelRect);
    if (safeRect) occupied.push(safeRect);
    occupied.push(...getFixedExclusionRects(panelRect));
    els.siteMenuTaps.forEach((el) => {
      if (el.classList.contains("is-visible")) {
        const r = el.getBoundingClientRect();
        occupied.push(
          padRect(
            {
              left: r.left - panelRect.left,
              top: r.top - panelRect.top,
              right: r.right - panelRect.left,
              bottom: r.bottom - panelRect.top,
            },
            10
          )
        );
      }
    });

    const offsetX = 24 + Math.random() * 20;
    const offsetY = 22 + Math.random() * 18;
    // Desired spot first, then a small search around it: right, left,
    // above, below, further away — never a visible slide to get there,
    // just picked before the text ever appears.
    const candidates = [
      { x: localX + offsetX, y: localY + offsetY },
      { x: localX + offsetX + w * 0.9, y: localY + offsetY },
      { x: localX - offsetX - w, y: localY + offsetY },
      { x: localX - w / 2, y: localY - offsetY - h },
      { x: localX - w / 2, y: localY + offsetY + h * 1.6 },
    ];

    // Offsets sized to the new (small) reaction aren't necessarily big
    // enough to clear a much larger obstacle — the huge "Nein." especially.
    // Jump straight to just outside each occupied rect too, sized to
    // *that* rect instead.
    occupied.forEach((o) => {
      candidates.push(
        { x: o.left, y: o.top - h - 12 },
        { x: o.left, y: o.bottom + 12 },
        { x: o.left - w - 12, y: o.top },
        { x: o.right + 12, y: o.top }
      );
    });

    let best = null;
    let bestOverlap = Infinity;
    for (const c of candidates) {
      const x = Math.min(Math.max(minX, c.x), maxX);
      const y = Math.min(Math.max(minY, c.y), maxY);
      const rect = { left: x, top: y, right: x + w, bottom: y + h };
      const totalOverlap = occupied.reduce((sum, o) => sum + overlapAreaOf(rect, o), 0);
      if (totalOverlap === 0) return { x, y };
      if (totalOverlap < bestOverlap) {
        bestOverlap = totalOverlap;
        best = { x, y };
      }
    }
    return best;
  }

  function showMenuTapReaction(clientX, clientY, panelRect) {
    const visibleSlots = els.siteMenuTaps.filter((el) => el.classList.contains("is-visible"));
    if (visibleSlots.length >= MENU_TAP_MAX) {
      const oldest = menuTapOrder.shift();
      if (oldest) {
        const idx = els.siteMenuTaps.indexOf(oldest);
        if (menuTapHideTimers[idx]) {
          clearTimeout(menuTapHideTimers[idx]);
          menuTapHideTimers[idx] = null;
        }
        oldest.classList.remove("is-visible");
      }
    }

    const exclude = new Set(els.siteMenuTaps.filter((el) => el.classList.contains("is-visible")).map((el) => el.textContent));
    if (menuLastTapText) exclude.add(menuLastTapText);
    const text = pickMenuTapText(exclude);
    menuLastTapText = text;
    menuTapsShown.add(text);

    const el = els.siteMenuTaps[menuTapIndex];
    const slot = menuTapIndex;
    menuTapIndex = (menuTapIndex + 1) % els.siteMenuTaps.length;

    if (menuTapHideTimers[slot]) clearTimeout(menuTapHideTimers[slot]);
    el.classList.remove("is-visible");
    el.textContent = text;

    // Measure the real rendered size (opacity:0 still lays out normally)
    // instead of guessing a fixed width/height.
    const measured = el.getBoundingClientRect();
    const w = measured.width || 120;
    const h = measured.height || 28;

    const localX = clientX - panelRect.left;
    const localY = clientY - panelRect.top;
    const pos = findTapPosition(localX, localY, w, h, panelRect);

    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add("is-visible");
    menuTapOrder.push(el);

    menuTapHideTimers[slot] = setTimeout(() => {
      el.classList.remove("is-visible");
      menuTapHideTimers[slot] = null;
      const idx = menuTapOrder.indexOf(el);
      if (idx !== -1) menuTapOrder.splice(idx, 1);
    }, 2000);
  }

  function triggerTapGlow(clientX, clientY, panelRect) {
    const x = clientX - panelRect.left;
    const y = clientY - panelRect.top;
    els.siteMenuTapGlow.style.left = `${x}px`;
    els.siteMenuTapGlow.style.top = `${y}px`;
    els.siteMenuTapGlow.classList.add("is-active");
    if (menuTapGlowTimer) clearTimeout(menuTapGlowTimer);
    menuTapGlowTimer = setTimeout(() => {
      els.siteMenuTapGlow.classList.remove("is-active");
      menuTapGlowTimer = null;
    }, 1100);
  }

  function handleMenuPanelClick(e) {
    if (!menuOpen) return;
    const now = Date.now();
    if (now - menuLastTapAt < MENU_TAP_COOLDOWN_MS) return;
    menuLastTapAt = now;

    const rect = els.siteMenuPanel.getBoundingClientRect();
    showMenuTapReaction(e.clientX, e.clientY, rect);
    if (!reducedMotion) triggerTapGlow(e.clientX, e.clientY, rect);
  }

  function initMenu() {
    els.menuTrigger.addEventListener("click", () => {
      if (menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // The menu always takes the full viewport, so the scrim is purely a
    // background dimming layer — there is no "outside the panel" area
    // left to click, closing happens via the × or Escape only.
    els.siteMenuPanel.addEventListener("click", handleMenuPanelClick);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen) closeMenu();
    });

    document.addEventListener("visibilitychange", () => {
      els.siteMenu.classList.toggle("is-paused", document.hidden);
    });

    if (!isTouch) {
      els.menuTrigger.addEventListener("mouseenter", () => {
        document.body.classList.add("menu-hover");
      });
      els.menuTrigger.addEventListener("mouseleave", () => {
        document.body.classList.remove("menu-hover");
      });
    }
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
    let shown = false;

    function trigger() {
      if (shown) return;
      shown = true;
      els.scrollHint.textContent = "Da unten ist auch nichts.";
      els.scrollHint.classList.add("is-visible");
      setTimeout(() => {
        els.scrollHint.classList.remove("is-visible");
      }, 2500);
    }

    if (!isTouch) {
      window.addEventListener(
        "wheel",
        (e) => {
          if (!shown && !menuOpen && e.deltaY > 15) trigger();
        },
        { passive: true }
      );
      return;
    }

    // Touch: only a clear, mostly-vertical upward drag counts as "trying to
    // scroll down" — small taps/jitter from ordinary button taps stay well
    // under this threshold, so it shouldn't fire from normal interaction.
    let startX = null;
    let startY = null;

    window.addEventListener(
      "touchstart",
      (e) => {
        if (shown || menuOpen) return;
        const t = e.touches[0];
        startX = t ? t.clientX : null;
        startY = t ? t.clientY : null;
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (shown || menuOpen || startY == null) return;
        const t = e.touches[0];
        if (!t) return;
        const deltaY = startY - t.clientY;
        const deltaX = Math.abs(startX - t.clientX);
        if (deltaY > 48 && deltaY > deltaX * 1.5) trigger();
      },
      { passive: true }
    );

    window.addEventListener(
      "touchend",
      () => {
        startX = null;
        startY = null;
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
    initMenu();

    renderStep(0, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

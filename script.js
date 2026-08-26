(() => {
  "use strict";

  const STORAGE_KEY = "jmeysel-experience-completed";
  const IDLE_DELAY = 15000;
  const LEAVE_MS = 300;
  const PARTICLE_COUNT = 22;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchQuery = window.matchMedia("(pointer: coarse)");
  let reducedMotion = reducedMotionQuery.matches;
  const isTouch = touchQuery.matches;

  const STEPS = [
    { headline: "Hier gibt es noch nichts.", subline: "Du kannst trotzdem ein bisschen bleiben.", button: "Okay.", intensity: 0.03, calm: 1, particles: 0 },
    { headline: "Oh.", subline: "Du bist wirklich geblieben.", button: "Ja.", intensity: 0.09, calm: 1, particles: 0 },
    { headline: "Das ist nett.", subline: "Ich hatte ehrlich gesagt nicht damit gerechnet.", button: "Macht nichts.", intensity: 0.15, calm: 1, particles: 0 },
    { headline: "Ich habe noch gar nichts vorbereitet.", subline: "Nicht mal eine richtige Website.", button: "Sehe ich.", intensity: 0.2, calm: 1, particles: 0 },
    { headline: "Fair.", subline: "Aber wir haben ja keine Eile.", button: "Eben.", intensity: 0.26, calm: 1, particles: 0 },
    { headline: "Dann bleiben wir einfach kurz hier.", subline: "Ist eigentlich ganz angenehm.", button: "Finde ich auch.", intensity: 0.34, calm: 1, particles: 0 },
    { headline: "Komisch eigentlich.", subline: "Im Internet will sonst immer jeder etwas von dir.", button: "Stimmt.", intensity: 0.34, calm: 0.4, particles: 0 },
    { headline: "Hier nicht.", subline: "Du musst nichts anklicken. Nichts kaufen. Nichts verstehen.", button: "Schön.", intensity: 0.44, calm: 1, particles: 0 },
    { headline: "Du klickst trotzdem weiter.", subline: "Das gefällt mir.", button: "Mir auch.", intensity: 0.5, calm: 1, particles: 0.4 },
    { headline: "Ich glaube, wir verstehen uns.", subline: "Und das ganz ohne Inhalt.", button: "Läuft doch.", intensity: 0.57, calm: 1, particles: 0.6 },
    { headline: "Vielleicht ist das hier schon genug.", subline: "Für den Moment zumindest.", button: "Vielleicht.", intensity: 0.55, calm: 0.45, particles: 0.6 },
    { headline: "Eigentlich wollte ich hier irgendwann etwas bauen.", subline: "Ich weiß nur noch nicht was.", button: "Kein Stress.", intensity: 0.64, calm: 0.85, particles: 0.75 },
    { headline: "Danke.", subline: "Das musste ich gerade hören.", button: "Gern.", intensity: 0.68, calm: 0.85, particles: 0.85, pulse: true },
    { headline: "Dann machen wir für heute Schluss.", subline: "Bevor ich noch sentimental werde.", button: "Okay.", intensity: 0.62, calm: 0.8, particles: 0.45 },
    { headline: "Schön, dass du dageblieben bist.", subline: "Vielleicht gibt es hier irgendwann mehr. Für heute reicht das aber.", button: null, intensity: 0.8, calm: 0.7, particles: 0.3, final: true },
  ];

  const RETURN_STEPS = [
    { headline: "Hey.", subline: "Schön, dich wiederzusehen.", button: "Hallo.", intensity: 0.1, calm: 1, particles: 0 },
    { headline: "Es gibt übrigens immer noch nichts.", subline: "Aber das hat uns letztes Mal ja auch nicht gestört.", button: "Stimmt.", intensity: 0.14, calm: 1, particles: 0 },
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
    blobA: document.querySelector(".blob-a"),
    blobB: document.querySelector(".blob-b"),
    blobC: document.querySelector(".blob-c"),
    blobD: document.querySelector(".blob-d"),
    particles: document.getElementById("particles"),
    pulseOverlay: document.getElementById("pulseOverlay"),
    cursorLight: document.getElementById("cursorLight"),
    touchLight: document.getElementById("touchLight"),
  };

  let sequence = [];
  let stepIndex = 0;
  let isAnimating = false;
  let idleTimer = null;

  function hexToRgb(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function mixColor(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r}, ${g}, ${bl})`;
  }

  function applyStage(step) {
    const intensity = Math.min(1, step.intensity);
    const bgT = intensity * 0.32;
    document.body.style.backgroundColor = mixColor("#f8f6fa", "#f1eaf7", bgT);

    els.blobA.style.opacity = String(intensity * 0.55);
    els.blobB.style.opacity = String(intensity * 0.5);
    els.blobC.style.opacity = String(intensity * 0.42);
    els.blobD.style.opacity = String(Math.max(0, intensity - 0.45) * 0.32);

    const amp = `${(2.5 + step.calm * 2.5).toFixed(2)}vw`;
    [els.blobA, els.blobB, els.blobC, els.blobD].forEach((el) => {
      el.style.setProperty("--amp", amp);
    });
    els.blobA.style.setProperty("--dur-a", `${(46 / step.calm).toFixed(1)}s`);
    els.blobB.style.setProperty("--dur-b", `${(52 / step.calm).toFixed(1)}s`);
    els.blobC.style.setProperty("--dur-c", `${(58 / step.calm).toFixed(1)}s`);
    els.blobD.style.setProperty("--dur-d", `${(50 / step.calm).toFixed(1)}s`);

    els.particles.style.opacity = String(step.particles || 0);

    if (step.pulse && !reducedMotion) {
      els.pulseOverlay.classList.remove("is-pulsing");
      // eslint-disable-next-line no-unused-expressions
      els.pulseOverlay.offsetWidth;
      els.pulseOverlay.classList.add("is-pulsing");
    }
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

  function renderStep(index, initial) {
    const step = sequence[index];
    els.headline.textContent = step.headline;
    els.subline.textContent = step.subline;

    applyStage(step);

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
      requestAnimationFrame(() => {
        els.headline.classList.remove("is-leaving", "is-entering");
        els.subline.classList.remove("is-leaving", "is-entering");
        els.action.classList.remove("is-leaving", "is-entering");
        isAnimating = false;
        if (step.button) {
          scheduleIdleTimer();
        }
        if (step.final) {
          scheduleFinal();
        }
      });
    });
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

  function scheduleFinal() {
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch (e) {
        /* localStorage unavailable — experience still works, just won't be remembered */
      }
      els.epilogueLine1.textContent = "Komm gern wieder.";
      els.epilogueLine2.textContent = "Bis dahin passe ich auf die Domain auf.";
      els.epilogue.classList.add("is-visible");
    }, 2000);
  }

  function initParticles() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const p = document.createElement("div");
      p.className = reducedMotion ? "particle" : "particle drift";
      const size = 2 + Math.random() * 2.5;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.setProperty("--p-x", `${(Math.random() * 30 - 15).toFixed(1)}px`);
      p.style.setProperty("--p-y", `${(Math.random() * 40 - 30).toFixed(1)}px`);
      p.style.setProperty("--p-min", (0.1 + Math.random() * 0.1).toFixed(2));
      p.style.setProperty("--p-max", (0.3 + Math.random() * 0.25).toFixed(2));
      if (!reducedMotion) {
        p.style.animationDuration = `${18 + Math.random() * 18}s`;
        p.style.animationDelay = `-${Math.random() * 20}s`;
      } else {
        p.style.opacity = "0.2";
      }
      frag.appendChild(p);
    }
    els.particles.appendChild(frag);
  }

  function initCursorLight() {
    if (isTouch || reducedMotion) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = null;
    let hovering = false;

    window.addEventListener(
      "mousemove",
      (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
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
      x += (targetX - x) * 0.055;
      y += (targetY - y) * 0.055;
      els.cursorLight.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      els.cursorLight.style.opacity = hovering ? "0.42" : "0.3";
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

    initParticles();
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

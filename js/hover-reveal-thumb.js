/**
 * HoverRevealThumb — vanilla-JS port of the design handoff component
 * (HoverRevealThumbnail.jsx).
 *
 * Ported 1:1: same geometry, timeline and easing. Do not "clean up" the
 * pop-card alignment constants (POP_* / CARD_*) — they're measured so the
 * lifted card lands exactly on the list card's content box; re-deriving
 * them from scratch will visibly misalign the pop.
 *
 * Plays once on hover/focus (before -> sweep -> scroll -> pop), holds on
 * the final popped-card frame while hovered, resets to frame 0 on
 * mouseleave/blur. Runs one requestAnimationFrame loop per hovered
 * instance (nothing runs while at rest).
 */
(function () {
  // ---------------------------------------------------------------- layout
  const W = 1600,
    H = 900;
  const FRAME_W = 470; // on-stage width of the phone screen
  const NATIVE_W = 814; // pixel width of before/after.png
  const S = FRAME_W / NATIVE_W;
  const VIEW_H = 740;
  const VIEW_X = (W - FRAME_W) / 2;
  const VIEW_Y = (H - VIEW_H) / 2;

  // The selected card inside after.png, in that file's pixels.
  const CARD_TOP = 3346,
    CARD_BOT = 3809;
  const CARD_Y = CARD_TOP * S;
  const CARD_H = (CARD_BOT - CARD_TOP) * S;
  const SCROLL_TO = -(CARD_Y + CARD_H / 2 - VIEW_H / 2);

  // selected-card.png is aligned so its content box lands exactly on the
  // list card's content box (x 43..770, y 3358.. in after.png) at pop start.
  const POP_FILE_W = 854,
    POP_FILE_H = 489,
    POP_PAD = 39;
  const POP_IMG_S = (727 * S) / (POP_FILE_W - POP_PAD * 2);
  const POP_W = POP_FILE_W * POP_IMG_S;
  const POP_H = POP_FILE_H * POP_IMG_S;
  const POP_LEFT = VIEW_X + 43 * S - POP_PAD * POP_IMG_S;
  const POP_TOP_N = 3358;

  const DRAG_AMP = 380; // cursor travel per drag stroke, stage px
  const STROKES = 2;

  // ---------------------------------------------------------------- timeline
  const SCENES = [
    ["before", 1.2],
    ["sweep", 1.4],
    ["scroll", 2.1],
    ["pop", 1.3],
  ];
  const CUE = {};
  let _acc = 0;
  for (const [name, dur] of SCENES) {
    CUE[name] = _acc;
    _acc += dur;
  }
  const TOTAL = _acc; // 6.0s

  // ---------------------------------------------------------------- easing
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mix = (a, b, u) => a + (b - a) * u;
  const E = {
    linear: (t) => t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  };

  /** Piecewise ramp: track(t, [t0, t1, ...], [v0, v1, ...], ease) */
  function track(t, ins, outs, ease) {
    ease = ease || E.inOutCubic;
    if (t <= ins[0]) return outs[0];
    for (let i = 1; i < ins.length; i++) {
      if (t <= ins[i]) {
        const u = (t - ins[i - 1]) / (ins[i] - ins[i - 1]);
        return mix(outs[i - 1], outs[i], ease(clamp(u, 0, 1)));
      }
    }
    return outs[outs.length - 1];
  }

  /**
   * Two drag strokes. The list advances only on the downstroke; the return
   * stroke lifts the finger and moves nothing — that is what makes the drag
   * read as the cause of the scroll.
   */
  function dragPath(p) {
    const s = clamp(p, 0, 1) * STROKES;
    const i = Math.min(Math.floor(s), STROKES - 1);
    const l = clamp(s - i, 0, 1);
    const pull = 0.72;
    if (l < pull) {
      const u = E.outQuad(l / pull);
      return { y: -0.5 + u, adv: (i + u) / STROKES, pulling: true };
    }
    const u = E.inOutCubic((l - pull) / (1 - pull));
    return { y: 0.5 - u, adv: (i + 1) / STROKES, pulling: false };
  }

  // -------------------------------------------------------------- the frame
  /** Every visible value is a pure function of `t` (authored seconds). */
  function frame(t) {
    const sweepStart = CUE.sweep - 0.1,
      sweepEnd = CUE.sweep + 1.05;
    const wipe = clamp(track(t, [sweepStart, sweepEnd], [0, 1], E.inOutQuart), 0, 1);
    const dividerOn =
      clamp(track(t, [sweepStart - 0.45, sweepStart - 0.1], [0, 1], E.outCubic), 0, 1) *
      clamp(track(t, [sweepEnd + 0.05, sweepEnd + 0.35], [1, 0]), 0, 1);

    const dragStart = CUE.scroll + 0.15,
      dragEnd = CUE.scroll + 1.85;
    const drag = dragPath((t - dragStart) / (dragEnd - dragStart));
    const scroll = SCROLL_TO * drag.adv;

    const popStart = CUE.pop + 0.12;
    const popFade = clamp(track(t, [popStart, popStart + 0.3], [0, 1]), 0, 1);
    const pop = clamp(track(t, [popStart + 0.3, popStart + 0.98], [0, 1], E.outCubic), 0, 1);
    const scrim = clamp(track(t, [popStart + 0.28, popStart + 0.72], [0, 1], E.outCubic), 0, 1);

    const cardCenterY = VIEW_Y + CARD_Y + CARD_H / 2 + scroll;
    const toDrag = clamp(track(t, [sweepEnd + 0.05, dragStart], [0, 1]), 0, 1);
    const toCard = clamp(track(t, [dragEnd, CUE.pop + 0.02], [0, 1], E.inOutQuart), 0, 1);

    let cursorX = mix(VIEW_X + FRAME_W + 200, VIEW_X + FRAME_W / 2 + 60, toDrag);
    cursorX = mix(cursorX, VIEW_X + FRAME_W / 2 - 40, toCard);
    let cursorY = mix(H - 60, H / 2 + drag.y * DRAG_AMP, toDrag);
    cursorY = mix(cursorY, cardCenterY, toCard);

    const click = clamp(track(t, [CUE.pop - 0.24, CUE.pop - 0.02, CUE.pop + 0.26], [0, 1, 0], E.outQuad), 0, 1);
    const press = clamp(Math.max(0.34 * toDrag * (1 - toCard) * (drag.pulling ? 1 : 0), click), 0, 1);
    const cursorOpacity =
      clamp(track(t, [sweepEnd + 0.05, sweepEnd + 0.35], [0, 1], E.linear), 0, 1) *
      clamp(track(t, [popStart + 0.05, popStart + 0.3], [1, 0], E.linear), 0, 1);

    return { wipe, dividerOn, scroll, popFade, pop, scrim, cursorX, cursorY, press, cursorOpacity };
  }

  // ---------------------------------------------------------------- build
  function el(tag, style) {
    const node = document.createElement(tag);
    if (style) Object.assign(node.style, style);
    return node;
  }

  const TOKENS = {
    dark: {
      backdrop: "#141517",
      gradient: "radial-gradient(120% 90% at 50% 40%, rgba(255,255,255,.07), rgba(0,0,0,0) 70%)",
      screenShadow: "0 40px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08)",
    },
    light: {
      backdrop: "#EDEBE7",
      gradient: "radial-gradient(120% 90% at 50% 40%, rgba(255,255,255,.9), rgba(0,0,0,0) 72%)",
      screenShadow: "0 40px 80px rgba(30,28,24,.22), 0 0 0 1px rgba(0,0,0,.06)",
    },
  };

  function build(mount) {
    const beforeSrc = mount.dataset.beforeSrc;
    const afterSrc = mount.dataset.afterSrc;
    const cardSrc = mount.dataset.cardSrc;
    const theme = mount.dataset.theme === "dark" ? "dark" : "light";
    const accent = mount.dataset.accent || "#2C6EF2";
    const showCursor = mount.dataset.showCursor !== "false";
    const transparent = mount.dataset.transparent === "true";
    const tokens = TOKENS[theme];

    mount.style.position = "relative";
    mount.style.overflow = "hidden";
    // Transparent skips the component's own backdrop/gradient so the site's
    // .project__frame grey shows through instead of an approximated color.
    mount.style.background = transparent ? "transparent" : tokens.backdrop;

    const stage = el("div", {
      position: "absolute",
      left: "0",
      top: "0",
      width: W + "px",
      height: H + "px",
      transformOrigin: "0 0",
    });
    mount.appendChild(stage);

    if (!transparent) {
      stage.appendChild(el("div", { position: "absolute", inset: "0", background: tokens.gradient }));
    }

    // phone screen
    const screen = el("div", {
      position: "absolute",
      left: VIEW_X + "px",
      top: VIEW_Y + "px",
      width: FRAME_W + "px",
      height: VIEW_H + "px",
      borderRadius: "26px",
      overflow: "hidden",
      background: "#fff",
      boxShadow: tokens.screenShadow,
    });
    stage.appendChild(screen);

    const beforeImg = el("img", { position: "absolute", left: "0", top: "0", width: FRAME_W + "px", display: "block" });
    beforeImg.alt = "Original listing screen";
    beforeImg.src = beforeSrc;
    screen.appendChild(beforeImg);

    const afterWrap = el("div", { position: "absolute", inset: "0", background: "#fff" });
    screen.appendChild(afterWrap);

    const afterImg = el("img", { position: "absolute", left: "0", top: "0", width: FRAME_W + "px", display: "block" });
    afterImg.alt = "Redesigned listing screen";
    afterImg.src = afterSrc;
    afterWrap.appendChild(afterImg);

    const divider = el("div", {
      position: "absolute",
      top: "0",
      bottom: "0",
      width: "3px",
      background: accent,
      boxShadow: `0 0 26px 6px ${accent}55`,
    });
    screen.appendChild(divider);

    const scrim = el("div", { position: "absolute", inset: "0", background: "#0b0d10" });
    screen.appendChild(scrim);

    // the selected card lifting out of the list
    const popCard = el("div", {
      position: "absolute",
      width: POP_W + "px",
      height: POP_H + "px",
      background: "#fff",
      overflow: "hidden",
      transformOrigin: "50% 50%",
      zIndex: "30",
    });
    stage.appendChild(popCard);

    const popImg = el("img", { width: "100%", display: "block" });
    popImg.alt = "Selected listing card";
    popImg.src = cardSrc;
    popCard.appendChild(popImg);

    let cursorWrap = null,
      cursorHalo = null,
      cursorPad = null;
    if (showCursor) {
      const R = 34;
      cursorWrap = el("div", {
        position: "absolute",
        left: "0",
        top: "0",
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
        zIndex: "40",
      });
      cursorHalo = el("div", {
        position: "absolute",
        left: -R * 2.4 + "px",
        top: -R * 2.4 + "px",
        width: R * 4.8 + "px",
        height: R * 4.8 + "px",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}55, ${accent}00 70%)`,
      });
      cursorPad = el("div", {
        position: "absolute",
        left: -R + "px",
        top: -R + "px",
        width: R * 2 + "px",
        height: R * 2 + "px",
        borderRadius: "50%",
        background: "rgba(255,255,255,.34)",
        border: "1.5px solid rgba(255,255,255,.75)",
        backdropFilter: "blur(2px)",
        boxShadow: "0 6px 22px rgba(0,0,0,.28)",
      });
      cursorWrap.appendChild(cursorHalo);
      cursorWrap.appendChild(cursorPad);
      stage.appendChild(cursorWrap);
    }

    return { stage, afterWrap, afterImg, divider, scrim, popCard, cursorWrap, cursorHalo, cursorPad };
  }

  function render(nodes, t, scale) {
    nodes.stage.style.transform = `scale(${scale})`;
    const f = frame(t);

    nodes.afterWrap.style.clipPath = `inset(0 0 0 ${(1 - f.wipe) * 100}%)`;
    nodes.afterImg.style.top = f.scroll + "px";

    nodes.divider.style.left = (1 - f.wipe) * FRAME_W - 1.5 + "px";
    nodes.divider.style.opacity = String(f.dividerOn);

    nodes.scrim.style.opacity = String(f.scrim * 0.42);

    nodes.popCard.style.left = POP_LEFT + "px";
    nodes.popCard.style.top = VIEW_Y + POP_TOP_N * S + f.scroll - POP_PAD * POP_IMG_S + "px";
    nodes.popCard.style.opacity = String(f.popFade);
    nodes.popCard.style.transform = `translateY(${-f.pop * 20}px) scale(${1 + f.pop * 0.52})`;
    nodes.popCard.style.borderRadius = f.pop * 18 + "px";
    nodes.popCard.style.boxShadow = `0 ${f.pop * 40}px ${f.pop * 90}px rgba(0,0,0,${f.pop * 0.34})`;

    if (nodes.cursorWrap) {
      nodes.cursorWrap.style.left = f.cursorX + "px";
      nodes.cursorWrap.style.top = f.cursorY + "px";
      nodes.cursorWrap.style.opacity = String(f.cursorOpacity);
      nodes.cursorHalo.style.opacity = String(0.35 + f.press * 0.65);
      nodes.cursorHalo.style.transform = `scale(${0.7 + f.press * 0.55})`;
      nodes.cursorPad.style.transform = `scale(${1 - f.press * 0.18})`;
    }
  }

  // CSS aspect-ratio on a flex item under align-items:center is unreliable
  // in this environment, so the 16:9 box is pinned explicitly in JS. The box
  // is fit *inside* the frame (like object-fit:contain) rather than derived
  // from the mount's own width, because .project__frame has a max-height
  // clamp — past that breakpoint the frame keeps growing wider while staying
  // capped in height, and a width-only fit would overflow and get clipped.
  function fitMount(mount) {
    const frame = mount.parentElement;
    const boxW = frame.clientWidth || W;
    const boxH = frame.clientHeight || (boxW * H) / W;
    let w = boxW,
      h = (w * H) / W;
    if (h > boxH) {
      h = boxH;
      w = (h * W) / H;
    }
    mount.style.width = w + "px";
    mount.style.height = h + "px";
  }

  function init(mount) {
    const nodes = build(mount);
    fitMount(mount);
    const scale = (mount.clientWidth || W) / W;
    let raf = 0;
    let started = 0;
    let live = false;

    render(nodes, 0, scale);

    // Plays once and holds on the final (popped-card) frame while hovered —
    // unlike a looping thumbnail, it does not wrap back to t=0 on its own.
    function step(now) {
      const t = (now - started) / 1000;
      if (t >= TOTAL) {
        render(nodes, TOTAL, mount.clientWidth / W || scale);
        raf = 0;
        return;
      }
      render(nodes, t, mount.clientWidth / W || scale);
      raf = requestAnimationFrame(step);
    }

    function play() {
      if (live) return;
      live = true;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return; // decorative only — stays on frame 0
      started = performance.now();
      raf = requestAnimationFrame(step);
    }

    function stop() {
      live = false;
      cancelAnimationFrame(raf);
      raf = 0;
      render(nodes, 0, mount.clientWidth / W || scale);
    }

    const target = mount.closest("a,button") || mount;
    target.addEventListener("mouseenter", play);
    target.addEventListener("mouseleave", stop);
    target.addEventListener("focus", play);
    target.addEventListener("blur", stop);

    // Window "resize" and a ResizeObserver on the frame are complementary:
    // some viewport-size changes (e.g. certain DevTools device-toolbar
    // drags) only trigger one or the other.
    function refit() {
      fitMount(mount);
      render(nodes, 0, mount.clientWidth / W || scale);
    }
    window.addEventListener("resize", refit);
    new ResizeObserver(refit).observe(mount.parentElement);
  }

  document.querySelectorAll("[data-hover-reveal]").forEach(init);
})();

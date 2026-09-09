/**
 * ReviewSparkleThumb — vanilla-JS port of the design handoff component.
 *
 * Ported 1:1 from the React source (ReviewSparkleThumb.jsx): same geometry,
 * timeline, easing curves and sampled sparkle keyframes. Do not "clean up"
 * SCALE_KEYS / RISE_KEYS — they are a frame-by-frame sample of the designer's
 * source animation, not a curve to be re-derived.
 *
 * Plays on hover/focus, holds frame 0 at rest. Runs one requestAnimationFrame
 * loop per hovered instance (nothing runs while at rest).
 */
(function () {
  // ---------------------------------------------------------------- geometry
  const SCREEN = { w: 750, h: 1624 };
  const LIST = { w: 750, h: 3152 };
  const VIEW = { w: 1280, h: 720 };
  const LIST_CARD = { x: 0, y: 352, w: 750, h: 790 };
  const SPARKS = [
    { x: 91.5, y: 995.5 },
    { x: 383.5, y: 995.5 },
    { x: 91.5, y: 1043.5 },
  ];
  const REST_R = 8;
  const AMBER = "#FFAB0A";
  const CARD_BG = "#F5F5F5";

  // ---------------------------------------------------------------- timeline
  const SCENES = [
    ["list", 0.75],
    ["push", 0.65],
    ["zoom", 1.1],
    ["spark", 2.4],
    ["out", 1.15],
  ];
  const CUE = {};
  let _acc = 0;
  for (const [name, dur] of SCENES) {
    CUE[name] = _acc;
    _acc += dur;
  }
  const TOTAL = _acc; // 6.05s

  const FAR = 0.415,
    NEAR = 1.0;
  const CARD_C = { x: 375, y: 1005 };

  // ------------------------------------------------- sampled sparkle motion
  const SPARK_T = [
    0, 0.08, 0.17, 0.25, 0.34, 0.42, 0.51, 0.59, 0.68, 0.76, 1.27, 1.36, 1.44,
    1.52, 1.61, 1.69, 1.78, 1.86, 1.95, 2.033,
  ];
  const SCALE_KEYS = [
    1.0, 1.026, 1.032, 1.075, 1.179, 1.436, 1.766, 1.815, 1.838, 1.864, 1.864,
    1.847, 1.806, 1.749, 1.436, 1.171, 1.069, 1.032, 1.023, 1.0,
  ];
  const RISE_KEYS = [
    0, 0, -0.006, -0.014, -0.043, -0.11, -0.188, -0.205, -0.214, -0.217,
    -0.217, -0.214, -0.202, -0.188, -0.11, -0.043, -0.014, -0.006, -0.003, 0,
  ];
  const STAGGER = 0.18;

  const PEAK = 1.864;
  const waistOf = (s) => 1 + (s - 1) * 0.3646;
  const spinOf = (s) => -90 * (1 - (s - 1) / (PEAK - 1));

  // ---------------------------------------------------------------- easing
  const E = {
    linear: (t) => t,
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuad: (t) => 1 - (1 - t) * (1 - t),
  };

  function track(times, values, ease) {
    ease = ease || E.linear;
    return (t) => {
      if (t <= times[0]) return values[0];
      const last = times.length - 1;
      if (t >= times[last]) return values[last];
      let i = 0;
      while (i < last && t > times[i + 1]) i++;
      const span = times[i + 1] - times[i] || 1;
      const f = Array.isArray(ease) ? ease[i] || E.linear : ease;
      return values[i] + (values[i + 1] - values[i]) * f((t - times[i]) / span);
    };
  }

  function sparkPath(r, w) {
    const c1 = 0.06 * w,
      c1y = 0.34 * r,
      c2 = 0.26 * w,
      c2y = 0.12 * w;
    return [
      `M 0 ${-r}`,
      `C ${c1} ${-c1y} ${c2} ${-c2y} ${r} 0`,
      `C ${c2} ${c2y} ${c1} ${c1y} 0 ${r}`,
      `C ${-c1} ${c1y} ${-c2} ${c2y} ${-r} 0`,
      `C ${-c2} ${-c2y} ${-c1} ${-c1y} 0 ${-r}`,
      "Z",
    ].join(" ");
  }

  // ---------------------------------------------------------------- tracks
  // Zoom-in ramp shortened from the source's 1.1s to feel snappier on hover;
  // the zoom-out ramp at the end keeps its original 1.1s pace.
  const ZOOM_IN_DUR = 0.65;
  const camScale = track(
    [0, CUE.zoom, CUE.zoom + ZOOM_IN_DUR, CUE.out, CUE.out + 1.1, TOTAL],
    [FAR, FAR, NEAR, NEAR, FAR, FAR],
    [E.inOutSine, E.inOutSine, E.linear, E.inOutSine, E.inOutSine]
  );
  const camX = track(
    [0, CUE.zoom, CUE.zoom + ZOOM_IN_DUR, CUE.out, CUE.out + 1.1, TOTAL],
    [375, 375, CARD_C.x, CARD_C.x, 375, 375],
    [E.inOutSine, E.inOutSine, E.linear, E.inOutSine, E.inOutSine]
  );
  const camY = track(
    [0, CUE.zoom, CUE.zoom + ZOOM_IN_DUR, CUE.out, CUE.out + 1.1, TOTAL],
    [812, 818, CARD_C.y, CARD_C.y, 812, 812],
    [E.inOutSine, E.inOutSine, E.linear, E.inOutSine, E.inOutSine]
  );
  const pushTrack = track(
    [CUE.push, CUE.push + 0.62, CUE.out + 0.16, TOTAL],
    [0, 1, 1, 0],
    [E.inOutCubic, E.linear, E.inOutCubic]
  );
  const TAP_AT = CUE.list * 0.62;
  const tapTrack = track([TAP_AT, TAP_AT + 0.46], [0, 1], E.outQuad);
  const pressTrack = track([TAP_AT, TAP_AT + 0.12, TAP_AT + 0.3], [1, 0.982, 1], E.outQuad);

  function sparkAt(i, t) {
    const t0 = CUE.spark + i * STAGGER;
    const times = SPARK_T.map((v) => t0 + v);
    return {
      scale: track(times, SCALE_KEYS)(t),
      rise: track(times, RISE_KEYS)(t),
    };
  }

  // ---------------------------------------------------------------- build
  function el(tag, style, attrs) {
    const node = document.createElement(tag);
    if (style) Object.assign(node.style, style);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function build(mount) {
    const listSrc = mount.dataset.listSrc;
    const detailSrc = mount.dataset.detailSrc;
    const transparent = mount.dataset.transparent === "true";

    mount.style.position = "relative";
    mount.style.width = "100%";
    mount.style.overflow = "hidden";
    mount.style.background = transparent ? "transparent" : "#EFEAE2";

    const scaler = el("div", {
      position: "absolute",
      top: "0",
      left: "0",
      width: VIEW.w + "px",
      height: VIEW.h + "px",
      transformOrigin: "0 0",
    });
    mount.appendChild(scaler);

    if (!transparent) {
      scaler.appendChild(
        el("div", {
          position: "absolute",
          inset: "0",
          background: "radial-gradient(115% 88% at 50% 40%, #FCFAF6 0%, #E8E2D8 100%)",
        })
      );
    }

    const cam = el("div", { position: "absolute", inset: "0", transformOrigin: "0 0" });
    scaler.appendChild(cam);

    const phone = el("div", {
      position: "absolute",
      left: "0",
      top: "0",
      width: SCREEN.w + "px",
      height: SCREEN.h + "px",
      borderRadius: "30px",
      overflow: "hidden",
      background: "#fff",
    });
    cam.appendChild(phone);

    // list screen
    const listLayer = el("div", {
      position: "absolute",
      left: "0",
      top: "0",
      width: LIST.w + "px",
      height: LIST.h + "px",
    });
    phone.appendChild(listLayer);

    const listImg = el("img", { display: "block" }, { width: LIST.w, height: LIST.h, alt: "" });
    listImg.src = listSrc;
    listLayer.appendChild(listImg);

    const pressWash = el("div", {
      position: "absolute",
      left: LIST_CARD.x + "px",
      top: LIST_CARD.y + "px",
      width: LIST_CARD.w + "px",
      height: LIST_CARD.h + "px",
      background: "#0F1115",
      opacity: "0",
      transformOrigin: "50% 50%",
    });
    listLayer.appendChild(pressWash);

    const rippleWrap = el("div", {
      position: "absolute",
      left: "375px",
      top: "747px",
      width: "0",
      height: "0",
      display: "none",
    });
    const ripple = el("div", {
      position: "absolute",
      left: "-110px",
      top: "-110px",
      width: "220px",
      height: "220px",
      borderRadius: "50%",
      border: "3px solid rgba(20,22,28,0.30)",
    });
    rippleWrap.appendChild(ripple);
    listLayer.appendChild(rippleWrap);

    // detail screen
    const detailLayer = el("div", {
      position: "absolute",
      left: "0",
      top: "0",
      width: SCREEN.w + "px",
      height: SCREEN.h + "px",
      background: "#fff",
    });
    phone.appendChild(detailLayer);

    const detailImg = el("img", { display: "block" }, { width: SCREEN.w, height: SCREEN.h, alt: "" });
    detailImg.src = detailSrc;
    detailLayer.appendChild(detailImg);

    const sparks = SPARKS.map((p) => {
      const patch = el("div", {
        position: "absolute",
        left: p.x - REST_R * 1.4 + "px",
        top: p.y - REST_R * 1.4 + "px",
        width: REST_R * 2.8 + "px",
        height: REST_R * 2.8 + "px",
        background: CARD_BG,
      });
      detailLayer.appendChild(patch);

      const box = REST_R * 2.2;
      const wrap = el("div", { position: "absolute", left: p.x + "px", top: p.y + "px", width: "0", height: "0" });
      const spin = el("div", { transformOrigin: "0 0" });
      const svg = svgEl("svg", {
        width: box * 2,
        height: box * 2,
        viewBox: `${-box} ${-box} ${box * 2} ${box * 2}`,
        style: "display:block;overflow:visible;position:absolute;left:" + -box + "px;top:" + -box + "px",
      });
      const path = svgEl("path", { fill: AMBER });
      svg.appendChild(path);
      spin.appendChild(svg);
      wrap.appendChild(spin);
      detailLayer.appendChild(wrap);

      return { wrap, spin, path };
    });

    return { scaler, cam, phone, listLayer, pressWash, rippleWrap, ripple, detailLayer, sparks };
  }

  function render(nodes, t, scale) {
    nodes.scaler.style.transform = `scale(${scale})`;

    const s = camScale(t),
      cx = camX(t),
      cy = camY(t),
      push = pushTrack(t);
    nodes.cam.style.transform = `translate(${VIEW.w / 2 - cx * s}px, ${VIEW.h / 2 - cy * s}px) scale(${s})`;

    nodes.listLayer.style.transform = `translateX(${-176 * push}px)`;
    nodes.detailLayer.style.transform = `translateX(${SCREEN.w * (1 - push)}px)`;

    const tapOn = t > TAP_AT && t < TAP_AT + 0.5;
    if (tapOn) {
      const tap = tapTrack(t);
      const press = pressTrack(t);
      nodes.pressWash.style.opacity = String(0.05 * (1 - tap));
      nodes.pressWash.style.transform = `scale(${press})`;
      nodes.rippleWrap.style.display = "";
      nodes.ripple.style.transform = `scale(${0.28 + tap * 0.95})`;
      nodes.ripple.style.opacity = String((1 - tap) * 0.9);
    } else {
      nodes.pressWash.style.opacity = "0";
      nodes.rippleWrap.style.display = "none";
    }

    nodes.sparks.forEach((spark, i) => {
      const m = sparkAt(i, t);
      const r = REST_R * m.scale;
      const w = REST_R * waistOf(m.scale);
      spark.wrap.style.transform = `translate(0, ${m.rise * REST_R}px)`;
      spark.spin.style.transform = `rotate(${spinOf(m.scale)}deg)`;
      spark.path.setAttribute("d", sparkPath(r, w));
    });
  }

  // CSS aspect-ratio on a flex item under align-items:center is unreliable
  // in this environment (the item's height ends up matching the flex
  // container's own height instead of following its own ratio), so the
  // 16:9 box is pinned explicitly in JS instead of trusted to CSS alone.
  // The box is fit *inside* the frame (like object-fit:contain) rather than
  // derived from the mount's own width, because .project__frame has a
  // max-height clamp — past that breakpoint the frame keeps growing wider
  // while staying capped in height, and a width-only fit would overflow and
  // get clipped by the frame's overflow:hidden.
  function fitMount(mount) {
    const frame = mount.parentElement;
    const boxW = frame.clientWidth || VIEW.w;
    const boxH = frame.clientHeight || (boxW * VIEW.h) / VIEW.w;
    let w = boxW,
      h = (w * VIEW.h) / VIEW.w;
    if (h > boxH) {
      h = boxH;
      w = (h * VIEW.w) / VIEW.h;
    }
    mount.style.width = w + "px";
    mount.style.height = h + "px";
  }

  function init(mount) {
    const nodes = build(mount);
    fitMount(mount);
    const scale = (mount.clientWidth || VIEW.w) / VIEW.w;
    let raf = 0;
    let started = 0;
    let live = false;

    render(nodes, 0, scale);

    function step(now) {
      const t = ((now - started) / 1000) % TOTAL;
      render(nodes, t, mount.clientWidth / VIEW.w || scale);
      raf = requestAnimationFrame(step);
    }

    function play() {
      if (live) return;
      live = true;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        render(nodes, CUE.spark + 1.0, mount.clientWidth / VIEW.w || scale);
        return;
      }
      started = performance.now();
      raf = requestAnimationFrame(step);
    }

    function stop() {
      live = false;
      cancelAnimationFrame(raf);
      render(nodes, 0, mount.clientWidth / VIEW.w || scale);
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
      render(nodes, 0, mount.clientWidth / VIEW.w || scale);
    }
    window.addEventListener("resize", refit);
    new ResizeObserver(refit).observe(mount.parentElement);
  }

  document.querySelectorAll("[data-sparkle-thumb]").forEach(init);
})();

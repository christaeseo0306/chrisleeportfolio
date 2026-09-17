/**
 * Glass trailing cursor: a translucent ring that lerps toward the pointer,
 * growing over links/buttons and shrinking on press. Skipped entirely on
 * touch devices and under prefers-reduced-motion — cursor:none is never
 * set in those cases, so those visitors keep a normal cursor.
 */
(function () {
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || calm) return;

  const ring = document.getElementById("ring");
  if (!ring) return;

  let x = 0,
    y = 0,
    tx = 0,
    ty = 0;

  addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    ring.classList.add("visible");
  });

  (function loop() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    ring.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(loop);
  })();

  // Delegated hover so it covers dynamically-inserted content (the project
  // cards' animated mounts) without needing per-element listeners.
  addEventListener("mouseover", (e) => {
    if (e.target.closest("a, button, [role='button']")) ring.classList.add("over-link");
  });
  addEventListener("mouseout", (e) => {
    if (e.target.closest("a, button, [role='button']")) ring.classList.remove("over-link");
  });

  addEventListener("mousedown", () => ring.classList.add("pressed"));
  addEventListener("mouseup", () => ring.classList.remove("pressed"));
  document.addEventListener("mouseleave", () => ring.classList.remove("visible", "pressed"));
})();

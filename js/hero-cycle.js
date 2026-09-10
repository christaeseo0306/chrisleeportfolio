/**
 * Cycles the hero tagline through a list of phrases. The star spins off to
 * the left, masking the phrase as it passes over it (the text is clipped
 * to whatever is left of the star's current position, each frame, so it
 * looks erased by the star rather than just disappearing). The phrase then
 * swaps behind the star, which spins back to the right, unmasking the new
 * phrase the same way it masked the old one. Disabled under
 * prefers-reduced-motion (shows the first phrase, static).
 */
(function () {
  const PHRASES = [
    "who connects the dots",
    "who bridges people and tech",
    "who reframes questions",
    "who makes things tangible",
  ];
  const HOLD_MS = 2200;
  const LEFT_MS = 350;
  const RIGHT_MS = 350;
  const EASE = "ease-in-out";

  const wrap = document.querySelector("[data-hero-cycle]");
  const text = document.querySelector("[data-hero-cycle-text]");
  const star = document.querySelector(".hero__tagline .star img");
  if (!wrap || !text || !star) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    text.textContent = PHRASES[0];
    return;
  }

  star.style.position = "relative";

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  // Clips the text to whatever lies left of the star's current center, each
  // frame, for `duration` ms — the star's edge becomes the mask boundary,
  // so the phrase looks erased (star moving left) or drawn in (star moving
  // right) as it passes over it, rather than just vanishing/appearing.
  function driveMask(duration, done) {
    const textRect = text.getBoundingClientRect();
    const start = performance.now();
    function frame(now) {
      const starRect = star.getBoundingClientRect();
      const starCenterX = starRect.left + starRect.width / 2;
      const visible = clamp(starCenterX - textRect.left, 0, textRect.width);
      text.style.clipPath = `inset(0 ${textRect.width - visible}px 0 0)`;
      if (now - start < duration) {
        requestAnimationFrame(frame);
      } else {
        done();
      }
    }
    requestAnimationFrame(frame);
  }

  let index = 0;

  function next() {
    index = (index + 1) % PHRASES.length;

    // Spin off to the left, roughly to where the current phrase starts,
    // masking the phrase as it goes.
    const leftTravel = wrap.getBoundingClientRect().width;
    star.style.transition = `transform ${LEFT_MS}ms ${EASE}`;
    star.style.transform = `translateX(-${leftTravel}px) rotate(-180deg)`;

    driveMask(LEFT_MS, () => {
      text.style.clipPath = "inset(0 100% 0 0)"; // fully masked, guard against a stray frame

      // Swap the text while fully masked. Resizing the box shifts the
      // star's own (untransformed) flow position, so compensate the
      // transform instantly to avoid a visible jump, then spin back from
      // there.
      const beforeLeft = star.offsetLeft;
      text.textContent = PHRASES[index];
      wrap.style.width = "auto";
      const shift = star.offsetLeft - beforeLeft;

      star.style.transition = "none";
      star.style.transform = `translateX(${-leftTravel - shift}px) rotate(-180deg)`;
      void star.offsetWidth; // flush before re-enabling the transition

      star.style.transition = `transform ${RIGHT_MS}ms ${EASE}`;
      star.style.transform = "translateX(0) rotate(-360deg)";

      driveMask(RIGHT_MS, () => {
        text.style.clipPath = "none";
        star.style.transform = "none";
        setTimeout(next, HOLD_MS);
      });
    });
  }

  text.textContent = PHRASES[0];
  setTimeout(next, HOLD_MS);
})();

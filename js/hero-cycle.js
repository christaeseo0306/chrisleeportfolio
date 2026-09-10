/**
 * Cycles the hero tagline through a list of phrases: the star grows and
 * spins until it completely covers the current phrase, the phrase swaps
 * underneath (hidden), then the star spins back down to its normal size,
 * revealing the next phrase. Disabled under prefers-reduced-motion (shows
 * the first phrase, static, no animation).
 */
(function () {
  const PHRASES = [
    "who connects the dots",
    "who bridges people and tech",
    "who reframes questions",
    "who makes things tangible",
  ];
  const STAR_SIZE = 18;
  const HOLD_MS = 2200;
  const GROW_MS = 320;
  const SHRINK_MS = 360;
  const EASE = "cubic-bezier(.4,0,.2,1)";

  const wrap = document.querySelector("[data-hero-cycle]");
  const text = document.querySelector("[data-hero-cycle-text]");
  const star = document.querySelector(".hero__tagline .star img");
  if (!wrap || !text || !star) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    text.textContent = PHRASES[0];
    return;
  }

  star.style.position = "relative";
  star.style.zIndex = "1";
  star.style.transformOrigin = "50% 50%";

  let index = 0;

  function next() {
    index = (index + 1) % PHRASES.length;

    const starRect = star.getBoundingClientRect();
    const textRect = wrap.getBoundingClientRect();
    const dx = textRect.left + textRect.width / 2 - (starRect.left + starRect.width / 2);
    const dy = textRect.top + textRect.height / 2 - (starRect.top + starRect.height / 2);
    // Non-uniform: cover the phrase's full width, but only pad its height
    // generously rather than matching width 1:1 — a uniformly-scaled star
    // wide enough to cover a long phrase would also be absurdly tall.
    const scaleX = (textRect.width * 1.15) / STAR_SIZE;
    const scaleY = (textRect.height * 1.8) / STAR_SIZE;

    star.style.transition = `transform ${GROW_MS}ms ${EASE}`;
    star.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY}) rotate(180deg)`;

    setTimeout(() => {
      // The star now fully covers the current phrase. Swap the text and
      // resize the box underneath while hidden, then instantly compensate
      // the star's transform for however much that resize just shifted its
      // own (untransformed) flow position, so nothing visibly jumps.
      const beforeLeft = star.offsetLeft;
      const beforeTop = star.offsetTop;

      text.textContent = PHRASES[index];
      wrap.style.width = "auto";
      const naturalWidth = wrap.getBoundingClientRect().width;
      wrap.style.width = naturalWidth + "px";

      const shiftX = star.offsetLeft - beforeLeft;
      const shiftY = star.offsetTop - beforeTop;
      star.style.transition = "none";
      star.style.transform = `translate(${dx - shiftX}px, ${dy - shiftY}px) scale(${scaleX}, ${scaleY}) rotate(180deg)`;
      void star.offsetWidth; // flush before re-enabling the transition

      star.style.transition = `transform ${SHRINK_MS}ms ${EASE}`;
      star.style.transform = "translate(0, 0) scale(1, 1) rotate(360deg)";

      setTimeout(() => {
        star.style.transform = "none";
        setTimeout(next, HOLD_MS);
      }, SHRINK_MS);
    }, GROW_MS);
  }

  text.textContent = PHRASES[0];
  setTimeout(next, HOLD_MS);
})();

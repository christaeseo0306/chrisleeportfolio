/**
 * Smoothly cycles the hero tagline through a list of phrases: holds, then
 * crossfades to the next phrase while the container width eases to match
 * (so the star at the end glides over rather than jumping), spinning the
 * star once as it moves. Disabled under prefers-reduced-motion (shows the
 * first phrase, static).
 */
(function () {
  const PHRASES = [
    "who connects the dots",
    "who bridges people and tech",
    "who reframes questions",
    "who makes things tangible",
  ];
  const HOLD_MS = 2200;
  const FADE_MS = 300;
  const WIDTH_MS = 400;

  const wrap = document.querySelector("[data-hero-cycle]");
  const text = document.querySelector("[data-hero-cycle-text]");
  const star = document.querySelector(".hero__tagline .star img");
  if (!wrap || !text) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    text.textContent = PHRASES[0];
    return;
  }

  text.style.transition = `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`;
  wrap.style.transition = `width ${WIDTH_MS}ms ease`;

  let index = 0;

  function next() {
    index = (index + 1) % PHRASES.length;

    // Fade the current phrase out.
    text.style.opacity = "0";
    text.style.transform = "translateY(6px)";

    setTimeout(() => {
      // Pin the container at its current width so there's something to
      // animate from, swap the text, measure the new natural width, then
      // ease over to it.
      const startWidth = wrap.getBoundingClientRect().width;
      wrap.style.transition = "none";
      wrap.style.width = startWidth + "px";

      text.textContent = PHRASES[index];
      wrap.style.width = "auto";
      const targetWidth = wrap.getBoundingClientRect().width;
      wrap.style.width = startWidth + "px";
      void wrap.offsetWidth; // flush before re-enabling the transition
      wrap.style.transition = `width ${WIDTH_MS}ms ease`;
      wrap.style.width = targetWidth + "px";

      if (star) {
        star.classList.remove("is-spinning");
        void star.offsetWidth;
        star.classList.add("is-spinning");
      }

      text.style.transform = "translateY(-6px)";
      void text.offsetWidth;
      text.style.opacity = "1";
      text.style.transform = "translateY(0)";

      setTimeout(next, HOLD_MS);
    }, FADE_MS);
  }

  if (star) {
    star.addEventListener("animationend", () => star.classList.remove("is-spinning"));
  }

  text.textContent = PHRASES[0];
  setTimeout(next, HOLD_MS);
})();

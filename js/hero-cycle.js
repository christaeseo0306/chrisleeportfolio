/**
 * Typewriter-cycles the hero tagline through a list of phrases: types one
 * out, holds, deletes it, pauses, then types the next — looping forever.
 * Disabled under prefers-reduced-motion (shows the first phrase, static).
 */
(function () {
  const PHRASES = [
    "who connects the dots",
    "who bridges people and tech",
    "who reframes questions",
    "who makes things tangible",
  ];
  const TYPE_MS = 45;
  const DELETE_MS = 25;
  const HOLD_MS = 2200;
  const PAUSE_MS = 400;

  const el = document.querySelector("[data-hero-cycle]");
  if (!el) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = PHRASES[0];
    return;
  }

  let phraseIndex = 0;
  let charIndex = PHRASES[0].length;

  function type() {
    const phrase = PHRASES[phraseIndex];
    charIndex++;
    el.textContent = phrase.slice(0, charIndex);
    if (charIndex < phrase.length) {
      setTimeout(type, TYPE_MS);
    } else {
      setTimeout(startDelete, HOLD_MS);
    }
  }

  function startDelete() {
    charIndex = PHRASES[phraseIndex].length;
    del();
  }

  function del() {
    charIndex--;
    el.textContent = PHRASES[phraseIndex].slice(0, charIndex);
    if (charIndex > 0) {
      setTimeout(del, DELETE_MS);
    } else {
      phraseIndex = (phraseIndex + 1) % PHRASES.length;
      setTimeout(type, PAUSE_MS);
    }
  }

  el.textContent = PHRASES[0];
  setTimeout(startDelete, HOLD_MS);
})();

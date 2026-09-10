// Strip any incoming hash immediately so the browser's own (un-aligned,
// viewport-top) fragment scroll never gets a target to jump to — it would
// otherwise race our own scroll below and win, since it keeps re-correcting
// for layout shift until the page finishes loading. Restored once we've
// done our own aligned scroll.
if (history.scrollRestoration) history.scrollRestoration = "manual";
const incomingHash = location.hash;
if (incomingHash) {
  history.replaceState(null, "", location.pathname + location.search);
}

// A .reveal/.reveal-left target still mid (or not yet started) its
// scroll-triggered fade-in carries a transform (translateY) that shifts its
// measured position, so a delta computed off it goes stale the moment the
// reveal animation catches up. Snap it to its rest state first, with no
// transition, so the measurement below is against its true final position.
function settleReveal(el) {
  if (!el.classList.contains("reveal") && !el.classList.contains("reveal-left")) return;
  const prevTransition = el.style.transition;
  el.style.transition = "none";
  el.classList.add("is-visible");
  void el.offsetHeight; // flush the transition:none before restoring it
  el.style.transition = prevTransition;
}

function alignScrollTo(id, behavior) {
  const target = document.getElementById(id);
  const nav = document.querySelector(".sidebar__nav");
  if (!target || !nav) return false;
  settleReveal(target);
  const delta = target.getBoundingClientRect().top - nav.getBoundingClientRect().top;
  window.scrollBy({ top: delta, behavior });
  return true;
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href").slice(1);
    e.preventDefault();
    if (alignScrollTo(id, "smooth")) history.pushState(null, "", "#" + id);
  });
});

// A link to another page's anchor (e.g. "index.html#other-stuff") lands here
// via a normal navigation with the hash already in the URL, so the browser
// does its own instant, un-aligned jump before any of our JS runs. Redo it
// against the nav's real position once the hero/layout has settled — align-
// hero.js dispatches "hero-aligned" once its own adjustments (which shift
// everything below the hero, including these targets) are done.
let hashAligned = false;
function alignToHashOnce() {
  if (hashAligned || !incomingHash) return;
  const id = incomingHash.slice(1);
  if (!alignScrollTo(id, "instant")) return;
  hashAligned = true;
  history.replaceState(null, "", incomingHash);
}
window.addEventListener("hero-aligned", alignToHashOnce);

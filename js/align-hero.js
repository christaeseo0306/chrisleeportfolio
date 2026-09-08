function alignHeroToNav() {
  const hero = document.querySelector(".hero");
  const nav = document.querySelector(".sidebar__nav");
  const projects = document.querySelector(".projects");
  if (!hero || !nav || !projects) return;

  if (!window.matchMedia("(min-width: 901px)").matches) {
    hero.style.marginBottom = "";
    hero.style.lineHeight = "";
    return;
  }

  const prevHeroMargin = hero.style.marginBottom;
  const prevHeroLineHeight = hero.style.lineHeight;
  const prevProjectsTransform = projects.style.transform;
  const prevProjectsTransition = projects.style.transition;

  hero.style.marginBottom = "0px";
  hero.style.lineHeight = "1.3";
  projects.style.transition = "none";
  projects.style.transform = "none";

  // .sidebar__nav is position:fixed, so its rect.top is already viewport-stable
  // and must NOT be adjusted by scrollY (unlike normal-flow elements below).
  const navTop = nav.getBoundingClientRect().top;
  const heroRect = hero.getBoundingClientRect();
  const heroTop = heroRect.top + window.scrollY;
  const availableHeight = navTop - heroTop;
  const naturalHeight = heroRect.height;

  if (naturalHeight > availableHeight && availableHeight > 0) {
    const ratio = availableHeight / naturalHeight;
    const newLineHeight = Math.max(1, 1.3 * ratio);
    hero.style.lineHeight = String(newLineHeight);
  }

  const projectsTop = projects.getBoundingClientRect().top + window.scrollY;
  const delta = navTop - projectsTop;

  projects.style.transform = prevProjectsTransform;
  projects.style.transition = prevProjectsTransition;
  hero.style.marginBottom = prevHeroMargin;
  hero.style.lineHeight = prevHeroLineHeight;

  requestAnimationFrame(() => {
    if (naturalHeight > availableHeight && availableHeight > 0) {
      const ratio = availableHeight / naturalHeight;
      hero.style.lineHeight = String(Math.max(1, 1.3 * ratio));
    }
    hero.style.marginBottom = delta + "px";
  });
}

function alignWhenReady() {
  const run = () => requestAnimationFrame(() => requestAnimationFrame(alignHeroToNav));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run);
  } else {
    run();
  }
}

window.addEventListener("load", alignWhenReady);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(alignWhenReady, 150);
});

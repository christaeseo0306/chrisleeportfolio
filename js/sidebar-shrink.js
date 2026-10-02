(() => {
  let compact = false;
  const check = () => {
    const y = window.scrollY;
    if (!compact && y > 220) {
      compact = true;
      document.body.classList.add("compact");
    } else if (compact && y < 60) {
      compact = false;
      document.body.classList.remove("compact");
    }
  };
  window.addEventListener("scroll", check, { passive: true });
  check();
})();

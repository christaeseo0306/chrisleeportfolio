(() => {
  const KEY = "theme";
  const root = document.documentElement;
  const buttons = document.querySelectorAll(".sidebar__theme");
  if (!buttons.length) return;

  // No stored choice means "follow the OS", which the CSS already does on its
  // own — so the attribute stays off rather than being pinned to a value.
  const stored = () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  };

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => (stored() ? stored() === "dark" : systemDark.matches);

  // The knob position is pure CSS; this only mirrors the state for assistive
  // tech, which can't read it off the stylesheet.
  const sync = () => buttons.forEach((b) => b.setAttribute("aria-checked", String(isDark())));

  sync();

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode: the choice just won't persist */
      }
      root.setAttribute("data-theme", next);
      sync();
    });
  });

  // Follow the OS while the visitor hasn't picked a side themselves.
  systemDark.addEventListener("change", () => {
    if (!stored()) sync();
  });
})();

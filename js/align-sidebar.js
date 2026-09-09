function positionSidebar() {
  const page = document.querySelector(".page");
  const sidebar = document.querySelector(".sidebar");
  if (!page || !sidebar) return;

  if (!window.matchMedia("(min-width: 901px)").matches) {
    sidebar.style.left = "";
    return;
  }

  const pageRect = page.getBoundingClientRect();
  const paddingLeft = parseFloat(getComputedStyle(page).paddingLeft) || 0;
  sidebar.style.left = pageRect.left + paddingLeft + "px";
}

window.addEventListener("load", positionSidebar);

// Window "resize" and a ResizeObserver on the document are complementary:
// some viewport-size changes (e.g. certain DevTools device-toolbar drags)
// only trigger one or the other, so both are wired to the same debounce.
let sidebarResizeTimer;
function scheduleSidebarReposition() {
  clearTimeout(sidebarResizeTimer);
  sidebarResizeTimer = setTimeout(positionSidebar, 100);
}
window.addEventListener("resize", scheduleSidebarReposition);
new ResizeObserver(scheduleSidebarReposition).observe(document.documentElement);

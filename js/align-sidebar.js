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

let sidebarResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(sidebarResizeTimer);
  sidebarResizeTimer = setTimeout(positionSidebar, 100);
});

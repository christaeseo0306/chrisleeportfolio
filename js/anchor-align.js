document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    const nav = document.querySelector(".sidebar__nav");
    if (!target || !nav) return;

    e.preventDefault();
    const delta = target.getBoundingClientRect().top - nav.getBoundingClientRect().top;
    window.scrollBy({ top: delta, behavior: "smooth" });
    history.pushState(null, "", "#" + id);
  });
});

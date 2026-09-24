(function () {
  const root = document.querySelector(".colleague-quotes");
  if (!root) return;

  const viewport = root.querySelector(".colleague-quotes__viewport");
  const track = root.querySelector(".colleague-quotes__track");
  const bar = root.querySelector(".colleague-quotes__bar");
  const prev = root.querySelector(".colleague-quotes__arrow--prev");
  const next = root.querySelector(".colleague-quotes__arrow--next");
  if (!viewport || !track || !bar || !prev || !next) return;

  const mq = window.matchMedia("(max-width: 900px)");
  let index = 0;

  function render() {
    if (mq.matches) return;
    const total = track.children.length;
    const cardWidth = track.children[0] ? track.children[0].getBoundingClientRect().width : 0;
    const visible = cardWidth ? Math.max(1, Math.floor(viewport.clientWidth / cardWidth)) : total;
    const max = Math.max(0, total - visible);
    index = Math.min(Math.max(index, 0), max);
    track.style.transform = `translateX(${-index * cardWidth}px)`;
    const width = Math.min(100, (visible / total) * 100);
    bar.style.width = width + "%";
    bar.style.left = (max ? (index / max) * (100 - width) : 0) + "%";
    prev.disabled = index === 0;
    next.disabled = index === max;
  }

  prev.addEventListener("click", () => {
    index--;
    render();
  });

  next.addEventListener("click", () => {
    index++;
    render();
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      index--;
      render();
    } else if (e.key === "ArrowRight") {
      index++;
      render();
    }
  });

  window.addEventListener("resize", render);
  mq.addEventListener("change", render);
  render();
})();

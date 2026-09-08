const isSmallViewport = () => window.matchMedia("(max-width: 560px)").matches;

document.querySelectorAll(".project__frame video").forEach((video) => {
  const frame = video.closest(".project__frame");

  if (isSmallViewport()) {
    video.play();
  } else {
    video.pause();
  }

  frame.addEventListener("mouseenter", () => {
    if (!isSmallViewport()) video.play();
  });

  frame.addEventListener("mouseleave", () => {
    if (!isSmallViewport()) {
      video.pause();
      video.currentTime = 0;
    }
  });
});

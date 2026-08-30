const spotlightReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const controller = new AbortController();

function setSpotlightPosition(card, event) {
  const bounds = card.getBoundingClientRect();
  card.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
  card.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
}

function enableSpotlights() {
  document.querySelectorAll(".post-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (!spotlightReducedMotion.matches) {
        setSpotlightPosition(card, event);
      }
    }, { signal: controller.signal });

  });
}

enableSpotlights();
window.addEventListener("pagehide", () => controller.abort(), { once: true });

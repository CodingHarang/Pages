const canvas = document.querySelector(".ghost-fibers");
const context = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let animationFrame;
let width = 0;
let height = 0;

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function draw(time = 0) {
  context.clearRect(0, 0, width, height);
  context.lineWidth = 1;

  for (let fiber = 0; fiber < 16; fiber += 1) {
    const offset = fiber * 0.52;
    const startY = height * (0.08 + fiber * 0.06);
    const gradient = context.createLinearGradient(0, startY, width, startY);
    gradient.addColorStop(0, "rgb(194 122 77 / 0)");
    gradient.addColorStop(0.42, "rgb(194 122 77 / 22%)");
    gradient.addColorStop(0.65, "rgb(121 144 113 / 18%)");
    gradient.addColorStop(1, "rgb(121 144 113 / 0)");
    context.strokeStyle = gradient;
    context.beginPath();

    for (let x = -40; x <= width + 40; x += 12) {
      const wave = Math.sin(x * 0.009 + time * 0.00035 + offset) * 22;
      const ripple = Math.sin(x * 0.021 - time * 0.00055 + offset * 2) * 9;
      const y = startY + wave + ripple;

      if (x === -40) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
  }
}

function animate(time) {
  draw(time);
  animationFrame = window.requestAnimationFrame(animate);
}

function updateMotion() {
  window.cancelAnimationFrame(animationFrame);
  draw();

  if (!reducedMotion.matches && !document.hidden) {
    animationFrame = window.requestAnimationFrame(animate);
  }
}

resizeCanvas();
updateMotion();
window.addEventListener("resize", () => {
  resizeCanvas();
  draw();
});
reducedMotion.addEventListener("change", updateMotion);
document.addEventListener("visibilitychange", updateMotion);

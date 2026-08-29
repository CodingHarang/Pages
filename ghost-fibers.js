const defaultOptions = {
  lineColor: "#140E35",
  glowColor: "#3437A0",
  speed: 0.2,
  scale: 2,
  rotation: 0,
  rotationSpeed: 0.25,
  layers: 4,
  waveAmplitude: 0.015,
  waveFrequency: 3,
  waveSpeed: 0.15,
  layerSpeed: 0.08,
  twist: 0.1,
  twistFrequency: 5,
  twistSpeed: 1.2,
  lineFrequency: 5,
  lineSpacing: 2,
  lineSharpness: 16,
  glowFalloff: 10,
  glowIntensity: 1.6,
  brightness: 2,
  blueBoost: 1.25,
  vignette: 0.8,
  grain: 0.05,
  lightMode: false,
  dpr: 1,
  fps: 60,
  paused: false
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    red: Number.parseInt(value.slice(0, 2), 16),
    green: Number.parseInt(value.slice(2, 4), 16),
    blue: Number.parseInt(value.slice(4, 6), 16)
  };
}

function colorWithBrightness(hex, alpha, brightness, blueBoost) {
  const color = hexToRgb(hex);
  return `rgb(${Math.min(255, color.red * brightness)} ${Math.min(255, color.green * brightness)} ${Math.min(255, color.blue * brightness * blueBoost)} / ${alpha})`;
}

class GhostFibers {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.options = { ...defaultOptions, ...options };
    this.animationFrame = 0;
    this.lastFrame = 0;
    this.width = 0;
    this.height = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.min((window.devicePixelRatio || 1) * this.options.dpr, 2);

    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.floor(this.width * pixelRatio);
    this.canvas.height = Math.floor(this.height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.draw(performance.now());
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    this.resize();
    this.updateAnimation();
  }

  draw(time = 0) {
    const { context, width, height, options } = this;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = options.scale;
    const angle = ((options.rotation + time * 0.001 * options.rotationSpeed * 60) * Math.PI) / 180;
    const layerCount = Math.round(options.layers);

    context.clearRect(0, 0, width, height);

    if (this.canvas.dataset.ghostFibersPlayground !== undefined) {
      context.fillStyle = options.lightMode ? "#fff" : "#120f1a";
      context.fillRect(0, 0, width, height);
    }

    context.save();
    context.translate(centerX, centerY);
    context.rotate(angle);
    context.translate(-centerX, -centerY);
    context.globalCompositeOperation = "screen";
    context.shadowBlur = options.glowIntensity * 12;
    context.shadowColor = colorWithBrightness(options.glowColor, 0.4, options.brightness, options.blueBoost);

    for (let layer = 0; layer < layerCount; layer += 1) {
      const fraction = layer / Math.max(1, layerCount - 1);
      const startY = height * (0.14 + fraction * 0.72);
      const phase = time * 0.001 * options.speed;
      const gradient = context.createLinearGradient(0, startY, width, startY);
      const alpha = (0.07 + options.glowIntensity * 0.04) * (1 - layer / (layerCount + 2));

      gradient.addColorStop(0, colorWithBrightness(options.lineColor, 0, options.brightness, options.blueBoost));
      gradient.addColorStop(0.4, colorWithBrightness(options.lineColor, alpha, options.brightness, options.blueBoost));
      gradient.addColorStop(0.65, colorWithBrightness(options.glowColor, alpha, options.brightness, options.blueBoost));
      gradient.addColorStop(1, colorWithBrightness(options.glowColor, 0, options.brightness, options.blueBoost));

      context.strokeStyle = gradient;
      context.lineWidth = Math.max(0.35, 17 - options.lineSharpness);
      context.beginPath();

      for (let x = -40; x <= width + 40; x += 10) {
        const normalizedX = (x - centerX) / Math.max(width, 1);
        const wave = Math.sin(normalizedX * options.waveFrequency * 12 + phase * options.waveSpeed + layer) * options.waveAmplitude * height * 2;
        const twist = Math.sin(normalizedX * options.twistFrequency * 10 + phase * options.twistSpeed + layer) * options.twist * height * 0.28;
        const line = Math.sin(normalizedX * options.lineFrequency * 16 + layer * options.lineSpacing) * height * 0.035;
        const y = startY + (wave + twist + line) / scale;

        if (x === -40) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.stroke();
    }

    context.restore();
    this.drawVignette();
    this.drawGrain(time);
  }

  drawVignette() {
    const { context, width, height, options } = this;
    const vignette = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.15, width / 2, height / 2, Math.max(width, height) * 0.75);

    vignette.addColorStop(0, "rgb(0 0 0 / 0)");
    vignette.addColorStop(1, `rgb(0 0 0 / ${options.vignette * 0.45})`);
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }

  drawGrain(time) {
    const { context, width, height, options } = this;
    const density = Math.floor(options.grain * 500);

    context.fillStyle = options.lightMode ? "rgb(0 0 0 / 8%)" : "rgb(255 255 255 / 8%)";
    for (let index = 0; index < density; index += 1) {
      const x = (index * 137.5 + time * 0.03) % width;
      const y = (index * 83.7 + time * 0.02) % height;
      context.fillRect(x, y, 1, 1);
    }
  }

  animate = (time) => {
    const frameInterval = 1000 / this.options.fps;

    if (time - this.lastFrame >= frameInterval) {
      this.draw(time);
      this.lastFrame = time;
    }
    this.animationFrame = window.requestAnimationFrame(this.animate);
  };

  updateAnimation() {
    window.cancelAnimationFrame(this.animationFrame);
    this.draw(performance.now());

    if (!reducedMotion.matches && !document.hidden && !this.options.paused) {
      this.lastFrame = performance.now();
      this.animationFrame = window.requestAnimationFrame(this.animate);
    }
  }
}

function readFormOptions(form) {
  return Object.fromEntries(
    Object.entries(defaultOptions).map(([name, defaultValue]) => {
      const input = form.elements.namedItem(name);
      const value = input.type === "checkbox" ? input.checked : input.value;
      return [name, typeof defaultValue === "number" ? Number(value) : value];
    })
  );
}

function updateControlValue(input) {
  const output = input.parentElement.querySelector("output");
  if (output) {
    output.value = input.type === "checkbox" ? String(input.checked) : input.value;
    output.textContent = output.value;
  }
}

document.querySelectorAll(".ghost-fibers, [data-ghost-fibers-playground]").forEach((canvas) => {
  const renderer = new GhostFibers(canvas);
  const form = canvas.parentElement.querySelector(".ghost-playground-controls");

  if (form) {
    form.querySelectorAll("input, select").forEach((input) => {
      const output = document.createElement("output");
      input.parentElement.append(output);
      updateControlValue(input);
    });
    form.addEventListener("input", (event) => {
      updateControlValue(event.target);
      renderer.setOptions(readFormOptions(form));
    });
    form.addEventListener("reset", (event) => {
      event.preventDefault();
      Object.entries(defaultOptions).forEach(([name, value]) => {
        const input = form.elements.namedItem(name);
        if (input.type === "checkbox") {
          input.checked = value;
        } else {
          input.value = value;
        }
        updateControlValue(input);
      });
      renderer.setOptions(defaultOptions);
    });
  }

  renderer.updateAnimation();
  window.addEventListener("resize", () => renderer.resize());
  reducedMotion.addEventListener("change", () => renderer.updateAnimation());
  document.addEventListener("visibilitychange", () => renderer.updateAnimation());
});

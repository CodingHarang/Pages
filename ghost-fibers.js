/*
 * GhostFibers WebGL shader port
 * Derived from DavidHDev/react-bits GhostFibers (MIT License).
 *
 * Copyright (c) DavidHDev
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions: The above copyright
 * notice and this permission notice shall be included in all copies or
 * substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
 * WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
 */

const defaultOptions = {
  lineColor: "#140E35", glowColor: "#3437A0", speed: 0.2, scale: 2, rotation: 0,
  rotationSpeed: 0.25, layers: 4, waveAmplitude: 0.015, waveFrequency: 3,
  waveSpeed: 0.15, layerSpeed: 0.08, twist: 0.1, twistFrequency: 5,
  twistSpeed: 1.2, lineFrequency: 5, lineSpacing: 2, lineSharpness: 16,
  glowFalloff: 10, glowIntensity: 1.6, brightness: 2, blueBoost: 1.25,
  vignette: 0.8, grain: 0.05, lightMode: false, dpr: 1, fps: 60, paused: false
};

const vertexShader = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uLayers;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uLayerSpeed;
uniform float uTwist;
uniform float uTwistFrequency;
uniform float uTwistSpeed;
uniform float uLineFrequency;
uniform float uLineSpacing;
uniform float uLineSharpness;
uniform float uGlowFalloff;
uniform float uGlowIntensity;
uniform float uBrightness;
uniform float uBlueBoost;
uniform float uVignette;
uniform float uGrain;
uniform float uRotationSpeed;
uniform float uLightMode;
uniform vec3 uLineColor;
uniform vec3 uGlowColor;
out vec4 fragColor;
#define MAX_LAYERS 10
mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}
float grainHash(vec2 point) {
  point = floor(point);
  float hash = 52.9829189 * fract(dot(point, vec2(0.065, 0.005)));
  return fract(hash);
}
float layeredGrain(vec2 fragmentPixel) {
  vec2 point = mod(fragmentPixel + vec2(uTime * 30.0, -uTime * 21.0), 1024.0);
  vec2 rotated = mat2(0.8, -0.5, 0.5, 0.8) * point;
  float grain = 0.0;
  grain += 0.40 * grainHash(rotated);
  grain += 0.25 * grainHash(rotated * 2.0 + 17.0);
  grain += 0.20 * grainHash(rotated * 4.0 + 47.0);
  grain += 0.10 * grainHash(rotated * 8.0 + 113.0);
  grain += 0.05 * grainHash(rotated * 16.0 + 191.0);
  return grain;
}
void main() {
  vec2 resolution = max(uResolution, vec2(1.0));
  vec2 uv = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;
  float time = uTime * uSpeed;
  vec3 backdrop = mix(vec3(0.070588, 0.058824, 0.090196), vec3(1.0), step(0.5, uLightMode));
  vec3 centerTone = max(uLineColor * 0.85567 - uGlowColor * 0.06186, vec3(0.0));
  vec3 cloudTone = uLineColor * 0.19588 + uGlowColor * 0.2268;
  vec2 p = uv;
  p /= max(uScale, 0.05);
  p = rotate2d(radians(uRotation) + time * uRotationSpeed) * p;
  vec3 color = vec3(0.0);
  float fiberField = 0.0;
  for (int index = 0; index < MAX_LAYERS; index++) {
    float fi = float(index) + 1.0;
    if (fi > uLayers) break;
    p += uWaveAmplitude * sin(p.yx * fi * uWaveFrequency + time * (uWaveSpeed + fi * uLayerSpeed));
    float radius = length(p);
    float polarAngle = atan(p.y, p.x);
    polarAngle += sin(radius * uTwistFrequency - time * uTwistSpeed + fi) * uTwist;
    p = vec2(cos(polarAngle), sin(polarAngle)) * radius;
    float lines = abs(sin(p.x * (uLineFrequency + fi * uLineSpacing) + sin(p.y * 3.0 + time)));
    lines = pow(max(0.0, 1.0 - lines), uLineSharpness);
    fiberField += lines / fi;
    color += uLineColor * lines / fi;
    float glow = exp(-uGlowFalloff * abs(sin(p.x * 3.0 + time + fi)));
    color += uGlowColor * glow * uGlowIntensity / (fi * 2.0);
  }
  float center = exp(-2.2 * dot(uv, uv));
  color += centerTone * center;
  float cloud = exp(-1.5 * length(uv + vec2(sin(time * 0.3) * 0.25, cos(time * 0.25) * 0.18)));
  color += cloudTone * cloud;
  float vignette = 1.0 - smoothstep(0.35, 1.45, length(uv));
  color *= mix(1.0 - uVignette, 1.0, vignette);
  color = 1.0 - exp(-color * uBrightness);
  color.b *= uBlueBoost;
  vec3 outputColor;
  if (uLightMode > 0.5) {
    float edgeFade = mix(1.0 - uVignette, 1.0, vignette);
    float fibers = pow(smoothstep(0.12, 1.05, fiberField) * edgeFade, 1.5);
    float atmosphere = (center * 0.025 + cloud * 0.015) * edgeFade;
    vec3 fiberInk = mix(backdrop, uLineColor, 0.52);
    vec3 airColor = mix(backdrop, uGlowColor, 0.16);
    outputColor = mix(backdrop, airColor, atmosphere);
    outputColor = mix(outputColor, fiberInk, fibers * 0.3);
  } else {
    outputColor = backdrop + color;
  }
  float noise = (layeredGrain(gl_FragCoord.xy) - 0.5) * uGrain;
  outputColor = clamp(outputColor + noise, 0.0, 1.0);
  fragColor = vec4(outputColor, 1.0);
}`;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function hexToRgb(hex) {
  const value = hex.trim().replace(/^#/, "");
  const normalized = value.length === 3 ? value.replace(/./g, (channel) => channel + channel) : value;
  const match = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
  return match ? [Number.parseInt(match[1], 16) / 255, Number.parseInt(match[2], 16) / 255, Number.parseInt(match[3], 16) / 255] : [1, 1, 1];
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

class GhostFibersRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.options = { ...defaultOptions };
    this.frameId = 0;
    this.elapsed = 0;
    this.previousTime = performance.now();
    this.lastRenderTime = 0;
    this.isVisible = true;
    this.isPageVisible = !document.hidden;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: false });
    if (!this.gl) throw new Error("WebGL2 unavailable");

    this.program = this.createProgram();
    this.uniforms = Object.fromEntries([
      "Resolution", "Time", "Speed", "Scale", "Rotation", "RotationSpeed", "Layers",
      "WaveAmplitude", "WaveFrequency", "WaveSpeed", "LayerSpeed", "Twist",
      "TwistFrequency", "TwistSpeed", "LineFrequency", "LineSpacing", "LineSharpness",
      "GlowFalloff", "GlowIntensity", "Brightness", "BlueBoost", "Vignette", "Grain",
      "LightMode", "LineColor", "GlowColor"
    ].map((name) => [name, this.gl.getUniformLocation(this.program, `u${name}`)]));
    this.createTriangle();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.isVisible = entry.isIntersecting;
      this.updateAnimation();
    }, { threshold: 0 });
    this.intersectionObserver.observe(canvas);
    this.handleResize = () => this.resize();
    this.handleVisibility = () => this.setPageVisibility();
    this.handleReducedMotion = () => this.updateAnimation();
    window.addEventListener("resize", this.handleResize);
    document.addEventListener("visibilitychange", this.handleVisibility);
    reducedMotion.addEventListener("change", this.handleReducedMotion);
    this.resize();
    this.setOptions(defaultOptions);
  }

  createProgram() {
    const gl = this.gl;
    const program = gl.createProgram();
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }

  createTriangle() {
    const gl = this.gl;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(this.program, "position");
    gl.useProgram(this.program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  setOptions(options) {
    this.options = { ...this.options, ...options, layers: Math.min(Math.max(Math.round(options.layers ?? this.options.layers), 1), 10), dpr: Math.min(Math.max(options.dpr ?? this.options.dpr, 0.5), 2), fps: Math.min(Math.max(options.fps ?? this.options.fps, 1), 120) };
    const gl = this.gl;
    const uniform = this.uniforms;
    gl.useProgram(this.program);
    gl.uniform1f(uniform.Speed, this.options.speed);
    gl.uniform1f(uniform.Scale, this.options.scale);
    gl.uniform1f(uniform.Rotation, this.options.rotation);
    gl.uniform1f(uniform.RotationSpeed, this.options.rotationSpeed);
    gl.uniform1f(uniform.Layers, this.options.layers);
    gl.uniform1f(uniform.WaveAmplitude, this.options.waveAmplitude);
    gl.uniform1f(uniform.WaveFrequency, this.options.waveFrequency);
    gl.uniform1f(uniform.WaveSpeed, this.options.waveSpeed);
    gl.uniform1f(uniform.LayerSpeed, this.options.layerSpeed);
    gl.uniform1f(uniform.Twist, this.options.twist);
    gl.uniform1f(uniform.TwistFrequency, this.options.twistFrequency);
    gl.uniform1f(uniform.TwistSpeed, this.options.twistSpeed);
    gl.uniform1f(uniform.LineFrequency, this.options.lineFrequency);
    gl.uniform1f(uniform.LineSpacing, this.options.lineSpacing);
    gl.uniform1f(uniform.LineSharpness, this.options.lineSharpness);
    gl.uniform1f(uniform.GlowFalloff, this.options.glowFalloff);
    gl.uniform1f(uniform.GlowIntensity, this.options.glowIntensity);
    gl.uniform1f(uniform.Brightness, this.options.brightness);
    gl.uniform1f(uniform.BlueBoost, this.options.blueBoost);
    gl.uniform1f(uniform.Vignette, this.options.vignette);
    gl.uniform1f(uniform.Grain, this.options.grain);
    gl.uniform1f(uniform.LightMode, this.options.lightMode ? 1 : 0);
    gl.uniform3fv(uniform.LineColor, hexToRgb(this.options.lineColor));
    gl.uniform3fv(uniform.GlowColor, hexToRgb(this.options.glowColor));
    this.resize();
    this.updateAnimation();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(Math.max(this.options.dpr, 0.5), 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uniforms.Resolution, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.render();
  }

  render() {
    this.gl.useProgram(this.program);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  canAnimate() {
    return this.isVisible && this.isPageVisible && !this.options.paused && !reducedMotion.matches;
  }

  loop = (now) => {
    this.frameId = 0;
    if (!this.canAnimate()) return;
    const delta = Math.min((now - this.previousTime) / 1000, 0.1);
    this.previousTime = now;
    this.elapsed += delta;
    if (now - this.lastRenderTime >= 1000 / this.options.fps - 0.5) {
      this.gl.uniform1f(this.uniforms.Time, this.elapsed);
      this.render();
      this.lastRenderTime = now;
    }
    this.frameId = requestAnimationFrame(this.loop);
  };

  updateAnimation() {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.render();
    if (this.canAnimate()) {
      this.previousTime = performance.now();
      this.frameId = requestAnimationFrame(this.loop);
    }
  }

  setPageVisibility() {
    this.isPageVisible = !document.hidden;
    this.updateAnimation();
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    reducedMotion.removeEventListener("change", this.handleReducedMotion);
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

function readFormOptions(form) {
  return Object.fromEntries(Object.entries(defaultOptions).map(([name, defaultValue]) => {
    const input = form.elements.namedItem(name);
    return [name, typeof defaultValue === "number" ? Number(input.value) : input.type === "checkbox" ? input.checked : input.value];
  }));
}

function updateControlValue(input) {
  const output = input.parentElement.querySelector("output");
  if (output) output.textContent = input.type === "checkbox" ? String(input.checked) : input.value;
}

function showWebglError(canvas, message, className) {
  canvas.hidden = true;
  const error = document.createElement("p");
  error.className = className;
  error.textContent = message;
  canvas.parentElement.append(error);
}

function initializeRenderer(canvas, form) {
  let renderer;
  try {
    renderer = new GhostFibersRenderer(canvas);
  } catch {
    showWebglError(canvas, form
      ? "이 브라우저에서는 WebGL 2를 지원하지 않아 Ghost Fibers 미리보기를 표시할 수 없습니다."
      : "WebGL 2를 지원하지 않아 배경 효과를 표시할 수 없습니다.", form ? "playground-render-error" : "site-render-error");
    return;
  }
  renderer.updateAnimation();
  window.addEventListener("pagehide", () => renderer.destroy(), { once: true });

  if (!form) return;

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
      input.type === "checkbox" ? input.checked = value : input.value = value;
      updateControlValue(input);
    });
    renderer.setOptions(defaultOptions);
  });
}

document.querySelectorAll(".ghost-fibers").forEach((canvas) => initializeRenderer(canvas));
document.querySelectorAll("[data-ghost-fibers-playground]").forEach((canvas) => {
  initializeRenderer(canvas, canvas.closest(".ghost-playground").querySelector(".ghost-playground-controls"));
});

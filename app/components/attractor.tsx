"use client";

import { useEffect, useRef, useState } from "react";
import { createLorenzPoints } from "@/app/lib/lorenz";

export function Attractor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playingRef = useRef(true);
  const syncRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const points = createLorenzPoints();
    const count = points.length / 3;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let angle = 0.3;
    let head = 1600;
    let frame = 0;
    let previousTime = 0;
    let visible = true;
    let accent = "";

    const project = (index: number) => {
      const x = points[index * 3];
      const y = points[index * 3 + 1];
      const z = points[index * 3 + 2];
      const depth = x * Math.sin(angle) + y * Math.cos(angle);
      const scale = Math.min(width / 60, height / 54) * 0.88;
      const perspective = 160 / (160 + depth);

      return [
        width / 2 + (x * Math.cos(angle) - y * Math.sin(angle)) * scale * perspective,
        height / 2 - z * scale * perspective,
      ];
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.strokeStyle = accent;
      context.lineWidth = 0.65;

      for (let start = 0; start < count - 1; start += 100) {
        context.beginPath();
        context.globalAlpha = 0.16 + 0.3 * start / count;
        const [firstX, firstY] = project(start);
        context.moveTo(firstX, firstY);
        for (let index = start + 1; index <= Math.min(start + 100, count - 1); index++) {
          const [x, y] = project(index);
          context.lineTo(x, y);
        }
        context.stroke();
      }

      const [x, y] = project(Math.floor(head) % count);
      context.globalAlpha = 1;
      context.fillStyle = accent;
      context.beginPath();
      context.arc(x, y, 2.3, 0, Math.PI * 2);
      context.fill();
    };

    const animate = (time: number) => {
      if (time - previousTime >= 32) {
        const elapsed = Math.min(time - previousTime, 64);
        angle += elapsed * 0.000035;
        head = (head + elapsed * 0.06) % count;
        draw();
        previousTime = time;
      }
      frame = window.requestAnimationFrame(animate);
    };

    const syncAnimation = () => {
      window.cancelAnimationFrame(frame);
      if (playingRef.current && !motion.matches && visible && !document.hidden) {
        previousTime = 0;
        frame = window.requestAnimationFrame(animate);
      } else {
        draw();
      }
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      accent = getComputedStyle(canvas).getPropertyValue("--accent").trim();
      draw();
    };

    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(resize);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    visibilityObserver.observe(canvas);
    motion.addEventListener("change", syncAnimation);
    document.addEventListener("visibilitychange", syncAnimation);
    resize();
    syncAnimation();
    syncRef.current = syncAnimation;

    return () => {
      window.cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      themeObserver.disconnect();
      visibilityObserver.disconnect();
      scheme.removeEventListener("change", resize);
      motion.removeEventListener("change", syncAnimation);
      document.removeEventListener("visibilitychange", syncAnimation);
      syncRef.current = null;
    };
  }, []);

  function toggleAnimation() {
    playingRef.current = !playing;
    setPlaying(!playing);
    syncRef.current?.();
  }

  return (
    <figure className="attractor">
      <canvas ref={canvasRef} aria-hidden="true" />
      <figcaption>
        <span>Lorenz attractor</span>
        <button
          type="button"
          className="figure-toggle"
          onClick={toggleAnimation}
          aria-label={playing ? "Pause animation" : "Play animation"}
        >
          {playing ? "Pause" : "Play"}
        </button>
      </figcaption>
    </figure>
  );
}

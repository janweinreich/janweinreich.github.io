"use client";

import { useEffect, useRef, useState } from "react";
import { createLorenzPoints } from "@/app/lib/lorenz";
import styles from "./attractor-cover.module.css";

const points = createLorenzPoints(4800);
const count = points.length / 3;
const initialView = { yaw: 0.23, tilt: -0.12 };

function project(index: number, width: number, height: number, yaw: number, tilt: number) {
  const x = points[index * 3];
  const y = points[index * 3 + 1];
  const z = points[index * 3 + 2];
  const across = x * Math.cos(yaw) - y * Math.sin(yaw);
  const depth = x * Math.sin(yaw) + y * Math.cos(yaw);
  const vertical = z * Math.cos(tilt) - depth * Math.sin(tilt);
  const perspective = 180 / (180 + depth * Math.cos(tilt) + z * Math.sin(tilt));
  const scale = Math.min(width / 55, height / 53) * 0.9;
  return [width / 2 + across * scale * perspective, height * 0.54 - vertical * scale * perspective];
}

// A server-rendered drawing stays visible before the canvas starts, or without JavaScript.
const preview = Array.from({ length: 2 }, (_, lobe) => {
  let path = "";
  let connected = false;
  for (let index = 0; index < count; index += 3) {
    if ((points[index * 3] >= 0 ? 1 : 0) !== lobe) { connected = false; continue; }
    const [x, y] = project(index, 400, 300, initialView.yaw, initialView.tilt);
    path += `${connected ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    connected = true;
  }
  return path;
});

export function AttractorCover() {
  const figureRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playingRef = useRef(false);
  const syncRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const figure = figureRef.current;
    if (!canvas || !context || !figure) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let yaw = initialView.yaw;
    let tilt = initialView.tilt;
    let head = 1800;
    let frame = 0;
    let previousTime = 0;
    let visible = true;
    let dragging: { id: number; x: number; y: number } | undefined;

    function draw() {
      context!.clearRect(0, 0, width, height);
      context!.lineWidth = 0.7;
      for (let start = 0; start < count - 1; start += 36) {
        const finish = Math.min(start + 36, count - 1);
        const midpoint = Math.floor((start + finish) / 2);
        context!.strokeStyle = points[midpoint * 3] < 0 ? "#d8a383" : "#a4d8c9";
        context!.globalAlpha = 0.23 + 0.5 * start / count;
        context!.beginPath();
        for (let index = start; index <= finish; index++) {
          const [x, y] = project(index, width, height, yaw, tilt);
          if (index === start) context!.moveTo(x, y);
          else context!.lineTo(x, y);
        }
        context!.stroke();
      }

      context!.globalAlpha = 1;
      const [x, y] = project(Math.floor(head) % count, width, height, yaw, tilt);
      context!.fillStyle = "#f8edd6";
      context!.shadowColor = "#f8edd6";
      context!.shadowBlur = 8;
      context!.beginPath();
      context!.arc(x, y, 2, 0, Math.PI * 2);
      context!.fill();
      context!.shadowBlur = 0;
    }

    function animate(time: number) {
      if (time - previousTime >= 32) {
        const elapsed = previousTime ? Math.min(time - previousTime, 64) : 0;
        if (!dragging) yaw += elapsed * 0.000022;
        head = (head + elapsed * 0.045) % count;
        draw();
        previousTime = time;
      }
      frame = window.requestAnimationFrame(animate);
    }

    function syncAnimation() {
      window.cancelAnimationFrame(frame);
      if (playingRef.current && visible && !document.hidden) {
        previousTime = 0;
        frame = window.requestAnimationFrame(animate);
      } else draw();
    }

    function resize() {
      const bounds = canvas!.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
      figure!.dataset.ready = "true";
    }

    function onPointerDown(event: PointerEvent) {
      if (!event.isPrimary || event.button !== 0) return;
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas!.setPointerCapture(event.pointerId);
      figure!.dataset.dragging = "true";
    }
    function onPointerMove(event: PointerEvent) {
      if (!dragging || dragging.id !== event.pointerId) return;
      yaw += (event.clientX - dragging.x) * 0.008;
      tilt = Math.max(-0.9, Math.min(0.9, tilt + (event.clientY - dragging.y) * 0.005));
      dragging.x = event.clientX;
      dragging.y = event.clientY;
      draw();
    }
    function onPointerEnd() {
      dragging = undefined;
      delete figure!.dataset.dragging;
    }
    function onKey(event: KeyboardEvent) {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "ArrowLeft") yaw -= 0.1;
      if (event.key === "ArrowRight") yaw += 0.1;
      if (event.key === "ArrowUp") tilt = Math.min(0.9, tilt + 0.1);
      if (event.key === "ArrowDown") tilt = Math.max(-0.9, tilt - 0.1);
      if (event.key === "Home") { yaw = initialView.yaw; tilt = initialView.tilt; }
      draw();
    }
    function onMotionChange() {
      if (motion.matches) { playingRef.current = false; setPlaying(false); }
      syncAnimation();
    }

    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    visibility.observe(canvas);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerEnd);
    canvas.addEventListener("pointercancel", onPointerEnd);
    canvas.addEventListener("lostpointercapture", onPointerEnd);
    canvas.addEventListener("keydown", onKey);
    motion.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", syncAnimation);
    playingRef.current = !motion.matches;
    setPlaying(playingRef.current);
    resize();
    syncAnimation();
    syncRef.current = syncAnimation;

    return () => {
      window.cancelAnimationFrame(frame);
      sizes.disconnect();
      visibility.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      canvas.removeEventListener("lostpointercapture", onPointerEnd);
      canvas.removeEventListener("keydown", onKey);
      motion.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", syncAnimation);
      syncRef.current = null;
    };
  }, []);

  return (
    <figure className={styles.figure} ref={figureRef}>
      <div className={styles.stage}>
        <span className={styles.figureNumber} aria-hidden="true">Fig. 01</span>
        <span className={styles.parameters} aria-hidden="true">σ 10 · ρ 28 · β 8/3</span>
        <svg className={styles.preview} viewBox="0 0 400 300" aria-hidden="true">
          {preview.map((path, index) => <path key={index} d={path} stroke={index === 0 ? "#d8a383" : "#a4d8c9"} />)}
        </svg>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label="Lorenz attractor. Drag or use the arrow keys to rotate. Press Home to reset the view."
        />
        <span className={styles.dragHint} aria-hidden="true">Drag to rotate</span>
        <span className={styles.axes} aria-hidden="true">x / y / z</span>
      </div>
      <figcaption>
        <span><i aria-hidden="true" />Lorenz attractor</span>
        <button
          type="button"
          aria-label={playing ? "Pause attractor animation" : "Play attractor animation"}
          aria-pressed={playing}
          onClick={() => {
            playingRef.current = !playingRef.current;
            setPlaying(playingRef.current);
            syncRef.current?.();
          }}
        >
          <span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>{playing ? "Pause" : "Play"}
        </button>
      </figcaption>
    </figure>
  );
}

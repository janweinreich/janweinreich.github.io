"use client";

import { useEffect, useRef, useState } from "react";
import { createLorenzPoints, LORENZ_CENTRE, stepLorenz } from "@/app/lib/lorenz";
import styles from "./attractor-cover.module.css";

const points = createLorenzPoints(4800);
const count = points.length / 3;

// Seen across the wings rather than along them, so the curve reads as the familiar butterfly.
const initialView = { yaw: -0.62, tilt: 0.06 };
const SWAY = 0.2; // radians the view drifts either side of where it was left
const SWAY_PERIOD = 44000; // milliseconds

// Two paths start this far apart: under a quarter of a pixel at the size the figure is drawn.
const OFFSET = 0.05;
const TAIL = 150; // steps of each path kept on screen
const STEPS_PER_MS = 0.07;
const PARTED = 1.5; // the distance at which the two paths can be told apart
const APART = 12; // the distance at which they are on unrelated courses
const LINGER = 700; // steps both paths are followed once they are apart
const FADE = 700; // milliseconds

type Point = [number, number, number];

/** Returns a function that writes a point's canvas position and distance from the viewer into `out`. */
function createProjection(yaw: number, tilt: number, scale = 1, originX = 0, originY = 0) {
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);

  return (x: number, y: number, z: number, out: number[]) => {
    const across = x * cosYaw - y * sinYaw;
    const depth = x * sinYaw + y * cosYaw;
    const away = depth * cosTilt + z * sinTilt;
    const perspective = 180 / (180 + away);
    out[0] = originX + across * perspective * scale;
    out[1] = originY - (z * cosTilt - depth * sinTilt) * perspective * scale;
    out[2] = away;
  };
}

// The space the curve needs across the whole sway, so it never drifts out of the stage.
const frame = (() => {
  const spot = [0, 0, 0];
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const yaw of [initialView.yaw - SWAY, initialView.yaw, initialView.yaw + SWAY]) {
    const place = createProjection(yaw, initialView.tilt);
    for (let index = 0; index < count; index++) {
      place(points[index * 3], points[index * 3 + 1], points[index * 3 + 2], spot);
      left = Math.min(left, spot[0]);
      right = Math.max(right, spot[0]);
      top = Math.min(top, spot[1]);
      bottom = Math.max(bottom, spot[1]);
    }
  }
  const margin = 1.1; // the two paths occasionally swing wider than the drawn curve
  return {
    width: (right - left) * margin,
    height: (bottom - top) * margin,
    centreX: (left + right) / 2,
    centreY: (top + bottom) / 2,
  };
})();

function fit(width: number, height: number, yaw: number, tilt: number) {
  const scale = Math.min(width / frame.width, height / frame.height);
  return createProjection(yaw, tilt, scale, width / 2 - frame.centreX * scale, height / 2 - frame.centreY * scale);
}

// A server-rendered drawing stays visible before the canvas starts, or without JavaScript.
const preview = (() => {
  const place = fit(frame.width, frame.height, initialView.yaw, initialView.tilt);
  const spot = [0, 0, 0];
  let path = "";
  for (let index = 0; index < count; index += 3) {
    place(points[index * 3], points[index * 3 + 1], points[index * 3 + 2], spot);
    path += `${index ? "L" : "M"}${spot[0].toFixed(1)},${spot[1].toFixed(1)}`;
  }
  return path;
})();

function distance(a: Point, b: Point) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function pointAt(index: number): Point {
  return [points[index * 3], points[index * 3 + 1], points[index * 3 + 2] + LORENZ_CENTRE];
}

/** Places on the curve from which the two paths can be told apart after three to five seconds. */
function findStarts() {
  const starts: number[] = [];
  for (let index = 0; index < count && starts.length < 8; index += 61) {
    let a = pointAt(index);
    let b: Point = [a[0] + OFFSET, a[1], a[2]];
    for (let step = 1; step <= 340; step++) {
      a = stepLorenz(a);
      b = stepLorenz(b);
      if (distance(a, b) > PARTED) {
        if (step >= 210) starts.push(index);
        break;
      }
    }
  }
  return starts.length ? starts : [0];
}

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
    const starts = findStarts();
    const tails = [new Float32Array(TAIL * 3), new Float32Array(TAIL * 3)];
    const spot = [0, 0, 0];
    let paths: [Point, Point] = [[0, 0, 0], [0, 0, 0]];
    let run = 0;
    let recorded = 0;
    let pending = 0;
    let lingering = -1;
    let fading = 0;
    let width = 0;
    let height = 0;
    let yaw = initialView.yaw;
    let tilt = initialView.tilt;
    let swayTime = 0;
    let frameRequest = 0;
    let previousTime = 0;
    let visible = true;
    let curveColour = "";
    let paperColour = "";
    let pathColours = ["", ""];
    let dragging: { id: number; x: number; y: number } | undefined;

    function record() {
      const slot = (recorded % TAIL) * 3;
      paths.forEach((path, index) => {
        tails[index][slot] = path[0];
        tails[index][slot + 1] = path[1];
        tails[index][slot + 2] = path[2] - LORENZ_CENTRE;
      });
      recorded++;
    }

    function restart() {
      const first = pointAt(starts[run++ % starts.length]);
      paths = [first, [first[0] + OFFSET, first[1], first[2]]];
      recorded = 0;
      lingering = -1;
      fading = 0;
      record();
    }

    function advance() {
      paths = [stepLorenz(paths[0]), stepLorenz(paths[1])];
      record();
      if (lingering < 0 && distance(paths[0], paths[1]) > APART) lingering = LINGER;
      else if (lingering > 0) lingering--;
    }

    function draw() {
      const place = fit(width, height, yaw + SWAY * Math.sin(swayTime * 2 * Math.PI / SWAY_PERIOD), tilt);
      context!.clearRect(0, 0, width, height);
      context!.lineJoin = "round";

      // The attractor itself: nearer strands are drawn darker.
      context!.lineWidth = 0.7;
      context!.strokeStyle = curveColour;
      for (let start = 0; start < count - 1; start += 36) {
        const finish = Math.min(start + 36, count - 1);
        let away = 0;
        context!.beginPath();
        for (let index = start; index <= finish; index++) {
          place(points[index * 3], points[index * 3 + 1], points[index * 3 + 2], spot);
          if (index === start) context!.moveTo(spot[0], spot[1]);
          else context!.lineTo(spot[0], spot[1]);
          away += spot[2];
        }
        const nearness = Math.max(0, Math.min(1, 0.5 - away / (finish - start + 1) / 56));
        context!.globalAlpha = 0.16 + 0.44 * nearness;
        context!.stroke();
      }

      // The two paths, each trailing where it has just been.
      const length = Math.min(recorded, TAIL);
      const oldest = recorded - length;
      const strength = 1 - fading / FADE;
      tails.forEach((tail, path) => {
        context!.strokeStyle = pathColours[path];
        context!.lineWidth = 1.6;
        for (let start = 0; start < length - 1; start += 10) {
          const finish = Math.min(start + 10, length - 1);
          const freshness = 1 - (length - 1 - finish) / TAIL;
          context!.globalAlpha = strength * (0.06 + 0.94 * freshness ** 1.4);
          context!.beginPath();
          for (let index = start; index <= finish; index++) {
            const slot = ((oldest + index) % TAIL) * 3;
            place(tail[slot], tail[slot + 1], tail[slot + 2], spot);
            if (index === start) context!.moveTo(spot[0], spot[1]);
            else context!.lineTo(spot[0], spot[1]);
          }
          context!.stroke();
        }
      });
      tails.forEach((tail, path) => {
        const slot = ((recorded - 1) % TAIL) * 3;
        place(tail[slot], tail[slot + 1], tail[slot + 2], spot);
        context!.globalAlpha = strength;
        context!.fillStyle = pathColours[path];
        context!.strokeStyle = paperColour;
        context!.lineWidth = 1.5;
        context!.beginPath();
        context!.arc(spot[0], spot[1], 3.2, 0, Math.PI * 2);
        context!.fill();
        context!.stroke();
      });
      context!.globalAlpha = 1;
    }

    function animate(time: number) {
      const elapsed = previousTime ? Math.min(time - previousTime, 64) : 0;
      previousTime = time;
      if (!dragging) swayTime += elapsed;
      pending += elapsed * STEPS_PER_MS;
      for (; pending >= 1; pending--) advance();
      if (lingering === 0) {
        fading += elapsed;
        if (fading >= FADE) restart();
      }
      draw();
      frameRequest = window.requestAnimationFrame(animate);
    }

    function syncAnimation() {
      window.cancelAnimationFrame(frameRequest);
      if (playingRef.current && visible && !document.hidden) {
        previousTime = 0;
        frameRequest = window.requestAnimationFrame(animate);
      } else draw();
    }

    function resize() {
      const colours = getComputedStyle(figure!);
      curveColour = colours.getPropertyValue("--muted").trim();
      paperColour = colours.getPropertyValue("--paper").trim();
      pathColours = [colours.getPropertyValue("--plot-a").trim(), colours.getPropertyValue("--plot-b").trim()];
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
      if (event.key === "Home") { yaw = initialView.yaw; tilt = initialView.tilt; swayTime = 0; }
      draw();
    }
    function onMotionChange() {
      if (motion.matches) { playingRef.current = false; setPlaying(false); }
      syncAnimation();
    }

    restart();
    // Without motion the figure shows the outcome instead: the two paths on separate wings.
    if (motion.matches) {
      const settled = () => lingering > 0 && lingering <= LINGER - TAIL && paths[0][0] * paths[1][0] < -25;
      for (let step = 0; step < 4000 && !settled(); step++) advance();
    }

    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    const themes = new MutationObserver(resize);
    themes.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
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
      window.cancelAnimationFrame(frameRequest);
      sizes.disconnect();
      themes.disconnect();
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
        <svg
          className={styles.preview}
          viewBox={`0 0 ${frame.width.toFixed(1)} ${frame.height.toFixed(1)}`}
          aria-hidden="true"
        >
          <path d={preview} />
        </svg>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label="Lorenz attractor, with two paths that start almost together and end up on separate courses. Drag or use the arrow keys to rotate. Press Home to reset the view."
        />
        <span className={styles.parameters} aria-hidden="true">σ 10 · ρ 28 · β 8/3</span>
        <span className={styles.dragHint} aria-hidden="true">Drag to rotate</span>
      </div>
      <figcaption>
        <p><span>Lorenz attractor.</span> Two paths that start less than a pixel apart.</p>
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

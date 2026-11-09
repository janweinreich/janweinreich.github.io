"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "../home.module.css";

function enhanceHomepage(root: HTMLDivElement) {
  const seen = new WeakSet<HTMLElement>();
  const animations = new Set<Animation>();
  const pending = new Set<HTMLElement>();
  const progressBar = root.querySelector<HTMLElement>("[data-scroll-progress]");
  const images = [...root.querySelectorAll<HTMLElement>("[data-scroll-image]")];
  const visibleImages = new Set<HTMLElement>();
  const desktop = window.matchMedia("(min-width: 800px) and (pointer: fine)");
  let frame = 0;

  const reveals = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const target = entry.target as HTMLElement;
      reveals.unobserve(target);
      pending.delete(target);
      if (target.matches(":focus-within")) continue;

      // No hidden CSS state: content stays readable if JavaScript stops or is disabled.
      const animation = target.animate(
        [
          { opacity: 0, transform: "translate3d(0, 24px, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        {
          duration: 720,
          delay: Number(target.dataset.scrollDelay || 0),
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "backwards",
        },
      );
      animations.add(animation);
      animation.addEventListener("finish", () => animations.delete(animation), { once: true });
    }
  }, { rootMargin: "0px 0px 48px 0px", threshold: 0.01 });

  function observeReveals() {
    for (const target of pending) {
      if (!root.contains(target)) {
        reveals.unobserve(target);
        pending.delete(target);
      }
    }
    for (const target of root.querySelectorAll<HTMLElement>("[data-scroll-reveal]")) {
      if (seen.has(target)) continue;
      seen.add(target);
      // Hydration, restored scroll positions, and filter changes never hide visible text.
      if (target.getBoundingClientRect().top >= window.innerHeight) {
        pending.add(target);
        reveals.observe(target);
      }
    }
  }

  function update() {
    frame = 0;
    const height = window.innerHeight;
    const distance = Math.max(1, document.documentElement.scrollHeight - height);
    const progress = Math.max(0, Math.min(1, window.scrollY / distance));
    const offsets: [HTMLElement, number][] = [];
    for (const image of visibleImages) {
      const bounds = image.getBoundingClientRect();
      const position = (height / 2 - bounds.top - bounds.height / 2) / (height + bounds.height);
      const drift = desktop.matches ? Math.max(-8, Math.min(8, position * 28)) : 0;
      offsets.push([image, drift]);
    }
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    offsets.forEach(([image, drift]) => image.style.setProperty("--image-drift", `${drift.toFixed(2)}px`));
  }

  function requestUpdate() {
    if (!frame && !document.hidden) frame = window.requestAnimationFrame(update);
  }

  const imageObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleImages.add(entry.target as HTMLElement);
      else visibleImages.delete(entry.target as HTMLElement);
    }
    requestUpdate();
  }, { rootMargin: "100px" });

  function cancelReveals() {
    for (const animation of animations) animation.cancel();
    animations.clear();
  }

  // Subject filters can insert new article rows after the first render.
  const mutations = new MutationObserver(observeReveals);
  const sizes = new ResizeObserver(requestUpdate);
  observeReveals();
  images.forEach((image) => imageObserver.observe(image));
  mutations.observe(root, { childList: true, subtree: true });
  sizes.observe(document.documentElement);
  root.addEventListener("focusin", cancelReveals);
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  document.addEventListener("visibilitychange", requestUpdate);
  root.dataset.motion = "ready";
  requestUpdate();

  return () => {
    window.cancelAnimationFrame(frame);
    reveals.disconnect();
    imageObserver.disconnect();
    mutations.disconnect();
    sizes.disconnect();
    cancelReveals();
    root.removeEventListener("focusin", cancelReveals);
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", requestUpdate);
    document.removeEventListener("visibilitychange", requestUpdate);
    images.forEach((image) => image.style.removeProperty("--image-drift"));
    progressBar?.style.removeProperty("transform");
    delete root.dataset.motion;
  };
}

export function HomeMotion({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || !window.IntersectionObserver || !window.ResizeObserver || !element.animate) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup: (() => void) | undefined;

    function syncMotion() {
      cleanup?.();
      cleanup = preference.matches ? undefined : enhanceHomepage(element!);
    }

    syncMotion();
    preference.addEventListener("change", syncMotion);
    return () => {
      cleanup?.();
      preference.removeEventListener("change", syncMotion);
    };
  }, []);

  return (
    <div className={className} ref={root}>
      <div className={styles.scrollProgress} aria-hidden="true"><span data-scroll-progress /></div>
      {children}
    </div>
  );
}

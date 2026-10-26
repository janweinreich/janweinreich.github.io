"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", onChange);
  window.addEventListener("blog-theme-change", onChange);
  return () => {
    scheme.removeEventListener("change", onChange);
    window.removeEventListener("blog-theme-change", onChange);
  };
}

function getTheme() {
  const saved = document.documentElement.dataset.theme;
  return saved === "light" || saved === "dark"
    ? saved
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);

  function toggleTheme() {
    const next = (theme ?? getTheme()) === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event("blog-theme-change"));
    try {
      localStorage.setItem("blog-theme", next);
    } catch {
      // Theme selection still works when storage is unavailable.
    }
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={theme ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Switch colour theme"}
    >
      <span aria-hidden="true">◐</span>
    </button>
  );
}

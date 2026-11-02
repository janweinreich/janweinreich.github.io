"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("blog-theme-change", onChange);
  return () => {
    window.removeEventListener("blog-theme-change", onChange);
  };
}

function getTheme() {
  const saved = document.documentElement.dataset.theme;
  return saved === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");

  function toggleTheme() {
    const next = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#101418" : "#ffffff");
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
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <span aria-hidden="true">◐</span>
    </button>
  );
}

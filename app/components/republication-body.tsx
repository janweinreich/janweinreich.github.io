"use client";

import { useEffect, useRef, useState } from "react";

export function RepublicationBody({ html }: { html: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const root = contentRef.current?.querySelector<HTMLElement>("[data-molecular-viewer]");
    if (!root) return;
    let disposed = false;
    let unmount: (() => void) | undefined;
    void import("@/app/lib/molecular-viewer").then(({ mountMolecularViewer }) => {
      if (!disposed) unmount = mountMolecularViewer(root);
    }).catch(() => {
      if (disposed) return;
      root.dataset.viewerState = "fallback";
      const status = root.querySelector<HTMLElement>("[data-viewer-status]");
      if (status) status.textContent = "The 3D viewer could not load. The image shows the top hit, B2S0219.";
    });
    return () => { disposed = true; unmount?.(); };
  }, [html]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    let active = true;
    let statusTimer: ReturnType<typeof setTimeout> | undefined;

    function announce(message: string) {
      if (!active) return;
      setCopyStatus(message);
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => setCopyStatus(""), 5000);
    }

    async function copySmiles(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button[data-smiles]");
      if (!button || !content?.contains(button)) return;
      const smiles = button.dataset.smiles;
      if (!smiles) return;
      const name = button.querySelector(".mol2d-name")?.textContent ?? "compound";
      try {
        await navigator.clipboard.writeText(smiles);
        announce(`Copied SMILES for ${name}.`);
      } catch {
        announce("Copy is unavailable in this browser. You can use the original article on ChemBricks.");
      }
    }

    content.addEventListener("click", copySmiles);
    return () => {
      active = false;
      clearTimeout(statusTimer);
      content.removeEventListener("click", copySmiles);
    };
  }, []);

  return (
    <>
      <div
        ref={contentRef}
        className="republication-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <p className="copy-status" role="status">{copyStatus}</p>
    </>
  );
}

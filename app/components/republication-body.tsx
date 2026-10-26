"use client";

import { useEffect, useRef, useState } from "react";

export function RepublicationBody({ html }: { html: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState("");

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

"use client";

import { useState } from "react";

const EXPLORER_URL = "https://zippy-olive-d8oxuxy.vercel.app/";

export function ExplorerPreview() {
  const [live, setLive] = useState(false);

  return (
    <figure className="explorer-preview">
      <div className="explorer-stage">
        {live ? (
          <iframe
            title="CystiNers explorer, live"
            src={EXPLORER_URL}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <img
            src="/writing/cysteine-pocket/dashboard.png"
            alt="The CystiNers explorer open on a cysteine, with the folded protein and the extracted 10 angstrom pocket side by side."
            width={1280}
            height={800}
          />
        )}
        <div className="explorer-actions">
          {live ? (
            <button type="button" onClick={() => setLive(false)}>
              Show screenshot
            </button>
          ) : (
            <button type="button" onClick={() => setLive(true)}>
              Live preview
            </button>
          )}
          <a href={EXPLORER_URL} target="_blank" rel="noreferrer">
            Open in full <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <figcaption>
        The explorer is the live calculation. The header count moves as new
        sites finish. The model numbers later in this article come from a
        frozen snapshot of 8,222 sites, so they will not match that count.
      </figcaption>
    </figure>
  );
}

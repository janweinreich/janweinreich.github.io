type Selection = Record<string, unknown>;
type Style = Record<string, unknown>;

type Viewer = {
  setStyle(selection: Selection, style: Style): void;
  addStyle(selection: Selection, style: Style): void;
  zoomTo(selection: Selection): void;
  zoom(factor: number): void;
  render(): void;
  spin(enabled: boolean): void;
  resize(): void;
  setBackgroundColor(color: string): void;
  removeAllModels(): void;
  addModel(data: string, format: string): void;
  clear(): void;
};

type Library = { createViewer(element: HTMLElement, options: { backgroundColor: string }): Viewer };
type ViewerWindow = Window & { $3Dmol?: Library; "3Dmol"?: Library };
let libraryPromise: Promise<Library> | undefined;

function loadLibrary() {
  const scope = window as ViewerWindow;
  const available = scope.$3Dmol ?? scope["3Dmol"];
  if (available) return Promise.resolve(available);
  if (libraryPromise) return libraryPromise;

  libraryPromise = new Promise<Library>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/vendor/3dmol/3Dmol-min.js";
    script.async = true;
    const timeout = setTimeout(() => failed(), 15000);
    function failed() {
      clearTimeout(timeout);
      script.remove();
      reject(new Error("The 3D viewer library could not be loaded."));
    }
    script.addEventListener("error", failed, { once: true });
    script.addEventListener("load", () => {
      clearTimeout(timeout);
      const library = scope.$3Dmol ?? scope["3Dmol"];
      if (library) resolve(library);
      else failed();
    }, { once: true });
    document.head.appendChild(script);
  }).catch(error => {
    libraryPromise = undefined;
    throw error;
  });
  return libraryPromise;
}

// Uses the original ChemBricks models, chain colours, pocket selection, and zoom.
export function mountMolecularViewer(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("[data-viewer-stage]");
  const select = root.querySelector<HTMLSelectElement>("[data-viewer-compound]");
  const status = root.querySelector<HTMLElement>("[data-viewer-status]");
  const hint = root.querySelector<HTMLElement>("[data-viewer-hint]");
  const retry = root.querySelector<HTMLButtonElement>("[data-viewer-retry]");
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-viewer-toggle]")];
  if (!stage || !select || !status || !retry) return () => {};

  const allowed = new Set([...select.options].map(option => option.value));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const state = { pocket: true, closeup: true, spin: !motion.matches };
  let viewer: Viewer | undefined;
  let disposed = false;
  let visible = true;
  let request: AbortController | undefined;
  let requestNumber = 0;
  const modelCache = new Map<string, string>();

  const background = () => getComputedStyle(root).getPropertyValue("--paper-raised").trim() || "white";
  const setControls = (enabled: boolean) => {
    select.disabled = !enabled;
    buttons.forEach(button => { button.disabled = !enabled; });
  };
  const syncButtons = () => {
    buttons.forEach(button => {
      const key = button.dataset.viewerToggle as keyof typeof state;
      if (key in state) button.setAttribute("aria-pressed", String(state[key]));
    });
  };
  const syncSpin = () => {
    viewer?.spin(state.spin && visible && !document.hidden && root.dataset.viewerState === "ready");
  };

  function fallback(message: string) {
    if (disposed) return;
    viewer?.spin(false);
    root.dataset.viewerState = "fallback";
    status!.textContent = message + " The image shows the top hit, B2S0219.";
    setControls(false);
    retry!.hidden = false;
  }

  function applyStyle() {
    if (!viewer) return;
    viewer.setStyle({}, {});
    viewer.setStyle({ chain: "A" }, { cartoon: { color: "#a9c7e8" } });
    viewer.setStyle({ chain: "B" }, { cartoon: { color: "#b7d9a5" } });
    viewer.setStyle({ chain: "L" }, { stick: { colorscheme: "orangeCarbon", radius: 0.3 } });
    if (state.pocket) {
      viewer.addStyle(
        { and: [{ within: { distance: 5, sel: { chain: "L" }, byres: true } }, { not: { chain: "L" } }] },
        { stick: { color: "#c9c9c9", radius: 0.15 } },
      );
    }
  }

  function applyView() {
    if (!viewer) return;
    viewer.zoomTo(state.closeup ? { chain: "L" } : {});
    if (state.closeup) viewer.zoom(0.8);
    viewer.render();
  }

  async function loadCompound() {
    if (!viewer || disposed) return;
    const id = select!.value;
    if (!allowed.has(id)) return;
    request?.abort();
    request = new AbortController();
    const number = ++requestNumber;
    root.dataset.viewerState = "loading";
    status!.textContent = "Loading 3D structure...";
    retry!.hidden = true;
    setControls(false);
    syncSpin();
    try {
      let pdb = modelCache.get(id);
      if (!pdb) {
        const response = await fetch(
          "/republished/chembricks/media/blog/after-ebolathon-bdbv-gp-screen/structures/" + id + ".pdb",
          { signal: request.signal },
        );
        if (!response.ok) throw new Error("Structure request failed.");
        pdb = await response.text();
        if (!/^(ATOM  |HETATM)/m.test(pdb)) throw new Error("Invalid structure file.");
        modelCache.set(id, pdb);
      }
      if (disposed || number !== requestNumber) return;
      viewer.removeAllModels();
      viewer.addModel(pdb, "pdb");
      applyStyle();
      applyView();
      root.dataset.viewerState = "ready";
      status!.textContent = "";
      setControls(true);
      syncSpin();
    } catch {
      if (!disposed && number === requestNumber) fallback("The selected structure could not be loaded. Please retry.");
    }
  }

  async function initialize() {
    root.dataset.viewerState = "loading";
    status!.textContent = "Loading interactive 3D viewer...";
    retry!.hidden = true;
    try {
      const library = await loadLibrary();
      if (disposed) return;
      if (!viewer) {
        stage!.querySelectorAll("canvas").forEach(canvas => canvas.remove());
        viewer = library.createViewer(stage!, { backgroundColor: background() });
      }
      await loadCompound();
    } catch {
      fallback("The interactive viewer could not start. Check that WebGL is enabled, then retry.");
    }
  }

  const onSelect = () => { void loadCompound(); };
  const onRetry = () => { void initialize(); };
  const onPointer = () => { if (hint) hint.hidden = true; };
  const onToggle = (event: Event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const key = button.dataset.viewerToggle as keyof typeof state;
    if (!(key in state)) return;
    state[key] = !state[key];
    syncButtons();
    if (key === "pocket") { applyStyle(); viewer?.render(); }
    if (key === "closeup") applyView();
    if (key === "spin") syncSpin();
  };
  const onMotion = () => { state.spin = !motion.matches; syncButtons(); syncSpin(); };
  const onTheme = () => { viewer?.setBackgroundColor(background()); viewer?.render(); };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    requestNumber++;
    request?.abort();
    viewer?.spin(false);
    viewer = undefined;
    stage!.querySelectorAll("canvas").forEach(canvas => canvas.remove());
    fallback("The graphics context was interrupted. Please retry the interactive viewer.");
  };

  const sizes = new ResizeObserver(() => { viewer?.resize(); viewer?.render(); });
  sizes.observe(stage);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncSpin(); });
  visibility.observe(stage);
  const themes = new MutationObserver(onTheme);
  themes.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  select.addEventListener("change", onSelect);
  retry.addEventListener("click", onRetry);
  stage.addEventListener("pointerdown", onPointer, { once: true });
  stage.addEventListener("webglcontextlost", onContextLost, true);
  buttons.forEach(button => button.addEventListener("click", onToggle));
  motion.addEventListener("change", onMotion);
  scheme.addEventListener("change", onTheme);
  document.addEventListener("visibilitychange", syncSpin);
  setControls(false);
  syncButtons();
  void initialize();

  return () => {
    disposed = true;
    requestNumber++;
    request?.abort();
    viewer?.spin(false);
    viewer?.clear();
    stage.querySelectorAll("canvas").forEach(canvas => canvas.remove());
    sizes.disconnect();
    visibility.disconnect();
    themes.disconnect();
    select.removeEventListener("change", onSelect);
    retry.removeEventListener("click", onRetry);
    stage.removeEventListener("pointerdown", onPointer);
    stage.removeEventListener("webglcontextlost", onContextLost, true);
    buttons.forEach(button => button.removeEventListener("click", onToggle));
    motion.removeEventListener("change", onMotion);
    scheme.removeEventListener("change", onTheme);
    document.removeEventListener("visibilitychange", syncSpin);
  };
}

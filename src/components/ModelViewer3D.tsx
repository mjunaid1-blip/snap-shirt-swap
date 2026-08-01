import { useEffect, useRef, useState } from "react";

// Fast pass: 4 cardinal angles render first so the turntable is usable quickly.
// Refine pass: the in-between angles fill in afterwards for a smoother spin.
const FAST_ANGLES = [0, 90, 180, 270];
const REFINE_ANGLES = [45, 135, 225, 315];
const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

type Frames = Record<number, string>;

/**
 * Builds a rotatable 3D character turntable of the person wearing the shirt:
 * each frame is an AI-rendered camera angle of the same subject, and dragging
 * spins the model through the full 360 degrees.
 */
export function ModelViewer3D({ src, alt }: { src: string; alt: string }) {
  const [frames, setFrames] = useState<Frames>({ 0: src });
  const [index, setIndex] = useState(0);
  const [building, setBuilding] = useState(true);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spin, setSpin] = useState(false);
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; index: number } | null>(null);

  // Generate the missing camera angles for this subject.
  useEffect(() => {
    let cancelled = false;
    setFrames({ 0: src });
    setIndex(0);
    setBuilding(true);
    setRefining(false);
    setError(null);

    const renderAngle = async (angle: number) => {
      try {
        const res = await fetch("/api/turnaround", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: src, angle }),
        });
        const data = (await res.json().catch(() => null)) as
          | { image?: string; error?: string }
          | null;
        if (!res.ok || !data?.image) return { angle, error: data?.error ?? "Frame failed" };
        if (!cancelled) setFrames((f) => ({ ...f, [angle]: data.image as string }));
        return { angle };
      } catch {
        return { angle, error: "Network error" };
      }
    };

    (async () => {
      const results = await Promise.all(FAST_ANGLES.slice(1).map(renderAngle));
      if (cancelled) return;
      const failed = results.filter((r) => r.error);
      if (failed.length === FAST_ANGLES.length - 1) {
        setError(failed[0]?.error ?? "Could not build the 3D model.");
      } else if (failed.length) {
        setError(`${failed.length} angle${failed.length > 1 ? "s" : ""} could not be rendered.`);
      }
      setBuilding(false);
      setSpin(true);

      // Smooth it out in the background — the model is already interactive.
      setRefining(true);
      await Promise.all(REFINE_ANGLES.map(renderAngle));
      if (!cancelled) setRefining(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  // Auto rotation.
  useEffect(() => {
    if (!spin) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % ANGLES.length), 220);
    return () => clearInterval(id);
  }, [spin]);


  useEffect(() => {
    const move = (clientX: number) => {
      const start = drag.current;
      if (!start) return;
      const step = Math.round((clientX - start.x) / 28);
      setIndex(((start.index + step) % ANGLES.length + ANGLES.length) % ANGLES.length);
    };
    const onMouse = (e: MouseEvent) => move(e.clientX);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) move(t.clientX);
    };
    const stop = () => (drag.current = null);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  const ready = FAST_ANGLES.filter((a) => frames[a]).length;
  const currentAngle = ANGLES[index] ?? 0;
  // Fall back to the nearest rendered frame while others are still generating.
  const shown =
    frames[currentAngle] ??
    [...ANGLES]
      .sort((a, b) => {
        const d = (x: number) => Math.min(Math.abs(x - currentAngle), 360 - Math.abs(x - currentAngle));
        return d(a) - d(b);
      })
      .map((a) => frames[a])
      .find(Boolean) ??
    src;


  return (
    <div className="relative h-full w-full">
      <div
        onMouseDown={(e) => {
          setSpin(false);
          drag.current = { x: e.clientX, index };
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (!t) return;
          setSpin(false);
          drag.current = { x: t.clientX, index };
        }}
        className="flex h-full w-full cursor-grab items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,var(--color-card),var(--color-background))] select-none active:cursor-grabbing"
        role="img"
        aria-label={`${alt} as a rotatable 3D model, viewed at ${currentAngle} degrees`}
      >
        <img
          src={shown}
          alt={alt}
          draggable={false}
          className="h-full w-full object-contain transition-transform duration-150"
          style={{ transform: `scale(${zoom})` }}
        />
        {/* floor shadow to sell the 3D stage */}
        <div className="pointer-events-none absolute bottom-[8%] left-1/2 h-6 w-2/5 -translate-x-1/2 rounded-[100%] bg-black/60 blur-xl" />
      </div>

      {building && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Building your 3D model…</p>
          <p className="text-xs text-primary">
            {ready} / {ANGLES.length} angles rendered
          </p>
        </div>
      )}

      {error && !building && (
        <p className="absolute inset-x-0 top-0 z-10 bg-destructive/15 px-3 py-2 text-center text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
        <button
          onClick={() => setSpin((s) => !s)}
          disabled={building}
          className="rounded-full border border-primary/40 bg-black/50 px-3 py-1 text-xs text-primary backdrop-blur-sm transition-colors hover:bg-primary/15 disabled:opacity-40"
        >
          {spin ? "Pause spin" : "Auto-spin"}
        </button>
        <input
          aria-label="Rotate model"
          type="range"
          min={0}
          max={ANGLES.length - 1}
          step={1}
          value={index}
          onChange={(e) => {
            setSpin(false);
            setIndex(Number(e.target.value));
          }}
          className="h-1 flex-1 accent-[var(--color-primary)]"
        />
        <input
          aria-label="Zoom"
          type="range"
          min={0.8}
          max={1.8}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1 w-20 accent-[var(--color-primary)]"
        />
      </div>
    </div>
  );
}

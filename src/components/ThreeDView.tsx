import { useEffect, useRef, useState } from "react";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Presents the generated preview as an interactive 3D card:
 * drag (or move the pointer) to rotate it in space, with a
 * parallax depth layer and a gold rim light.
 */
export function ThreeDView({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!autoSpin || dragging) return;
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.008;
      setRot({ x: Math.sin(t * 0.7) * 6, y: Math.sin(t) * 18 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSpin, dragging]);

  const track = (clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (clientX - rect.left) / rect.width - 0.5;
    const py = (clientY - rect.top) / rect.height - 0.5;
    setRot({ x: clamp(-py * 40, -24, 24), y: clamp(px * 60, -34, 34) });
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => track(e.clientX, e.clientY);
    const touch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) track(t.clientX, t.clientY);
    };
    const stop = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", touch, { passive: true });
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", touch);
      window.removeEventListener("touchend", stop);
    };
  }, [dragging]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={ref}
        onMouseDown={(e) => {
          setAutoSpin(false);
          setDragging(true);
          track(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (!t) return;
          setAutoSpin(false);
          setDragging(true);
          track(t.clientX, t.clientY);
        }}
        className="flex h-full w-full cursor-grab items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,var(--color-card),var(--color-background))] select-none active:cursor-grabbing"
        style={{ perspective: "1100px" }}
        role="img"
        aria-label={`${alt} shown in an interactive 3D view`}
      >
        <div
          className="relative h-[86%] w-[76%]"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${zoom})`,
            transition: dragging ? "none" : "transform 0.25s ease-out",
          }}
        >
          {/* depth backdrop */}
          <div
            className="absolute inset-0 rounded-xl bg-primary/15 blur-xl"
            style={{ transform: "translateZ(-60px) scale(1.05)" }}
          />
          {/* the image plane */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="absolute inset-0 h-full w-full rounded-xl border border-primary/30 object-cover shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]"
          />
          {/* gold rim light / sheen */}
          <div
            className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-primary/10 to-primary/25 mix-blend-screen"
            style={{ transform: "translateZ(24px)" }}
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
        <button
          onClick={() => setAutoSpin((s) => !s)}
          className="rounded-full border border-primary/40 bg-black/50 px-3 py-1 text-xs text-primary backdrop-blur-sm transition-colors hover:bg-primary/15"
        >
          {autoSpin ? "Pause spin" : "Auto-spin"}
        </button>
        <input
          aria-label="Zoom"
          type="range"
          min={0.8}
          max={1.6}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1 w-28 accent-[var(--color-primary)]"
        />
        <button
          onClick={() => {
            setAutoSpin(false);
            setRot({ x: 0, y: 0 });
            setZoom(1);
          }}
          className="rounded-full border border-border bg-black/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

import { useRef, useState, useCallback, useEffect } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const handleSize = 28;

export function BeforeAfterSlider({
  before,
  after,
  beforeAlt = "Before",
  afterAlt = "After",
}: {
  before: string;
  after: string;
  beforeAlt?: string;
  afterAlt?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setPosition(clamp(pct, 0, 100));
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    updatePosition(touch.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => updatePosition(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      updatePosition(touch.clientX);
    };
    const stop = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", stop);
    window.addEventListener("touchcancel", stop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stop);
      window.removeEventListener("touchcancel", stop);
    };
  }, [isDragging, updatePosition]);

  return (
    <div
      ref={containerRef}
      className="group relative aspect-[3/4] w-full cursor-ew-resize overflow-hidden rounded-2xl border border-border bg-card select-none"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      role="slider"
      aria-label="Before and after comparison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
    >
      {/* After image fills the frame */}
      <img
        src={after}
        alt={afterAlt}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Before image clipped to the left side */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden border-r border-white/20"
        style={{ width: `${position}%` }}
      >
        <img
          src={before}
          alt={beforeAlt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: `${100 / (position / 100 || 1)}%` }}
          draggable={false}
        />
      </div>

      {/* Divider handle */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 z-10 flex -translate-x-1/2 items-center justify-center"
        style={{ left: `${position}%` }}
      >
        <div className="flex h-full w-px bg-white/60" />
        <div
          className="absolute flex items-center justify-center rounded-full border border-white/40 bg-black/60 text-white shadow-[0_0_20px_-4px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform"
          style={{ width: handleSize, height: handleSize }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute top-3 left-3 z-20 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        Before
      </span>
      <span className="pointer-events-none absolute top-3 right-3 z-20 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-black backdrop-blur-sm">
        After
      </span>
    </div>
  );
}

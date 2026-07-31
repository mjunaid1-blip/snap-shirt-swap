import { useState } from "react";
import {
  exportImage,
  formatBytes,
  FORMAT_META,
  RESOLUTIONS,
  type DownloadFormat,
} from "@/lib/export-image";

const selectClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-ring text-foreground";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function DownloadOptions({ src }: { src: string }) {
  const [format, setFormat] = useState<DownloadFormat>("png");
  const [resolution, setResolution] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const { url, width, height, bytes } = await exportImage(src, format, resolution);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fitroom-tryon-${width}x${height}.${FORMAT_META[format].ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus(`Saved ${width}×${height} ${FORMAT_META[format].label} · ${formatBytes(bytes)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Export</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Resolution</span>
          <select
            value={resolution}
            onChange={(e) => setResolution(Number(e.target.value))}
            className={selectClass}
          >
            {RESOLUTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Format</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as DownloadFormat)}
            className={selectClass}
          >
            {(Object.keys(FORMAT_META) as DownloadFormat[]).map((f) => (
              <option key={f} value={f}>
                {FORMAT_META[f].label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        onClick={download}
        disabled={busy}
        className="group relative w-full overflow-hidden rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-highlight hover:shadow-[0_0_24px_-6px_var(--color-primary)] disabled:opacity-50"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <DownloadIcon />
          {busy ? "Preparing…" : "Download preview"}
        </span>
      </button>
      {status && <p className="text-center text-xs text-muted-foreground">{status}</p>}
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}

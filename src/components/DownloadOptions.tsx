import { useState } from "react";
import {
  exportImage,
  formatBytes,
  FORMAT_META,
  RESOLUTIONS,
  type DownloadFormat,
} from "@/lib/export-image";

const selectClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

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
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <span className="text-sm font-medium">Download options</span>
      <div className="grid gap-3 sm:grid-cols-2">
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
        className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Preparing…" : "Download preview"}
      </button>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

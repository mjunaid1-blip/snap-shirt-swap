import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImageDrop } from "@/components/ImageDrop";
import { DownloadOptions } from "@/components/DownloadOptions";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitRoom — Virtual Shirt Try-On from Your Photo" },
      {
        name: "description",
        content:
          "Upload your photo and any shirt, and see a realistic preview of yourself wearing it in seconds.",
      },
      { property: "og:title", content: "FitRoom — Virtual Shirt Try-On" },
      {
        property: "og:description",
        content: "Upload a body photo and a shirt to preview the outfit on yourself instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function SparkleIcon({ className }: { className?: string }) {
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
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
    </svg>
  );
}

function Loader() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground">Styling your fit…</p>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex flex-col items-center gap-4 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <SparkleIcon className="h-7 w-7" />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Upload your photo and the shirt, then tap <span className="font-medium text-foreground">Try it on</span> to reveal your preview here.
      </p>
    </div>
  );
}

function Index() {
  const [person, setPerson] = useState<string | null>(null);
  const [garment, setGarment] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function tryOn() {
    if (!person || !garment || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, garment, notes }),
      });
      const data = (await res.json().catch(() => null)) as
        | { image?: string; error?: string }
        | null;
      if (!res.ok || !data?.image) {
        setError(data?.error ?? "Something went wrong. Please try again.");
      } else {
        setResult(data.image);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const ready = Boolean(person && garment);

  return (
    <main className="relative mx-auto max-w-6xl px-5 py-14 md:py-24">
      {/* Hero */}
      <header className="max-w-3xl fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">FitRoom</p>
        <h1 className="mt-6 text-5xl leading-[1.05] md:text-7xl lg:text-8xl">
          See the shirt on <span className="text-primary text-glow">you</span>, before you buy it.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Drop in a full-body photo and a picture of any shirt. Our AI fits the garment to your
          body, pose, and lighting — then reveals the preview.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Private & secure
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Photos are never stored
          </span>
        </div>
      </header>

      {/* Three-step grid */}
      <section className="mt-16 grid gap-6 md:grid-cols-3 fade-up" style={{ animationDelay: "0.1s" }}>
        <ImageDrop
          label="1. Your photo"
          hint="Click or drop a clear, front-facing full-body photo"
          value={person}
          onChange={setPerson}
        />
        <ImageDrop
          label="2. The shirt"
          hint="Click or drop a product shot of the shirt"
          value={garment}
          onChange={setGarment}
        />

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium tracking-wide text-foreground/90">3. Preview</span>
            {result && (
              <div className="flex items-center gap-1 rounded-full border border-border bg-card/60 p-0.5">
                {(["compare", "3d"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      viewMode === m
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "compare" ? "Compare" : "3D view"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-card card-lift">
            {loading ? (
              <Loader />
            ) : result && viewMode === "3d" ? (
              <ThreeDView src={result} alt="Preview of you wearing the shirt" />
            ) : result && person ? (
              <BeforeAfterSlider
                before={person}
                after={result}
                beforeAlt="Your original photo"
                afterAlt="Preview of you wearing the shirt"
              />
            ) : result ? (
              <img src={result} alt="Preview of you wearing the shirt" className="h-full w-full object-cover" />
            ) : (
              <EmptyPreview />
            )}
          </div>
          {result && viewMode === "3d" && (
            <p className="text-center text-xs text-muted-foreground">
              Drag to rotate · use the slider to zoom
            </p>
          )}
          {result && <DownloadOptions src={result} />}
        </div>
      </section>

      {/* Controls */}
      <section className="mt-10 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm fade-up" style={{ animationDelay: "0.2s" }}>
        <label htmlFor="notes" className="text-sm font-medium tracking-wide text-foreground/90">
          Optional styling notes
        </label>
        <input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. tuck it in, roll the sleeves, keep the background"
          className="mt-4 w-full rounded-xl border border-input bg-background px-4 py-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring"
        />
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <button
            onClick={tryOn}
            disabled={!ready || loading}
            className={`relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-semibold transition-all ${
              ready && !loading
                ? "bg-primary text-primary-foreground hover:bg-highlight hover:shadow-[0_0_28px_-8px_var(--color-primary)]"
                : "border border-primary/40 bg-primary/5 text-primary/70 cursor-not-allowed"
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              <SparkleIcon />
              {loading ? "Generating…" : "Try it on"}
            </span>
          </button>
          <p className="text-xs text-muted-foreground">
            Add both photos above, then tap the button to generate your preview.
          </p>
        </div>
        {error && (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </section>

      {/* Footer note */}
      <p className="mt-16 text-center text-xs text-muted-foreground/60 fade-up" style={{ animationDelay: "0.3s" }}>
        Results are AI-generated and may vary. Use them as a styling guide, not a guarantee of fit.
      </p>
    </main>
  );
}

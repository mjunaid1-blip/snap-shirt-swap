import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImageDrop } from "@/components/ImageDrop";

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

  return (
    <main className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">FitRoom</p>
        <h1 className="mt-4 text-4xl leading-tight md:text-6xl">
          See the shirt on <em className="not-italic text-primary">you</em>, before you buy it.
        </h1>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          Drop in a full-body photo and a picture of any shirt. Our AI fits the garment to your
          body, pose and lighting — and shows the preview.
        </p>
      </header>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
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

        <div className="space-y-2">
          <span className="text-sm font-medium">3. Preview</span>
          <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
            {result ? (
              <img src={result} alt="Preview of you wearing the shirt" className="h-full w-full object-cover" />
            ) : (
              <span className="px-6 text-center text-sm text-muted-foreground">
                {loading ? "Styling your fit…" : "Your try-on will appear here"}
              </span>
            )}
          </div>
          {result && <DownloadOptions src={result} />}

        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <label htmlFor="notes" className="text-sm font-medium">
          Optional styling notes
        </label>
        <input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. tuck it in, roll the sleeves, keep the background"
          className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={tryOn}
            disabled={!person || !garment || loading}
            className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Generating…" : "Try it on"}
          </button>
          <p className="text-xs text-muted-foreground">
            Photos are used only to generate your preview.
          </p>
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </section>
    </main>
  );
}

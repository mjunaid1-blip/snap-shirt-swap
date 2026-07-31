import { createFileRoute } from "@tanstack/react-router";

type Body = { person: string; garment: string; notes?: string };

function extractImage(json: unknown): string | null {
  const j = json as any;
  const b64 = j?.data?.[0]?.b64_json;
  if (typeof b64 === "string") return `data:image/png;base64,${b64}`;
  const url = j?.data?.[0]?.url;
  if (typeof url === "string") return url;
  const images = j?.choices?.[0]?.message?.images;
  if (Array.isArray(images) && images[0]?.image_url?.url) return images[0].image_url.url;
  return null;
}

export const Route = createFileRoute("/api/try-on")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { person, garment, notes } = (await request.json()) as Body;
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        if (!person || !garment) return new Response("Missing images", { status: 400 });

        const prompt = [
          "Virtual clothing try-on. The first image is a photo of a person. The second image is a garment.",
          "Generate a single photorealistic image of the SAME person, same face, same body shape, same pose, same background and lighting,",
          "now wearing the garment from the second image. Match the garment's exact color, pattern, print, texture and cut.",
          "Fit it naturally to the body with realistic folds, shadows and proportions. Do not alter the person's identity.",
          notes ? `Extra instructions: ${notes}` : "",
        ]
          .filter(Boolean)
          .join(" ");

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: person } },
                  { type: "image_url", image_url: { url: garment } },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          const message =
            upstream.status === 429
              ? "Too many requests right now — please try again in a moment."
              : upstream.status === 402
                ? "AI credits are exhausted. Add credits in your workspace settings to keep generating."
                : `Generation failed: ${text.slice(0, 300)}`;
          return Response.json({ error: message }, { status: upstream.status });
        }

        const json = await upstream.json();
        const image = extractImage(json);
        if (!image) return Response.json({ error: "The model did not return an image." }, { status: 502 });
        return Response.json({ image });
      },
    },
  },
});

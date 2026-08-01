import { createFileRoute } from "@tanstack/react-router";

type Body = { image: string; angle: number };

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

function describe(angle: number) {
  if (angle === 0) return "straight-on front view";
  if (angle < 90) return `rotated ${angle} degrees to the right — three-quarter front view`;
  if (angle === 90) return "exact left-side profile view (90 degrees)";
  if (angle < 180) return `rotated ${angle} degrees — three-quarter rear view`;
  if (angle === 180) return "full back view, seen directly from behind";
  if (angle < 270) return `rotated ${angle} degrees — three-quarter rear view from the other side`;
  if (angle === 270) return "exact right-side profile view (270 degrees)";
  return `rotated ${angle} degrees — three-quarter front view from the other side`;
}

export const Route = createFileRoute("/api/turnaround")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { image, angle } = (await request.json()) as Body;
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        if (!image || typeof angle !== "number")
          return Response.json({ error: "Missing image or angle" }, { status: 400 });

        const prompt = [
          "This image shows a person wearing a shirt. Render the exact same person, in the exact same shirt,",
          "as one frame of a 360-degree turntable of a full-body 3D character model.",
          `Camera angle: ${describe(angle)}.`,
          "Keep identity, hair, body proportions, skin tone, garment colour, pattern and fit perfectly consistent with the source.",
          "Full body head-to-toe, centred, same scale and eye level in every frame, neutral A-pose, even studio lighting,",
          "plain seamless dark charcoal studio backdrop, no text, no watermark. Photorealistic.",
        ].join(" ");

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
                  { type: "image_url", image_url: { url: image } },
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
                : `Frame generation failed: ${text.slice(0, 200)}`;
          return Response.json({ error: message }, { status: upstream.status });
        }

        const json = await upstream.json();
        const out = extractImage(json);
        if (!out) return Response.json({ error: "The model did not return an image." }, { status: 502 });
        return Response.json({ image: out, angle });
      },
    },
  },
});

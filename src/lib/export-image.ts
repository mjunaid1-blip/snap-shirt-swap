export type DownloadFormat = "png" | "jpeg" | "webp";

export const FORMAT_META: Record<DownloadFormat, { label: string; mime: string; ext: string }> = {
  png: { label: "PNG", mime: "image/png", ext: "png" },
  jpeg: { label: "JPG", mime: "image/jpeg", ext: "jpg" },
  webp: { label: "WebP", mime: "image/webp", ext: "webp" },
};

/** Longest-side target in px. 0 = keep original size. */
export const RESOLUTIONS = [
  { value: 0, label: "Original" },
  { value: 2048, label: "2048 px" },
  { value: 1536, label: "1536 px" },
  { value: 1024, label: "1024 px" },
  { value: 512, label: "512 px" },
];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the generated image."));
    img.src = src;
  });
}

export async function exportImage(
  src: string,
  format: DownloadFormat,
  longestSide: number,
): Promise<{ url: string; width: number; height: number; bytes: number }> {
  const img = await loadImage(src);
  const max = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longestSide > 0 ? Math.min(longestSide / max, 4) : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingQuality = "high";
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const mime = FORMAT_META[format].mime;
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, format === "png" ? undefined : 0.92),
  );
  if (!blob) throw new Error("This browser could not encode that format.");
  return { url: URL.createObjectURL(blob), width, height, bytes: blob.size };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

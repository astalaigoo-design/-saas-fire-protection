export type VideoSource =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string }
  | { kind: "file"; src: string; poster?: string };

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"]);

function parseYoutubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    return id || null;
  }
  if (url.pathname.startsWith("/embed/")) {
    return url.pathname.split("/")[2] ?? null;
  }
  return url.searchParams.get("v");
}

function parseVimeoId(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const videoIndex = parts.indexOf("video");
  if (videoIndex >= 0 && parts[videoIndex + 1]) {
    return parts[videoIndex + 1] ?? null;
  }
  return parts[parts.length - 1] ?? null;
}

/** Parse a marketing video URL from env or config (YouTube, Vimeo, or site-relative file). */
export function parseMarketingVideoUrl(raw: string | undefined): VideoSource | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) {
    return { kind: "file", src: trimmed };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const id = parseYoutubeId(url);
    return id ? { kind: "youtube", id } : null;
  }

  if (url.hostname === "vimeo.com" || url.hostname === "www.vimeo.com" || url.hostname === "player.vimeo.com") {
    const id = parseVimeoId(url);
    return id ? { kind: "vimeo", id } : null;
  }

  if (url.protocol === "https:" || url.protocol === "http:") {
    return { kind: "file", src: trimmed };
  }

  return null;
}

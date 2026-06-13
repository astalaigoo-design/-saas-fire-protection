"use client";

import { useMemo, useState } from "react";
import type { VideoSource } from "@/lib/marketing/parse-video-source";
import { cn } from "@/lib/utils";

type MarketingVideoPlayerProps = {
  source: VideoSource;
  title: string;
  poster?: string;
  className?: string;
  /** Muted loop autoplay for hero demos (file sources only). */
  autoPlayMuted?: boolean;
};

function embedUrl(source: VideoSource): string | null {
  if (source.kind === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${source.id}?rel=0&modestbranding=1`;
  }
  if (source.kind === "vimeo") {
    return `https://player.vimeo.com/video/${source.id}?title=0&byline=0`;
  }
  return null;
}

export function MarketingVideoPlayer({
  source,
  title,
  poster,
  className,
  autoPlayMuted = false,
}: MarketingVideoPlayerProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeSrc = useMemo(() => embedUrl(source), [source]);
  const resolvedPoster = poster ?? (source.kind === "file" ? source.poster : undefined);

  if (source.kind === "file") {
    return (
      <video
        className={cn("h-full w-full bg-slate-950 object-cover", className)}
        controls
        playsInline
        preload="metadata"
        poster={resolvedPoster}
        autoPlay={autoPlayMuted}
        muted={autoPlayMuted}
        loop={autoPlayMuted}
        aria-label={title}
      >
        <source src={source.src} type={source.src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
        Your browser does not support embedded video.
      </video>
    );
  }

  return (
    <div className={cn("relative aspect-[9/16] w-full bg-slate-950", className)}>
      {!iframeLoaded && resolvedPoster ? (
        // eslint-disable-next-line @next/next/no-img-element -- poster fallback before iframe loads
        <img
          src={resolvedPoster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-80"
        />
      ) : null}
      <iframe
        title={title}
        src={iframeSrc ?? undefined}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  );
}

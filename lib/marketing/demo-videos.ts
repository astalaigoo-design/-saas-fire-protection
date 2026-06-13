import fs from "node:fs";
import path from "node:path";
import { marketingScreenshotPaths } from "@/lib/marketing/screenshot-assets";
import { parseMarketingVideoUrl, type VideoSource } from "@/lib/marketing/parse-video-source";

export type MarketingDemoClip = {
  id: string;
  title: string;
  description: string;
  durationLabel: string;
  posterPath: string;
  /** Env var holding an optional clip URL (YouTube, Vimeo, or /public path). */
  envKey: string;
  socialSeriesDay: number;
  socialCaption: string;
};

export const MARKETING_HERO_VIDEO_ENV = "NEXT_PUBLIC_MARKETING_HERO_VIDEO_URL";

export const marketingDemoClips: MarketingDemoClip[] = [
  {
    id: "field-checklist",
    title: "Tap through NFPA checklist items",
    description:
      "Large Pass / Fail / N/A controls, citation text on every line, and swipe between items — built for gloved hands on a phone.",
    durationLabel: "0:45",
    posterPath: marketingScreenshotPaths.fieldInspection,
    envKey: "NEXT_PUBLIC_MARKETING_CLIP_FIELD_URL",
    socialSeriesDay: 1,
    socialCaption:
      "Day 1 — Swipe through NFPA citations on your phone. No generic task list. Every line shows the standard, edition, and section.",
  },
  {
    id: "compliance-report",
    title: "Submit once, PDF ready",
    description:
      "Signature on glass, photos on failed items only, and a branded compliance PDF your customer can open from email.",
    durationLabel: "0:35",
    posterPath: marketingScreenshotPaths.complianceReport,
    envKey: "NEXT_PUBLIC_MARKETING_CLIP_REPORT_URL",
    socialSeriesDay: 8,
    socialCaption:
      "Day 8 — One submit generates the AHJ-ready PDF. Logo, report phone, pass/fail summary, and deficiency photos included.",
  },
  {
    id: "repair-quote",
    title: "Failed item → repair quote",
    description:
      "Deficiencies become draft line items. Email the report and quote together; customers accept online without an account.",
    durationLabel: "0:40",
    posterPath: marketingScreenshotPaths.commandCenter,
    envKey: "NEXT_PUBLIC_MARKETING_CLIP_QUOTE_URL",
    socialSeriesDay: 15,
    socialCaption:
      "Day 15 — Stop retyping failed items into a separate estimating tool. Quotes start in the inspection.",
  },
];

const bundledHeroVideoPath = "/marketing/demo/hero-field-inspection.webm";
const bundledHeroPosterPath = marketingScreenshotPaths.fieldInspection;

function readEnvVideo(envKey: string): VideoSource | null {
  return parseMarketingVideoUrl(process.env[envKey]);
}

function bundledHeroVideoSource(): VideoSource | null {
  const absolute = path.join(process.cwd(), "public", bundledHeroVideoPath.replace(/^\//, ""));
  if (!fs.existsSync(absolute)) return null;
  return {
    kind: "file",
    src: bundledHeroVideoPath,
    poster: bundledHeroPosterPath,
  };
}

/** Hero demo at the top of the homepage — env URL, bundled WebM, or null (interactive fallback). */
export function getHeroDemoVideoSource(): VideoSource | null {
  const fromEnv = readEnvVideo(MARKETING_HERO_VIDEO_ENV);
  if (fromEnv) {
    if (fromEnv.kind === "file" && !fromEnv.poster) {
      return { ...fromEnv, poster: bundledHeroPosterPath };
    }
    return fromEnv;
  }
  return bundledHeroVideoSource();
}

export function getMarketingDemoClipSources(): Array<{
  clip: MarketingDemoClip;
  source: VideoSource | null;
}> {
  return marketingDemoClips.map((clip) => {
    const source = readEnvVideo(clip.envKey);
    if (source?.kind === "file" && !source.poster) {
      return { clip, source: { ...source, poster: clip.posterPath } };
    }
    return { clip, source };
  });
}

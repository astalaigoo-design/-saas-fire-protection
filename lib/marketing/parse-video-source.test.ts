import { describe, expect, it } from "vitest";
import { parseMarketingVideoUrl } from "@/lib/marketing/parse-video-source";

describe("parseMarketingVideoUrl", () => {
  it("parses site-relative file paths", () => {
    expect(parseMarketingVideoUrl("/marketing/demo/hero.webm")).toEqual({
      kind: "file",
      src: "/marketing/demo/hero.webm",
    });
  });

  it("parses YouTube watch URLs", () => {
    expect(parseMarketingVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  it("parses Vimeo URLs", () => {
    expect(parseMarketingVideoUrl("https://vimeo.com/123456789")).toEqual({
      kind: "vimeo",
      id: "123456789",
    });
  });
});

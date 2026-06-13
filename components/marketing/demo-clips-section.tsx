import Link from "next/link";
import { MarketingVideoPlayer } from "@/components/marketing/marketing-video-player";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { buttonVariants } from "@/components/ui/button";
import { getMarketingDemoClipSources } from "@/lib/marketing/demo-videos";
import { cn } from "@/lib/utils";

export function DemoClipsSection() {
  const clips = getMarketingDemoClipSources();

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="border-y border-border/60 bg-muted/20 py-14 sm:py-16"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Field demo</p>
          <h2
            id="demo-heading"
            className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            See how fast inspections are on a phone
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Fire protection contractors need proof, not promises. Watch a technician tap through
            citation-backed checklist items, submit, and deliver a compliance PDF — or try the live
            preview in the hero above.
          </p>
        </div>

        <ul className="mt-10 grid gap-6 lg:grid-cols-3">
          {clips.map(({ clip, source }) => (
            <li
              key={clip.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="relative aspect-[9/16] max-h-[420px] w-full bg-slate-950 sm:max-h-none">
                {source ? (
                  <MarketingVideoPlayer
                    source={source}
                    title={clip.title}
                    poster={clip.posterPath}
                    className="absolute inset-0 h-full"
                  />
                ) : (
                  <ProductScreenshot
                    src={clip.posterPath}
                    alt={clip.title}
                    width={390}
                    height={844}
                    className="h-full w-full object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 320px"
                  />
                )}
                <span className="absolute bottom-3 right-3 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow">
                  {clip.durationLabel}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Social series · Day {clip.socialSeriesDay}
                </p>
                <h3 className="mt-1 font-heading text-base font-semibold text-foreground">
                  {clip.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                  {clip.description}
                </p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{clip.socialCaption}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: "lg" }), "min-h-11 justify-center")}
          >
            Try it on your next inspection
          </Link>
          <Link
            href="/marketing-screenshot/field-inspection"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 justify-center",
            )}
          >
            Open full-screen field preview
          </Link>
        </div>
      </div>
    </section>
  );
}

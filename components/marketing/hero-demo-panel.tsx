import { MarketingFieldInspectionPreview } from "@/components/marketing/marketing-field-inspection-preview";
import { MarketingVideoPlayer } from "@/components/marketing/marketing-video-player";
import { PhoneDemoFrame } from "@/components/marketing/phone-demo-frame";
import { getHeroDemoVideoSource } from "@/lib/marketing/demo-videos";

export function HeroDemoPanel() {
  const video = getHeroDemoVideoSource();

  if (video) {
    return (
      <PhoneDemoFrame badge="90-second field demo">
        <MarketingVideoPlayer
          source={video}
          title="GetFlareflow field inspection demo — NFPA checklist to compliance PDF"
          autoPlayMuted
          className="aspect-[9/16] max-h-[560px]"
        />
      </PhoneDemoFrame>
    );
  }

  return (
    <PhoneDemoFrame badge="Live preview — tap Pass or Fail">
      <div className="max-h-[560px] overflow-y-auto overscroll-contain">
        <MarketingFieldInspectionPreview />
      </div>
    </PhoneDemoFrame>
  );
}

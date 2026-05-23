"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { InspectionFormShell } from "@/components/inspect/inspection-form-shell";
import { cacheOfflineInspectShell } from "@/lib/offline/cache-page";
import { warmUrlForOffline } from "@/lib/offline/warm-cache";

function OfflineInspectContent() {
  const searchParams = useSearchParams();
  const inspectionId = searchParams.get("inspectionId")?.trim() ?? "";

  useEffect(() => {
    cacheOfflineInspectShell();
    void warmUrlForOffline("/inspect/offline");
  }, []);

  if (!inspectionId) {
    return (
      <div className="flex min-h-[100dvh] flex-col justify-center bg-slate-950 p-6 text-slate-50">
        <h1 className="text-lg font-semibold text-white">Missing inspection</h1>
        <p className="mt-2 text-sm text-slate-400">
          Open a job from My Jobs while online, or use Resume inspection when offline.
        </p>
      </div>
    );
  }

  return <InspectionFormShell inspectionId={inspectionId} serverInspection={null} />;
}

export default function OfflineInspectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-sm text-slate-400">
          Loading inspection…
        </div>
      }
    >
      <OfflineInspectContent />
    </Suspense>
  );
}

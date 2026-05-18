import { Skeleton } from "@/components/ui/skeleton";

export default function BuildingDetailLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading building">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-11 w-48" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

import Link from "next/link";

/** Shown when reassignment needs a second branch. */
export function BranchReassignHint() {
  return (
    <p className="text-xs text-muted-foreground">
      <Link href="/dashboard/settings#branches" className="font-medium text-primary underline-offset-4 hover:underline">
        Add another branch
      </Link>{" "}
      under Organization to move between locations.
    </p>
  );
}

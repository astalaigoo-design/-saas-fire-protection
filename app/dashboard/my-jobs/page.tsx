import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAppRole } from "@/lib/auth/session";

/** Technicians: list only jobs where `assignedClerkUserId === user.id` in your DB. */
export default async function MyJobsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = await getAppRole();
  if (!role) redirect("/dashboard");
  if (role !== "technician") redirect("/dashboard/jobs");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My assigned jobs</h1>
      <p className="text-slate-400">
        Clerk user id for assignment filters:{" "}
        <code className="rounded bg-slate-800 px-2 py-0.5 text-amber-200">
          {user.id}
        </code>
      </p>
      <p className="text-sm text-slate-500">
        Query jobs with{" "}
        <code className="rounded bg-slate-800 px-1">assignedClerkUserId = user.id</code>{" "}
        (or your field name).
      </p>
    </div>
  );
}

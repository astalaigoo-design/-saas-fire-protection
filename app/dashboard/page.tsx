import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { parseAppRoleFromMetadata } from "@/lib/auth/roles";
import { permissionSummary } from "@/lib/auth/permissions";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = parseAppRoleFromMetadata(
    user.publicMetadata as Record<string, unknown>,
    user.unsafeMetadata as Record<string, unknown> | undefined,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-slate-400">
          Signed in as{" "}
          <span className="text-slate-200">
            {user.primaryEmailAddress?.emailAddress ?? user.username ?? user.id}
          </span>
        </p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-amber-400">
          App role
        </h2>
        {role ? (
          <p className="mt-2 font-mono text-lg text-white">{role}</p>
        ) : (
          <div className="mt-2 space-y-2 text-slate-300">
            <p>No <code className="rounded bg-slate-800 px-1">role</code> in public metadata.</p>
            <p className="text-sm text-slate-400">
              In Clerk: Users → this user → Public metadata → add{" "}
              <code className="rounded bg-slate-800 px-1">{`{ "role": "owner" }`}</code>{" "}
              (or <code className="rounded bg-slate-800 px-1">admin</code> /{" "}
              <code className="rounded bg-slate-800 px-1">technician</code>).
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-amber-400">
          Permissions for this role
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-slate-300">
          {permissionSummary(role).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-slate-500">
        <Link href="/" className="text-amber-400 hover:underline">
          ← Home
        </Link>
      </p>
    </div>
  );
}

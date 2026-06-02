"use client";

import { SignUp } from "@clerk/nextjs";

export function SignUpPanel() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <SignUp
        appearance={{ variables: { colorPrimary: "#f59e0b" } }}
        forceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}

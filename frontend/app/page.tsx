
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth-context";

const roleRedirectMap: Record<string, string> = {
  PATIENT: "/dashboard/patient",
  OPTOMETRIST: "/dashboard/optometrist",
  DOCTOR: "/dashboard/doctor",
  ADMIN: "/dashboard/admin",
  PHARMACY: "/dashboard/pharmacy",
  // Also support lowercase for backwards compatibility
  patient: "/dashboard/patient",
  optometrist: "/dashboard/optometrist",
  doctor: "/dashboard/doctor",
  admin: "/dashboard/admin",
  pharmacy: "/dashboard/pharmacy",
};

export default function Home(): JSX.Element {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const target = user ? roleRedirectMap[user.role] ?? "/login" : "/login";

    // Use replace so the landing page is not preserved in history
    router.replace(target);
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm">Preparing your dashboard…</p>
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AppShellSkeleton } from "@/components/ui/Skeleton";
import { SubscriptionExpiryBanner } from "@/components/SubscriptionExpiryBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isHydrated && (!token || !user)) {
      router.replace("/login");
    }
  }, [isHydrated, token, user, router]);

  if (!isHydrated || !token || !user) {
    return <AppShellSkeleton />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <SubscriptionExpiryBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

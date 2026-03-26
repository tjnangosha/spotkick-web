import { AppSidebar } from "@/components/app-sidebar";
import { PathBreadcrumbs } from "@/components/path-breadcrumbs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { AuthUser, getCurrentUser } from "@/lib/auth";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  loader: async () => await getCurrentUser(),
});

export function DashboardLayout() {
  const { accessToken, hasCheckedRefresh } = useAuthStore((state) => ({
    accessToken: state.accessToken,
    hasCheckedRefresh: state.hasCheckedRefresh,
  }));
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCheckedRefresh && !accessToken) {
      navigate({ to: "/" });
    }
  }, [accessToken, hasCheckedRefresh, navigate]);

  const { data: user,  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => getCurrentUser(),
  });

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 justify-between">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <PathBreadcrumbs />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

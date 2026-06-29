import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated || !user) {
      throw redirect({ to: "/auth" });
    }
    if (user.role === "Intern") {
      throw redirect({ to: "/employee" });
    }
  },
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
});

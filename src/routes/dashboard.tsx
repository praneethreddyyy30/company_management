import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (user && user.role === "Intern") {
      throw redirect({ to: "/employee" });
    }
  },
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
});

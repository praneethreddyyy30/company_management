import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/employee")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated || !user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => (
    <EmployeeLayout>
      <Outlet />
    </EmployeeLayout>
  ),
});

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
});

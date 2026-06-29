import { createFileRoute, Outlet } from "@tanstack/react-router";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";

export const Route = createFileRoute("/employee")({
  component: () => (
    <EmployeeLayout>
      <Outlet />
    </EmployeeLayout>
  ),
});

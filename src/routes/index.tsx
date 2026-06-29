import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate({ to: "/auth" });
    } else {
      const isIntern = user.role === "Intern";
      navigate({ to: isIntern ? "/employee" : "/dashboard" });
    }
  }, [user, isAuthenticated, navigate]);

  return null;
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const user = useAuthStore.getState().user;
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated || !user) {
      throw redirect({ to: "/auth" });
    }
    const isIntern = user.role === "Intern";
    throw redirect({ to: isIntern ? "/employee" : "/dashboard" });
  },
});

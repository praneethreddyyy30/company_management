import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const isIntern = user?.role === "Intern";
    throw redirect({ to: isIntern ? "/employee" : "/dashboard" });
  },
});

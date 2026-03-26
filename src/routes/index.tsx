import SignInViewPage from "@/features/auth/sign-in-view";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/")({
  component: SignInRoute,
});

function SignInRoute() {
  const { accessToken, hasCheckedRefresh } = useAuthStore((state) => ({
    accessToken: state.accessToken,
    hasCheckedRefresh: state.hasCheckedRefresh,
  }));
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCheckedRefresh && accessToken) {
      navigate({ to: "/dashboard" });
    }
  }, [accessToken, hasCheckedRefresh, navigate]);

  return <SignInViewPage stars={120} />;
}

import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { adminApi } from "../lib/admin-api-client";
import { appConfig } from "../config";

const RootLayout = () => (
  <div className="h-dvh">
    <Outlet />
  </div>
);

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const { success } = await adminApi.refreshAccessToken();

    switch (location.pathname) {
      case "/signin":
      case "/app":
      case "/":
        if (success) {
          throw redirect({ to: appConfig.homeRoute });
        }
        break;
      default:
        if (!success) {
          throw redirect({ to: "/signin" });
        }
    }
  },

  component: RootLayout,
});

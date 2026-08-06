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
    const accessToken = await adminApi.refreshAccessToken();

    switch (location.pathname) {
      case "/signin":
      case "/signup":
      case "/app":
      case "/":
        if (accessToken) {
          console.log("REDIRECT:", appConfig.homeRoute)
          throw redirect({ to: appConfig.homeRoute });
        }
        break;
      default:
        if (!accessToken) {
          console.log("REDIRECT: /signin")
          throw redirect({ to: "/signin" });
        }
    }
  },

  component: RootLayout,
});

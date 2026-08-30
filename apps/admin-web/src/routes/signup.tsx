import { createFileRoute } from "@tanstack/react-router";
import { SignUpView } from "../features/auth/views/signup.view";

export const Route = createFileRoute("/signup")({
  component: SignUpView,
});

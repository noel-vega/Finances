import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { JoinView } from "../features/auth/views/join.view";

const JoinSearchSchema = z.object({
  token: z.string(),
});

export const Route = createFileRoute("/join")({
  validateSearch: JoinSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useSearch();
  return <JoinView token={token} />;
}

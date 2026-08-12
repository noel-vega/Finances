import { isRouteErrorResponse, useRouteError } from "react-router";

export function RouteError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-medium">Product not found</h1>
        <p className="mt-2 text-muted-foreground">
          It may have been removed or is no longer available.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-medium">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">Please try again later.</p>
    </div>
  );
}

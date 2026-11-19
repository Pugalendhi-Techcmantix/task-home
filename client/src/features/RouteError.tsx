import { RotateCw, TriangleAlert } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";

/** Shown instead of a blank page if rendering a page throws unexpectedly. */
export function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Unknown error";

  return (
    <div className="grid min-h-dvh place-items-center bg-background p-6">
      <div role="alert" className="w-full max-w-md rounded-lg border bg-card p-6 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-bad-soft text-bad">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-base font-semibold">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted-foreground">The page hit an unexpected error. Reloading usually fixes it.</p>
        <p className="mt-3 rounded-md bg-secondary px-3 py-2 font-mono text-xs break-words text-muted-foreground">{detail}</p>
        <Button className="mt-5" onClick={() => window.location.reload()}>
          <RotateCw aria-hidden="true" />
          Reload
        </Button>
      </div>
    </div>
  );
}

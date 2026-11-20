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
    <div className="canvas-glow grid min-h-dvh place-items-center bg-background p-6">
      <div role="alert" className="surface-raised motion-fade-up w-full max-w-md p-6 text-center">
        <span className="mx-auto grid size-10 place-items-center rounded-xl border border-bad/20 bg-bad-soft text-bad-ink">
          <TriangleAlert className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-base font-semibold tracking-[-0.02em]">Something went wrong</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
          The page hit an unexpected error. Reloading usually fixes it.
        </p>
        <p className="mt-4 rounded-lg border bg-sunken px-3 py-2 text-left font-mono text-xs wrap-break-word text-muted-foreground">
          {detail}
        </p>
        <Button className="mt-5" onClick={() => window.location.reload()}>
          <RotateCw aria-hidden="true" />
          Reload
        </Button>
      </div>
    </div>
  );
}

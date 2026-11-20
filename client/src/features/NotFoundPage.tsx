import { Compass } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center px-6 py-16 text-center sm:py-24">
      <p className="num motion-fade-up text-[96px] leading-none font-semibold tracking-[-0.04em] text-faint/30 select-none" aria-hidden="true">
        404
      </p>
      <div
        className="motion-pop mt-4 grid size-10 place-items-center rounded-xl border bg-sunken text-muted-foreground shadow-panel"
        style={{ animationDelay: "120ms" }}
      >
        <Compass className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-lg font-semibold tracking-[-0.02em]">Page not found</h1>
      <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
        This page doesn&apos;t exist. It may have moved, or the link may be mistyped.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Go to the dashboard</Link>
      </Button>
    </section>
  );
}

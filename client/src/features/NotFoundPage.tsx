import { Compass } from "lucide-react";
import { Link } from "react-router";
import { EmptyState, Panel } from "@/components/common/Page";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <Panel>
      <EmptyState
        icon={<Compass className="size-5" aria-hidden="true" />}
        title="Page not found"
        body="This page doesn't exist. It may have moved, or the link may be mistyped."
        action={
          <Button asChild>
            <Link to="/">Go to the dashboard</Link>
          </Button>
        }
      />
    </Panel>
  );
}

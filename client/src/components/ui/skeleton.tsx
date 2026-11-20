import { cn } from "cn"

/** Static block under reduced motion; a soft sweep (`.motion-shimmer`, see index.css) otherwise. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("motion-shimmer rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }

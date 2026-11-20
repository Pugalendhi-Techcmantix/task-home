"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Tabs as TabsPrimitive } from "radix-ui"

import { useMergedRef } from "@/app/motion"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-sunken",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Moves the segmented control's single active pill onto the active trigger. Writes straight to the
 * DOM (no React state), so a tab change costs no extra render. A tab change (click, arrow keys,
 * a value set from the URL) glides; a resize, font swap or first paint snaps, so the pill never
 * lags behind layout.
 */
function useSlidingIndicator(
  listRef: React.RefObject<HTMLDivElement | null>,
  indicatorRef: React.RefObject<HTMLSpanElement | null>,
  enabled: boolean
) {
  React.useLayoutEffect(() => {
    const list = listRef.current
    const indicator = indicatorRef.current
    if (!enabled || !list || !indicator) return

    let frame = 0
    const place = (animate: boolean) => {
      const active = list.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]'
      )
      if (!active) {
        list.removeAttribute("data-indicator")
        return
      }
      const listRect = list.getBoundingClientRect()
      const rect = active.getBoundingClientRect()
      const x = rect.left - listRect.left - list.clientLeft + list.scrollLeft
      const y = rect.top - listRect.top - list.clientTop + list.scrollTop

      cancelAnimationFrame(frame)
      if (!animate) indicator.removeAttribute("data-animate")
      indicator.style.translate = `${x}px ${y}px`
      indicator.style.width = `${rect.width}px`
      indicator.style.height = `${rect.height}px`
      list.setAttribute("data-indicator", "ready")
      // Re-enable the glide only after the snapped position has been committed.
      frame = requestAnimationFrame(() => {
        indicator.setAttribute("data-animate", "true")
      })
    }

    place(false)

    const resizeObserver = new ResizeObserver(() => place(false))
    const observeTriggers = () => {
      resizeObserver.disconnect()
      resizeObserver.observe(list)
      list
        .querySelectorAll('[data-slot="tabs-trigger"]')
        .forEach((trigger) => resizeObserver.observe(trigger))
    }
    observeTriggers()

    const mutationObserver = new MutationObserver((records) => {
      if (records.some((record) => record.type === "childList")) {
        observeTriggers()
        place(false)
      } else {
        place(indicator.getAttribute("data-animate") === "true")
      }
    })
    mutationObserver.observe(list, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-state"],
    })

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [listRef, indicatorRef, enabled])
}

function TabsList({
  className,
  variant = "default",
  children,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const indicatorRef = React.useRef<HTMLSpanElement | null>(null)
  const sliding = variant !== "line"
  useSlidingIndicator(listRef, indicatorRef, sliding)

  const setRef = useMergedRef(listRef, ref)

  return (
    <TabsPrimitive.List
      ref={setRef}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), "relative", className)}
      {...props}
    >
      {sliding && (
        <span
          ref={indicatorRef}
          aria-hidden="true"
          data-slot="tabs-indicator"
          className="pointer-events-none absolute top-0 left-0 rounded-md border border-transparent bg-card opacity-0 shadow-panel group-data-[indicator=ready]/tabs-list:opacity-100 data-[animate=true]:transition-[translate,width,height] data-[animate=true]:duration-(--dur-3) data-[animate=true]:ease-spring dark:border-border-strong dark:bg-accent"
        />
      )}
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-0.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color,box-shadow,border-color] duration-(--dur-2) ease-out-quint group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-panel group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-card data-active:text-foreground dark:data-active:border-border-strong dark:data-active:bg-accent dark:data-active:text-foreground",
        // Once the sliding pill is in place it draws the active surface, so the trigger turns transparent.
        "group-data-[indicator=ready]/tabs-list:data-active:border-transparent! group-data-[indicator=ready]/tabs-list:data-active:bg-transparent! group-data-[indicator=ready]/tabs-list:data-active:shadow-none!",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }

import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { selectClass } from "../lib/styles";

/** A styled native select with a chevron. Native keeps keyboard and screen-reader behavior for free. */
export function SelectField({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`relative block ${className}`}>
      <select {...props} className={selectClass} />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
    </span>
  );
}

import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

const CROSS_FADE = "animate-in duration-(--dur-2) ease-(--ease-snappy) fade-in-0";

/**
 * Content of a submit button: the spinner scales and fades in while `submitting`, and the label
 * cross-fades whenever its text changes ("Save changes" -> "Saving…"). Instant under reduced motion.
 */
export function SubmitLabel({ submitting, children }: { submitting: boolean; children: string }): ReactNode {
  return (
    <>
      {submitting && (
        <span className={`${CROSS_FADE} inline-flex zoom-in-75`} aria-hidden="true">
          <LoaderCircle className="animate-spin" />
        </span>
      )}
      <span key={children} className={CROSS_FADE}>
        {children}
      </span>
    </>
  );
}

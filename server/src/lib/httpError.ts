import type { FieldError } from "@tracker/shared";

/** An error that maps directly to an HTTP status, a client-safe message and optional field errors. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: FieldError[],
  ) {
    super(message);
    this.name = "HttpError";
  }
}

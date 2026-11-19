import type { ApiErrorBody } from "@tracker/shared";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/httpError";

/** body-parser errors carry a `type` such as "entity.parse.failed". */
function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "type" in err && typeof err.type === "string") {
    return err.type;
  }
  return undefined;
}

/** Turns every error into the API's `{ message, errors? }` body. Must be registered last. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const body: ApiErrorBody = {
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        field: issue.path.map(String).join(".") || "body",
        message: issue.message,
      })),
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message } satisfies ApiErrorBody);
    return;
  }

  const parserError = bodyParserErrorType(err);
  if (parserError === "entity.parse.failed") {
    res.status(400).json({ message: "Request body must be valid JSON" } satisfies ApiErrorBody);
    return;
  }
  if (parserError === "entity.too.large") {
    res.status(413).json({ message: "Request body is too large" } satisfies ApiErrorBody);
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" } satisfies ApiErrorBody);
}

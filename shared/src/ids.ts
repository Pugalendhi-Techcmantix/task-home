import { z } from "zod";

/** A MongoDB ObjectId as a 24-character hex string. */
export function objectIdString(message = "Must be a valid id") {
  return z.string({ error: message }).regex(/^[a-f\d]{24}$/i, { error: message });
}

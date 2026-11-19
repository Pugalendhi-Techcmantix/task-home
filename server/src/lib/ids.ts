import { isObjectIdOrHexString } from "mongoose";
import { HttpError } from "./httpError";

/**
 * Returns the id when it is a valid ObjectId, otherwise throws 404. A malformed id can't match a
 * document, so it is "not found" (the brief's rule for tasks, applied to every resource).
 */
export function parseObjectIdOr404(raw: string, notFoundMessage: string): string {
  if (!isObjectIdOrHexString(raw)) {
    throw new HttpError(404, notFoundMessage);
  }
  return raw;
}

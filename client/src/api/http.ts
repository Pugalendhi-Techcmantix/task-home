import { apiErrorSchema, type FieldError } from "@tracker/shared";
import type { z } from "zod";

const NETWORK_ERROR_MESSAGE = "Can't reach the server. Check your connection and try again.";

/** Any failed API call. `status` is 0 when the server could not be reached. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** The only place the client talks to the network. Every response is validated against a shared schema. */
export async function request<T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  const body: unknown = await res.json().catch((error: unknown) => {
    if (isAbortError(error)) throw error; // aborted mid-body: let the caller ignore it
    return undefined; // empty or non-JSON body
  });

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) {
      throw new ApiError(res.status, parsed.data.message, parsed.data.errors ?? []);
    }
    // A non-JSON 5xx usually means the dev proxy could not reach the API.
    throw new ApiError(
      res.status,
      res.status >= 500 ? NETWORK_ERROR_MESSAGE : `Request failed (${res.status})`,
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(res.status, "Unexpected response from the server");
  }
  return parsed.data;
}

/** Builds "?a=1&b=2" from the defined values, or "" when there are none. */
export function toSearch(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, value);
  }
  return search.size > 0 ? `?${search.toString()}` : "";
}

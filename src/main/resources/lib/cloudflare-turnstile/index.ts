import type { Request } from "@enonic-types/core";
import { request as httpRequest } from "/lib/http-client";
import { getSiteConfig } from "/lib/xp/portal";
import type { CloudflareTurntile } from "/site/mixins";

export const TURNSTILE_CLIENT_JS = "https://challenges.cloudflare.com/turnstile/v0/api.js";
export const FIELD_TURNSTILE_RESPONSE = "cf-turnstile-response";
const URL_SITE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResponseSuccess = {
  success: true;
  challenge_ts: string;
  hostname: string;
  "error-codes": string[];
  action: string;
  cdata: string;
  metadata: Record<string, string>;
};

export type TurnstileResponseFailed = {
  success: false;
  "error-codes": string[];
};

export type TurnstileResponse = TurnstileResponseSuccess | TurnstileResponseFailed;

const ERROR_INTERNAL_MISSING_INPUT_RESPONSE: TurnstileResponseFailed = {
  success: false,
  "error-codes": ["missing-input-response"],
};
const ERROR_INTERNAL_SERVER_ERROR: TurnstileResponseFailed = {
  success: false,
  "error-codes": ["internal-error"],
};

/**
 * Verifies a Cloudflare Turnstile token against Cloudflare's siteverify endpoint.
 *
 * The token is read from the `cf-turnstile-response` request parameter
 * (see {@link FIELD_TURNSTILE_RESPONSE}), which the Turnstile widget submits
 * with the form.
 *
 * This function never throws: if the token is missing, or the request to
 * Cloudflare fails, it returns a {@link TurnstileResponseFailed} with an
 * appropriate entry in `error-codes` (`missing-input-response` or
 * `internal-error`).
 *
 * @param req - The incoming request containing the Turnstile token and the client's remote address.
 * @returns The verification result. Check the `success` field to determine the outcome.
 */
export function verify(req: Request): TurnstileResponse {
  const token = first(req.params[FIELD_TURNSTILE_RESPONSE]);

  if (!token) {
    return ERROR_INTERNAL_MISSING_INPUT_RESPONSE;
  }

  try {
    const res = httpRequest({
      url: URL_SITE_VERIFY,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: getSecretKey(),
        response: token,
        remoteip: req.remoteAddress,
      }),
    });

    if (res.status === 200 && res.body) {
      return JSON.parse(res.body) as TurnstileResponse;
    }
  } catch (e) {
    log.error("Cloudflare turnstile verification failed", e);
  }

  return ERROR_INTERNAL_SERVER_ERROR;
}

/**
 * Returns the Turnstile site key, or `null` if it is not configured.
 *
 * The key is resolved from the application config (`turnstileSiteKey`) first,
 * falling back to the `turnstileSiteKey` value of the site's
 * `cloudflare-turnstile` mixin.
 *
 * @returns The configured site key, or `null` when none is configured.
 */
export function getSiteKeyOrNull(): string | null {
  return app.config.turnstileSiteKey ?? getSiteConfig<Partial<CloudflareTurntile>>()?.turnstileSiteKey ?? null;
}

/**
 * Returns the Turnstile site key, throwing if it is not configured.
 *
 * The key is resolved the same way as {@link getSiteKeyOrNull}: from the
 * application config (`turnstileSiteKey`), falling back to the site's
 * `cloudflare-turnstile` mixin.
 *
 * @returns The configured site key.
 * @throws {Error} If `turnstileSiteKey` is not configured.
 */
export function getSiteKey(): string {
  const siteKey = getSiteKeyOrNull();
  assertIsDefined(siteKey, "siteKey");
  return siteKey;
}

/**
 * Returns the Turnstile secret key, throwing if it is not configured.
 *
 * The key is resolved from the application config (`turnstileSecretKey`) first,
 * falling back to the `turnstileSecretKey` value of the site's
 * `cloudflare-turnstile` mixin. It is used as the `secret` when calling
 * Cloudflare's siteverify endpoint.
 *
 * @returns The configured secret key.
 * @throws {Error} If `turnstileSecretKey` is not configured.
 */
export function getSecretKey(): string {
  const secretKey = app.config.turnstileSecretKey ?? getSiteConfig<Partial<CloudflareTurntile>>()?.turnstileSecretKey;
  assertIsDefined(secretKey, "secretKey");
  return secretKey;
}

function assertIsDefined<T>(value: T, name: string): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${name} is ${value}`);
  }
}

function first<A>(data: A | A[] | undefined | null): A | undefined {
  return Array.isArray(data) ? data[0] : (data ?? undefined);
}

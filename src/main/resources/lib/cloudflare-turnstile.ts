import { getSiteConfig } from "/lib/xp/portal";
import { request as httpRequest } from "/lib/http-client";
import type { CloudflareTurntile } from "/site/mixins";
import type { Request } from "@enonic-types/core";

export const TURNSTILE_CLIENT_JS = "https://challenges.cloudflare.com/turnstile/v0/api.js";
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

export function verify(req: Request): TurnstileResponse {
  const token = first(req.params["cf-turnstile-response"]);

  try {
    assertIsDefined(token, "token");

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

  return {
    success: false,
    "error-codes": ["internal-error"],
  };
}

/**
 * @throws {Error} The `turnstileSiteKey` must be configured
 */
export function getSiteKey(): string {
  const siteKey = app.config.turnstileSiteKey ?? getSiteConfig<Partial<CloudflareTurntile>>()?.turnstileSiteKey;
  assertIsDefined(siteKey, "siteKey");
  return siteKey;
}

/**
 * @throws {Error} The `turnstileSecretKey` must be configured
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

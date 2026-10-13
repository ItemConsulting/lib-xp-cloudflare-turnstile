# Cloudflare Turnstile integration for Enonic XP

This library simplifies integration with Cloudflare Turnstile from Enonic XP projects.

[![](https://repo.itemtest.no/api/badge/latest/releases/no/item/lib-xp-cloudflare-turnstile)](https://repo.itemtest.no/#/releases/no/item/lib-xp-cloudflare-turnstile)
![Enonic XP8 badge](https://market.enonic.com/badges/xp8.svg)

## Installation

Version 1 of this library requires Enonic XP 8, and is built against XP 8.0.4. Use version 0.x for Enonic XP 7.

To install this library you need to add a new dependency to your app's build.gradle file.

### Gradle

```groovy
repositories {
  maven { url "https://repo.itemtest.no/releases" }
}

dependencies {
  include "no.item:lib-xp-cloudflare-turnstile:1.0.0"
}
```

The library depends on `lib-portal` and `lib-http-client`, which your app picks up transitively.

### TypeScript

To update the version of *enonic-types* in *package.json* using npm, run the following command:
```bash
npm i -D @item-enonic-types/lib-cloudflare-turnstile
```

You can add the following changes to your *tsconfig.json* to get TypeScript-support. Leave out `baseUrl`: TypeScript 7
no longer supports it, and `paths` resolve relative to the *tsconfig.json* file without it.

```diff
{
  "compilerOptions": {
+   "paths": {
+     "/lib/xp/*": ["./node_modules/@enonic-types/lib-*"],
+     "/lib/*": [ "./node_modules/@item-enonic-types/lib-*" ,"./src/main/resources/lib/*"],
+   }
  }
}
```

## Configuration

You can configure the API-keys in one of two ways:

 1. As a form fragment in _cms/cms.yaml_
    ```yaml
    kind: "CMS"
    form:
      - type: "FormFragment"
        name: "cloudflare-turnstile"
    ```
 2. As a configuration on your applications _*.cfg_ file
    ```ini
    # These testing keys will always succeed
    turnstileSiteKey=1x00000000000000000000AA
    turnstileSecretKey=1x0000000000000000000000000000000AA
    ```


### Usage

```typescript
import { getSiteKey, verify, TURNSTILE_CLIENT_JS, FIELD_TURNSTILE_RESPONSE } from "/lib/cloudflare-turnstile";
import type { Response } from "@enonic-types/core";

export function get(): Response {
  const turnstileSiteKey = getSiteKey();

  return {
    body: `
      <form method="post">
        <div class="cf-turnstile" data-sitekey="${turnstileSiteKey}"></div>
        <button type="submit">Submit</button>
      </form>
    `,
    pageContributions: {
      headEnd: [`<script src="${TURNSTILE_CLIENT_JS}" async defer></script>`],
    },
  };
}

type FormParams = {
  [FIELD_TURNSTILE_RESPONSE]: string | string[];
};

export function post(req: Request<{ params: FormParams }>): Response {
  const result = verify(req);

  return {
    body: verify.success ? "You have been verified!" : "You are a bot!"
  };
}
```

## Development

### Changesets

[Changesets](https://changesets-docs.vercel.app/) is a tool that helps developers version the software, and create
changelogs.

Please include Changesets in your PRs.

Run the following command and you will be prompted to create a changelog message and tell it which level to bump the next version:

```bash
npx changeset
```

### Building

Building requires Java 25 (the Enonic XP 8 Gradle plugins use a Java 25 toolchain, and the Gradle settings plugin needs
Java 21 or newer to run). To build the project run the following command:

```bash
./gradlew build
```

This generates TypeScript types from the YAML descriptors, runs [Biome](https://biomejs.dev/) and the TypeScript type
check, bundles the TypeScript with [tsdown](https://tsdown.dev/) and builds the jar. The checks can also be run on
their own:

```bash
npm run check   # Biome + TypeScript type check
npm run format  # Apply Biome's formatting and safe fixes
```

### Deploy locally

Deploy locally for testing purposes:

```bash
./gradlew publishToMavenLocal
```

### Releasing

Releases are published by the *Publish* GitHub Actions workflow. When changesets are merged to `main`, it opens a
"Version Packages" pull request. Merging that pull request publishes the type definitions to npm and the jar to
[repo.itemtest.no](https://repo.itemtest.no).

# Cloudflare Turnstile integration for Enonic XP

This library simplifies integration with Cloudflare Turnstile from Enonic XP projects.

[![](https://repo.itemtest.no/api/badge/latest/releases/no/item/lib-xp-cloudflare-turnstile)](https://repo.itemtest.no/#/releases/no/item/lib-xp-cloudflare-turnstile)

<img src="https://github.com/ItemConsulting/lib-xp-cloudflare-turnstile/raw/main/docs/icon.svg?sanitize=true" width="150">

## Installation

To install this library you need to add a new dependency to your app's build.gradle file.

### Gradle

```groovy
repositories {
  maven { url "https://repo.itemtest.no/releases" }
}

dependencies {
  include "no.item:lib-xp-cloudflare-turnstile:0.0.1"
}
```

### TypeScript

To update the version of *enonic-types* in *package.json* using npm, run the following command:
```bash
npm i -D @item-enonic-types/lib-cloudflare-turnstile
```

You can add the following changes to your *tsconfig.json* to get TypeScript-support.

```diff
{
  "compilerOptions": {
+   "baseUrl": "./",
+   "paths": {
+     "/lib/xp/*": ["./node_modules/@enonic-types/lib-*"],
+     "/lib/*": [ "./node_modules/@item-enonic-types/lib-*" ,"./src/main/resources/lib/*"],
+   }
  }
}
```

### Usage

```typescript
import { getSiteKey, verify, TURNSTILE_CLIENT_JS } from "/lib/cloudflare-turnstile";

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
  "cf-turnstile-response": string | string[];
};

export function post(req: Request<{ params: FormParams }>): Response {
  const result = verify(req);

  return {
    body: verify.success ? "You have been verified!" : "You are a bot!"
  };
}
```

## Deploying

### Building

To build the project, run the following command

```bash
enonic project build
```

### Deploying locally

To deploy to a local sandbox, run the following command

```bash
enonic project deploy
```

### Deploy to Maven

```bash
./gradlew publish -P com.enonic.xp.app.production=true
```

### Deploy to npm

```bash
npm publish
```

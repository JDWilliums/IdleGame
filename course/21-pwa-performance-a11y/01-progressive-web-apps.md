# 21.1 · Progressive Web Apps

> ⏱ 3 hours · Module 21 · PWA, Performance & Accessibility

## What you'll learn
- What makes a website a PWA, and why an idle game benefits
- The web app manifest: name, icons, display mode
- Service workers: lifecycle, caching strategies, and what never to cache
- Setting it up with `vite-plugin-pwa`, including an "update available" prompt
- Installing on Android, iOS and desktop
- Notifications, briefly

---

## Why a PWA?

Idle games are played in short sessions many times a day: check in, collect, start something new, leave. A **Progressive Web App** can be installed to the home screen, opens full-screen like a native app, and loads **with no network at all**. For Hearthwild that means:

- An icon on the phone's home screen, so players come back.
- The game shell loads offline. Combined with local-first saves (18.2), the whole game works on a plane.
- Browsers are much less likely to evict an installed app's storage (18.2).
- No app store, no review process, no 30% cut. Every update is just a deploy.

A PWA is still your website. Everything you've built keeps working. You add two things: a **manifest** and a **service worker**.

## The manifest

A JSON file describing the app to the operating system:

```json
{
  "name": "Hearthwild",
  "short_name": "Hearthwild",
  "description": "A cosy idle game: gather, craft and grow, on any device.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#1d1a16",
  "theme_color": "#1d1a16",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- `display: "standalone"` hides the browser UI when launched from the home screen.
- A **maskable** icon has its important content in the middle 80%, so Android can crop it to a circle or squircle without cutting anything off. maskable.app lets you preview it.
- `theme_color` tints the status bar or title bar.
- iOS also reads `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">` (180×180) from your HTML.

## Service workers

A **service worker** is a script the browser runs **separately from your page**. It sits between the page and the network, and can answer requests from a cache. It's what makes the app load offline.

### Lifecycle
1. **Register**: the page asks the browser to install `/sw.js`.
2. **Install**: the new worker downloads and caches the app shell (`index.html`, JS, CSS, icons).
3. **Wait**: if an old version is still controlling open tabs, the new one waits, so a page never runs with half old, half new code.
4. **Activate**: once old tabs close (or the new worker is told to skip waiting), it takes over and cleans up old caches.

Step 3 surprises everyone the first time: *you deploy, reload, and still see the old version.* That's correct behaviour. The fix is to show players an "Update available, reload?" prompt (below).

### Caching strategies

| Strategy | How | Use for |
|---|---|---|
| **Precache** | cached at install time, served from the cache | the app shell: `index.html`, hashed JS/CSS, icons |
| **Cache first** | cache, falling back to network | things that rarely change: fonts, images |
| **Network first** | network, falling back to cache | content that should be fresh but useful offline |
| **Network only** | never cached | **the API**: auth, saves, sync |

**Never cache API responses** in the service worker. A cached `GET /api/save` or `GET /api/auth/me` would show players stale or wrong data, and quietly break the revision logic of Module 18. Your local-first storage (18.2) already handles offline play.

## Setting it up with vite-plugin-pwa

Writing a service worker by hand is error-prone. `vite-plugin-pwa` generates one with Workbox, precaching exactly the files in your build:

```bash
npm install -D vite-plugin-pwa -w apps/web
```

```ts
// apps/web/vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',              // ask the player before switching to a new version
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: { /* the manifest above */ },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',   // client-side routes work offline (like 20.3's fallback)
        navigateFallbackDenylist: [/^\/api\//],
        // no runtimeCaching for /api: network only, by default
      },
    }),
  ],
});
```

### The update prompt
The plugin provides a React hook:

```tsx
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div role="status" className="update-toast">
      A new version of Hearthwild is ready.
      <button onClick={() => updateServiceWorker(true)}>Reload</button>
    </div>
  );
}
```

`updateServiceWorker(true)` activates the waiting worker and reloads. **Save locally first** (the lifecycle hooks from 14.4 do), so nothing is lost on reload. For TypeScript, add `/// <reference types="vite-plugin-pwa/react" />` to `vite-env.d.ts`.

The service worker only runs in production builds by default. Test with `vite build && vite preview`, and use **DevTools → Application → Service workers** ("Update on reload", "Offline") and **Application → Manifest** to check everything.

### Versions and saves
A cached app shell means a player may run **yesterday's code** with **today's server**. This is exactly why 18.1 says to deploy the server first and keep it accepting the previous save version. The update prompt keeps that window short.

## Installing

- **Android / Chrome / Edge**: the browser offers "Install app" once the site meets the installability criteria (HTTPS, a manifest with name and icons, a service worker). You can show your own install button using the `beforeinstallprompt` event (Chromium only).
- **iOS / iPadOS Safari**: no automatic prompt and no `beforeinstallprompt`. Players use **Share → Add to Home Screen**. Consider a one-time hint for iOS players explaining how.
- **Desktop Chrome/Edge**: an install icon in the address bar.

Detect when you're running installed with `matchMedia('(display-mode: standalone)').matches`, for example to hide your "install" hint.

## Notifications (a stretch goal)

"Your bank is full" or "Your oak logs are ready" is the classic idle-game notification. The **Push API** lets your server send notifications even when the game isn't open. On iOS this works only for apps added to the home screen (iOS 16.4 and later). It needs a push service, subscription storage and permission UX, so treat it as a stretch goal in C12. The golden rule: **ask for permission only after the player chooses to turn notifications on**, never on first load.

## Check your understanding

1. What two things turn a website into a PWA?
2. Why does a new deploy sometimes not appear when you reload?
3. Which caching strategy suits the app shell? Which suits `/api/save`?
4. Why does `navigateFallbackDenylist` include `/api/`?
5. How does an iOS player install a PWA?
6. Why should the server keep accepting the previous save version after a deploy?

<details><summary>Answers</summary>

1. A web app manifest and a service worker (served over HTTPS).
2. The new service worker waits until all tabs using the old one are closed, so no page mixes old and new code. Show an update prompt that activates it.
3. App shell: precache. `/api/save`: network only, never cached by the service worker.
4. So API requests are never answered with `index.html`. The fallback is only for page navigations.
5. Safari's Share button, then "Add to Home Screen". There's no automatic install prompt.
6. Players can keep running the cached previous version of the client until they reload, so their uploads may still be in the old format.
</details>

## Further reading
- web.dev: "Learn PWA" (the full course)
- vite-pwa-org.netlify.app: the vite-plugin-pwa guide, "Prompt for update" and "React"
- MDN: "Service Worker API", "Web app manifests"

---
[← Module overview](README.md) · [Next: Mobile polish →](02-mobile-polish.md)

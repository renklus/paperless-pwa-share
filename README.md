# paperless-pwa-share

Share files from any Android app straight into [paperless-ngx](https://docs.paperless-ngx.com/).

paperless-ngx has no share-menu integration on Android ([#1955](https://github.com/paperless-ngx/paperless-ngx/discussions/1955), [#8263](https://github.com/paperless-ngx/paperless-ngx/discussions/8263)). paperless-pwa-share is a small, purely client-side progressive web app. Install it once in Chrome, save your paperless URL and API token, and **To Paperless** shows up in the Android share sheet. Shared files are uploaded directly to paperless, and you see whether paperless consumed each one.

## Architecture

```
 ┌───────────────── ANDROID PHONE ─────────────────┐
 │                                                 │
 │  ┌──────────────┐   share   ┌────────────────┐  │
 │  │ Any app      │──────────▶│ "To Paperless" │  │
 │  │ (Files, ...) │           │ installed PWA  │  │
 │  └──────────────┘           └───┬────────┬───┘  │
 │                                 │        │      │
 └─────────────────────────────────┼────────┼──────┘
                                   │        │
        (1) app files, HTTPS       │        │ (2) uploads + status, HTTPS
            once per update        │        │     with API token
                                   ▼        ▼
                 ┌───────────────────┐   ┌───────────────────┐
                 │ HTTPS reverse     │   │ paperless-ngx     │
                 │ proxy             │   └───────────────────┘
                 └─────────┬─────────┘
                           ▼
                 ┌───────────────────┐
                 │ paperless-pwa-    │
                 │ share container   │
                 │ (static files)    │
                 └───────────────────┘
```

The container only serves the app's static files. It never talks to paperless and never sees your token or your files; uploads go directly from the phone to paperless.

## Requirements and limitations
- **No permissions handling** It just uploads the document as a simple API call. No configuration for permissions is possible in paperless-pwa-share.
- **Android with a Chromium browser** (Chrome, Edge, Samsung Internet), with the app *installed*. Firefox and iOS are not supported because they don't support the underlying API: [Web Share Target API](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target) ([browser support](https://caniuse.com/?search=share_target)).
- **HTTPS with trusted certificates** required for paperless-pwa-share and paperless-ngx (browser requirement).
- **No offline queue:** paperless must be reachable when you share.

## Installation
This chapter is AI generated and not tested. See chapter 'Intended use' for tested setup instructions.

1. **Run the container.**

   ```sh
   docker run -d -p 8080:8080 ghcr.io/renklus/paperless-pwa-share:latest
   ```

   ```yaml
   services:
     paperless-pwa-share:
       image: ghcr.io/renklus/paperless-pwa-share:latest
       ports: ["8080:8080"]
       restart: unless-stopped
   ```

2. **Put it behind an HTTPS reverse proxy**, for example with Caddy (also configure TLS, paperless-pwa-share does not support HTTPS, but it is required for the sharing menu to work):

   ```
   share.example.com {
       reverse_proxy localhost:8080
   }
   ```

3. **Allow the app's origin in paperless-ngx** and restart paperless-ngx:

   ```
   PAPERLESS_CORS_ALLOWED_HOSTS=https://share.example.com
   ```

4. **create a dedicated paperless-pwa-share user** with only the permissions the app needs:
   - **Document → Add**
   - **UISettings → View**
   - **PaperlessTask → View**

   Get its token under *Profile → API Auth Token*. The token is stored unencrypted by the app in the browser's IndexedDB (sandboxed by Android), so a limited user keeps the damage small if the phone is compromised.
5. **Import workflow** that sets correct permissions on every added document. The added document is by default owned by the dedicated paperless-pwa-share user. Only admin users can see it's documents. Create an import workflow that adds permissions for other users on the newly added documents. Trigger: "Document Added", Action 1: "Remove owners" and select the dedicated paperless-pwa-share user., Action 2: "Assignment" and select the intended owner.
7. **On the phone,** open the app URL in Chrome, then *Menu → Install app* (or *Add to Home screen*). It needs to be installed. A link on the home screen is not enough. If the install menu doesn't appear in Chrome, verify that it is a supported browser, OS, not an In-Private Window and the connection uses HTTPS.
8. Open the app, enter the paperless URL and token, and tap **Save** and **Test connection**.
9. Share a file from any app and pick **To Paperless**.

## Troubleshooting

- **Test connection fails with a network/CORS hint:** check that the URL is HTTPS and that `PAPERLESS_CORS_ALLOWED_HOSTS` contains exactly this app's origin (scheme and host, no path).
- **"To Paperless" is missing from the share sheet:** the app must be installed (not just opened in a tab) from Chrome or another Chromium browser.
- **Local network prompt:** if this app is on a public origin and paperless on a private IP, recent Chrome versions (142+) ask for local network access. Allow it.
- **Mixed content errors:** paperless-ngx must be served over HTTPS.

## Updating

Pull a new image; the app updates itself the next time it is opened. Tags: `latest` is the newest stable release, `X.Y.Z`, `X.Y` and `X` pin a release line, and `dev` is the latest build of `main` (prerelease).

## Application maintenance

This is a quick vibe-coded project for my own use. Don't expect reliable maintenance on this application. Fork it if you need something reliable. 

## Intended use

I use paperless-pwa-share on a k8s cluster. Ingress serves it over HTTPS, which is why the application container only supports plain HTTP.
### Configuration example
- Paperless-ngx URL: paperless.example.com
- paperless-pwa-share URL: pps.example.com

#### Paperless required environment variables
- PAPERLESS_URL=https://paperless.example.com
- PAPERLESS_CORS_ALLOWED_HOSTS=https://pps.example.com

#### paperless-pwa-share
- Paperless URL: https://paperless.example.com
- API token: copy from the dedicated paperless user

## Development

```sh
npm ci
npm run dev        # dev server
npm test           # vitest
npm run typecheck
npm run build
```

Releases: every push to `main` publishes a prerelease `X.Y.(Z+1)-dev.N`. A stable release is made by running the **Release** workflow and choosing patch, minor or major.

## License
Use everything in this repository in any way you like.
`Unlicense OR 0BSD`: pick whichever you prefer. See [UNLICENSE](UNLICENSE) and [LICENSE-0BSD](LICENSE-0BSD). Contributions are accepted under the same terms.

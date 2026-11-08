# paperless-pwa-share

Share files from any Android app straight into [paperless-ngx](https://docs.paperless-ngx.com/).

paperless-ngx has no share-menu integration on Android ([#1955](https://github.com/paperless-ngx/paperless-ngx/discussions/1955), [#8263](https://github.com/paperless-ngx/paperless-ngx/discussions/8263)). paperless-pwa-share is a small, purely client-side progressive web app. Install it once in Chrome, save your paperless URL and API token, and **To Paperless** shows up in the Android share sheet. Shared files are uploaded directly to paperless, and you see whether paperless consumed each one.

## Requirements and limitations

- **One user, one instance:** one paperless URL and one API token per installed app. No multiple accounts or profiles.
- **linux/amd64 image only.** There is no ARM image (no Raspberry Pi / arm64).
- **Android with a Chromium browser** (Chrome, Edge, Samsung Internet), with the app *installed*. Firefox and iOS are not supported. The app relies on the [Web Share Target API](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target) ([browser support](https://caniuse.com/?search=share_target)).
- **HTTPS with trusted certificates** for both this app and paperless (otherwise the browser blocks the calls as mixed content).
- **No offline queue:** paperless must be reachable when you share.

## Installation

1. **Run the container.**

   ```sh
   docker run -d -p 8080:8080 ghcr.io/<owner>/paperless-pwa-share:latest
   ```

   ```yaml
   services:
     paperless-pwa-share:
       image: ghcr.io/<owner>/paperless-pwa-share:latest
       ports: ["8080:8080"]
       restart: unless-stopped
   ```

2. **Put it behind an HTTPS reverse proxy**, for example with Caddy:

   ```
   share.example.com {
       reverse_proxy localhost:8080
   }
   ```

3. **Allow the app's origin in paperless** and restart it:

   ```
   PAPERLESS_CORS_ALLOWED_HOSTS=https://share.example.com
   ```

4. **Recommended: create a dedicated paperless user** with only the permissions the app needs:
   - **Document → Add**
   - **UISettings → View**

   Get its token under *Profile → API Auth Token*. The token is stored unencrypted by the app in the browser's IndexedDB (sandboxed by Android), so a limited user keeps the damage small if the phone is compromised.
5. **On the phone,** open the app URL in Chrome, then *Menu → Install app* (or *Add to Home screen*).
6. Open the app, enter the paperless URL and token, and tap **Test connection**.
7. Share a file from any app and pick **To Paperless**.

## Troubleshooting

- **Test connection fails with a network/CORS hint:** check that the URL is HTTPS and that `PAPERLESS_CORS_ALLOWED_HOSTS` contains exactly this app's origin (scheme and host, no path).
- **"To Paperless" is missing from the share sheet:** the app must be installed (not just opened in a tab) from Chrome or another Chromium browser.
- **Local network prompt:** if this app is on a public origin and paperless on a private IP, recent Chrome versions (142+) ask for local network access. Allow it.
- **Mixed content errors:** paperless must be served over HTTPS.

## Updating

Pull a new image; the app updates itself the next time it is opened. Tags: `latest` is the newest stable release, `X.Y.Z`, `X.Y` and `X` pin a release line, and `dev` is the latest build of `main` (prerelease).

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

`Unlicense OR 0BSD`: pick whichever you prefer. See [UNLICENSE](UNLICENSE) and [LICENSE-0BSD](LICENSE-0BSD). Contributions are accepted under the same terms.

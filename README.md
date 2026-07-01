# VirtFusion → Discord Relay

Receives VirtFusion webhook events and posts them as embeds to a Discord channel.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `DISCORD_WEBHOOK_URL` — a Discord channel webhook URL (Channel Settings → Integrations → Webhooks).
- `WEBHOOK_PATH` — the path VirtFusion will POST to (default `/webhooks/virtfusion`).
- `PORT` — port to listen on (default `3000`).

Run:

```bash
npm start
```

In VirtFusion, add a webhook pointing to `http://<this-host>:<PORT><WEBHOOK_PATH>`.

## Notes

- Unrecognized event types fall back to a generic embed built from common fields (`event`, `controlName`, server/user data, `errors`).
- Special-cased events with nicer titles: `server.boot`, `server.build`, `server.suspend`, `server.delete`, `user.create`. Add more in `src/formatEvent.js`.
- The endpoint currently accepts any POST with an `event` field — there is no shared-secret or signature check, so anyone who discovers the URL could send fake events. Add a shared-secret header check in `src/server.js` if the endpoint will be internet-reachable.

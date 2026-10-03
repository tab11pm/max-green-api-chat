# WhatsApp chat through GREEN-API

A local React and TypeScript demo for sending and receiving WhatsApp text
messages through GREEN-API. WhatsApp is used as the fallback messenger allowed
by the test assignment when a MAX instance is unavailable.

## Run locally

Use Node.js 22.12 or newer in the 22.x line, Node.js 24.x, or Node.js 26+.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Vite. In GREEN-API, prepare and authorize a
WhatsApp instance, then enter its **ID instance** and **API token instance**
on the connection screen. Select **Continue**, choose **New chat**, and enter
the recipient's international phone number. This demo currently accepts Russian
numbers beginning with `7` and Belarusian numbers beginning with `375`. After
the number is checked and the chat opens, send a text from the composer.

To check the full flow, reply to the message from WhatsApp and confirm the
reply appears in the chat. Chats and their history, together with connection
credentials, are retained in `sessionStorage`: they survive a page refresh in
the same tab but are cleared on **Disconnect** or when the browser session
ends. The left sidebar lets you reopen a saved chat and see its latest message.

During `npm run dev`, GREEN-API requests use Vite's same-origin `/green-api`
development proxy. Set `GREEN_API_URL` in `.env.local` to the `apiUrl` shown
in the GREEN-API instance card, for example `https://7107.api.greenapi.com`.
Restart `npm run dev` after changing this file. The repository includes only
`.env.example`; `.env.local` is ignored by Git. Do not store `idInstance` or
`apiTokenInstance` in any `.env` file.

## Credential handling

The instance ID and API token are stored only in this tab's `sessionStorage`
and are never committed to application files. Do not use a shared or public
computer for this demo; JavaScript running on this origin can read
`sessionStorage`. During local development, the browser sends requests to
Vite's proxy; credential-bearing request URLs can still be visible to someone
with access to browser developer tools or local network traffic. The Vite
proxy applies only to `npm run dev` and is intended for local evaluation with
an appropriate test instance. Production builds do not include this proxy. A
production application should route GREEN-API requests through a backend
session proxy that keeps API credentials off the browser.

## Checks

```sh
npm run test -- --run
npm run build
```

To diagnose the GREEN-API connection without starting the UI, provide the
instance host, ID, and token through the shell environment and run:

```sh
GREEN_API_URL=https://your-cluster.api.green-api.com \
GREEN_API_ID=your-id GREEN_API_TOKEN=your-token npm run check:green-api
```

The script calls `getStateInstance`, masks the instance ID, never prints the
token or the response body, and exits non-zero for a wrong host, invalid
credentials, or a non-authorized instance.

Real GREEN-API acceptance requires an authorized WhatsApp instance and valid
credentials: connect, open a chat using an international phone number, send a
text, reply from WhatsApp, confirm the incoming text appears, and refresh to
confirm the selected chat and history are retained for the current tab.

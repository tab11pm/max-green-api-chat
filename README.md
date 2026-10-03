# MAX chat through GREEN-API

A local React and TypeScript demo for sending and receiving MAX text messages
through GREEN-API.

## Run locally

Use Node.js 22.12 or newer in the 22.x line, Node.js 24.x, or Node.js 26+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. In GREEN-API, prepare an instance enabled
for MAX, then enter its **ID instance** and **API token instance** on the
connection screen. Select **Continue**, choose **New chat**, and enter the
recipient's international phone number. This demo currently accepts Russian
numbers beginning with `7` and Belarusian numbers beginning with `375`. After
the number is checked and the chat opens, send a text from the composer. Keep
the chat open to receive incoming text messages from that recipient.

To check the full flow, reply to the message from MAX and confirm the reply
appears in the chat. Refreshing the page or selecting **Disconnect** returns
to the connection screen; credentials and chat state are not restored.

## Credential handling

The instance ID and API token are held only in React memory. The app does not
save them to browser storage or include them in application files, so they are
cleared when the page is refreshed or disconnected. Since this is a direct
browser integration, credentials are still used in requests from the browser
and can be visible to someone with access to that browser's developer tools or
network traffic. Use this integration only for local evaluation with an
appropriate test instance. Do not publish or deploy it as a production client;
a production application should send GREEN-API requests through a backend
session proxy that keeps API credentials off the browser.

## Checks

```sh
npm run test -- --run
npm run build
```

Real GREEN-API acceptance requires a MAX-enabled instance and valid credentials:
connect, open a chat using an international phone number, send a text, reply
from MAX, confirm the incoming text appears, and refresh to confirm credentials
are not retained.

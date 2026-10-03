# MAX chat with GREEN-API — design specification

## Purpose

Build a small React application for a frontend-developer test assignment. A
user supplies their GREEN-API MAX credentials, creates a chat by recipient
phone number, sends text messages, and sees incoming text replies in that
chat.

The app is a local demonstration client. It deliberately does not attempt to
be a full messenger: one current chat, text messages only, no persistence,
contacts, attachments, or account management.

## Constraints and security

- React and TypeScript are required.
- Use GREEN-API MAX endpoints for sending a message and HTTP API notification
  polling for receiving messages.
- Credentials (`idInstance`, `apiTokenInstance`) exist solely in React memory.
  They are never written to localStorage, sessionStorage, URLs, source files,
  logs, or an environment file.
- Because this is a browser-only demo, a credential is necessarily present in
  requests sent by the browser. The README will explicitly label this as a
  local-demo trade-off and advise using a backend session proxy for production.

## User flow

1. On the connection screen, the user enters `idInstance` and
   `apiTokenInstance` and selects **Continue**.
2. In the chat screen, the user selects **New chat**, enters a recipient
   phone number in international format, and opens the chat. The app verifies
   the number with `CheckAccount` and uses the returned MAX `chatId`.
3. The user enters non-blank text and sends it. It is added to the timeline
   only after GREEN-API confirms the send.
4. The app polls for incoming notifications while the chat is open. Incoming
   text messages from the current recipient appear in the timeline.

## Architecture

```
App
├── ConnectionScreen        owns credential form validation
└── ChatScreen              owns recipient flow and visual layout
    ├── ChatHeader          shows recipient and transport status
    ├── MessageTimeline     renders normalized messages
    └── Composer            validates and submits text

greenApiClient              transport-only API module
notificationParser          pure notification-to-message conversion
phone.ts                    pure phone normalization / chat-id conversion
useNotifications            polling lifecycle and notification acknowledgement
```

`App` holds the in-memory connection and current chat session. The API client
receives credentials as call arguments; no module stores them. Pure parsing
and phone conversion are independent of React for straightforward tests.

## GREEN-API data flow

- Sending calls `POST /waInstance{idInstance}/sendMessage/{apiTokenInstance}`
  with `{ chatId, message }`.
- Creating a chat calls `POST /waInstance{idInstance}/checkAccount/{apiTokenInstance}`
  with the normalized international `phoneNumber`. The returned `chatId` is
  retained only for the active in-memory chat. This is required for reliable
  incoming-message matching; phone-number `@c.us` identifiers are only a
  backwards-compatible alternative.
- Polling calls `GET /waInstance{idInstance}/receiveNotification/{apiTokenInstance}`
  at a restrained fixed interval. A `null` response means there is no event.
- A supported `incomingMessageReceived` text event is normalized into an
  incoming message only if its sender matches the active chat.
- Each non-null notification is acknowledged with
  `DELETE /waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}`
  after it has been considered, so polling does not receive it again.

## States and error handling

- The connection form requires both values before continuation.
- The new-chat form accepts an 11-digit Russian (`7`) or 12-digit Belarusian
  (`375`) international number. A non-MAX number produces clear guidance and
  does not open a chat.
- The composer disables sending blank or in-flight messages.
- An API failure leaves existing messages unchanged, shows a compact,
  actionable status message, and returns controls to an enabled state.
- Polling failures change the connection indicator to **Connection issue**;
  polling tries again at the next interval.
- When the user leaves a chat or disconnects, the polling timer is cleaned up
  to prevent duplicate requests and stale state updates.

## Visual direction

The layout borrows the practical spatial model of a desktop messenger without
copying MAX assets or branding: a quiet pale-blue application shell, a compact
left navigation rail on wide screens, and a single message surface. Outgoing
messages use a restrained blue bubble; incoming messages use white. Controls
have visible focus states, status text does not rely on colour alone, and the
two-column layout collapses naturally on small screens.

## Verification

- Unit-test phone normalization and chat-id construction.
- Unit-test notification parsing, including ignored unsupported and foreign
  messages.
- Unit-test GREEN-API request construction and failed responses with mocked
  `fetch`.
- Build the production bundle and run the full test suite.
- Manually verify: connect, create a chat, send a message, and receive a
  reply using an instance with real GREEN-API credentials.

## Out of scope

Persistent credentials or history, multimedia, typing indicators, user
profiles, a contact list, multiple chats, read receipts, authentication
server, and public production hosting are not part of this assignment.

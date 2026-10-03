# MAX GREEN-API Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure-in-memory React demonstration client that sends and receives MAX text messages through GREEN-API.

**Architecture:** A Vite React TypeScript single-page application holds credentials and the active chat only in component state. Pure phone and notification modules establish the data contract; a transport-only GREEN-API client and polling hook sit below focused connection and chat UI components.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS.

**Spec:** `docs/superpowers/specs/2026-10-03-max-green-api-chat-design.md`

## Global Constraints

- Credentials (`idInstance`, `apiTokenInstance`) must exist only in React memory; never write them to browser storage, URLs, source files, logs, or `.env`.
- Implement text messages only; do not add contacts, history persistence, media, multiple chats, or account management.
- Use GREEN-API MAX `sendMessage` and HTTP notification receive/delete endpoints.
- The browser-only app is a local demo; document that a server session proxy is needed for production credential isolation.
- Use accessible sentence-case Russian interface copy, visible keyboard focus, and status text that does not depend on colour alone.

## Review Focus

- A phone number with spaces, punctuation, or a leading `+` must produce the same normalized `phoneNumber` request value as its digits-only form.
- A blank or whitespace-only outgoing message must never trigger a network request.
- A notification for another sender or non-text message must not be shown in the active chat, but must still be acknowledged.
- A polling request must stop when the active chat is closed or the component unmounts, preventing stale messages and duplicate timers.
- API failures must preserve the current conversation and return the relevant control to an actionable state with visible text.

---

## File structure

| Path | Responsibility |
| --- | --- |
| `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html` | Vite, TypeScript, test scripts, and root document. |
| `src/main.tsx`, `src/App.tsx` | React mount and in-memory screen/session orchestration. |
| `src/styles.css` | Responsive messenger shell, accessible controls, and message bubbles. |
| `src/domain/phone.ts` | Phone validation and normalized `phoneNumber` conversion. |
| `src/domain/notifications.ts` | Pure GREEN-API notification normalization. |
| `src/api/greenApiClient.ts` | Typed send, receive, and delete HTTP calls. |
| `src/hooks/useNotifications.ts` | Controlled polling lifecycle and event acknowledgement. |
| `src/components/ConnectionScreen.tsx` | Credentials form with local validation. |
| `src/components/NewChatDialog.tsx` | Recipient-number entry flow. |
| `src/components/ChatScreen.tsx` | Chat layout, send state, error/status integration. |
| `src/components/MessageTimeline.tsx`, `src/components/Composer.tsx` | Message rendering and text composition. |
| `src/**/*.test.ts(x)` | Unit and UI regression tests co-located with owned behaviour. |
| `README.md` | Local run instructions, GREEN-API setup, and browser-demo security note. |

### Task 1: Scaffold the tested React application

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/vite-env.d.ts`, `src/test/setup.ts`
- Create: `README.md`, `.gitignore`

**Interfaces:**
- Produces: a Vite application with `npm run dev`, `npm run test`, and `npm run build`; `App` is the root component.

- [ ] **Step 1: Scaffold Vite React TypeScript and install the test dependencies**

Use React, TypeScript, Vitest, jsdom, and Testing Library; configure Vitest to load `src/test/setup.ts` and expose globals.

- [ ] **Step 2: Write the failing root render test**

Create `src/App.test.tsx` asserting `render(<App />)` exposes the credentials heading `Подключение к GREEN-API`.

- [ ] **Step 3: Run the root test to verify it fails**

Run: `npm run test -- --run src/App.test.tsx`

Expected: FAIL because the application screen is not implemented.

- [ ] **Step 4: Implement the minimal `App(): JSX.Element` root screen and application CSS**

Render the required heading through the root component; establish the pale-blue responsive shell and global visible focus style without storing any credentials.

- [ ] **Step 5: Run the root test to verify it passes**

Run: `npm run test -- --run src/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the scaffold**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src README.md .gitignore
git commit -m "chore: scaffold MAX chat app"
```

### Task 2: Establish phone and notification domain contracts

**Files:**
- Create: `src/domain/phone.ts`, `src/domain/phone.test.ts`
- Create: `src/domain/notifications.ts`, `src/domain/notifications.test.ts`

**Interfaces:**
- Produces: `normalizePhone(phone: string): string | null`.
- Produces: `parseIncomingText(notification: unknown, activeChatId: string): IncomingMessage | null` and types `IncomingMessage`, `NotificationEnvelope`.
- Consumed by: Tasks 3–5.

- [ ] **Step 1: Write the failing phone-domain tests**

In `src/domain/phone.test.ts`, assert `normalizePhone('+7 (999) 123-45-67')` equals `79991234567`, accepts a `375` Belarusian number, and rejects invalid lengths or country codes.

- [ ] **Step 2: Run the phone test to verify it fails**

Run: `npm run test -- --run src/domain/phone.test.ts`

Expected: FAIL because the converter does not exist.

- [ ] **Step 3: Implement `normalizePhone` in `src/domain/phone.ts`**

Retain digits only and accept precisely the documented Russian 11-digit or Belarusian 12-digit international forms.

- [ ] **Step 4: Run the phone test to verify it passes**

Run: `npm run test -- --run src/domain/phone.test.ts`

Expected: PASS.

- [ ] **Step 5: Write the failing notification parser tests**

Assert a matching `incomingMessageReceived` text payload becomes `{ direction: 'incoming', text, timestamp }`; assert foreign-sender and non-text payloads return `null`.

- [ ] **Step 6: Run the parser test to verify it fails**

Run: `npm run test -- --run src/domain/notifications.test.ts`

Expected: FAIL because the parser does not exist.

- [ ] **Step 7: Implement `parseIncomingText` in `src/domain/notifications.ts`**

Narrow unknown data defensively and return a normalized message only for current-chat incoming text. Keep the notification receipt data available to Task 4 for acknowledgement.

- [ ] **Step 8: Run domain tests to verify they pass**

Run: `npm run test -- --run src/domain/phone.test.ts src/domain/notifications.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit the domain contracts**

```bash
git add src/domain
git commit -m "feat: add chat domain utilities"
```

### Task 3: Implement the GREEN-API transport client

**Files:**
- Create: `src/api/greenApiClient.ts`, `src/api/greenApiClient.test.ts`

**Interfaces:**
- Consumes: `ConnectionCredentials { idInstance: string; apiTokenInstance: string }` and `NotificationEnvelope` from Task 2.
- Produces: `createGreenApiClient(credentials)` returning `checkAccount(phoneNumber: string)`, `sendText(chatId: string, text: string)`, `receiveNotification()`, and `deleteNotification(receiptId: number)` promises.
- Consumed by: Task 4 and Task 5.

- [ ] **Step 1: Write the failing send-client test**

Mock `fetch` and assert `sendText('recipient-chat-id', 'Привет')` makes the documented `POST sendMessage` request with JSON `{ chatId, message: 'Привет' }`.

- [ ] **Step 2: Run the send-client test to verify it fails**

Run: `npm run test -- --run src/api/greenApiClient.test.ts`

Expected: FAIL because the client is missing.

- [ ] **Step 3: Implement `createGreenApiClient(credentials)` in `src/api/greenApiClient.ts`**

Build endpoint URLs from arguments without emitting credentials. For non-OK responses, throw an error containing the operation name and safe HTTP status only.

- [ ] **Step 4: Run the send-client test to verify it passes**

Run: `npm run test -- --run src/api/greenApiClient.test.ts`

Expected: PASS.

- [ ] **Step 5: Add failing account-check, receive/delete, and failure-state tests**

Assert `checkAccount('79991234567')` posts `{ phoneNumber: 79991234567 }` to the documented endpoint and returns `chatId` only for `exist: true`; also assert receive uses the documented endpoint, `null` is returned for no notification, delete uses its receipt id, and a non-OK response rejects without exposing the token.

- [ ] **Step 6: Run the API-client test to verify it fails**

Run: `npm run test -- --run src/api/greenApiClient.test.ts`

Expected: FAIL for the not-yet-implemented receive/delete behaviour.

- [ ] **Step 7: Extend the client with `checkAccount`, `receiveNotification`, and `deleteNotification`**

Use `POST` for account lookup and return the account `chatId` only when `exist` is true; return parsed JSON or `null` for an empty receive response; use `DELETE` for acknowledgement.

- [ ] **Step 8: Run the API-client test to verify it passes**

Run: `npm run test -- --run src/api/greenApiClient.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit the API client**

```bash
git add src/api
git commit -m "feat: add GREEN-API client"
```

### Task 4: Add lifecycle-safe notification polling

**Files:**
- Create: `src/hooks/useNotifications.ts`, `src/hooks/useNotifications.test.tsx`

**Interfaces:**
- Consumes: `GreenApiClient`, `parseIncomingText`, active `chatId`, and `onMessage(IncomingMessage)` callback.
- Produces: `useNotifications(options): { status: 'online' | 'issue' }`.
- Consumed by: Task 5.

- [ ] **Step 1: Write the failing polling-hook test**

With fake timers and a mocked client, assert a matching incoming message calls `onMessage`, every non-null notification is deleted, and a foreign message is not emitted.

- [ ] **Step 2: Run the hook test to verify it fails**

Run: `npm run test -- --run src/hooks/useNotifications.test.tsx`

Expected: FAIL because the hook is missing.

- [ ] **Step 3: Implement `useNotifications` in `src/hooks/useNotifications.ts`**

Start a single interval only when a client and active chat exist; receive, parse, acknowledge in `finally`, report polling issues, and clear the interval during cleanup.

- [ ] **Step 4: Run the core hook test to verify it passes**

Run: `npm run test -- --run src/hooks/useNotifications.test.tsx`

Expected: PASS.

- [ ] **Step 5: Add the failing unmount-cleanup test**

Unmount the hook, advance timers, and assert no further receive request occurs.

- [ ] **Step 6: Run the cleanup test to verify it fails**

Run: `npm run test -- --run src/hooks/useNotifications.test.tsx`

Expected: FAIL because the timer cleanup is not implemented.

- [ ] **Step 7: Complete cleanup handling and re-run the hook tests**

Ensure the cleanup clears the timer and guards asynchronous callbacks from updating unmounted state.

Run: `npm run test -- --run src/hooks/useNotifications.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit the polling hook**

```bash
git add src/hooks
git commit -m "feat: poll incoming GREEN-API messages"
```

### Task 5: Build the connection and chat user flows

**Files:**
- Create: `src/components/ConnectionScreen.tsx`, `src/components/NewChatDialog.tsx`
- Create: `src/components/ChatScreen.tsx`, `src/components/MessageTimeline.tsx`, `src/components/Composer.tsx`
- Create: `src/components/ChatScreen.test.tsx`, `src/components/ConnectionScreen.test.tsx`
- Modify: `src/App.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `ConnectionCredentials`, `normalizePhone`, `createGreenApiClient`, and `useNotifications`.
- Produces: an end-to-end in-memory connect → open chat → send → receive user experience.

- [ ] **Step 1: Write the failing connection-flow test**

Render `App`, submit blank credentials, and assert clear field guidance. Enter valid values, submit, and assert the chat screen appears; assert no browser-storage API is called.

- [ ] **Step 2: Run the connection test to verify it fails**

Run: `npm run test -- --run src/components/ConnectionScreen.test.tsx`

Expected: FAIL because the connection flow is absent.

- [ ] **Step 3: Implement `ConnectionScreen` and in-memory connection transition in `App`**

Accept `onConnect(credentials: ConnectionCredentials): void`; keep the object only in `App` state and pass it down without persistence.

- [ ] **Step 4: Run the connection test to verify it passes**

Run: `npm run test -- --run src/components/ConnectionScreen.test.tsx`

Expected: PASS.

- [ ] **Step 5: Write the failing new-chat and composer tests**

Assert an invalid number shows guidance; a normalized valid number calls `checkAccount` and opens the chat with its returned `chatId`; a non-MAX number stays on the dialog with clear guidance; a whitespace composer cannot send; a valid message calls `sendText` and appears only after its promise resolves; a rejected send preserves the timeline and shows safe error text.

- [ ] **Step 6: Run the chat UI test to verify it fails**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx`

Expected: FAIL because the chat controls are incomplete.

- [ ] **Step 7: Implement `NewChatDialog`, `ChatScreen`, `MessageTimeline`, and `Composer`**

Use `normalizePhone` and `checkAccount` to establish the active chat, append only confirmed outgoing messages, surface send and polling states as text, and render message direction accessibly. Wire `useNotifications` so matching replies append to the same in-memory timeline.

- [ ] **Step 8: Run component tests to verify they pass**

Run: `npm run test -- --run src/components/ConnectionScreen.test.tsx src/components/ChatScreen.test.tsx`

Expected: PASS.

- [ ] **Step 9: Refine responsive and accessible layout styles**

Implement the restrained MAX-inspired two-panel layout on desktop, compact one-panel layout on mobile, keyboard focus, readable status labels, and reduced-motion-safe transitions.

- [ ] **Step 10: Run all component tests after styling changes**

Run: `npm run test -- --run`

Expected: PASS.

- [ ] **Step 11: Commit the user flow**

```bash
git add src/App.tsx src/components src/styles.css
git commit -m "feat: add MAX text chat interface"
```

### Task 6: Document and verify the deliverable

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: completed scripts and UI from Tasks 1–5.
- Produces: concise, reproducible local run and manual verification instructions.

- [ ] **Step 1: Extend `README.md` with local setup and safety instructions**

Document Node version requirement, `npm install`, `npm run dev`, the two GREEN-API credentials, recipient-number flow, and why tokens are kept only in memory. State that the direct browser integration is intended only for local evaluation.

- [ ] **Step 2: Run the complete automated test suite**

Run: `npm run test -- --run`

Expected: PASS with zero failing tests.

- [ ] **Step 3: Build the production bundle**

Run: `npm run build`

Expected: Vite completes successfully and writes `dist/`.

- [ ] **Step 4: Perform the manual GREEN-API acceptance checklist**

With a real MAX-enabled GREEN-API instance: connect; open a chat using an international phone number; send a text; respond from MAX; confirm the incoming text arrives; refresh and confirm credentials are not retained.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md
git commit -m "docs: add local run instructions"
```

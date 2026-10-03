# Saved Chat List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist multiple chats and their independent message histories in the left sidebar for the current browser session.

**Architecture:** `App` owns a normalized session containing credentials, saved chat records, and the active chat ID. `ChatScreen` receives those records to render and reports selection, opening, and message changes upward. The active chat remains keyed by `chatId`, so its local timeline initializes from the matching record whenever the user switches.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, `sessionStorage`.

## Global Constraints

- Store credentials and chat data only in `sessionStorage`, never `localStorage`.
- Migrate the legacy `{ activeChat, messages }` session at read time.
- Reopening a known `chatId` must not make a duplicate or erase history.
- Do not change user-owned edits in `src/domain/phone.ts`, `vite.config.ts`, or `docs/superpowers/DESIGN.md`.
- Finish with `npm run test -- --run`, `npm run build`, and `git diff --check`.

---

### Task 1: Normalize multi-chat persistence

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**

- Produces `SavedChat = ActiveChat & { messages: TimelineMessage[] }`.
- Produces `ChatSession = { credentials: ConnectionCredentials; chats: SavedChat[]; activeChatId: string | null }`.
- Supplies `ChatScreen` with saved chats, selection, and per-chat message callbacks.

- [ ] **Step 1: Write failing persistence and migration tests**

```tsx
test('restores every saved chat and the selected chat history', () => {
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'token' },
    activeChatId: 'chat-two',
    chats: [
      { chatId: 'chat-one', phone: '+7 999 111-11-11', messages: [] },
      { chatId: 'chat-two', phone: '+7 999 222-22-22', messages: [{ id: '2', direction: 'incoming', text: 'Второй чат', timestamp: 2 }] },
    ],
  }))
  render(<App />)
  expect(screen.getByRole('button', { name: /\+7 999 111-11-11/ })).toBeInTheDocument()
  expect(screen.getByText('Второй чат')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test and observe the expected failure**

Run: `npm run test -- --run src/App.test.tsx`

Expected: FAIL because `App` only understands one `activeChat` and only sends one record to the sidebar.

- [ ] **Step 3: Implement the normalized model and legacy migration**

```tsx
interface SavedChat extends ActiveChat {
  messages: TimelineMessage[]
}

interface ChatSession {
  credentials: ConnectionCredentials
  chats: SavedChat[]
  activeChatId: string | null
}
```

Validate credentials as before. Return the new shape directly, or convert an old saved `activeChat` plus `messages` into a single `SavedChat`. On opening a chat, find it by `chatId`: select it if present, otherwise append an empty saved record. Update only the matching record when its messages change. Closing changes only `activeChatId` to `null`.

- [ ] **Step 4: Run the focused tests and observe them pass**

Run: `npm run test -- --run src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the persistence slice**

Run: `git add src/App.tsx src/App.test.tsx && git commit -m "feat: persist multiple chat sessions"`

### Task 2: List and select saved chats in the sidebar

**Files:**

- Modify: `src/components/ChatScreen.tsx`
- Modify: `src/components/ChatScreen.test.tsx`
- Modify: `src/styles.css` only if button reset or active-state styling is required

**Interfaces:**

- Consumes `chats: Array<ActiveChat & { messages: TimelineMessage[] }>`, `activeChatId`, and `onSelectChat(chatId)`.
- Consumes `onMessagesChange(chatId, messages)`.
- Produces one accessible sidebar button per saved chat, with `aria-current="page"` only on the active chat.

- [ ] **Step 1: Write a failing list-and-switching test**

```tsx
it('lists two chats and restores the selected chat history', async () => {
  // Open chat one, send 'Сообщение первого чата', then open chat two.
  expect(screen.getByRole('button', { name: /\+7 \(999\) 123-45-67/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /\+7 \(999\) 765-43-21/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /\+7 \(999\) 123-45-67/ }))
  expect(screen.getByText('Сообщение первого чата')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test and observe the expected failure**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx`

Expected: FAIL because the component accepts and displays only one active chat.

- [ ] **Step 3: Implement the accessible sidebar list**

```tsx
{chats.map((chat) => (
  <button
    key={chat.chatId}
    className="chat-preview"
    type="button"
    aria-current={chat.chatId === activeChatId ? 'page' : undefined}
    onClick={() => onSelectChat(chat.chatId)}
  >
    {/* existing avatar and phone content */}
  </button>
))}
```

Derive the active chat from `chats` and `activeChatId`. Start `nextMessageId` higher than any numeric saved ID to prevent duplicate React keys after reload. Maintain existing polling and send behavior, but save the active record only.

- [ ] **Step 4: Run the focused tests and observe them pass**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the sidebar slice**

Run: `git add src/components/ChatScreen.tsx src/components/ChatScreen.test.tsx src/styles.css && git commit -m "feat: switch saved chats from sidebar"`

### Task 3: Cover deduplication and perform final verification

**Files:**

- Modify: `src/components/ChatScreen.test.tsx`

**Interfaces:**

- Validates Tasks 1–2; no new production interface.

- [ ] **Step 1: Write a failing duplicate-chat test**

```tsx
it('selects an existing chat instead of adding it twice', async () => {
  // Verify the same recipient twice through the new-chat dialog.
  expect(screen.getAllByRole('button', { name: /\+7 \(999\) 123-45-67/ })).toHaveLength(1)
})
```

- [ ] **Step 2: Run the test and observe the expected failure**

Run: `npm run test -- --run src/components/ChatScreen.test.tsx`

Expected: FAIL if re-opening a known recipient creates a second saved record.

- [ ] **Step 3: Keep deduplication at the App boundary**

Use the `chatId` lookup in `App` as the single deduplication point. Do not add separate deduplication logic to the presentational sidebar.

- [ ] **Step 4: Run full verification**

Run: `npm run test -- --run && npm run build && git diff --check`

Expected: all tests pass, build exits 0, and the whitespace check is empty.

- [ ] **Step 5: Commit regression coverage**

Run: `git add src/App.test.tsx src/components/ChatScreen.test.tsx && git commit -m "test: cover saved chat persistence"`


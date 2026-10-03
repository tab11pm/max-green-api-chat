# Chat Preview Last Message Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Show each saved chat's last message in the sidebar instead of an activity label.

**Architecture:** Derive preview text from the final item in a saved chat's existing messages array while rendering the sidebar. No persistence or API changes are required.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS.

## Global Constraints

- Do not change session persistence or GREEN-API behavior.
- Render no preview element for an empty message list.
- Keep the chat button accessible name as its phone number.
- Do not modify user-owned src/domain/phone.ts or vite.config.ts.

---

### Task 1: Render last-message previews

**Files:**

- Modify: src/components/ChatScreen.tsx
- Modify: src/components/ChatScreen.test.tsx
- Modify: src/styles.css only if the preview needs one-line ellipsis styling

**Interfaces:**

- Consumes existing chat.messages: TimelineMessage[].
- Produces the final message text under the phone number, or no secondary element for empty histories.

- [ ] **Step 1: Write failing component tests**

Add a test which renders a saved chat with first and last messages, then asserts the final text is visible and "Текущий чат" is absent. Add a test that renders a saved chat without messages and asserts "Сохранённый чат" is absent.

- [ ] **Step 2: Run focused tests and observe failure**

Run: npm run test -- --run src/components/ChatScreen.test.tsx

Expected: FAIL because the sidebar still renders activity labels.

- [ ] **Step 3: Implement the smallest sidebar change**

Compute the final item with chat.messages.at(-1). Render its text in the existing secondary element only when present. Keep aria-label={chat.phone}. Use overflow hidden, text-overflow ellipsis, and white-space nowrap only if the existing preview selector lacks them.

- [ ] **Step 4: Run focused tests and observe success**

Run: npm run test -- --run src/components/ChatScreen.test.tsx

Expected: PASS.

- [ ] **Step 5: Run full verification and commit**

Run: npm run test -- --run && npm run build && git diff --check

Expected: all tests pass, build succeeds, and no whitespace errors.

Run: git add src/components/ChatScreen.tsx src/components/ChatScreen.test.tsx src/styles.css && git commit -m "feat: show last message in chat previews"


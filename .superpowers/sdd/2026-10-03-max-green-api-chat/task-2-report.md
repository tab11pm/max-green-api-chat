# Task 2 report — Establish phone and notification domain contracts

Status: DONE

## Changes

- Added `normalizePhone`, which removes non-digits and accepts exactly 11-digit Russian numbers beginning with `7` and 12-digit Belarusian numbers beginning with `375`.
- Added `IncomingMessage` and `NotificationEnvelope` domain types and `parseIncomingText` for matching incoming text notifications. It accepts either a raw notification or a receipt envelope with `receiptId` and `body`; the envelope remains available to the caller for acknowledgement.
- The notification parser validates unknown data defensively and ignores other event types, chats, malformed payloads, and invalid timestamps.

## TDD evidence

- Phone RED: `npm run test -- --run src/domain/phone.test.ts` exited 1 because the `./phone` module did not exist. Vitest reported the unresolved import.
- Phone GREEN: after adding `src/domain/phone.ts`, the same command exited 0 with 1 file / 3 tests passed.
- Notification RED: `npm run test -- --run src/domain/notifications.test.ts` exited 1 because the `./notifications` module did not exist. Vitest reported the unresolved import.
- Notification GREEN: after adding `src/domain/notifications.ts`, `npm run test -- --run src/domain/phone.test.ts src/domain/notifications.test.ts` exited 0 with 2 files / 6 tests passed.

## Final verification

- `npm run test -- --run`: exit 0, 3 files / 7 tests passed.
- `npm run build`: exit 0; TypeScript and Vite production build succeeded.
- `git diff --check`: exit 0.

## Files changed

- `src/domain/phone.ts`
- `src/domain/phone.test.ts`
- `src/domain/notifications.ts`
- `src/domain/notifications.test.ts`
- `.superpowers/sdd/2026-10-03-max-green-api-chat/task-2-report.md`

## Self-review and concerns

The parser returns only the normalized message fields while accepting the transport envelope as input, so callers can retain and acknowledge its receipt ID. It rejects non-finite timestamps and malformed nested objects instead of throwing. Phone validation intentionally checks country prefix and digit count only, as specified; it does not validate operator or area allocations. No UI/API-client code, credential storage, or credential logging was added.

No blocking concerns.

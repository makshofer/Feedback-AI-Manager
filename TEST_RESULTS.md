# Test Results Log

Date: 2026-04-21 (UTC)

## Automated checks

1. `pnpm run typecheck`
   - ✅ Passed.
   - Covers TypeScript validation for libraries and app packages.

2. `pnpm run build`
   - ⚠️ Partial failure due to environment constraints in workspace-level build.
   - `artifacts/mockup-sandbox` requires `PORT` env variable at build-time.

3. `pnpm --filter @workspace/api-server run build`
   - ✅ Passed.
   - Confirms API server compiles after Telegram + RAG integration changes.

4. `PORT=4173 BASE_PATH=/ pnpm --filter @workspace/feedback-ai run build`
   - ✅ Passed.
   - Confirms frontend compiles with updated UI/UX and role/bot enhancements.

## Voice / Speech-to-Text test notes

- Frontend voice capture flow was updated to support dual transcription paths:
  - Server-side STT via API (`/api/feedbacks/transcribe`).
  - Browser SpeechRecognition fallback when server-side STT is unavailable.
- Functional verification performed via static/type/build checks for the updated voice pipeline.
- Full microphone/browser runtime validation requires interactive browser execution and user media permissions.

## Telegram integration test notes

1. Bot API connectivity check:
   - Command used:
     - `TELEGRAM_BOT_TOKEN=*** node -e '... getMe ...'`
   - ⚠️ Could not complete due to environment outbound network restriction (`ENETUNREACH`).

2. Integration status in code:
   - Added polling + webhook handlers.
   - Added DB persistence for text/voice feedback from bot.
   - Added auto-reply confirmation message after successful capture.

## Role authorization checks

- Role indicators and role-aware routing are validated by TypeScript/build checks.
- End-to-end login scenario (admin vs manager) requires runtime DB-backed environment and seeded users.

# Security

## Authentication

Sessions use a 48-byte hex token stored in the `sessions` table. Every request performs a DB lookup — there are no stateless JWTs. Logout deletes the session row immediately, with no grace period.

Password hashing: **scrypt** with a 32-byte random salt and 64-byte derived key, stored as `salt:hex`.

## Data Encryption

| Data | Method |
|------|--------|
| Health record content | AES-256-GCM, encrypted at rest |
| Messages | End-to-end encrypted — ECDH key exchange per conversation, AES-256-GCM |
| Documents | Stored in private Cloudflare R2; access via presigned URLs (15-min expiry) |
| Passwords | scrypt (salt 32B, keylen 64B) |
| Transport | TLS 1.3 enforced by Fly.io and Vercel |

## Audit Logging

Every read of PHI, write to health records, appointment action, and auth event is recorded in `audit_logs`. Logs are immutable (no update/delete routes) and retained for 6 years per HIPAA requirements. Only non-PHI metadata is stored in log entries.

## Authorization

Routes are protected at two levels:

1. `request.authenticate()` — validates session token, attaches user to request
2. `request.requireRole(role)` — enforces role-based access (PATIENT / DOCTOR / ADMIN)

Both are opt-in decorators applied per route, not global middleware.

## Input Validation

All request bodies and query params are validated with Zod schemas defined in `packages/shared`. Invalid input returns `400` with field-level error details. Zod schemas are shared between the API and frontend to keep validation consistent.

## HIPAA Alignment

- PHI stored in encrypted form at rest
- Access control via role-based authorization
- Full audit trail with 6-year retention
- Business Associate Agreements in place with Neon, Cloudflare, and Resend
- Emergency care disclaimer shown throughout the UI

See the live HIPAA notice: https://medflow-five.vercel.app/hipaa

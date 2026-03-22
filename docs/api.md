# API Reference

Base URL: `/api/v1/`
Auth: `Authorization: Bearer <token>` — opt-in per route via `request.authenticate()`

---

## `/auth`

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/register/patient` | ❌ | `email, password, firstName, lastName, dateOfBirth, gender` | Enqueues verification email |
| POST | `/register/doctor` | ❌ | `email, password, firstName, lastName, specialty, licenseNumber, licenseState, consultationFee, yearsExperience` | Requires admin approval |
| POST | `/verify-email` | ❌ | `token` | |
| POST | `/login` | ❌ | `email, password` | Returns `{ user, token }` |
| POST | `/logout` | ✅ | — | Invalidates session |
| POST | `/forgot-password` | ❌ | `email` | Always 200 (no enumeration) |
| POST | `/reset-password` | ❌ | `token, newPassword` | Invalidates all sessions |
| GET | `/me` | ✅ | — | `{ id, email, role, emailVerified, profileId }` |

---

## `/appointments`

All routes require auth.

| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/` | Any | `status?, from, to, page, limit` — scoped by role |
| GET | `/slots` | Any | `doctorId, date (YYYY-MM-DD)` → `[{ start, end, available }]` |
| GET | `/:id` | Any | Includes doctor, patient, prescription, conversation |
| POST | `/` | PATIENT | `doctorId, scheduledAt, type, chiefComplaint?, durationMinutes` |
| PATCH | `/:id/confirm` | DOCTOR, ADMIN | Body `{}` |
| PATCH | `/:id/cancel` | Any | `{ reason? }` |
| PATCH | `/:id/complete` | DOCTOR | `{ notes? }` |
| GET | `/:id/video-token` | Any | `{ token, roomName, livekitUrl }` |

---

## `/doctors`

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| GET | `/` | ❌ | — | `specialty?, search?, page, limit` |
| GET | `/:id` | ❌ | — | Public profile + last 5 reviews |
| GET | `/me` | ✅ | DOCTOR | Full profile |
| PUT | `/me/availability` | ✅ | DOCTOR | Array body: `[{ dayOfWeek, startTime, endTime, slotDuration }]` |
| POST | `/me/time-off` | ✅ | DOCTOR | `startDate, endDate, reason?` |
| PATCH | `/me/profile` | ✅ | DOCTOR | `bio?, consultationFee?, isAcceptingNew?, languages[]?` |
| POST | `/me/profile-image` | ✅ | DOCTOR | Multipart — JPEG/PNG/WebP, max 5 MB |
| GET | `/:doctorId/reviews` | ❌ | — | Paginated |
| POST | `/:doctorId/reviews` | ✅ | PATIENT | `appointmentId, rating (1-5), comment?` — requires COMPLETED appointment |

---

## `/patients`

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| GET | `/me` | ✅ | PATIENT | Own profile |
| PATCH | `/me` | ✅ | PATIENT | `firstName?, lastName?, phoneNumber?, bloodType?, allergies[]?, chronicConditions?, emergencyContact?, address?` |
| GET | `/:id` | ✅ | DOCTOR, ADMIN | Audited as `RECORD_ACCESSED` |

> No patient list endpoint — derive from `GET /appointments?status=COMPLETED` and aggregate client-side.

---

## `/prescriptions`

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| GET | `/` | ✅ | Any | `status?, page, limit` |
| GET | `/:id` | ✅ | Any | Full detail — audited |
| POST | `/` | ✅ | DOCTOR | `appointmentId, diagnosis, expiresAt, medications[]` — accepts CONFIRMED or COMPLETED |
| PATCH | `/:id/status` | ✅ | DOCTOR, ADMIN | `{ status }` |

Medication shape:
```json
{
  "medicationName": "string",
  "dosage": "string",
  "frequency": "string",
  "durationDays": 7,
  "refillsAllowed": 0,
  "instructions": "string (optional)"
}
```

---

## `/health-records`

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| GET | `/` | ✅ | Any | `patientId?, type?, page, limit` — content excluded in list |
| GET | `/:id` | ✅ | Any | Full record with decrypted content |
| POST | `/` | ✅ | DOCTOR | `patientId, type, title, content, isSensitive?, appointmentId?` |
| PATCH | `/:id` | ✅ | DOCTOR | `title?, content?, isSensitive?` |
| POST | `/:patientId/vitals` | ✅ | Any | Vital signs |
| POST | `/:id/documents` | ✅ | Any | Multipart — PDF/JPEG/PNG/WebP/DOC/DOCX, max 20 MB |
| GET | `/documents/:docId/download` | ✅ | Any | Presigned URL (15 min) |
| DELETE | `/documents/:docId` | ✅ | DOCTOR, ADMIN | Deletes from R2 + DB |

---

## `/messages`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/conversations` | With `lastMessage`, `unreadCount` |
| GET | `/:conversationId` | Paginated — `before?, limit` |
| POST | `/:conversationId` | `{ encryptedContent, iv }` |
| PATCH | `/:conversationId/read` | Body `{}` |
| POST | `/:conversationId/keys` | `{ publicKey }` |
| GET | `/:conversationId/keys` | Other participants' public keys |

---

## `/notifications`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | `unreadOnly ("true"/"false")?, page, limit` |
| PATCH | `/:id/read` | Body `{}` |
| PATCH | `/read-all` | Body `{}` |

---

## `/admin`

All routes require `ADMIN` role.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/users` | `role?, isActive?, search?, page, limit` |
| PATCH | `/users/:id/activate` | `{ isActive: bool }` |
| GET | `/doctors` | `isVerified?, search?, page, limit` |
| PATCH | `/doctors/:id/verify` | `{ isVerified: bool }` — uses **doctor profile id**, not user id |
| GET | `/audit-logs` | `userId?, action?, resourceType?, from?, to?, page, limit` |
| GET | `/stats` | Grouped aggregates by role and appointment status |

---

## Pagination

All list endpoints return:
```json
{ "items": [], "total": 0, "page": 1, "limit": 20 }
```

## Error Format

```json
{ "error": "Not Found", "message": "Appointment not found", "statusCode": 404 }
```

Status codes: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `422` unprocessable, `500` server error.

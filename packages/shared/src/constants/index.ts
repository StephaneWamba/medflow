/**
 * Appointment scheduling constants
 */

/** Duration of each appointment slot in minutes */
export const APPOINTMENT_SLOT_DURATION = 30;

/** Maximum number of days in advance an appointment can be booked */
export const MAX_APPOINTMENT_ADVANCE_DAYS = 60;

/** Minimum number of hours in advance an appointment must be booked */
export const MIN_APPOINTMENT_ADVANCE_HOURS = 2;

/**
 * Session / token expiry constants
 */

/** Number of days before a session expires */
export const SESSION_EXPIRY_DAYS = 30;

/** Number of hours before a password reset token expires */
export const PASSWORD_RESET_EXPIRY_HOURS = 1;

/** Number of hours before an email verification token expires */
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

/**
 * File upload constants
 */

/** Maximum allowed file size in bytes (10 MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** MIME types permitted for file uploads */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

/**
 * Video session constants
 */

/** Number of minutes before a video room token expires */
export const VIDEO_ROOM_EXPIRY_MINUTES = 90;

/**
 * Prescription constants
 */

/** Default number of days until a prescription expires */
export const PRESCRIPTION_DEFAULT_EXPIRY_DAYS = 90;

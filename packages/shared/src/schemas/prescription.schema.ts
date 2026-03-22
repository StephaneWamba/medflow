import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum definitions matching Prisma schema
// ---------------------------------------------------------------------------

export const PrescriptionStatusEnum = z.enum([
  'ACTIVE',
  'EXPIRED',
  'CANCELLED',
  'DISPENSED',
] as const);

// ---------------------------------------------------------------------------
// PrescriptionItemSchema
// ---------------------------------------------------------------------------

export const PrescriptionItemSchema = z.object({
  medicationName: z
    .string({ required_error: 'Medication name is required' })
    .min(1, 'Medication name cannot be empty')
    .max(200, 'Medication name cannot exceed 200 characters')
    .trim(),
  dosage: z
    .string({ required_error: 'Dosage is required' })
    .min(1, 'Dosage cannot be empty')
    .max(100, 'Dosage cannot exceed 100 characters')
    .trim(),
  frequency: z
    .string({ required_error: 'Frequency is required' })
    .min(1, 'Frequency cannot be empty')
    .max(200, 'Frequency cannot exceed 200 characters')
    .trim(),
  durationDays: z
    .number({ required_error: 'Duration is required' })
    .int('Duration must be a whole number of days')
    .positive('Duration must be a positive number of days'),
  refillsAllowed: z
    .number()
    .int('Refills allowed must be a whole number')
    .min(0, 'Refills allowed cannot be negative')
    .max(5, 'Refills allowed cannot exceed 5')
    .default(0),
  instructions: z
    .string()
    .max(1000, 'Instructions cannot exceed 1000 characters')
    .optional(),
});

export type PrescriptionItem = z.infer<typeof PrescriptionItemSchema>;

// ---------------------------------------------------------------------------
// CreatePrescriptionSchema
// ---------------------------------------------------------------------------

export const CreatePrescriptionSchema = z.object({
  appointmentId: z
    .string({ required_error: 'Appointment ID is required' })
    .min(1, 'Appointment ID cannot be empty'),
  diagnosis: z
    .string({ required_error: 'Diagnosis is required' })
    .min(1, 'Diagnosis cannot be empty')
    .max(500, 'Diagnosis cannot exceed 500 characters')
    .trim(),
  notes: z
    .string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional(),
  expiresAt: z
    .string({ required_error: 'Expiry date is required' })
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'expiresAt must be an ISO date string (YYYY-MM-DD)',
    )
    .refine(
      (val) => new Date(val) > new Date(),
      'Prescription expiry date must be in the future',
    ),
  medications: z
    .array(PrescriptionItemSchema)
    .min(1, 'At least one medication must be prescribed'),
});

export type CreatePrescription = z.infer<typeof CreatePrescriptionSchema>;

// ---------------------------------------------------------------------------
// UpdatePrescriptionStatusSchema
// ---------------------------------------------------------------------------

export const UpdatePrescriptionStatusSchema = z.object({
  status: PrescriptionStatusEnum,
});

export type UpdatePrescriptionStatus = z.infer<typeof UpdatePrescriptionStatusSchema>;

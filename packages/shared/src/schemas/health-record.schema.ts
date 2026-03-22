import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum definitions matching Prisma schema
// ---------------------------------------------------------------------------

export const HealthRecordTypeEnum = z.enum([
  'CONSULTATION_NOTE',
  'LAB_RESULT',
  'IMAGING',
  'VACCINATION',
  'ALLERGY',
  'SURGERY',
  'CHRONIC_CONDITION',
  'GENERAL',
] as const);

// ---------------------------------------------------------------------------
// CreateHealthRecordSchema
// ---------------------------------------------------------------------------

export const CreateHealthRecordSchema = z.object({
  type: HealthRecordTypeEnum,
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  content: z
    .string({ required_error: 'Content is required' })
    .min(1, 'Content cannot be empty')
    .trim(),
  isSensitive: z.boolean().default(false),
  appointmentId: z
    .string()
    .min(1, 'Appointment ID cannot be empty')
    .optional(),
});

export type CreateHealthRecord = z.infer<typeof CreateHealthRecordSchema>;

// ---------------------------------------------------------------------------
// UpdateHealthRecordSchema
// ---------------------------------------------------------------------------

export const UpdateHealthRecordSchema = CreateHealthRecordSchema.partial();

export type UpdateHealthRecord = z.infer<typeof UpdateHealthRecordSchema>;

// ---------------------------------------------------------------------------
// CreateVitalSchema
// ---------------------------------------------------------------------------

export const CreateVitalSchema = z
  .object({
    recordedAt: z
      .string({ required_error: 'Recorded time is required' })
      .datetime({ message: 'recordedAt must be a valid ISO datetime string' }),

    // Blood pressure
    systolic: z
      .number()
      .int('Systolic pressure must be a whole number')
      .min(40, 'Systolic pressure must be at least 40 mmHg')
      .max(300, 'Systolic pressure cannot exceed 300 mmHg')
      .optional(),
    diastolic: z
      .number()
      .int('Diastolic pressure must be a whole number')
      .min(20, 'Diastolic pressure must be at least 20 mmHg')
      .max(200, 'Diastolic pressure cannot exceed 200 mmHg')
      .optional(),

    // Heart rate (bpm)
    heartRate: z
      .number()
      .int('Heart rate must be a whole number')
      .min(20, 'Heart rate must be at least 20 bpm')
      .max(300, 'Heart rate cannot exceed 300 bpm')
      .optional(),

    // Temperature (°C)
    temperature: z
      .number()
      .min(30, 'Temperature must be at least 30 °C')
      .max(45, 'Temperature cannot exceed 45 °C')
      .optional(),

    // Oxygen saturation (%)
    oxygenSat: z
      .number()
      .int('Oxygen saturation must be a whole number')
      .min(50, 'Oxygen saturation must be at least 50%')
      .max(100, 'Oxygen saturation cannot exceed 100%')
      .optional(),

    // Weight (kg)
    weight: z
      .number()
      .positive('Weight must be a positive number')
      .optional(),

    // Height (cm)
    height: z
      .number()
      .positive('Height must be a positive number')
      .optional(),

    // Blood glucose (mg/dL)
    glucoseLevel: z
      .number()
      .positive('Glucose level must be a positive number')
      .optional(),

    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional(),
  })
  .refine(
    (data) => {
      const vitalFields = [
        data.systolic,
        data.diastolic,
        data.heartRate,
        data.temperature,
        data.oxygenSat,
        data.weight,
        data.height,
        data.glucoseLevel,
      ];
      return vitalFields.some((v) => v !== undefined);
    },
    {
      message: 'At least one vital measurement must be provided',
      path: ['systolic'],
    },
  );

export type CreateVital = z.infer<typeof CreateVitalSchema>;

// ---------------------------------------------------------------------------
// HealthRecordQuerySchema
// ---------------------------------------------------------------------------

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const HealthRecordQuerySchema = z.object({
  type: HealthRecordTypeEnum.optional(),
  from: z
    .string()
    .regex(isoDateRegex, 'from must be an ISO date string (YYYY-MM-DD)')
    .optional(),
  to: z
    .string()
    .regex(isoDateRegex, 'to must be an ISO date string (YYYY-MM-DD)')
    .optional(),
  page: z
    .number()
    .int('Page must be an integer')
    .positive('Page must be a positive integer')
    .default(1),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be a positive integer')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

export type HealthRecordQuery = z.infer<typeof HealthRecordQuerySchema>;

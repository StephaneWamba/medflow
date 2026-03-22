import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum definitions matching Prisma schema
// ---------------------------------------------------------------------------

export const AppointmentStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
] as const);

export const AppointmentTypeEnum = z.enum([
  'VIDEO',
  'IN_PERSON',
] as const);

export const DayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const);

// ---------------------------------------------------------------------------
// CreateAppointmentSchema
// ---------------------------------------------------------------------------

export const CreateAppointmentSchema = z.object({
  doctorId: z
    .string({ required_error: 'Doctor ID is required' })
    .min(1, 'Doctor ID cannot be empty'),
  scheduledAt: z
    .string({ required_error: 'Scheduled time is required' })
    .datetime({ message: 'scheduledAt must be a valid ISO datetime string' })
    .refine(
      (val) => new Date(val) > new Date(),
      'Appointment must be scheduled in the future',
    ),
  type: AppointmentTypeEnum,
  chiefComplaint: z
    .string()
    .max(500, 'Chief complaint cannot exceed 500 characters')
    .optional(),
  durationMinutes: z
    .number()
    .int('Duration must be a whole number of minutes')
    .positive('Duration must be positive')
    .default(30),
});

export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;

// ---------------------------------------------------------------------------
// UpdateAppointmentSchema
// ---------------------------------------------------------------------------

export const UpdateAppointmentSchema = CreateAppointmentSchema.partial().extend({
  status: AppointmentStatusEnum.optional(),
  notes: z
    .string()
    .max(5000, 'Notes cannot exceed 5000 characters')
    .optional(),
  cancelReason: z
    .string()
    .max(1000, 'Cancellation reason cannot exceed 1000 characters')
    .optional(),
});

export type UpdateAppointment = z.infer<typeof UpdateAppointmentSchema>;

// ---------------------------------------------------------------------------
// DoctorAvailabilitySchema
// ---------------------------------------------------------------------------

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const DoctorAvailabilitySchema = z
  .object({
    dayOfWeek: DayOfWeekEnum,
    startTime: z
      .string({ required_error: 'Start time is required' })
      .regex(timeRegex, 'Start time must be in HH:mm format (24-hour)'),
    endTime: z
      .string({ required_error: 'End time is required' })
      .regex(timeRegex, 'End time must be in HH:mm format (24-hour)'),
    slotDuration: z
      .number()
      .int('Slot duration must be a whole number of minutes')
      .min(15, 'Slot duration must be at least 15 minutes')
      .default(30),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    },
  );

export type DoctorAvailability = z.infer<typeof DoctorAvailabilitySchema>;

// ---------------------------------------------------------------------------
// DoctorTimeOffSchema
// ---------------------------------------------------------------------------

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const DoctorTimeOffSchema = z
  .object({
    startDate: z
      .string({ required_error: 'Start date is required' })
      .regex(isoDateRegex, 'Start date must be an ISO date string (YYYY-MM-DD)'),
    endDate: z
      .string({ required_error: 'End date is required' })
      .regex(isoDateRegex, 'End date must be an ISO date string (YYYY-MM-DD)'),
    reason: z
      .string()
      .max(500, 'Reason cannot exceed 500 characters')
      .optional(),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );

export type DoctorTimeOff = z.infer<typeof DoctorTimeOffSchema>;

// ---------------------------------------------------------------------------
// AppointmentQuerySchema
// ---------------------------------------------------------------------------

export const AppointmentQuerySchema = z.object({
  status: AppointmentStatusEnum.optional(),
  type: AppointmentTypeEnum.optional(),
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

export type AppointmentQuery = z.infer<typeof AppointmentQuerySchema>;

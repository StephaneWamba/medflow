import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum definitions matching Prisma schema
// ---------------------------------------------------------------------------

export const UserRoleEnum = z.enum([
  'PATIENT',
  'DOCTOR',
  'ADMIN',
] as const);

// ---------------------------------------------------------------------------
// VerifyDoctorSchema
// ---------------------------------------------------------------------------

export const VerifyDoctorSchema = z.object({
  isVerified: z.boolean({
    required_error: 'isVerified is required',
    invalid_type_error: 'isVerified must be a boolean',
  }),
});

export type VerifyDoctor = z.infer<typeof VerifyDoctorSchema>;

// ---------------------------------------------------------------------------
// DeactivateUserSchema
// ---------------------------------------------------------------------------

export const DeactivateUserSchema = z.object({
  reason: z
    .string()
    .max(1000, 'Reason cannot exceed 1000 characters')
    .trim()
    .optional(),
});

export type DeactivateUser = z.infer<typeof DeactivateUserSchema>;

// ---------------------------------------------------------------------------
// AdminUserQuerySchema
// ---------------------------------------------------------------------------

export const AdminUserQuerySchema = z.object({
  role: UserRoleEnum.optional(),
  isActive: z.boolean().optional(),
  search: z
    .string()
    .max(200, 'Search query cannot exceed 200 characters')
    .trim()
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

export type AdminUserQuery = z.infer<typeof AdminUserQuerySchema>;

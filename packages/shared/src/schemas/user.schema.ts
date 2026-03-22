import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum definitions matching Prisma schema
// ---------------------------------------------------------------------------

export const BloodTypeEnum = z.enum([
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
  'UNKNOWN',
] as const);

// ---------------------------------------------------------------------------
// Nested object schemas
// ---------------------------------------------------------------------------

const EmergencyContactSchema = z.object({
  name: z
    .string({ required_error: 'Emergency contact name is required' })
    .min(1, 'Emergency contact name cannot be empty')
    .max(200, 'Emergency contact name cannot exceed 200 characters')
    .trim(),
  relationship: z
    .string({ required_error: 'Relationship is required' })
    .min(1, 'Relationship cannot be empty')
    .max(100, 'Relationship cannot exceed 100 characters')
    .trim(),
  phone: z
    .string({ required_error: 'Emergency contact phone is required' })
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Phone number must be a valid E.164 formatted number',
    ),
});

const AddressSchema = z.object({
  street: z
    .string({ required_error: 'Street is required' })
    .min(1, 'Street cannot be empty')
    .max(200, 'Street cannot exceed 200 characters')
    .trim(),
  city: z
    .string({ required_error: 'City is required' })
    .min(1, 'City cannot be empty')
    .max(100, 'City cannot exceed 100 characters')
    .trim(),
  state: z
    .string({ required_error: 'State is required' })
    .min(1, 'State cannot be empty')
    .max(100, 'State cannot exceed 100 characters')
    .trim(),
  country: z
    .string({ required_error: 'Country is required' })
    .min(1, 'Country cannot be empty')
    .max(100, 'Country cannot exceed 100 characters')
    .trim(),
  zip: z
    .string({ required_error: 'ZIP code is required' })
    .min(1, 'ZIP code cannot be empty')
    .max(20, 'ZIP code cannot exceed 20 characters')
    .trim(),
});

// ---------------------------------------------------------------------------
// UpdatePatientProfileSchema
// ---------------------------------------------------------------------------

export const UpdatePatientProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name cannot exceed 100 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name cannot exceed 100 characters')
    .trim()
    .optional(),
  phoneNumber: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Phone number must be a valid E.164 formatted number',
    )
    .optional(),
  bloodType: BloodTypeEnum.optional(),
  allergies: z
    .array(z.string().min(1, 'Allergy entry cannot be empty').trim())
    .optional(),
  chronicConditions: z
    .array(z.string().min(1, 'Condition entry cannot be empty').trim())
    .optional(),
  emergencyContact: EmergencyContactSchema.optional(),
  address: AddressSchema.optional(),
});

export type UpdatePatientProfile = z.infer<typeof UpdatePatientProfileSchema>;

// ---------------------------------------------------------------------------
// UpdateDoctorProfileSchema
// ---------------------------------------------------------------------------

export const UpdateDoctorProfileSchema = z.object({
  bio: z
    .string()
    .max(2000, 'Bio cannot exceed 2000 characters')
    .trim()
    .optional(),
  consultationFee: z
    .number()
    .positive('Consultation fee must be a positive number')
    .optional(),
  isAcceptingNew: z.boolean().optional(),
  languages: z
    .array(z.string().min(1, 'Language entry cannot be empty'))
    .optional(),
  profileImageUrl: z
    .string()
    .url('Profile image URL must be a valid URL')
    .optional(),
});

export type UpdateDoctorProfile = z.infer<typeof UpdateDoctorProfileSchema>;

// ---------------------------------------------------------------------------
// PaginationSchema
// ---------------------------------------------------------------------------

export const PaginationSchema = z.object({
  page: z
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

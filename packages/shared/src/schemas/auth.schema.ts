import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum definitions matching Prisma schema
// ---------------------------------------------------------------------------

export const GenderEnum = z.enum([
  'MALE',
  'FEMALE',
  'OTHER',
  'PREFER_NOT_TO_SAY',
] as const);

// ---------------------------------------------------------------------------
// Shared field validators
// ---------------------------------------------------------------------------

const emailField = z
  .string({ required_error: 'Email is required' })
  .email('Must be a valid email address')
  .toLowerCase()
  .trim();

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters');

// ---------------------------------------------------------------------------
// RegisterPatientSchema
// ---------------------------------------------------------------------------

export const RegisterPatientSchema = z.object({
  email: emailField,
  password: passwordField,
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name cannot be empty')
    .max(100, 'First name cannot exceed 100 characters')
    .trim(),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name cannot exceed 100 characters')
    .trim(),
  dateOfBirth: z
    .string({ required_error: 'Date of birth is required' })
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Date of birth must be an ISO date string (YYYY-MM-DD)',
    ),
  gender: GenderEnum,
  phoneNumber: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Phone number must be a valid E.164 formatted number',
    )
    .optional(),
});

export type RegisterPatient = z.infer<typeof RegisterPatientSchema>;

// ---------------------------------------------------------------------------
// RegisterDoctorSchema
// ---------------------------------------------------------------------------

export const RegisterDoctorSchema = z.object({
  email: emailField,
  password: passwordField,
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name cannot be empty')
    .max(100, 'First name cannot exceed 100 characters')
    .trim(),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name cannot exceed 100 characters')
    .trim(),
  specialty: z
    .string({ required_error: 'Specialty is required' })
    .min(1, 'Specialty cannot be empty')
    .max(100, 'Specialty cannot exceed 100 characters')
    .trim(),
  licenseNumber: z
    .string({ required_error: 'License number is required' })
    .min(1, 'License number cannot be empty')
    .max(50, 'License number cannot exceed 50 characters')
    .trim(),
  licenseState: z
    .string({ required_error: 'License state is required' })
    .min(1, 'License state cannot be empty')
    .max(50, 'License state cannot exceed 50 characters')
    .trim(),
  consultationFee: z
    .number({ required_error: 'Consultation fee is required' })
    .positive('Consultation fee must be a positive number'),
  yearsExperience: z
    .number({ required_error: 'Years of experience is required' })
    .int('Years of experience must be an integer')
    .positive('Years of experience must be a positive integer'),
  bio: z
    .string()
    .max(2000, 'Bio cannot exceed 2000 characters')
    .trim()
    .optional(),
  languages: z
    .array(z.string().min(1, 'Language entry cannot be empty'))
    .default([]),
});

export type RegisterDoctor = z.infer<typeof RegisterDoctorSchema>;

// ---------------------------------------------------------------------------
// LoginSchema
// ---------------------------------------------------------------------------

export const LoginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export type Login = z.infer<typeof LoginSchema>;

// ---------------------------------------------------------------------------
// ForgotPasswordSchema
// ---------------------------------------------------------------------------

export const ForgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;

// ---------------------------------------------------------------------------
// ResetPasswordSchema
// ---------------------------------------------------------------------------

export const ResetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Token is required' })
    .min(1, 'Token cannot be empty'),
  newPassword: passwordField,
});

export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

// ---------------------------------------------------------------------------
// ChangePasswordSchema
// ---------------------------------------------------------------------------

export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    newPassword: passwordField,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

export type ChangePassword = z.infer<typeof ChangePasswordSchema>;

// ---------------------------------------------------------------------------
// VerifyEmailSchema
// ---------------------------------------------------------------------------

export const VerifyEmailSchema = z.object({
  token: z
    .string({ required_error: 'Verification token is required' })
    .min(1, 'Verification token cannot be empty'),
});

export type VerifyEmail = z.infer<typeof VerifyEmailSchema>;

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum definitions matching Prisma schema
// ---------------------------------------------------------------------------

export const MessageStatusEnum = z.enum([
  'SENT',
  'DELIVERED',
  'READ',
] as const);

// ---------------------------------------------------------------------------
// SendMessageSchema
// ---------------------------------------------------------------------------

export const SendMessageSchema = z.object({
  conversationId: z
    .string({ required_error: 'Conversation ID is required' })
    .min(1, 'Conversation ID cannot be empty'),
  encryptedContent: z
    .string({ required_error: 'Encrypted content is required' })
    .min(1, 'Encrypted content cannot be empty'),
  iv: z
    .string({ required_error: 'IV is required' })
    .min(1, 'IV cannot be empty'),
});

export type SendMessage = z.infer<typeof SendMessageSchema>;

// ---------------------------------------------------------------------------
// RegisterPublicKeySchema
// ---------------------------------------------------------------------------

const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

export const RegisterPublicKeySchema = z.object({
  conversationId: z
    .string({ required_error: 'Conversation ID is required' })
    .min(1, 'Conversation ID cannot be empty'),
  publicKey: z
    .string({ required_error: 'Public key is required' })
    .min(1, 'Public key cannot be empty')
    .regex(base64Regex, 'Public key must be a valid base64 encoded string'),
});

export type RegisterPublicKey = z.infer<typeof RegisterPublicKeySchema>;

// ---------------------------------------------------------------------------
// MessageQuerySchema
// ---------------------------------------------------------------------------

export const MessageQuerySchema = z.object({
  before: z
    .string()
    .datetime({ message: 'before cursor must be a valid ISO datetime string' })
    .optional(),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be a positive integer')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
});

export type MessageQuery = z.infer<typeof MessageQuerySchema>;

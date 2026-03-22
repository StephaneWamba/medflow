import { Queue } from "bullmq";
import { env } from "../env.js";

// Pass URL config rather than a shared Redis instance to avoid
// type conflicts between BullMQ's bundled ioredis and our own.
const bullConnection = { url: env.REDIS_URL };

export const QUEUE_NAMES = {
  APPOINTMENT_REMINDERS: "appointment-reminders",
  EMAIL: "email",
  NOTIFICATIONS: "notifications",
} as const;

export const reminderQueue = new Queue(QUEUE_NAMES.APPOINTMENT_REMINDERS, {
  connection: bullConnection,
  defaultJobOptions: {
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 86400 },
    attempts: 3,
    backoff: { type: "exponential", delay: 5000, jitter: 0.5 },
  },
});

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: bullConnection,
  defaultJobOptions: {
    removeOnComplete: { age: 3600, count: 500 },
    removeOnFail: { age: 86400 },
    attempts: 5,
    backoff: { type: "exponential", delay: 2000, jitter: 0.5 },
  },
});

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
  connection: bullConnection,
  defaultJobOptions: {
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400 },
    attempts: 3,
  },
});

import { reminderQueue } from "./queues.js";

export type ReminderJobData = {
  appointmentId: string;
  type: "24h" | "1h";
};

/**
 * Schedule the two standard appointment reminder jobs:
 * - 24 hours before
 * - 1 hour before
 * Jobs are named so they can be individually cancelled.
 */
export async function scheduleAppointmentReminders(
  appointmentId: string,
  scheduledAt: Date,
): Promise<void> {
  const now = Date.now();

  const reminder24hAt = scheduledAt.getTime() - 24 * 60 * 60 * 1000;
  const reminder1hAt = scheduledAt.getTime() - 60 * 60 * 1000;

  const jobs: Array<{ delay: number; type: "24h" | "1h" }> = [];

  if (reminder24hAt > now) {
    jobs.push({ delay: reminder24hAt - now, type: "24h" });
  }
  if (reminder1hAt > now) {
    jobs.push({ delay: reminder1hAt - now, type: "1h" });
  }

  for (const { delay, type } of jobs) {
    await reminderQueue.add(
      `reminder:${type}:${appointmentId}`,
      { appointmentId, type } satisfies ReminderJobData,
      {
        delay,
        jobId: `reminder:${type}:${appointmentId}`, // idempotent
      },
    );
  }
}

export async function cancelReminders(appointmentId: string): Promise<void> {
  for (const type of ["24h", "1h"] as const) {
    const job = await reminderQueue.getJob(`reminder:${type}:${appointmentId}`);
    if (job) {
      await job.remove();
    }
  }
}

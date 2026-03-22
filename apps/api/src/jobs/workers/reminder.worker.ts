import { Worker } from "bullmq";
import { env } from "../../env.js";
import { QUEUE_NAMES, emailQueue, notificationQueue } from "../queues.js";
import type { ReminderJobData } from "../reminder.job.js";
import { prisma, AppointmentStatus } from "@medflow/db";

export function startReminderWorker(): Worker {
  const worker = new Worker<ReminderJobData>(
    QUEUE_NAMES.APPOINTMENT_REMINDERS,
    async (job) => {
      const { appointmentId, type } = job.data;

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            include: { user: { select: { email: true } } },
          },
          doctor: { select: { firstName: true, lastName: true } },
        },
      });

      if (
        !appointment ||
        appointment.status === AppointmentStatus.CANCELLED ||
        appointment.status === AppointmentStatus.COMPLETED
      ) {
        return; // No-op for cancelled/completed
      }

      const hoursLabel = type === "24h" ? "24 hours" : "1 hour";
      const patientEmail = appointment.patient.user.email;
      const doctorName = `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;

      // Queue email
      await emailQueue.add("appointment-reminder", {
        to: patientEmail,
        subject: `Appointment reminder — ${hoursLabel} to go`,
        template: "appointment-reminder",
        data: {
          patientFirstName: appointment.patient.firstName,
          doctorName,
          scheduledAt: appointment.scheduledAt.toISOString(),
          appointmentId,
          type: appointment.type,
        },
      });

      // Queue in-app notification
      await notificationQueue.add("appointment-reminder", {
        userId: appointment.patient.userId,
        title: "Upcoming appointment",
        body: `Your appointment with ${doctorName} is in ${hoursLabel}.`,
        type: "appointment_reminder",
        data: { appointmentId },
      });

      // Mark reminder as sent
      const reminderSentAt = (appointment.reminderSentAt as Record<string, string>) ?? {};
      reminderSentAt[type] = new Date().toISOString();
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { reminderSentAt },
      });
    },
    { connection: { url: env.REDIS_URL }, concurrency: 10 },
  );

  worker.on("failed", (job, err) => {
    console.error(`Reminder job ${job?.id} failed:`, err.message);
  });

  return worker;
}

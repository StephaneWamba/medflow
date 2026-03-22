import { Worker } from "bullmq";
import { env } from "../../env.js";
import { QUEUE_NAMES } from "../queues.js";
import {
  sendAppointmentReminder,
  sendAppointmentConfirmation,
  sendEmailVerification,
  sendPasswordReset,
  sendDoctorVerificationStatus,
} from "../../services/email.service.js";

export function startEmailWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      try {
        switch (job.name) {
          case "appointment-reminder": {
            const { to, data } = job.data as {
              to: string;
              template: string;
              data: {
                patientFirstName: string;
                doctorName: string;
                scheduledAt: string;
                appointmentId: string;
                type: string;
              };
            };
            await sendAppointmentReminder(to, data);
            break;
          }

          case "appointment-confirmed": {
            const { to, data } = job.data as {
              to: string;
              data: {
                patientFirstName: string;
                doctorName: string;
                scheduledAt: string;
                appointmentId: string;
                type: string;
              };
            };
            await sendAppointmentConfirmation(to, data);
            break;
          }

          case "email-verification": {
            const { to, data } = job.data as {
              to: string;
              data: { firstName: string; token: string };
            };
            await sendEmailVerification(to, data.token, data.firstName);
            break;
          }

          case "password-reset": {
            const { to, data } = job.data as {
              to: string;
              data: { firstName: string; token: string };
            };
            await sendPasswordReset(to, data.token, data.firstName);
            break;
          }

          case "doctor-verified": {
            const { to, data } = job.data as {
              to: string;
              data: { firstName: string; isVerified: boolean };
            };
            await sendDoctorVerificationStatus(to, data.firstName, data.isVerified);
            break;
          }

          default:
            console.warn(`Email worker: unknown job name "${job.name}" (id: ${job.id})`);
        }
      } catch (err) {
        console.error(`Email job "${job.name}" (id: ${job.id}) failed:`, err);
        throw err;
      }
    },
    { connection: { url: env.REDIS_URL }, concurrency: 5 },
  );

  worker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err.message);
  });

  return worker;
}

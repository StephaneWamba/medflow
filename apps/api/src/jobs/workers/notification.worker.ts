import { Worker } from "bullmq";
import { env } from "../../env.js";
import { QUEUE_NAMES } from "../queues.js";
import { prisma, Prisma } from "@medflow/db";
import { io } from "../../realtime/socket.server.js";

interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}

export function startNotificationWorker(): Worker {
  const worker = new Worker<NotificationJobData>(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job) => {
      const { userId, title, body, type, data } = job.data;

      try {
        const notification = await prisma.notification.create({
          data: {
            userId,
            title,
            body,
            type,
            ...(data !== undefined ? { data: data as Prisma.InputJsonValue } : {}),
          },
        });

        io.to(`user:${userId}`).emit("notification:new", {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: notification.data,
          createdAt: notification.createdAt,
        });
      } catch (err) {
        console.error(`Notification job "${job.name}" (id: ${job.id}) failed:`, err);
        throw err;
      }
    },
    { connection: { url: env.REDIS_URL }, concurrency: 20 },
  );

  worker.on("failed", (job, err) => {
    console.error(`Notification job ${job?.id} failed:`, err.message);
  });

  return worker;
}

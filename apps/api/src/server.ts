import { buildApp } from "./app.js";
import { env } from "./env.js";
import { startReminderWorker } from "./jobs/workers/reminder.worker.js";
import { startEmailWorker } from "./jobs/workers/email.worker.js";
import { startNotificationWorker } from "./jobs/workers/notification.worker.js";
import { prisma } from "@medflow/db";
import { redis } from "./lib/redis.js";
import { initSocketServer } from "./realtime/socket.server.js";

async function main() {
  const app = await buildApp();

  // Attach Socket.io to Fastify's underlying HTTP server
  initSocketServer(app.server);
  app.log.info("Socket.io server initialised");

  // Start background workers
  const reminderWorker = startReminderWorker();
  const emailWorker = startEmailWorker();
  const notificationWorker = startNotificationWorker();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await app.close();
      await reminderWorker.close();
      await emailWorker.close();
      await notificationWorker.close();
      await prisma.$disconnect();
      redis.disconnect();
      app.log.info("Shutdown complete");
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`MedFlow API running on ${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

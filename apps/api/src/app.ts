import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import multipart from "@fastify/multipart";
import { env } from "./env.js";
import errorHandler from "./plugins/error-handler.js";
import authGuard from "./plugins/auth-guard.js";
import { redis } from "./lib/redis.js";

// Routes
import authRoutes from "./routes/auth/index.js";
import appointmentRoutes from "./routes/appointments/index.js";
import doctorRoutes from "./routes/doctors/index.js";
import patientRoutes from "./routes/patients/index.js";
import healthRecordRoutes from "./routes/health-records/index.js";
import prescriptionRoutes from "./routes/prescriptions/index.js";
import messageRoutes from "./routes/messages/index.js";
import adminRoutes from "./routes/admin/index.js";
import notificationRoutes from "./routes/notifications/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      // Never log request bodies — they may contain PHI
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            hostname: request.hostname,
            remoteAddress: request.ip,
          };
        },
      },
    },
    trustProxy: true,
  });

  // ─── Security ──────────────────────────────────────────────────────────────

  await app.register(helmet, {
    contentSecurityPolicy: false, // CSP handled at CDN level
  });

  await app.register(cors, {
    origin: [env.FRONTEND_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
    redis,
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please slow down.",
    }),
  });

  // ─── File uploads (multipart/form-data) ─────────────────────────────────

  await app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20 MB
      files: 1,
    },
  });

  // ─── WebSocket ────────────────────────────────────────────────────────────

  await app.register(websocket);

  // ─── Plugins ──────────────────────────────────────────────────────────────

  await app.register(errorHandler);
  await app.register(authGuard);

  // ─── Health check ─────────────────────────────────────────────────────────

  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env["npm_package_version"] ?? "0.0.1",
  }));

  // ─── Routes ───────────────────────────────────────────────────────────────

  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(appointmentRoutes, { prefix: "/api/v1/appointments" });
  await app.register(doctorRoutes, { prefix: "/api/v1/doctors" });
  await app.register(patientRoutes, { prefix: "/api/v1/patients" });
  await app.register(healthRecordRoutes, { prefix: "/api/v1/health-records" });
  await app.register(prescriptionRoutes, { prefix: "/api/v1/prescriptions" });
  await app.register(messageRoutes, { prefix: "/api/v1/messages" });
  await app.register(adminRoutes, { prefix: "/api/v1/admin" });
  await app.register(notificationRoutes, { prefix: "/api/v1/notifications" });

  // ─── 404 ──────────────────────────────────────────────────────────────────

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      code: "NOT_FOUND",
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return app;
}

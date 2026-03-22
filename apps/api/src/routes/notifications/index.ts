import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@medflow/db";

export default async function notificationRoutes(app: FastifyInstance) {
  // GET /notifications — list the authenticated user's notifications
  app.get("/", async (request) => {
    await request.authenticate();
    const { user } = request;

    const query = z
      .object({
        unreadOnly: z
          .string()
          .transform((v) => v === "true")
          .optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      })
      .parse(request.query);

    const where: any = { userId: user.id };
    if (query.unreadOnly) where.readAt = null;

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, page: query.page, limit: query.limit };
  });

  // PATCH /notifications/:id/read — mark a single notification as read
  app.patch("/:id/read", async (request) => {
    await request.authenticate();
    const { id } = z.object({ id: z.string() }).parse(request.params);

    await prisma.notification.updateMany({
      where: { id, userId: request.user.id },
      data: { readAt: new Date() },
    });

    return { message: "Notification marked as read" };
  });

  // PATCH /notifications/read-all — mark all as read
  app.patch("/read-all", async (request) => {
    await request.authenticate();

    await prisma.notification.updateMany({
      where: { userId: request.user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return { message: "All notifications marked as read" };
  });
}

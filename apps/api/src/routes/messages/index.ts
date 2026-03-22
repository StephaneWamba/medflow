import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, UserRole, MessageStatus } from "@medflow/db";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";
import { broadcastMessage } from "../../realtime/socket.server.js";

export default async function messageRoutes(app: FastifyInstance) {
  // GET /messages/conversations — list the user's conversations
  app.get("/conversations", async (request) => {
    await request.authenticate();
    const { user } = request;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: user.id } },
      },
      include: {
        appointment: {
          select: {
            scheduledAt: true,
            status: true,
            doctor: { select: { firstName: true, lastName: true } },
            patient: { select: { firstName: true, lastName: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { encryptedContent: true, createdAt: true, senderId: true },
        },
        _count: {
          select: {
            messages: {
              where: { status: { not: MessageStatus.READ }, senderId: { not: user.id } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { conversations };
  });

  // GET /messages/:conversationId — paginated messages
  app.get("/:conversationId", async (request) => {
    await request.authenticate();
    const { user } = request;

    const { conversationId } = z
      .object({ conversationId: z.string() })
      .parse(request.params);

    const query = z
      .object({
        before: z.string().datetime().optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
      })
      .parse(request.query);

    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) throw new ForbiddenError();

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(query.before ? { createdAt: { lt: new Date(query.before) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: query.limit,
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        encryptedContent: true,
        iv: true,
        status: true,
        createdAt: true,
        readAt: true,
      },
    });

    // Mark unread messages as delivered
    const unread = messages
      .filter((m) => m.senderId !== user.id && m.status === MessageStatus.SENT)
      .map((m) => m.id);

    if (unread.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unread } },
        data: { status: MessageStatus.DELIVERED },
      });
    }

    return { messages: messages.reverse() };
  });

  // POST /messages/:conversationId — send a message
  app.post("/:conversationId", async (request, reply) => {
    await request.authenticate();
    const { user } = request;

    const { conversationId } = z
      .object({ conversationId: z.string() })
      .parse(request.params);

    const body = z
      .object({
        encryptedContent: z.string().min(1),
        iv: z.string().min(1),
      })
      .parse(request.body);

    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) throw new ForbiddenError();

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        encryptedContent: body.encryptedContent,
        iv: body.iv,
        status: MessageStatus.SENT,
      },
    });

    // Broadcast to all participants connected to the conversation room
    broadcastMessage(conversationId, message);

    return reply.status(201).send(message);
  });

  // PATCH /messages/:conversationId/read — mark messages as read
  app.patch("/:conversationId/read", async (request) => {
    await request.authenticate();
    const { user } = request;
    const { conversationId } = z
      .object({ conversationId: z.string() })
      .parse(request.params);

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) throw new ForbiddenError();

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        status: { not: MessageStatus.READ },
      },
      data: { status: MessageStatus.READ, readAt: new Date() },
    });

    return { message: "Messages marked as read" };
  });

  // POST /messages/:conversationId/keys — register ECDH public key
  app.post("/:conversationId/keys", async (request) => {
    await request.authenticate();
    const { user } = request;
    const { conversationId } = z
      .object({ conversationId: z.string() })
      .parse(request.params);

    const { publicKey } = z
      .object({ publicKey: z.string().min(1) })
      .parse(request.body);

    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      create: { conversationId, userId: user.id, publicKey },
      update: { publicKey },
    });

    return { message: "Public key registered" };
  });

  // GET /messages/:conversationId/keys — get the other participant's public key
  app.get("/:conversationId/keys", async (request) => {
    await request.authenticate();
    const { user } = request;
    const { conversationId } = z
      .object({ conversationId: z.string() })
      .parse(request.params);

    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true, publicKey: true },
    });

    const other = participants.filter((p) => p.userId !== user.id);
    return { keys: other };
  });
}

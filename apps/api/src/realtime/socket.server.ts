/**
 * Socket.io real-time server.
 *
 * Rooms:
 *   user:{userId}           — personal channel (notifications, appointment updates)
 *   conversation:{id}       — per-conversation chat room
 *
 * Auth:
 *   Client passes Bearer token in socket handshake auth: { token: "..." }
 *   Validated against the sessions table on every connection.
 */
import { Server, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { prisma } from "@medflow/db";
import { env } from "../env.js";

export let io: Server;

export interface SocketUser {
  id: string;
  email: string;
  role: string;
}

declare module "socket.io" {
  interface Socket {
    user: SocketUser;
  }
}

// ─── Events emitted by server ────────────────────────────────────────────────
export const ServerEvents = {
  MESSAGE_NEW: "message:new",
  MESSAGE_READ: "message:read",
  NOTIFICATION_NEW: "notification:new",
  APPOINTMENT_UPDATED: "appointment:updated",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
} as const;

// ─── Events emitted by client ─────────────────────────────────────────────────
export const ClientEvents = {
  CONVERSATION_JOIN: "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",
  MESSAGE_READ: "message:read",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
} as const;

// ─── Auth middleware ──────────────────────────────────────────────────────────

async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void,
) {
  try {
    const token =
      socket.handshake.auth["token"] ||
      socket.handshake.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Missing authentication token"));
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      return next(new Error("Session expired or invalid"));
    }

    if (!session.user.isActive) {
      return next(new Error("Account deactivated"));
    }

    socket.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };

    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
}

// ─── Connection handler ───────────────────────────────────────────────────────

function handleConnection(socket: Socket) {
  const { id: userId } = socket.user;

  // Auto-join personal user room
  socket.join(`user:${userId}`);

  // Client joins a conversation room
  socket.on(ClientEvents.CONVERSATION_JOIN, async (conversationId: string) => {
    // Verify the user is a participant before joining
    const participant = await prisma.conversationParticipant
      .findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      })
      .catch(() => null);

    if (participant) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  // Client leaves a conversation room
  socket.on(ClientEvents.CONVERSATION_LEAVE, (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Mark messages read — emit receipt to room
  socket.on(ClientEvents.MESSAGE_READ, (conversationId: string) => {
    socket
      .to(`conversation:${conversationId}`)
      .emit(ServerEvents.MESSAGE_READ, { conversationId, readBy: userId });
  });

  // Typing indicators — forward to room, exclude sender
  socket.on(ClientEvents.TYPING_START, (conversationId: string) => {
    socket
      .to(`conversation:${conversationId}`)
      .emit(ServerEvents.TYPING_START, { conversationId, userId });
  });

  socket.on(ClientEvents.TYPING_STOP, (conversationId: string) => {
    socket
      .to(`conversation:${conversationId}`)
      .emit(ServerEvents.TYPING_STOP, { conversationId, userId });
  });

  socket.on("disconnect", () => {
    // Cleanup handled automatically by Socket.io
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    // Ping every 25s, disconnect after 60s without response
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  io.use(authenticateSocket);
  io.on("connection", handleConnection);

  return io;
}

// ─── Helpers used by route handlers ──────────────────────────────────────────

/**
 * Broadcast a new message to all participants of a conversation.
 * Called from the messages route after persisting the message.
 */
export function broadcastMessage(
  conversationId: string,
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    encryptedContent: string;
    iv: string;
    status: string;
    createdAt: Date;
  },
) {
  io?.to(`conversation:${conversationId}`).emit(
    ServerEvents.MESSAGE_NEW,
    message,
  );
}

/**
 * Push an appointment status update to both patient and doctor.
 */
export function broadcastAppointmentUpdate(
  patientUserId: string,
  doctorUserId: string,
  payload: { appointmentId: string; status: string; [key: string]: unknown },
) {
  io?.to(`user:${patientUserId}`).emit(ServerEvents.APPOINTMENT_UPDATED, payload);
  io?.to(`user:${doctorUserId}`).emit(ServerEvents.APPOINTMENT_UPDATED, payload);
}

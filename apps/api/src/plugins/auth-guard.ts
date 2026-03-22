/**
 * Fastify plugin that adds:
 *  - `request.authenticate()` — verifies Bearer token, populates request.user / request.session
 *  - `request.requireRole(...roles)` — asserts the authenticated user has one of the given roles
 *
 * Routes opt-in by calling these methods (no global middleware that hides intent).
 */
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { prisma, UserRole } from "@medflow/db";
import { UnauthorizedError, ForbiddenError } from "../lib/errors.js";

export default fp(async function authGuard(app: FastifyInstance) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.decorateRequest("user", null as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.decorateRequest("session", null as any);

  app.decorateRequest("authenticate", async function (this: any) {
    const authHeader = this.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }
    const token = authHeader.slice(7);

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError("Session expired or invalid");
    }

    if (!session.user.isActive) {
      throw new UnauthorizedError("Account deactivated");
    }

    // Resolve profile id for the role
    let profileId: string | null = null;
    if (session.user.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      profileId = patient?.id ?? null;
    } else if (session.user.role === UserRole.DOCTOR) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      profileId = doctor?.id ?? null;
    }

    this.session = session;
    this.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      emailVerified: session.user.emailVerified,
      profileId,
    };
  });

  app.decorateRequest(
    "requireRole",
    function (this: any, ...roles: UserRole[]) {
      if (!this.user) throw new UnauthorizedError();
      if (!roles.includes(this.user.role)) {
        throw new ForbiddenError(
          `This action requires one of: ${roles.join(", ")}`,
        );
      }
    },
  );
});

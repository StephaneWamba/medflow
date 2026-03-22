import type { Session, UserRole } from "@medflow/db";
import type { AuthUser } from "./auth.js";

export type { AuthUser };

declare module "fastify" {
  interface FastifyRequest {
    user: AuthUser;
    session: Session;
    /** Validates the Bearer token and populates request.user + request.session */
    authenticate(): Promise<void>;
    /** Asserts the authenticated user has one of the provided roles */
    requireRole(...roles: UserRole[]): void;
  }
}
